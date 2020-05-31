-- change.lua
--
-- Copyright (c) 2010-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.--
-- PROPRIETARY/CONFIDENTIAL
--
-- Use is subject to license terms.

require 'cc_string_util'
require 'cc_db_util'
require 'archived_items'
require 'downloaded_items'
require 'periodicals_virtual_collections'
require 'home_dictionary_collection'
require 'query'
require 'metadata_index'
require 'content_state'
require 'dcm'
require 'series'
require 'post_processor'

local modname = ...
local change = {}
_G[modname] = change

-- We will determine title bidi direction for the mentioned mime types
local allowed_mimetypes_title_dir_detection = { "text/plain", "application/pdf" }

-- We will determine author(credit) bidi direction for the mentioned mime types
local allowed_mimetypes_credit_dir_detection = { "application/pdf" }

local is_file_path = cc_string_util.is_file_path
local uri_to_title = cc_string_util.uri_to_title

local make_binder = cc_db_util.make_binder

-- This indicates that the item modified is On Device
local on_device_content_source = "OnDevice"

-- This is the Java Integer.MAX_VALUE.  It is used
-- as a sentinel for indicating that a CC item will
-- not be indexed etc.
local integer_max_value = 2147483647

-- In an update to an indexedState column this will decrement by 1
-- to indicate an indexing attempt
local indexed_state_attempted = -1
-- In an update to an indexedState column this will increment by 1
-- to add another retry. Not using '1' because that means indexing 
-- has completed successfully.
local indexed_state_revert  =  1000
-- If the Item is already indexed. This is possible if the item is 
-- downloaded in the other profile
local item_indexed = 1


--A flag which indicates that the current request should be
--sent to the reindex for metadata  - used for changing My Clippings name
local metadata_to_reindex = false

--This is read from the JSON and if it's non-zero then there
--will be no notification.
local no_notify = false

--This is read from the JSON to identify the source of the request
local content_source = nil

-- Subscription Origin Type entered in CC DB.
local subscription_origin_type = 8

-- Content with Origin type shared.
local shared_origin_type = 12

-- Downloaded Item content state in CC DB.
local downloaded_item_content_state = 1

-- Series table.
local series_table = "SERIES"

-- Downloaded series info.
local downloadedSeriesInfo = "updateDownloadedSeriesInfo"

-- audible entry.
local audibleEntry = "Entry:Item:Audible"

-- audible periodical entry.
local audiblePeriodicalEntry = "Entry:Item:AudiblePeriodical"

-- series entry.
local seriesEntry = "Entry:Item:Series"

-- values of isArchived
local CLOUD_ENTRY = 1
local DOWNLOADED_ENTRY = 0

-- possible Visibility States
local VISIBILITY_SHOWN = 1
local VISIBILITY_HIDDEN = 0

-- cdeTypes
local CDE_TYPE_EBOOK = 'EBOK'
local CDE_TYPE_EBOOK_SAMPLE = 'EBSP'
local CDE_TYPE_AUDIBLE = 'AUDI'
local CDE_TYPE_AUDIBLE_SAMPLE = 'AUSP'

local db

function change.set_db(db_)
    db = db_
    
    -- Set up some SQLite database functions.
    local function json_array()
        local array = { '[' }

        local function step(a)
            array[#array + 1] = a
            array[#array + 1] = ','
        end

        local function final(n)
            if #array < 2 then
                return '[]'
            else
                array[#array] = ']'
                return table.concat(array)
            end
        end

        return step, final
    end

    assert(db:set_function("json_string", 1, json.encode))
    assert(db:set_aggregate("json_array", 1, json_array))
    assert(db:set_function("now", 0, os.time))
end

-- "enum" values
-- (Using tables for values so that == compares by reference.)
local change_types = { insert = { "insert" }, update = { "update" } }

-- For a given cdeKey and type, update the originType of downloaded item.
-- Called when archive item is inserted/udpated/deleted to update the origin type of the
-- corresponding downloaded item.
local function updateOriginType( db, cdeKey, cdeType, originType )
    if cdeKey == nil or cdeType == nil then
        llog.info("origin_type.update_origin_type", "exit", "cdekey_or_cdetype_is_nil", "")
        return
    end

    llog.debug4("origin_type.update_origin_type", "enter", "", "")
    local sql = [[ UPDATE Entries SET
                    p_originType = (
                    SELECT p_originType FROM Entries WHERE
                        p_cdeKey = "]] .. cdeKey .. [["
                        AND p_cdeType = "]] .. cdeType .. [["
                        AND p_isArchived = 1
                        LIMIT 1
                    )
    
                    WHERE
                    p_cdeKey = "]] .. cdeKey .. [["
                    AND p_cdeType = "]] .. cdeType .. [["
                    AND p_isArchived = 0
                ]]

    assert(cc_db_util.package_for_assert(db:exec(sql)))
    llog.debug4("origin_type.update_origin_type", "exit", "", "")
end

------------------------------------------------------------------------------------------
-- Functions implementing complex logic for updating specific fields.
------------------------------------------------------------------------------------------

-- See the note on change_members() for details, but any change in here has about a 75%
-- chance of needing a similar (but not the same) change in change_members().  Please
-- keep this in mind when making fixes here.
local function change_collections(obj, binder, change_type)
    -- If the item is archived, ignore updating the collections.  
     if obj.isArchived == true then                                                            
        return { }, { }                                                                        
     end

    -- Used over and over
    local collections = obj.collections
    
    -- List of SQL statements to use
    local sqls = { }

    if change_type ~= change_types.insert then
        -- This generates a SQL statement that updates the j_members field in all of
        -- the collections that were removed from the obj.collections list.
        --
        -- The final logic is "update collections which are in the current list (the
        -- Collections table) but not in the new list (obj.collections), filling in the
        -- new j_collections field with the contents of Collections, minus obj.uuid".
        local urc_b = make_binder()
        local urc_sql
            = [[ UPDATE Entries
                 SET    p_memberCount =
                            (SELECT count(*)
                             FROM   Collections
                             WHERE  i_collection_uuid = Entries.p_uuid
                                    AND i_member_uuid <> ]] .. urc_b:bind(obj.uuid) .. [[ ),
                        p_homeMemberCount =
                            (SELECT count(*)
                             FROM   Collections
                             WHERE  i_member_is_present = 1 AND i_collection_uuid = Entries.p_uuid
                                    AND i_member_uuid <> ]] .. urc_b:bind(obj.uuid) .. [[ )
                 WHERE  p_uuid IN
                            (SELECT i_collection_uuid
                             FROM   Collections
                             WHERE  i_member_uuid = ]] .. urc_b:bind(obj.uuid) .. [[
                                    AND i_collection_uuid NOT IN ( ]] .. urc_b:bind_list(collections)
                .. [[ )) ]]

        local update_removed_collections = { sql = urc_sql, bind_vars = urc_b.bind_vars }

        sqls[#sqls + 1] = update_removed_collections


        -- Delete the collection links if the collection is not in the entry's collection
        -- list.
        local doc_binder = make_binder()
        local doc_sql
            = [[ DELETE FROM Collections
                 WHERE  i_member_uuid = ]] .. doc_binder:bind(obj.uuid) .. [[
                        AND i_collection_uuid NOT IN ( ]] .. doc_binder:bind_list(collections) .. [[ ) ]]

        local delete_old_collections = { sql = doc_sql, bind_vars = doc_binder.bind_vars }

        sqls[#sqls + 1] = delete_old_collections
    end


    -- Insert any new collections (note that OR IGNORE will skip collection entries we
    -- already have).
    for _, col_uuid in ipairs(collections) do
        local insert_binder = make_binder()
        local insert_sql
            = [[ INSERT OR IGNORE INTO Collections (i_member_uuid,
                                                    i_collection_uuid,
                                                    i_order,
                                                    i_member_cde_type,
                                                    i_member_cde_key,
                                                    i_member_is_present,
                                                    i_is_sideloaded)
                 VALUES ( ]] .. insert_binder:bind(obj.uuid) .. [[ ,
                          ]] .. insert_binder:bind(col_uuid) .. [[ ,
                          (SELECT ifnull(max(i_order), 0) + 1
                           FROM   Collections
                           WHERE  i_collection_uuid
                                  = ]] .. insert_binder:bind(col_uuid) .. [[ ),
                          (SELECT p_cdeType FROM Entries WHERE p_uuid = ]] .. insert_binder:bind(obj.uuid) .. [[),
                          (SELECT p_cdeKey FROM Entries WHERE p_uuid = ]] .. insert_binder:bind(obj.uuid) .. [[),
                          (SELECT count(*) FROM Entries WHERE p_uuid = ]] .. insert_binder:bind(obj.uuid) .. [[ AND p_isArchived = 0),
                          (SELECT count(*) FROM Entries WHERE p_uuid = ]] .. insert_binder:bind(obj.uuid) .. [[ AND p_isArchived = 0 AND p_contentState = 0)
                          ) ]]
        sqls[#sqls + 1] = { sql = insert_sql, bind_vars = insert_binder.bind_vars }
    end

    -- Update collection Entries to include new member:
    local unc_binder = make_binder()
    local unc_sql
        = [[ UPDATE Entries
             SET    p_memberCount =
                            (SELECT count(*)
                             FROM   Collections
                             WHERE  i_collection_uuid = Entries.p_uuid),
                    p_homeMemberCount =
                            (SELECT count(*)
                             FROM   Collections
                             WHERE  i_member_is_present = 1 AND i_collection_uuid = Entries.p_uuid)
             WHERE  p_uuid IN ( ]] .. unc_binder:bind_list(collections) .. [[ ) ]]

    local update_new_collections = { sql = unc_sql, bind_vars = unc_binder.bind_vars }

    sqls[#sqls + 1] = update_new_collections


    return {
               j_collections = binder:bind(json.encode(obj.collections)),
               p_collectionCount = binder:bind(#obj.collections)
           },
           sqls
end



-- This is very similar to change_collections() -- it follows the same structure, and
-- performs a similar operation.  I could probably combine it with change_collections,
-- but there are enough (mostly small) differences that I think the result would be hard
-- to read.  Just remember than any fix in here has about a 75% chance of needing an
-- equivalent fix in change_collections().
--
-- There are two main differences:
--
-- "collection" and "member" are swapped, essentially everywhere
--
-- "collections" is unordered and "members" is ordered, so urm_sql and unm_sql are simpler
-- than urc_sql and unc_sql, but fix_sql takes a totally different form than rev_sql.
local function change_members(obj, binder, change_type)
    -- Used over and over
    local members = obj.members
    local sqls = { }

    if obj.cdeType ~= "Character" then
    
        if change_type ~= change_types.insert then
            -- This generates a SQL statement that updates the j_collections field in all of
            -- the entries that were removed from the obj.members list.
            --
            -- For every current member of the collection (as indicated by the contents of the
            -- Collections link table) that is not a member of the updated collection,
            -- reconstruct its j_collections field using the Collections link table, ignoring
            -- any rows in Collections that we're about to delete.
            local urm_b = make_binder()
            local urm_sql
                = [[ UPDATE Entries
                     SET    p_collectionCount =
                                (SELECT count(*)
                                 FROM   Collections
                                 WHERE  i_member_cde_key = Entries.p_cdeKey
                                        AND i_collection_uuid IN (Select p_uuid FROM entries WHERE p_type='Collection' AND p_isVisibleInhome=1)
                                        AND i_collection_uuid <> ]] .. urm_b:bind(obj.uuid) .. [[ )
                     WHERE  p_cdeKey IN
                                (SELECT i_member_cde_key
                                 FROM   Collections
                                 WHERE  i_collection_uuid = ]] .. urm_b:bind(obj.uuid) .. [[
                                        AND i_member_uuid NOT IN ( ]] .. urm_b:bind_list(members) .. [[ ))   ]]

            local update_removed_members = { sql = urm_sql, bind_vars = urm_b.bind_vars }

            sqls[#sqls + 1] = update_removed_members

            -- Now, remove the collection links.
            local dom_binder = make_binder()
            local dom_sql
                = [[ DELETE FROM   Collections
                     WHERE  i_collection_uuid = ]] .. dom_binder:bind(obj.uuid) .. [[
                            AND i_member_uuid NOT IN ( ]] .. dom_binder:bind_list(members) .. [[ ) ]]

            local delete_old_members = { sql = dom_sql, bind_vars = dom_binder.bind_vars }

            sqls[#sqls + 1] = delete_old_members
        end

    
        -- Insert any new collections (note that OR IGNORE will skip collection entries we
        -- already have). i_is_sideloaded field is used to distinguish sideloaded content from other items,
        -- And i_member_is_present distinguish "OnDevice" Content (sideloaded and downloaded items) from archive items.
        -- We have a stale state, (where i_member_is_present says item is a archive content, and i_is_sideloaded says the item is sideloaded)
        -- This stale state is used to identify the archive items (Which are being added to collection) but whose visibility got changed as they got downloaded.
        -- JSIXONE-2155, These stale data will get processed later so that the downloaded entry is added to collection, instead of the archive entry.
        for _, mem_uuid in ipairs(members) do
            local cdeKey, cdeType, isArchived, isVisibleInHome, contentState

            local stmt = assert(cc_db_util.package_for_assert(db:prepare("SELECT p_cdeKey AS cdeKey, p_cdeType AS cdeType, p_isArchived AS isArchived, p_contentState AS contentState, p_isVisibleInHome AS isVisibleInHome FROM Entries WHERE p_uuid = ?")))
            local ok, msg = cc_db_util.package_for_assert(stmt:bind(mem_uuid))

            if not ok then
                stmt:close()
                assert(ok, msg)
            end

            local row, message, code = stmt:first_row()
            stmt:close()

            if row then
                cdeKey = row.cdeKey
                cdeType = row.cdeType
                isArchived = row.isArchived
                isVisibleInHome = row.isVisibleInHome
                contentState = row.contentState
            end

            local insert_binder = make_binder()
            local insert_sql
                = [[ INSERT OR IGNORE INTO Collections (i_collection_uuid,
                                                        i_member_uuid,
                                                        i_member_cde_type,
                                                        i_member_cde_key,
                                                        i_order,                                                    
                                                        i_member_is_present,
                                                        i_is_sideloaded)
                    VALUES ( ]] .. insert_binder:bind(obj.uuid) .. [[ ,
                              ]] .. insert_binder:bind(mem_uuid) .. [[ ,
                              ]] .. insert_binder:bind(cdeType) .. [[,
                              ]] .. insert_binder:bind(cdeKey) .. [[,
                              (SELECT ifnull(max(i_order), 0) + 1
                               FROM   Collections
                               WHERE  i_collection_uuid
                                      = ]] .. insert_binder:bind(obj.uuid) .. [[ ),
                              ]] .. insert_binder:bind(((isArchived == 0) and 1 or 0)) .. [[,
                              ]] .. insert_binder:bind(((isArchived == 0 and contentState == 0) and 1 or ((isVisibleInHome  == 0 ) and 1 or 0))) .. [[
                            ) ]]
            sqls[#sqls + 1] = { sql = insert_sql, bind_vars = insert_binder.bind_vars }
        end

        -- This will check whether if the is_sideloaded flag need to be modified or not.
           for _, mem_uuid in ipairs(members) do
                local is_sideloaded_binder = make_binder()
                local is_sideloaded_sql
                   = [[ UPDATE Collections
                         SET     i_is_sideloaded = 
                                     (SELECT count(*) 
                                      FROM Entries 
                                      WHERE p_uuid = ]] .. is_sideloaded_binder:bind(mem_uuid) .. [[ AND ((p_isArchived = 0 AND p_contentState = 0) OR p_isVisibleInHome = 0)) 
                         WHERE i_member_uuid = ]] .. is_sideloaded_binder:bind(mem_uuid) .. [[ AND i_is_sideloaded = 1 ]]
               sqls[#sqls + 1] = { sql = is_sideloaded_sql, bind_vars = is_sideloaded_binder.bind_vars }
            end

        -- This will update the stale archive records to reflect the proper downloaded items.
        local update_stale_data_binder = make_binder()
        local update_stale_data_sql
            = [[ UPDATE Collections
                      SET    i_member_uuid = 
                                 (SELECT p_uuid
                                  FROM Entries 
                                  WHERE p_cdeKey = (SELECT p_cdeKey 
                                                    FROM Entries 
                                                    WHERE p_uuid = i_member_uuid) AND 
                                        p_cdeType = (SELECT p_cdeType
                                                    FROM Entries 
                                                    WHERE p_uuid = i_member_uuid) AND
                                        Entries.p_isVisibleInHome = 1),
                             i_member_is_present = 1,
                             i_is_sideloaded = 0
                      WHERE  i_member_is_present = 0 AND
                             i_is_sideloaded = 1  ]]
        sqls[#sqls + 1] = { sql = update_stale_data_sql, bind_vars = update_stale_data_binder.bind_vars }

        -- This will update the collectionCount, number of collections each book belongs to.
        local unm_binder = make_binder()    

        local unm_sql
            = [[ UPDATE Entries
                 SET    p_collectionCount =
                            (SELECT count(*)
                             FROM   Collections
                             WHERE  i_member_uuid = Entries.p_uuid AND
                                    i_collection_uuid IN
                                    ( SELECT p_uuid FROM Entries 
                                            WHERE 
                                            p_type='Collection' 
                                                    AND p_isVisibleInHome=1
                                    )
                            )
                 WHERE p_uuid IN ( ]] .. unm_binder:bind_list(members) .. [[ )]]

        local update_new_collections = { sql = unm_sql, bind_vars = unm_binder.bind_vars }

        sqls[#sqls + 1] = update_new_collections

        -- Update member Entries to include new collection count:
        local member_count_binder = make_binder()
        local member_count_sql
            = [[ UPDATE Entries
                 SET    p_memberCount =
                            (SELECT count(*)
                             FROM   Collections
                             WHERE  i_collection_uuid = ]] .. member_count_binder:bind(obj.uuid) .. [[),
                        p_homeMemberCount =
                            (SELECT count(*)
                             FROM   Collections
                             WHERE  i_member_is_present = 1 AND i_collection_uuid = ]] .. member_count_binder:bind(obj.uuid) .. [[)
                 WHERE p_uuid = ]] .. member_count_binder:bind(obj.uuid)

        local update_new_collections_count = { sql = member_count_sql, bind_vars = member_count_binder.bind_vars }

        sqls[#sqls + 1] = update_new_collections_count
    
    end

    return {
               j_members = binder:bind(json.encode(obj.members))
           },
           sqls
end

local function contains(list, val)
    for index, value in ipairs(list) do
        if value == val then
            return true
        end
    end
    return false
end

local function change_titles(obj, binder, change_type)
    local titles_collation_alternative = {}
    for idx, title in ipairs(obj.titles) do
        title.display = ctrl_chars_strip(title.display)
        if not title.language or string.len(title.language) == 0 then
            contentLanguage = obj and obj.languages and obj.languages[1]
            title.language = language_detector(contentLanguage, title.display)
        end
        if obj.mimeType and contains(allowed_mimetypes_title_dir_detection,obj.mimeType) then
            if not title.direction or string.len(title.direction) == 0 then
                title.direction = direction_detector(title.language, title.display)
            end
        end
        if title.pronunciation then
            title.pronunciation = ctrl_chars_strip(title.pronunciation)
        else
            if title.language and string.sub(title.language,1,2) == "zh" then
                title.pronunciation = hani_to_pinyin(title.display)
            else
                title.pronunciation = title.display
            end
        end
        if title.collation then
            title.collation = ctrl_chars_strip(title.collation)
        else
            title.collation = title_format(title.language, title.pronunciation)
        end
        -- "阿"(\233\152\191) is considered to be first character in Chinese, so put it as prefix.
        if title.language and string.sub(title.language,1,2) == "zh" then
            title.collation = "\233\152\191\233\152\191\233\152\191" .. space_chars_strip(title.collation)
            local preferenceCollation = get_preference_collation()
            -- For Chinese preference collation, title collation is built based on display title.
            if preferenceCollation and string.sub(preferenceCollation,1,2) == "zh"  then
                titles_collation_alternative[idx] = "\233\152\191\233\152\191\233\152\191" .. title_format(title.language, title.display)
            end
        else
              -- "ぁ"(\227\129\129) is considered to be first character in Japanese, so put it as prefix.
            if title.language and string.sub(title.language,1,2) == "ja" then
                title.collation = "\227\129\129\227\129\129\227\129\129" .. title.collation
            end
        end
    end

    -- nil checking
    local collation     = titles_collation_alternative[1] or (obj.titles and obj.titles[1] and obj.titles[1].collation)
    local display       = obj.titles and obj.titles[1] and obj.titles[1].display
    local pronunciation = obj.titles and obj.titles[1] and obj.titles[1].pronunciation
    return {
               j_titles = binder:bind(json.encode(obj.titles)),
               p_titleCount = binder:bind(#obj.titles),

               p_titles_0_collation     = binder:bind(collation),
               p_titles_0_nominal       = binder:bind(display),
               p_titles_0_pronunciation = binder:bind(pronunciation)
           },
           { }
end

-- Modify the author names for audible books to ensure proper author name sort
local function formatAuthorForAudible(authorName)
    llog.debug4("formatAuthorForAudible ", "enter", "name=%s", "", tostring(authorName))
    -- This will remove the last word if enclosed with in parentheses
    authorName = authorName:gsub('(.*)%s%b()$','%1')
    -- This will take last word append it with comma and append it with rest of the words. This is the proper format for author names.
    authorName  =  authorName:gsub('(.*)%s(.*)$', '%2, %1')
    llog.debug4("formatAuthorForAudible ", "exit", "name=%s", "", tostring(authorName))
    return authorName
end

local function change_credits(obj, binder, change_type)
    local credits_collation_alternative = {}
    for idx, credit in ipairs(obj.credits) do
        if credit.name then
            credit.name.display = ctrl_chars_strip(credit.name.display)
            if(obj.type and (obj.type == audibleEntry or obj.type == audiblePeriodicalEntry)) then
                credit.name.display =  formatAuthorForAudible(credit.name.display)
            end
            if not credit.name.language then
                contentLanguage = obj and obj.languages and obj.languages[1]
                credit.name.language = language_detector(contentLanguage , credit.name.display)
            end
            if obj.mimeType and contains(allowed_mimetypes_credit_dir_detection,obj.mimeType) then
                if not credit.name.direction or string.len(credit.name.direction) == 0 then
                    credit.name.direction = direction_detector(credit.name.language, credit.name.display)
                end
            end
            if credit.name.pronunciation then 
                credit.name.pronunciation = ctrl_chars_strip(credit.name.pronunciation)
            else
                if credit.name.language and string.sub(credit.name.language,1,2) == "zh" then
                    credit.name.pronunciation = hani_to_pinyin(credit.name.display)
                else
                    credit.name.pronunciation = credit.name.display
                end
            end
            if credit.name.collation then
                credit.name.collation = ctrl_chars_strip(credit.name.collation)
            else
                credit.name.collation = credit_format(credit.name.language, credit.name.pronunciation)
            end
            -- "阿"(\233\152\191) is considered to be first character in Chinese, so put it as prefix.
            if credit.name.language and string.sub(credit.name.language,1,2) == "zh" then
                credit.name.collation = "\233\152\191\233\152\191\233\152\191" .. space_chars_strip(credit.name.collation)
                local preferenceCollation = get_preference_collation()
                -- For Chinese preference collation, credit collation is built based on display credit.
                if preferenceCollation and string.sub(preferenceCollation,1,2) == "zh"  then
                    credits_collation_alternative[idx] = "\233\152\191\233\152\191\233\152\191" .. credit_format(credit.name.language, credit.name.display)
                end
            else
                  -- "ぁ"(\227\129\129) is considered to be first character in Japanese, so put it as prefix.
                if credit.name.language and string.sub(credit.name.language,1,2) == "ja" then
                    credit.name.collation = "\227\129\129\227\129\129\227\129\129" .. credit.name.collation
                end
            end
        end
    end

    -- nil checking
    local collation = credits_collation_alternative[1] or
                      (obj.credits
                      and obj.credits[1]
                      and obj.credits[1].name
                      and obj.credits[1].name.collation)

    -- make collation empty string to handle sorting of empty collations done by
    --     -- icuCompare
    if collation == nil then
        collation = ""
    end

    local pronunciation = obj.credits
                          and obj.credits[1]
                          and obj.credits[1].name
                          and obj.credits[1].name.pronunciation
    return {
               j_credits = binder:bind(json.encode(obj.credits)),
               p_creditCount = binder:bind(#obj.credits),
               p_credits_0_name_collation = binder:bind(collation),
               p_credits_0_name_pronunciation = binder:bind(pronunciation)
           },
           { }
end


local function change_languages(obj, binder, change_type)
    return {
               j_languages = binder:bind(json.encode(obj.languages)),
               p_languageCount = binder:bind(#obj.languages),
               p_languages_0 = binder:bind(obj.languages[1])
           }, 
           { }
end


-- Generic factory for raw JSON field change functions.
local function object_field(field_name, prefix)
    local function update_field(obj, binder, change_type)
        return { [prefix .. "_" .. field_name] = binder:bind(json.encode(obj[field_name])) }, { }
    end

    return update_field
end


-- Generic factory for scalar field change functions.
local function scalar_field(field_name, prefix)
    local function update_field(obj, binder, change_type)
        return { [prefix .. "_" .. field_name] = binder:bind(obj[field_name]) }, { }
    end

    return update_field
end


-- "location" is a generic field, but new file locations need to be indexed.
local function change_location(obj, binder, change_type)
    if obj.type ~= "Entry:Item:Dictionary" and obj.contentIndexedState ~= integer_max_value  and obj.contentIndexedState ~= item_indexed then
        local path = is_file_path(obj.location)
        if path and obj.uuid and obj.mimeType then
            --Create function to index title and add it to work list
            local function command()
                local asin =  cc_string_util.getObj(obj.cdeKey)
                local guid =  cc_string_util.getObj(obj.guid)
                local cdeType =  cc_string_util.getObj(obj.cdeType)
        
        if obj.languages == nil then                       
                    obj.languages = { }                                         
                end
        
        local content_language = cc_string_util.getObj(obj.languages[1])
                index_title(asin, cdeType, guid, obj.location, obj.uuid, content_language, obj.mimeType)
            end
            dcm.add_index_command(command)
        end
    end
    return { p_location = binder:bind(obj.location) }, { }
end

-- Changing an indexed state column. A value of -1 indicates a failure and will decrement
-- the column's present value by 1.
local function indexed_state(field_name)
    local function update_field(obj, binder, change_type)
        local p_fieldName = "p_" .. field_name
        --If an update occurs and the value is < 0 we will decrement the value by 1.
        if change_type == change_types.update then
            local function getSQL(p_fieldName, uuid, indexedStateModifier)
                    return "UPDATE Entries SET " ..p_fieldName.. " = " ..p_fieldName..indexedStateModifier.." where p_uuid = \"" .. uuid .. "\""
            end
            --check for special values which modify existing indexed state
            if obj[field_name] == indexed_state_attempted then 
                --increase retry count by decrementing the indexed state by one
                return { }, {{sql= getSQL(p_fieldName, obj.uuid, "- 1")}}
            elseif  obj[field_name] == indexed_state_revert then
                --decrease retry count by inrementing the indexed state by one
                return { }, {{sql= getSQL(p_fieldName, obj.uuid, "+ 1")}} 
            end                
        end
        return { [p_fieldName] = binder:bind(obj[field_name]) }, { }
    end

    return update_field
end

------------------------------------------------------------------------------------------
-- Change functions for each field.
------------------------------------------------------------------------------------------

local column_specs =
{
    cdeGroup              = scalar_field("cdeGroup", "p"),
    cdeKey                = scalar_field("cdeKey", "p"),
    cdeType               = scalar_field("cdeType", "p"),
    contentSize           = scalar_field("contentSize", "p"),
    cover                 = scalar_field("cover", "p"),
    credits               = change_credits,
    diskUsage             = scalar_field("diskUsage", "p"),
    displayObjects        = object_field("displayObjects", "j"),
    displayTags           = object_field("displayTags", "j"),
    excludedTransports    = object_field("excludedTransports", "j"),
    expirationDate        = scalar_field("expirationDate", "p"),
    guid                  = scalar_field("guid", "p"),
    isArchived            = scalar_field("isArchived", "p"),
    isDownloading         = scalar_field("isDownloading", "p"),
    isDRMProtected        = scalar_field("isDRMProtected", "p"),
    isMultimediaEnabled   = scalar_field("isMultimediaEnabled", "p"),
    isTestData            = scalar_field("isTestData", "p"),
    isLatestItem          = scalar_field("isLatestItem", "p"),
    isUpdateAvailable     = scalar_field("isUpdateAvailable", "p"),
    isVisibleInHome       = scalar_field("isVisibleInHome", "p"),
    virtualCollectionCount  = scalar_field("virtualCollectionCount", "p"),
    languages             = change_languages,
    lastAccessedPosition  = scalar_field("lastAccessedPosition", "p"),
    lastAccess            = scalar_field("lastAccess", "p"),
    location              = change_location,
    mimeType              = scalar_field("mimeType", "p"),
    modificationTime      = scalar_field("modificationTime", "p"),
    percentFinished       = scalar_field("percentFinished", "p"),
    publicationDate       = scalar_field("publicationDate", "p"),
    publisher             = scalar_field("publisher", "p"),
    thumbnail             = scalar_field("thumbnail", "p"),
    titles                = change_titles,
    type                  = scalar_field("type", "p"),
    uuid                  = scalar_field("uuid", "p"),
    version               = scalar_field("version", "p"),
    watermark             = scalar_field("watermark", "p"),
    contentIndexedState   = indexed_state("contentIndexedState"), 
    noteIndexedState      = indexed_state("noteIndexedState"),
    collections           = change_collections,
    members               = change_members,
    ownershipType         = scalar_field("ownershipType", "p"),
    shareType             = scalar_field("shareType", "p"),
    contentState          = scalar_field("contentState", "p"),
    profileId             = scalar_field("profileId", "p"),
    homeMemberCount       = scalar_field("homeMemberCount", "p"),
    collectionCount       = scalar_field("collectionCount", "p"),
    collectionSyncCounter = scalar_field("collectionSyncCounter", "p"),
    collectionDataSetName = scalar_field("collectionDataSetName", "p"),
    originType            = scalar_field("originType", "p"),
    pvcId                 = scalar_field("pvcId", "p"),
    metadataUnicodeWords  = metadata_index.change_metadataUnicodeNormalizedWords,
    companionCdeKey       = scalar_field("companionCdeKey", "p"),
    seriesState           = scalar_field("seriesState", "p"),
    totalContentSize      = scalar_field("totalContentSize", "p"),
    visibilityState       = scalar_field("visibilityState", "p"),
    isProcessed           = scalar_field("isProcessed", "p"),
    seriesId              = scalar_field("seriesId", "d"),
    itemCdeKey            = scalar_field("itemCdeKey", "d"),
    itemType              = scalar_field("itemType", "d"),
    itemPosition          = scalar_field("itemPosition", "d"),
    itemPositionLabel     = scalar_field("itemPositionLabel", "d"),
    readState             = scalar_field("readState","p")
}

-- Get the cdeType of the companion entry
local function get_companion_cdeType(cdeType)
    llog.debug4("get_companion_cdeType", "enter", "cdeType=%s", "", tostring(cdeType))
    local companionCdeType = nil
    if cdeType ~= nil then
        if cdeType == CDE_TYPE_EBOOK then
            companionCdeType = CDE_TYPE_AUDIBLE
        elseif cdeType == CDE_TYPE_EBOOK_SAMPLE then
            companionCdeType = CDE_TYPE_AUDIBLE_SAMPLE
        elseif cdeType == CDE_TYPE_AUDIBLE then
            companionCdeType = CDE_TYPE_EBOOK
        elseif cdeType == CDE_TYPE_AUDIBLE_SAMPLE then
            companionCdeType = CDE_TYPE_EBOOK_SAMPLE
        end
    end
    llog.debug4("get_companion_cdeType", "exit", "companionCdeType=%s", "", tostring(companionCdeType))
    return companionCdeType
end

-- To check if entry (cloud/downloaded based on the isArchived value) having the given companionCdeKey exists
local function is_companion_present(companionCdeKey, companionCdeType, isArchived)
    llog.debug4("is_companion_present", "enter", "companionCdeKey=%s, companionCdeType=%s, isArchived=%s", "", tostring(companionCdeKey), tostring(companionCdeType), tostring(isArchived))
    local stmt = assert(cc_db_util.package_for_assert(db:prepare("SELECT 1 FROM Entries WHERE p_cdeKey = ? AND p_isArchived = ? AND p_cdeType = ?")))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(companionCdeKey, isArchived, companionCdeType))

    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local row, message, code = stmt:first_row()
    stmt:close()
    llog.debug4("is_companion_present", "exit", "", tostring(row ~= nil))
    return row ~= nil
end

-- To update the visibilityState flag whenever the companion cdeKey column is updated
local function update_visibility_state_on_companion_update(update_spec)
    -- If the companionCdeKey is populated for an audio book, then it should be hidden
    if(update_spec.uuid ~= nil) then
        local companionCdeKey = update_spec.companionCdeKey
        if(companionCdeKey ~= nil) then
            --- To verify whether the updated entry is an Audible book
            local stmt = assert(cc_db_util.package_for_assert(db:prepare("SELECT p_isArchived AS isArchived, p_cdeType AS cdeType FROM Entries WHERE p_uuid = ? AND p_type = ?")))
            local ok, msg = cc_db_util.package_for_assert(stmt:bind(update_spec.uuid, audibleEntry))

            if not ok then
                stmt:close()
                assert(ok, msg)
            end

            local row, message, code = stmt:first_row()
            -- Update the visibility state accordingly
            -- If the entry is an ebook then set it to true
            -- If it's an audible book and 
                -- if companionCdeKey is null set it to true or
                -- if it's a downloaded entry and it has a donwloaded companion, set it to false   
            update_spec.visibilityState = row == nil or string.len(companionCdeKey) == 0 or not (row.isArchived or is_companion_present(companionCdeKey, get_companion_cdeType(row.cdeType), row.isArchived))
            stmt:close()
        end
    end
end

-- To update the visibility state of the entry corresponding to the given parameters
local function update_visibility_state(cdeKey, cdeType, state, isArchived)
    llog.debug4("update_visibility_state", "enter", "cdeKey=%s, cdeType=%s, state=%s,  isArchived=%s", "", tostring(cdeKey), tostring(cdeType), tostring(state), tostring(isArchived))
    local stmt = assert(cc_db_util.package_for_assert(db:prepare [[ UPDATE Entries SET p_visibilityState = ? WHERE p_cdeKey = ? AND p_cdeType = ? AND p_isArchived = ?]]))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(state, cdeKey, cdeType, isArchived))

    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local ok, msg = cc_db_util.package_for_assert(stmt:exec())
    stmt:close()
    assert(ok, msg)
    llog.debug4("update_visibility_state", "exit", "cdeKey=%s, cdeType=%s, state=%s,  isArchived=%s", "", tostring(cdeKey), tostring(cdeType), tostring(state), tostring(isArchived))
end

-- Update the visibility state based on the companion's existence
local function update_if_companion_exists(spec, companionCdeKey, companionCdeType)
    if companionCdeKey ~= nil then
        spec.companionCdeKey = companionCdeKey
        if spec.type == audibleEntry then
            -- Update visibility of the audible book state if it's companion exists
            spec.visibilityState = not is_companion_present(companionCdeKey, companionCdeType, DOWNLOADED_ENTRY)
        else
            -- Update the visibility of the ebook's audio companion's downloaded entry
            update_visibility_state(companionCdeKey, companionCdeType, VISIBILITY_HIDDEN,  DOWNLOADED_ENTRY)
        end
    end
end

------------------------------------------------------------------------------------------
-- Functions to assemble the "main" SQL for insert, update, or delete, plus gather any
-- special SQL statements.
------------------------------------------------------------------------------------------

local function construct_update_sql(binder, update_spec)
    local changes = { }
    local sqls = { }

    -- To update the visibilityState flag
    update_visibility_state_on_companion_update(update_spec)

    for k, v in pairs(update_spec) do
        assert(column_specs[k], "Attempt to set unknown field " .. k)

        local col_updates, extra
            = column_specs[k](update_spec, binder, change_types.update)

        for col, val in pairs(col_updates) do
            -- If the original values was "null" bypass the binder
            if string.lower(tostring(v)) == "null" then
                changes[#changes + 1] = col .. " = NULL"
            else
                changes[#changes + 1] = col .. " = " .. val
            end
        end

        for _, v in ipairs(extra) do
            sqls[#sqls + 1] = v
        end
    end

    -- When My Clippings.txt is renamed , we need to reindex metadata
    if metadata_to_reindex then
        update_spec.metadataUnicodeWords = ''
        local col_changes, extra    = column_specs.metadataUnicodeWords(update_spec, binder, change_types.update)
        for col, val in pairs(col_changes) do
            changes[#changes + 1] = col .. " = " .. val
        end

        for _, v in ipairs(extra) do
            sqls[#sqls + 1] = v
        end
    end
    
    metadata_to_reindex = false
    
    sqls[#sqls + 1] = {
                          sql = table.concat{
                                                [[ UPDATE Entries SET ]],
                                                table.concat(changes, ",\n"),
                                                [[ WHERE p_uuid = ]],
                                                binder:bind(update_spec.uuid)
                                            },
                          bind_vars = binder.bind_vars,
                          min_changes = 1,
                          max_changes = 1 
                      }

    return sqls
end

-- cache details of a downloaded entry that is going to get deleted
local function update_delete_spec_of_downloaded_entry(delete_spec)
    llog.debug4("update_delete_spec_of_downloaded_entry", "enter", "uuid=%s", "", tostring(delete_spec.uuid))

    local stmt = assert(cc_db_util.package_for_assert(db:prepare [[ SELECT p_type AS entry_type, p_cdeKey AS
         cdeKey, p_cdeType AS cdeType, p_companionCdeKey as companionCdeKey from Entries WHERE p_uuid = ? and p_isArchived = ?]]))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(delete_spec.uuid, DOWNLOADED_ENTRY))

    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local row, msg, code = stmt:first_row()
    stmt:close()

    if row then
        delete_spec.type = row.entry_type
        delete_spec.cdeKey = row.cdeKey
        local companionCdeKey = row.companionCdeKey
        local cdeType = row.cdeType
        if companionCdeKey ~= nil then
            if delete_spec.type ~= audibleEntry then
                -- While deleting the eBook, update the visibility state of the downloaded audio book if it exists
                update_visibility_state(companionCdeKey, get_companion_cdeType(cdeType), VISIBILITY_SHOWN, DOWNLOADED_ENTRY)
            end
        end
    end
    llog.debug4("update_delete_spec_of_downloaded_entry", "exit", "type=%s, cdeKey=%s", "", tostring(delete_spec.type), tostring(delete_spec.cdeKey))

end

-- The main problem with this is that the same method is used to delete an item
-- and a collection.  The two are very different, but this method needs to handle
-- both with the exact same SQL.
local function construct_delete_sql(binder, delete_spec)
    local bound_uuid = binder:bind(delete_spec.uuid)
    local filter =  nil

    -- Filter to fetch the uuid of archive item
    if delete_spec.uuid == nil then
        -- cdeGroup contains the seriesId if the entry to be deleted is a series Entry
        if delete_spec.cdeGroup then
            filter = {Equals = {path = "cdeGroup", value = delete_spec.cdeGroup}}
        else
            filter = {And = {
                            {Equals = {path = "cdeKey", value = delete_spec.cdeKey}},
                            {Equals = {path = "cdeType", value = delete_spec.cdeType}},
                            {Equals = {path = "isArchived", value = delete_spec.isArchived}}
                        }
                 }
        end
        local location_query = { noCount = true, filter = filter, resultType = "uuid" }
        --Make the query
        local result_rows = assert(query.internal.query(location_query))
        if result_rows and result_rows.values[1] then
            -- Rebind the UUID in case it was not directly passed in.
            bound_uuid = binder:bind(result_rows.values[1].uuid)
            -- Delete the downloaded shared item JSIXONE-3721
            llog.debug4("construct_delete_sql", "location_query", "originType=%s", "", tostring(result_rows.values[1].originType))
            if result_rows.values[1].originType == shared_origin_type then
                local downloaded_content_filter = {And = {
                            {Equals = {path = "cdeKey", value = delete_spec.cdeKey}},
                            {Equals = {path = "cdeType", value = delete_spec.cdeType}},
                            {Equals = {path = "isArchived", value = 0}}
                        }
                 }
                 
                local downloaded_content_query = { noCount = true, filter = downloaded_content_filter, resultType = "min_downloaded_data" }
                --Make the query
                local downloaded_content_result_rows = assert(query.internal.query(downloaded_content_query))
                if downloaded_content_result_rows and downloaded_content_result_rows.values[1] then
                    llog.debug4("construct_delete_sql", "downloaded_content_result_rows", "dump=%s", "",  cc_string_util.dump(downloaded_content_result_rows))
                    delete_downloaded_item(downloaded_content_result_rows.values[1].uuid, downloaded_content_result_rows.values[1].cdeKey, downloaded_content_result_rows.values[1].cdeType, downloaded_content_result_rows.values[1].titles_0_nominal, downloaded_content_result_rows.values[1].guid, downloaded_content_result_rows.values[1].location)
                end
            end
            
        end
    else
        -- Deletion of downloaded entry
        update_delete_spec_of_downloaded_entry(delete_spec)
    end
    
    -- Removing this logic and moving this to DCM. We need to remove only content index as
    -- metadata index is done and store in CC DB itself and not separately.
    return {
               {
                   -- TODO : Need to optimize this code to avoid query duplications.
                   -- This is for the case that an item is being deleted.
                   --  Also when a cloud item gets deleted from MYK
                   sql = [[ UPDATE  Collections 
                           SET     i_member_is_present = (SELECT count(*) 
                                                          FROM Entries 
                                                          WHERE p_cdeKey = (SELECT p_cdeKey FROM Entries WHERE p_uuid = ]] .. bound_uuid .. [[) AND 
                                                                p_cdeType=(SELECT p_cdeType FROM Entries WHERE p_uuid = ]] .. bound_uuid .. [[) AND 
                                                                p_uuid != ]] .. bound_uuid .. [[  AND p_isArchived = 0),
                                   i_is_sideloaded = (SELECT count(*) 
                                                      FROM Entries 
                                                      WHERE (p_cdeKey = (SELECT p_cdeKey FROM Entries WHERE p_uuid = ]] .. bound_uuid .. [[) AND 
                                                             p_cdeType = (SELECT p_cdeType FROM Entries WHERE p_uuid = ]] .. bound_uuid .. [[) AND 
                                                             p_uuid != ]] .. bound_uuid .. [[ AND p_isArchived = 0) 
                                                             OR 
                                                            (p_uuid = ]] .. bound_uuid .. [[ AND p_isArchived = 0 AND p_contentState = 0)),
                                   i_member_uuid = (SELECT p_uuid FROM Entries                                                                       
                                                      WHERE (p_cdeKey = (SELECT p_cdeKey FROM Entries WHERE p_uuid = ]] .. bound_uuid .. [[) AND       
                                                             p_cdeType = (SELECT p_cdeType FROM Entries WHERE p_uuid = ]] .. bound_uuid .. [[) AND     
                                                             p_uuid != ]] .. bound_uuid .. [[)                                                         
                                                             OR                                                                                        
                                                             (p_uuid = ]] .. bound_uuid .. [[))
                            WHERE   ( i_member_cde_key = (SELECT p_cdeKey FROM Entries WHERE p_uuid = ]] .. bound_uuid .. [[) AND 
                                      i_member_cde_type = (SELECT p_cdeType FROM Entries WHERE p_uuid = ]] .. bound_uuid .. [[)) 
                                    OR 
                                    ( i_member_uuid = ]] .. bound_uuid .. [[)]],
                   bind_vars = binder.bind_vars,
               },
               {
                   -- This is for the case that an item is being deleted.
                   sql = [[ UPDATE Entries
                            SET    p_memberCount = 
                                                (SELECT COUNT(*)
                                                FROM   Collections
                                                WHERE  i_collection_uuid = Entries.p_uuid AND (i_member_uuid != ]] .. bound_uuid .. [[)),
                                   p_homeMemberCount = 
                                                (SELECT COUNT(*)
                                                FROM   Collections
                                                WHERE  i_member_is_present = 1 AND i_collection_uuid = Entries.p_uuid)
                            WHERE  p_uuid IN
                                       (SELECT i_collection_uuid
                                        FROM   Collections
                                        WHERE  (i_member_cde_key = (SELECT p_cdeKey FROM Entries WHERE p_uuid = ]] .. bound_uuid .. [[) AND 
                                                i_member_cde_type = (SELECT p_cdeType FROM Entries WHERE p_uuid = ]] .. bound_uuid .. [[)) 
                                               OR 
                                               (i_member_uuid = ]] .. bound_uuid .. [[))]],
                    bind_vars = binder.bind_vars,
               },
               {
                   -- This is for the case that a collection is being deleted.
                   sql = [[ UPDATE Entries
                            SET    p_collectionCount =
                                       (SELECT  COUNT(i_collection_uuid)
                                        FROM    Collections
                                        WHERE   i_member_cde_key = Entries.p_cdeKey
                                        AND i_collection_uuid IN (SELECT p_uuid FROM Entries WHERE p_type='Collection' AND p_isVisibleInHome=1)
                                        AND i_collection_uuid <> ]] .. bound_uuid .. [[)
                            WHERE  p_cdeKey IN
                                       (SELECT i_member_cde_key
                                        FROM   Collections
                                        WHERE  i_collection_uuid = ]] .. bound_uuid .. [[)]],
                    bind_vars = binder.bind_vars,
               },
               {
                   sql = [[ DELETE FROM Entries
                            WHERE p_uuid = ]] .. bound_uuid,
                   bind_vars = binder.bind_vars,
                   min_changes = 1,
                   max_changes = 1
               },
               {                                                                                                                                                 
                   -- This is for the case that an cloud item is deleted and remove the association of collection and item, if item not downloaded.                          
                   sql = [[ DELETE FROM Collections                                                                                                              
                            WHERE  (i_member_uuid = ]] .. bound_uuid .. [[)                                                                                      
                            AND ( SELECT count(*) FROM entries WHERE p_cdekey = i_member_cde_key AND                                                             
                                         p_cdetype = i_member_cde_type AND p_uuid != i_member_uuid ) = 0]],                                                      
                   bind_vars = binder.bind_vars,                                                                                                                 
               },
               {
                   -- This is for the case that a collection is being deleted.
                   sql = [[ DELETE FROM Collections
                            WHERE   (i_collection_uuid = ]] .. bound_uuid .. [[)
                                    OR ((i_member_cde_type IS NULL OR i_member_cde_key IS NULL) AND i_member_is_present = 0) ]],
                   bind_vars = binder.bind_vars,
               },
           }
end


-- This function tried the cde_type and cde_key to get the UUID for a given item.
-- Otherwise it tries the location.
local function update_collections_in_entries_on_insert (member_uuid)
    llog.debug4("update_collections_in_entries_on_insert", "enter", "member_uuid=%s", "", tostring(member_uuid))
    
    -- add j_members and j_collections because the API needs it.
    local sql =         
        [[
            UPDATE Entries 
            SET 
                p_memberCount = (SELECT COUNT(i_member_uuid) FROM Collections WHERE i_collection_uuid = Entries.p_uuid),
                p_homeMemberCount = (SELECT COUNT(i_member_uuid) FROM Collections WHERE i_collection_uuid = Entries.p_uuid AND i_member_is_present = 1)
            WHERE 
                p_uuid IN (SELECT i_collection_uuid FROM Collections WHERE i_member_uuid = ?)
        ]]
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(member_uuid))
    if not ok then
        stmt:close()
        assert(ok, msg)
    end
    local ok, msg = cc_db_util.package_for_assert(stmt:exec())
    if not ok then
        stmt:close()
        assert(ok, msg)
    end
    stmt:close()

    local sql = 
        [[
            UPDATE Entries 
            SET 
                p_collectionCount = (SELECT COUNT(i_collection_uuid) FROM Collections WHERE i_member_cde_key = Entries.p_cdeKey AND i_collection_uuid IN (SELECT p_uuid FROM Entries WHERE p_type='Collection' AND p_isVisibleInHome=1))
            WHERE p_uuid = ?
        ]]
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(member_uuid))
    if not ok then
        stmt:close()
        assert(ok, msg)
    end
    local ok, msg = cc_db_util.package_for_assert(stmt:exec())
    if not ok then
        stmt:close()
        assert(ok, msg)
    end
    stmt:close()
end

-- This function creates collection associations using cdeKey and cdeType
-- @param associations List of collection associations to be created
local function create_collection_association(associations)
    local dirty_collection_rows = {}
    local dirty_member_rows = {}
    for _,association in pairs(associations) do            
        local is_member_present = association.member_present
        local is_sideloaded = association.sideloaded
        local should_query_entries = association.query_entries_for_member                        
        if(should_query_entries ~= nil and should_query_entries == 1 and association.member_uuid == nil ) then
                if association.cdetype and association.cdekey then
                        local stmt = assert(cc_db_util.package_for_assert(db:prepare("SELECT p_uuid AS uuid FROM Entries WHERE p_cdeType = ? AND p_cdeKey = ?")))
                        local ok, msg = cc_db_util.package_for_assert(stmt:bind(association.cdetype, association.cdekey))
                        if not ok then
                                stmt:close()
                                assert(ok, msg)
                        end
                        local row, message, code = stmt:first_row()
                        stmt:close()

                        if row then
                                association.member_uuid = row.uuid
                        end
                        if code and code ~= 0 then
                                assert(cc_db_util.package_for_assert(row, message, code))
                        end
                        if association.member_uuid == nil then
                        --avoid creating duplicate entries by combining collection_uuid+cdetype+cdekey
                                association.member_uuid = association.collection_uuid..association.cdetype..association.cdekey
                        end
                end
        else
                if(is_member_present == 0) then
                        --avoid creating duplicate entries by combining collection_uuid+cdetype+cdekey
                        association.member_uuid = association.collection_uuid..association.cdetype..association.cdekey
                end
        end
        local binder = make_binder()
        local sql = [[ INSERT OR IGNORE INTO Collections VALUES ( ]]..binder:bind(association.collection_uuid)..[[,]]..
                    binder:bind(association.member_uuid)..[[,]]..
                    [[(SELECT count(*) + 1 FROM Collections WHERE i_collection_uuid = ]] ..binder:bind(association.collection_uuid)..[[) ,]]..
                    binder:bind(association.cdetype)..[[,]]..
                    binder:bind(association.cdekey)..[[,]]..
                    binder:bind(is_member_present)..[[,]]..
                    binder:bind(is_sideloaded)..[[)]]        
        cc_db_util.exec_sql(db,sql,binder.bind_vars)
        dirty_collection_rows[association.collection_uuid] = association.collection_uuid
        dirty_member_rows[association.member_uuid] = association.member_uuid
    end
    
    local binder = make_binder()
    local sql = [[ UPDATE Entries
                    SET  p_memberCount = (SELECT COUNT(i_member_uuid) FROM Collections WHERE i_collection_uuid = Entries.p_uuid),
                         p_homeMemberCount = (SELECT COUNT(i_member_uuid) FROM Collections WHERE i_member_is_present = 1 AND i_collection_uuid = Entries.p_uuid)
                    WHERE p_uuid IN (]]
                    
    local vars = {}
    for k,v in pairs(dirty_collection_rows) do
        vars[#vars+1] = binder:bind(v)
    end

    sql=sql..table.concat(vars,",")..[[)]]
    cc_db_util.exec_sql(db,sql,binder.bind_vars)

    local binder = make_binder()
    local sql = [[ UPDATE Entries
                    SET  p_collectionCount =
                            (SELECT count(*)
                             FROM   Collections
                             WHERE  i_member_cde_key = Entries.p_cdeKey AND
                             i_collection_uuid IN (SELECT p_uuid FROM 
                                 Entries WHERE p_type='Collection' AND p_isVisibleInHome=1))
                   WHERE  p_uuid IN
                            (]]
    local vars = {}
    for k,v in pairs(dirty_member_rows) do
        vars[#vars+1]= binder:bind(v)
    end
    sql = sql..table.concat(vars,",")..[[ )]]
    cc_db_util.exec_sql(db,sql,binder.bind_vars)   
end

-- This function tries to get the UUID from the cde_key and cde_type. If the
-- UUID cannot be found, it then obtains the UUID from the location.
--
-- If the item is an archived item, then it is ignored.
--
-- @param cde_type New entry CDE type
-- @param cde_key New entry CDE key
-- @param is_archived Whether the new entry is archived
-- @param new_member_uuid The uuid of the new entry
-- @return new_member_uuid if the collection is to be updated, or nil if the update is ignored. 
local function update_member_uuid_in_collections (cde_type, cde_key, is_archived, new_member_uuid)
    llog.debug4("update_member_uuid_in_collections", "enter", "cdeType=%s,cdeKey=%s,new_member_uuid=%s", "", tostring(cde_type), tostring(cde_key), tostring(new_member_uuid))

    if not cde_type or not cde_key or is_archived == true then
        return nil
    end
        
    local stmt = assert(cc_db_util.package_for_assert(db:prepare("SELECT count(*) AS collection_count FROM Collections WHERE i_member_cde_type = ? AND i_member_cde_key = ?")))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(cde_type, cde_key))
    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local row, msg, code = stmt:first_row()
    stmt:close()

    if not row then
        if code and code ~= 0 then
            assert(cc_db_util.package_for_assert(row, msg, code))
        end
    end
            
    local stmt = assert(cc_db_util.package_for_assert(db:prepare("UPDATE Collections SET i_member_uuid = ?, i_member_is_present = 1 WHERE i_member_cde_type = ? AND i_member_cde_key = ?")))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(new_member_uuid, cde_type, cde_key))
    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local ok, msg = cc_db_util.package_for_assert(stmt:exec())
    stmt:close()
    assert(ok, msg)
    
    return new_member_uuid
end

-- This function uses the given filter to get the UUID for a given item.
local function read_uuid_from_entries_for_filter(filter)
    llog.debug4("read_uuid_from_entries_for_filter", "enter", "filter = %s", "", tostring(filter))
    if filter == nil then
        return nil
    end
    
    local uuid_query = { noCount = true, filter = filter, resultType = "fast" }
    --Make the query
    local result_rows = assert(query.internal.query(uuid_query))
    if result_rows and result_rows.values[1] then
        llog.debug4("read_uuid_from_entries_for_filter", "exit", "uuid=%s originType=%s", "", tostring(result_rows.values[1].uuid), tostring(result_rows.values[1].originType))
        -- return the matched UUID
        return result_rows.values[1]
    end
    llog.debug4("read_uuid_from_entries_for_filter", "exit", "uuid=nil", "")
    return nil
end

-- This fucntion gets the current lastAccess value from entries table if the entry exists already.
local function read_lastAccess_from_entries(cde_group, item_type)
    llog.debug4("read_lastAccess_from_entries", "enter", "cdeGroup=%s,type=%s", "", tostring(cde_group), tostring(item_type))

    local stmt = assert(cc_db_util.package_for_assert(db:prepare("SELECT p_lastAccess AS lastAccess FROM Entries WHERE p_cdeGroup = ? AND p_type = ? ")))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(cde_group, item_type))

    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local row, message, code = stmt:first_row()
    stmt:close()
    local lastAccess
    if row then
        lastAccess = row.lastAccess
    end
    if code and code ~= 0 then
        assert(cc_db_util.package_for_assert(row, message, code))
    end

    llog.debug4("read_lastAccess_from_entries", "exit", "lastAccess=%s", "", tostring(lastAccess))
    return lastAccess
end

-- This function tried the cde_type and cde_key to get the UUID for a given item.
-- Otherwise it tries the location.
local function read_uuid_from_entries (cde_type, cde_key, cde_group, version, guid, location, is_archive_item, title, item_type, origin_type)
    llog.debug4("read_uuid_from_entries", "enter", "cdeType=%s,cdeKey=%s,cdeGroup=%s,version=%s,guid=%s,location=%s,title=%s,type=%s,originType=%s", "", tostring(cde_type), tostring(cde_key), tostring(cde_group),tostring(version), tostring(guid), tostring(location), tostring(title), tostring(item_type), tostring(origin_type))

    if not is_archive_item then
        is_archive_item = 0
    end

    local stmt, ok, msg
    if item_type == seriesEntry then
        stmt = assert(cc_db_util.package_for_assert(db:prepare("SELECT p_uuid AS uuid, p_thumbnail AS thumbnail, p_readState AS readState FROM Entries WHERE p_cdeGroup = ? AND p_type = ? AND p_isArchived = ?")))
        ok, msg = cc_db_util.package_for_assert(stmt:bind(cde_group, item_type, is_archive_item))
    elseif location then
        stmt = assert(cc_db_util.package_for_assert(db:prepare("SELECT p_uuid AS uuid, p_thumbnail AS thumbnail, p_readState AS readState FROM Entries WHERE p_location = ? AND p_isArchived = ?")))
        ok, msg = cc_db_util.package_for_assert(stmt:bind(location, is_archive_item))
    elseif cde_type and cde_key then
        stmt = assert(cc_db_util.package_for_assert(db:prepare("SELECT p_uuid AS uuid, p_thumbnail AS thumbnail, p_readState AS readState FROM Entries WHERE p_cdeType = ? AND p_cdeKey = ? AND p_version IS ? AND p_guid IS ? AND p_isArchived = ?")))
        ok, msg = cc_db_util.package_for_assert(stmt:bind(cde_type, cde_key, version, guid, is_archive_item))
    elseif title and item_type=='Collection' and origin_type==subscription_origin_type then
        stmt = assert(cc_db_util.package_for_assert(db:prepare("SELECT p_uuid AS uuid, p_thumbnail AS thumbnail, p_readState AS readState FROM Entries WHERE p_titles_0_nominal = ? AND p_type = ? AND p_originType = ? AND p_isArchived = ?")))
        ok, msg = cc_db_util.package_for_assert(stmt:bind(title, item_type, origin_type, is_archive_item))
    else
        return nil
    end

    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local row, message, code = stmt:first_row()
    stmt:close()
    if row then
        return row.uuid, row.thumbnail, row.readState
    end
    if code and code ~= 0 then
        assert(cc_db_util.package_for_assert(row, message, code))
    end

    return nil
end

-- This function constructs insert sql for series table
local function construct_series_insert_sql(binder, insert_spec)
    local columns = { }
    local values = { }
    local sqls = { "<placeholder>" }
    local conflict = insert_spec.onConflict

    for k, v in pairs(insert_spec.entry) do
        local col_changes, extra
            = column_specs[k](insert_spec.entry, binder, change_types.insert)

        for col, val in pairs(col_changes) do
            columns[#columns + 1] = col
            values[#values + 1]   = val
        end

        for _, v in ipairs(extra) do
            sqls[#sqls + 1] = v
        end
    end

    local insert_partial
    if conflict then
        if conflict == "IGNORE" then
            insert_partial = "INSERT OR IGNORE INTO Series ( "
        else
            insert_partial = "INSERT OR REPLACE INTO Series ( "
        end
    else
        insert_partial = "INSERT INTO Series ( "
    end

    sqls[1] = {
                  sql = table.concat{
                                        insert_partial,
                                        table.concat(columns, ",\n"),
                                        [[ ) VALUES ( ]],
                                        table.concat(values, ",\n"),
                                        [[ ) ]]
                                    },
                  bind_vars = binder.bind_vars,
                  min_changes = 1,
                  max_changes = 1
              }

    return sqls
end

-- This function constructs delete sql for series table
local function construct_series_delete_sql(binder, delete_spec)
    local sqls = { "<placeholder>" }
    sqls[1] = {
                  sql = [[ DELETE FROM Series WHERE d_seriesId = "]] .. delete_spec.seriesId .. [[" AND d_itemCdeKey = "]] .. delete_spec.itemCdeKey .. [["]],
                  bind_vars = binder.bind_vars,
                  min_changes = 1,
                  max_changes = 1
              }
    return sqls
end

-- updates insert_spec of a downloaded entry if the corresponding cloud entry exists in cc.db
local function update_insert_spec_of_downloaded_entry(insert_spec)
    llog.debug4("update_insert_spec_of_downloaded_entry", "enter", "cdeKey=%s, cdeType=%s", "", tostring(insert_spec.cdeKey), tostring(insert_spec.cdeType))

    local stmt = assert(cc_db_util.package_for_assert(db:prepare [[ SELECT p_type AS entry_type, j_displayObjects AS
         displayObjects, p_publicationDate AS publicationDate, p_readState AS readState, p_companionCdeKey AS companionCdeKey from Entries WHERE
         p_cdeKey = ? and p_cdeType = ? and p_isArchived = 1 ]]))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(insert_spec.cdeKey, insert_spec.cdeType))

    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local row, msg, code = stmt:first_row()
    stmt:close()

    if row then
        if row.entry_type ~= nil then
            insert_spec.type = row.entry_type
        end
        if row.displayObjects ~= nil then
            insert_spec.displayObjects = json.decode(row.displayObjects)
        end
        if row.publicationDate ~= nil then
            insert_spec.publicationDate = row.publicationDate
        end
        if row.readState ~= nil then
            insert_spec.readState = row.readState
        end
        update_if_companion_exists(insert_spec, row.companionCdeKey, get_companion_cdeType(insert_spec.cdeType))
    end

  llog.debug4("update_insert_spec_of_downloaded_entry", "exit", "type=%s, displayObjects=%s, publicationDate=%s, readState=%d, companionCdeKey=%s"," ",
    tostring(insert_spec.type), tostring(json.encode(insert_spec.displayObjects)), tostring(insert_spec.publicationDate), insert_spec.readState, tostring(insert_spec.companionCdeKey))
end

-- updates the corresponding downloaded entry if it is already present in cc.db
local function update_downloaded_db_entry(insert_spec)
    llog.debug4("update_downloaded_db_entry", "enter", "cdeKey=%s, cdeType=%s", "", tostring(insert_spec.cdeKey), tostring(insert_spec.cdeType))

    local stmt = assert(cc_db_util.package_for_assert(db:prepare [[ UPDATE Entries set p_type = ? , j_displayObjects = ? ,
    p_publicationDate = ? WHERE p_cdeKey = ? and p_cdeType = ? and p_isArchived = 0 ]]))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(insert_spec.type, json.encode(insert_spec.displayObjects)
        ,insert_spec.publicationDate, insert_spec.cdeKey, insert_spec.cdeType))

    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local ok, msg = cc_db_util.package_for_assert(stmt:exec())
    stmt:close()
    assert(ok, msg)

    llog.debug4("update_downloaded_db_entry", "exit", "cdeKey=%s, cdeType=%s", "", tostring(insert_spec.cdeKey), tostring(insert_spec.cdeType))
end

function construct_insert_sql(binder, insert_spec, ignore_or_replace)
    local columns = { }
    local values = { }
    local sqls = { "<placeholder>" }

    local collection_member_uuid = update_member_uuid_in_collections(insert_spec.cdeType, insert_spec.cdeKey,
            insert_spec.isArchived, insert_spec.uuid)

    -- Do some initial fixup.
    if insert_spec.collections == nil then
        insert_spec.collections = { }
    end

    if insert_spec.members == nil then
        insert_spec.members = { }
    end

    if insert_spec.titles == nil or #insert_spec.titles == 0 then
        insert_spec.titles = { { display = uri_to_title(insert_spec.location) } }
    end

    if insert_spec.titles[1].display == nil
        and insert_spec.titles[1].nominal == nil then
        insert_spec.titles[1].display = insert_spec.location
    end

    if insert_spec.languages == nil then
        insert_spec.languages = { }
    end

    if insert_spec.credits == nil then
        insert_spec.credits = { }
    end

    if insert_spec.displayObjects == nil then
        insert_spec.displayObjects = { { ref = "titles" } }
    end

    if tostring(content_source) == on_device_content_source then
        update_insert_spec_of_downloaded_entry(insert_spec)
    else
        update_downloaded_db_entry(insert_spec)
    end

    if insert_spec.isArchived == nil then
        insert_spec.isArchived = false
    end

    if insert_spec.isLatestItem == nil then
        insert_spec.isLatestItem = true
    end

    if insert_spec.isUpdateAvailable == nil then
        insert_spec.isUpdateAvailable = false
    end

    if insert_spec.isVisibleInHome == nil then
        insert_spec.isVisibleInHome = false
    end

    if insert_spec.isTestData == nil then
        insert_spec.isTestData = false
    end

    if insert_spec.virtualCollectionCount == nil then
        insert_spec.virtualCollectionCount = 0
    end

    --If no access time is provided on an insert, set to now to
    --ensure that this is the newest item.
    if insert_spec.lastAccess == nil then
        insert_spec.lastAccess = tonumber(os.date('%s'))
    end

    if insert_spec.contentIndexedState == nil then
        if insert_spec.type ~= "Entry:Item" or insert_spec.isArchived then
            insert_spec.contentIndexedState = integer_max_value
        else
            insert_spec.contentIndexedState = 0
        end
    end

    if insert_spec.noteIndexedState == nil then
        insert_spec.noteIndexedState = 0
    end

    if insert_spec.ownershipType == nil then
        insert_spec.ownershipType = 0
    end

    if insert_spec.originType == nil then
        insert_spec.originType = 0
    end
 
    if insert_spec.contentState == nil then
        insert_spec.contentState = 0
    end
    
    if insert_spec.collectionDataSetName == nil then
        insert_spec.collectionDataSetName = 0
    end

    if insert_spec.collectionSyncCounter == nil then
        insert_spec.collectionSyncCounter = 0
    end

    insert_spec.seriesState = 1

    if insert_spec.type == seriesEntry then
        insert_spec.isProcessed = 0
    end

    if insert_spec.totalContentSize == nil then
        insert_spec.totalContentSize = insert_spec.diskUsage
    end

    if insert_spec.visibilityState == nil then
        insert_spec.visibilityState = VISIBILITY_SHOWN
    end

    for k, v in pairs(insert_spec) do
        assert(column_specs[k], "Attempt to set unknown field " .. k)
        local col_changes, extra
            = column_specs[k](insert_spec, binder, change_types.insert)

        for col, val in pairs(col_changes) do
            columns[#columns + 1] = col
            values[#values + 1]   = val
        end

        for _, v in ipairs(extra) do
            sqls[#sqls + 1] = v
        end
    end
 
    insert_spec.metadataUnicodeWords = ''
    -- Index the metadata to a searchable string.
    local col_changes, extra
          = column_specs.metadataUnicodeWords(insert_spec, binder, change_types.insert)
    for col, val in pairs(col_changes) do
        columns[#columns + 1] = col
        values[#values + 1]   = val
    end
    for _, v in ipairs(extra) do
        sqls[#sqls + 1] = v
    end
                                                                                                    
    local insert_partial
    if ignore_or_replace then
        if ignore_or_replace == "IGNORE" then
            insert_partial = "INSERT OR IGNORE INTO Entries ( "
        else
            insert_partial = "INSERT OR REPLACE INTO Entries ( "
        end
    else
        insert_partial = "INSERT INTO Entries ( "
    end

    sqls[1] = {
                  sql = table.concat{
                                        insert_partial,
                                        table.concat(columns, ",\n"),
                                        [[ ) VALUES ( ]],
                                        table.concat(values, ",\n"),
                                        [[ ) ]]
                                    },
                  bind_vars = binder.bind_vars,
                  min_changes = 1,
                  max_changes = 1
              }

    return sqls, collection_member_uuid
end

local function construct_insert_or_sql(binder, insert_spec)
    local display = nil
    local original_uuid = nil
    local original_thumbnail = nil
    local original_lastAccess = nil
    local original_readState  = nil

    if insert_spec.onConflict == "IGNORE_IF_SAME_VALUE" then
        local result = read_uuid_from_entries_for_filter(insert_spec.filter)
        
        -- Ignore the insert if item matches the given filter else insert the item with replace option
        if result ~= nil then
            original_uuid = result.uuid
            original_thumbnail = result.thumbnail
            local columnName = insert_spec.column.path
            if columnName and result[columnName] == insert_spec.entry[columnName] then
                return { }
            end

            -- Use the existing visibility of the item 
            insert_spec.entry.isVisibleInHome = result.isVisibleInHome
        end
    else    
        if insert_spec.entry.titles ~= nil and insert_spec.entry.titles[1] ~= nil then
            display = insert_spec.entry.titles[1].display
        end
        original_uuid, original_thumbnail, original_readState = read_uuid_from_entries(insert_spec.entry.cdeType, insert_spec.entry.cdeKey, insert_spec.entry.cdeGroup, insert_spec.entry.version, insert_spec.entry.guid, insert_spec.entry.location, insert_spec.entry.isArchived, display, insert_spec.entry.type, insert_spec.entry.originType)
        if insert_spec.entry.type == seriesEntry then
            original_lastAccess = read_lastAccess_from_entries(insert_spec.entry.cdeGroup, insert_spec.entry.type)
        end
    end

    if original_uuid then
        if insert_spec.onConflict == "IGNORE" then
            return { }
        else
            local stmt = assert(cc_db_util.package_for_assert(db:prepare("DELETE FROM Entries WHERE p_uuid = ?")))
            local ok, msg = cc_db_util.package_for_assert(stmt:bind(original_uuid))
            if not ok then
                stmt.close()
                assert(ok, msg)
            end

            local ok, msg = cc_db_util.package_for_assert(stmt:exec())

            stmt:close()

            if insert_spec.entry.isArchived then
                --This is done so that we enforce same UUID's. Needed for Cloud Collections support.
                insert_spec.entry.uuid = original_uuid
                if original_thumbnail then 
                    insert_spec.entry.thumbnail = original_thumbnail
                end
                if original_lastAccess then
                    insert_spec.entry.lastAccess = original_lastAccess
                end
                if original_readState then
                    insert_spec.entry.readState = original_readState
                end
            end

            assert(ok, msg)
        end
    end
    
    local insert_sqls, collection_member_uuid = construct_insert_sql(binder, insert_spec.entry, insert_spec.onConflict)
    return insert_sqls, collection_member_uuid
end

--This is a special command which simply resets the indexed states of each item.
local function construct_reset_indexer()
    --Note indexed states are just set to 0.
    --Content indexed state is set to 0 only for non-archived entries of type 'Entry:Item' while
    --others are set to a value indicating the content is not to be indexed.
    return {
            {
                sql = [[ UPDATE Entries SET
                            p_contentIndexedState = 
                                CASE 
                                    WHEN (p_isArchived = 0 AND p_type = 'Entry:Item') THEN 
                                        0
                                    ELSE  
                                        ]] .. integer_max_value .. [[
                                    END,
                            p_noteIndexedState = 0
                    ]],
                min_changes = 1,
                max_changes = 1
            }
        }
end

-- Reset the Origin Type for shared item.
local function reset_origin_type_for_shared()
    llog.debug4("reset_origin_type_for_shared", "enter", "", "")

    local sql = [[ UPDATE Entries SET p_originType = 0 WHERE p_originType = 12 ]]

    assert(cc_db_util.package_for_assert(db:exec(sql)))
    llog.debug4("reset_origin_type_for_shared", "exit", "", "")
end

local change_types = {
    update = construct_update_sql,
    delete = construct_delete_sql,
    insert = construct_insert_sql,
    insertOr = construct_insert_or_sql,
    resetIndexer = construct_reset_indexer,
    insertOr_series = construct_series_insert_sql,
    delete_series = construct_series_delete_sql
}

-- This function creates non_sql object with the given command and args.
local function construct_non_sql(change_spec_key, change_spec_value)
    local non_sql = {}
    non_sql.command = change_spec_key
    non_sql.args = change_spec_value
    return non_sql
end

-- This function appends _series to the given command.
local function construct_change_types(change_spec_key, change_spec_value)
    if change_spec_value.table == series_table then
        change_spec_key = change_spec_key .. "_series"
    end

    return change_spec_key
end

-- This function returns true for insert/insertOr/delete change types.
local function is_insert_or_delete(change_spec_key)
    return change_spec_key == "insert" or change_spec_key == "insertOr" or change_spec_key == "delete"
end

local function construct_change_sql(change_spec, profile_data)
    local non_sqls = { }
    local pack_sql_colls = { }
    local non_sql = { }
    for _, change in ipairs(change_spec.commands) do
        for k, u in pairs(change) do
            local skip_change = false
            -- Check if Device Content Change Request 
            if tostring(content_source) == on_device_content_source then
                local is_whitelisted = dcm.change_entry(k, u, profile_data, db)

                -- Skip this item as its not white listed
                if not is_whitelisted then
                    skip_change = true;
                end
            end
            if not skip_change then
                -- constructing change_types for sql commands that needs to be executed on tables other than "Entries" table.
                if change_types[k] and u.table then
                    k = construct_change_types(k,u)
                end
                if change_types[k]  then
                        local binder = make_binder()
                        local sqls, collection_member_uuid = change_types[k](binder, u)

                         -- constructs non_sql object based on change_spec entry type.
                        if tostring(content_source) == on_device_content_source then
                            if is_insert_or_delete(k) then
                                non_sqls[#non_sqls + 1] = construct_non_sql(downloadedSeriesInfo, u)
                            end
                        else
                            if k == 'delete' then
                                -- Constructs non_sql to refresh the series when a cloud series item is being deleted
                                non_sql = construct_non_sql("refreshSeriesIfRequired", u)
                                if non_sql ~= nill then
                                    non_sqls[#non_sqls + 1] = non_sql
                                end
                            end
                        end

                        local pack_sql_coll = { }
                        pack_sql_coll.sqls = sqls
                        pack_sql_coll.collection_member_uuid = collection_member_uuid
                        pack_sql_colls[#pack_sql_colls + 1] = pack_sql_coll
                else
                    -- Handle the other non-standard change types.
                    non_sqls[#non_sqls + 1] = construct_non_sql(k,u)
                end
            end
        end
    end

    return pack_sql_colls, non_sqls
end

local function change_internal(post_data, profile_data, rv)

    local ok, change_spec = pcall(function()
        return json.decode(post_data, false)
    end)

    if not ok then
        local dev_build=io.open("/INTERNAL_FEATURES_ENABLED__DO_NOT_RELEASE","r")
        if dev_build ~= nil then
            llog.error("pc","json_decode","JIRA:%s","JSON decode error", "JFOUR-6826")
            local file = io.open("/var/local/log/json_error", "w")
            if file ~= nil and post_data ~= nil then
               file:write(post_data)
               file:close()
            end
            dev_build:close()
        end
        assert(cc_db_util.package_for_assert(nil, "bad_json", 4))
    end

    -- Re-index the metadata if reindexMetadata is set to true.
    -- reIndexMetadata is not a column name. It is an instruction
    pcall(function()
            if change_spec.commands[1].update.reIndexMetadata then
                local value = tostring(change_spec.commands[1].update.reIndexMetadata)
                if value == "true" then
                    metadata_to_reindex = true
                end
                change_spec.commands[1].update.reIndexMetadata = nil
            end
        end)
        
    --Set the global no_notify. If this is non-zero this message will not send
    --an update notification.
    no_notify = change_spec.noNotify
    content_source = change_spec.contentSource

    if tostring(content_source) == on_device_content_source then
        dcm.begin()
    end

    rv.id = change_spec.id
    local pack_sql_colls, non_sqls = construct_change_sql(change_spec, profile_data)

    local ok = true
    local message

    -- deleted_archived_items is a list of items that are being
    -- deleted.  Their archived items entry might need to be
    -- updated.
    local deleted_archived_items_list = {}
    local UPDATE_TYPE_DELETE = "Delete"
    
    for _, non_sql in ipairs(non_sqls) do
        if non_sql.command == "updateDeletedArchivedItem" then
            local deleted_cdekey, deleted_cdetype = archived_items.fetch_cdekey_and_cdetype( db, non_sql.args.deletedUuid)
            if deleted_cdekey then
                deleted_archived_item = {}
                deleted_archived_item.cdekey = deleted_cdekey
                deleted_archived_item.cdetype = deleted_cdetype
                deleted_archived_items_list[#deleted_archived_items_list + 1] = deleted_archived_item
            end
        elseif non_sql.command == "deleteAllArchivedItems" then
            series.cleanUpSeries(db)
            archived_items.delete_all_archived_items_item(db, non_sql.args.removeThumbnails)
            content_state.clear_content_state_for_all(db)
            reset_origin_type_for_shared(db)
        elseif non_sql.command == "deleteSubscription" then
            change.delete_subscription(db)
        elseif non_sql.command == "updateCollectionOnLocaleChange" then
            change.update_collection_on_locale_change(db)
        elseif non_sql.command == "updateCollectionItemsCount" then
            change.update_collection_items_count(db,non_sql.args.collectionId, non_sql.args.isVisible)
        elseif non_sql.command == "updatePeriodicalVirtualCollection" and non_sql.args.updateType == UPDATE_TYPE_DELETE and non_sql.args.isArchived == "1" then
            non_sql.args.title, non_sql.args.cdeGroup, non_sql.args.language = periodicals_virtual_collections.fetchItemDetails(db, non_sql.args.cdeKey, non_sql.args.isArchived)
        elseif non_sql.command == "prepareForSeriesUpdate" then
            series.prepareForSeriesUpdate(db, non_sql.args.seriesId)
        elseif non_sql.command == "deleteArchivedItemsOfType" then
            archived_items.delete_all_archived_items_item(db, non_sql.args.removeThumbnails, non_sql.args.type)
            if non_sql.args.removeDownloadedItems == true then
                downloaded_items.delete_all_downloaded_items_item(db, non_sql.args.type)
            end
        end
    end

    for _, pack_sql_coll in ipairs(pack_sql_colls) do
        if not ok then
            llog.error("pc", "sqlb", '%s:"%s"', "", "quitting_due_to_an_earlier_error", tostring(message))
            break
        end

        local cs = pack_sql_coll.sqls
        if type(cs) == "function" then
            cs = cs(db)
        end

        for _, c in ipairs(cs) do
            llog.debug4("pc", "sql", "", "%s", c.sql)
            local stmt = assert(cc_db_util.package_for_assert(db:prepare(c.sql)))
            local ok, msg = cc_db_util.package_for_assert(stmt:bind(c.bind_vars))
            if not ok then
                stmt:close()
                assert(ok, msg)
            end
            local ok, msg = cc_db_util.package_for_assert(stmt:exec())
            stmt:close()

            assert(ok, msg)
        end

        if pack_sql_coll.collection_member_uuid then
            update_collections_in_entries_on_insert(pack_sql_coll.collection_member_uuid)
        end
        
        rv.changes = rv.changes + 1
    end

    -- Run through the list of non_sql content catalog commands. These commands
    -- are applied to the database within the change request transaction.
    
    local isMaxArchiveCountConstraint = false
    local maxArchiveCount = 0
    for _, non_sql in ipairs(non_sqls) do
        if non_sql.command == "updateArchivedItem" then
            archived_items.set_archive_item_visibility( db, (non_sql.args.cdekey or non_sql.args.cdeKey),
                (non_sql.args.cdetype or non_sql.args.cdeType), 0, false)
            content_state.update_content_state( db, (non_sql.args.cdekey or non_sql.args.cdeKey),
                (non_sql.args.cdetype or non_sql.args.cdeType))
            updateOriginType( db, (non_sql.args.cdekey or non_sql.args.cdeKey), (non_sql.args.cdetype or non_sql.args.cdeType), (non_sql.args.originType or non_sql.args.originType))

        elseif non_sql.command == "setArchivedItemVisibility" then
            archived_items.update_archived_item_visibility( db, (non_sql.args.cdekey or non_sql.args.cdeKey),
                (non_sql.args.cdetype or non_sql.args.cdeType))
            content_state.update_content_state( db, (non_sql.args.cdekey or non_sql.args.cdeKey),
                (non_sql.args.cdetype or non_sql.args.cdeType))
            updateOriginType( db, (non_sql.args.cdekey or non_sql.args.cdeKey), (non_sql.args.cdetype or non_sql.args.cdeType), (non_sql.args.originType or non_sql.args.originType))
        elseif non_sql.command == "maxArchiveCountConstraint" then
            isMaxArchiveCountConstraint = true
            maxArchiveCount = non_sql.args.maxArchiveCount
        elseif non_sql.command == 'createCollectionAssociation' then
            create_collection_association(non_sql.args)
        elseif non_sql.command == 'updateReadState' then
            rv.changes = rv.changes + change.update_read_state(db, non_sql.args.cdeKey, non_sql.args.cdeType,
            non_sql.args.readState, non_sql.args.companionKey, non_sql.args.companionType)
        elseif non_sql.command == "resetReadState" then
            rv.changes = rv.changes + change.reset_read_state(db)
        end
    end

    -- Update Archived Item for deleted titles.
    for _, deleted_archived_item in ipairs(deleted_archived_items_list) do
        local stmt = assert(cc_db_util.package_for_assert(db:prepare("SELECT p_uuid AS uuid FROM Entries WHERE p_cdeType = ? AND p_cdeKey = ? AND p_isArchived = 0")))
        local ok, msg = cc_db_util.package_for_assert(stmt:bind((deleted_archived_item.cdetype or deleted_archived_item.cdeType), (deleted_archived_item.cdekey or deleted_archived_item.cdeKey)))
        if not ok then
            stmt:close()
            assert(ok, msg)
        end

        local row, message, code = stmt:first_row()
        stmt:close()
        -- If no downloaded item match the cdekey/cdetype then toggle the archive
        -- visibility flag
        if row == nil then
            if code and code ~= 0 then
                llog.error("change", "deleted_archived_items_list", "", "")
                assert(cc_db_util.package_for_assert(nil, message, code))
            else
                archived_items.set_archive_item_visibility( db, (deleted_archived_item.cdekey or deleted_archived_item.cdeKey), (deleted_archived_item.cdetype or deleted_archived_item.cdeType), 1, true)
            end
        end
    end

    -- This is used to update the Archived Items Virtual Collection and Home
    -- Dictionary Virtual Collection at the very end.
    for _, non_sql in ipairs(non_sqls) do
        if non_sql.command == "updateArchivedItemsVirtualCollection" then
            archived_items.update_adc_item (db)
        elseif non_sql.command == "updateHomeDictionaryCollection" then
            home_dictionary_collection.update_hdc_item(db)
            -- This is required to update the ADC count which is shown in the Cloud view
            archived_items.update_adc_item(db)
        elseif non_sql.command == "updatePeriodicalVirtualCollection" then
            periodicals_virtual_collections.update_periodicals_collections (db, non_sql.args.title, non_sql.args.cdeKey, non_sql.args.cdeGroup, non_sql.args.language, non_sql.args.isArchived, non_sql.args.updateType)
        elseif non_sql.command == "refreshPeriodicalVirtualCollection" then
            periodicals_virtual_collections.refreshPeriodicalVirtualCollection (db)
        elseif non_sql.command == "pvcInfoUpdated" then
            periodicals_virtual_collections.pvcInfoUpdated (db, non_sql.args.title, non_sql.args.cdeGroup, non_sql.args.cdeKey)
        elseif non_sql.command == "migrateToPVC" then
            periodicals_virtual_collections.migrateToPvc(db, non_sql.args.currentPVCVersion)
        elseif non_sql.command == "updatePVCLastAccessTime" then
            periodicals_virtual_collections.updatePVCLastAccessTime(db, non_sql.args.title, non_sql.args.cdeGroup, non_sql.args.lastAccess)
        elseif non_sql.command == "migrateCollectionCount" then
            change.migrate_collection_count (db)
        elseif non_sql.command == 'updateDownloadedSeriesInfo' then
            local cdeKey = nil
            if non_sql.args.entry and non_sql.args.entry.cdeKey then
                cdeKey = non_sql.args.entry.cdeKey
            else
                cdeKey = non_sql.args.cdeKey
            end
            series.refreshSeriesInfo( db, cdeKey, false)
        elseif non_sql.command == 'seriesInfoUpdated' then
            series.updateSeriesInfo( db, non_sql.args.cdeKey)
        elseif non_sql.command == 'triggerPostProcessing' then
            post_processor.trigger(db)
        elseif non_sql.command == 'refreshSeriesIfRequired' then
            series.refreshSeriesInfo(db, non_sql.args.cdeKey, true)
        end
    end
    -- This is to apply purge policy on total number of archived items.
    llog.debug4("isMaxArchiveCountConstraintCheck", "sql", "", "%s", isMaxArchiveCountConstraint)
    if isMaxArchiveCountConstraint == true then
            archived_items.apply_max_archive_count_constraint( db, maxArchiveCount)
    end
    return rv
end


------------------------------------------------------------------------------------------
-- Main entry point for this file: take post_data, decode it, send it to the SQL
-- generators, run the resulting SQL statements (in a transaction), and assemble a reply.
------------------------------------------------------------------------------------------
function change.change(post_data, profile_data)
    local rv =
    {
        ok = true,
        changes = 0,
        type    = "ChangeResponse"
    }

    assert(cc_db_util.begin(db))
    assert(cc_db_util.package_for_assert(db:exec[[PRAGMA count_changes = true]]))

    llog.debug5("ccat", "change.change", "profile_data=%s", "", profile_data)

    local ok, ret_value = pcall(function()
        return change_internal(post_data, profile_data, rv)
    end)

    if not ok then
        db:exec[[ROLLBACK]]
        if tostring(content_source) == on_device_content_source then
            dcm.rollBack()
        end
        assert(ok, ret_value)
    end

    -- If the COMMIT fails, SQLite3 recommends executing an explicit ROLLBACK
    -- for the cases where it does not automatically.
    assert(cc_db_util.commit(db))

    metadata_to_reindex = false

    dcm.execute_index_commands()

    if tostring(content_source) == on_device_content_source then
        dcm.commit()
        content_source = nil;
    end

    if not no_notify then
        send_change_notification()
    end

    -- Memory logging for dev use.
    local highmem = sqlite3:memory_highwater()
    local usedmem = sqlite3:memory_used()
    local luamem = collectgarbage("count")
    llog.info("pc", "dbMem", "used=%d,high=%d,lua=%d", "sqlite and lua memory stats", usedmem, highmem, luamem)

    return "200 OK", json.encode(rv) .. "\n"
end

------------------------------------------------------------------------------------------
-- This function deletes all subscription information
-- @param db Database which to perform operations.
------------------------------------------------------------------------------------------
function change.delete_subscription (db)
    local startTime = perf_clock()

    local sql = "DELETE FROM Entries WHERE p_originType = " .. subscription_origin_type .. " and p_contentState != " .. downloaded_item_content_state 
    assert(cc_db_util.package_for_assert(db:exec(sql)))
    local endTime = perf_clock()
    llog.info("delete_subscription", "delete entries", "complete", "")

    llog.perf("delete_subscription", "perf", "deleteTime=" .. tostring(endTime - startTime), "")    
end 

------------------------------------------------------------------------------------------
-- This function updates the collection when locale gets changed.
-- 1. Updates the collection count and reset the collections sync Counter to 0
-- 2. Delete the archive items association from collections table.
-- @param db Database which to perform operations.
------------------------------------------------------------------------------------------
function change.update_collection_on_locale_change (db)

    local startTime = perf_clock()

    -- update the count to reflect the home members available
    -- and set sync counter to 0 so that collections will be properly updated.
    local sql = "UPDATE Entries SET p_memberCount = p_homeMemberCount, p_collectionSyncCounter = 0 WHERE p_type='Collection'"
    assert(cc_db_util.package_for_assert(db:exec(sql)))

    -- delete the archive item associations from the db.
    local sql = "DELETE FROM Collections WHERE i_member_is_present = 0 AND i_is_sideloaded = 0"
    assert(cc_db_util.package_for_assert(db:exec(sql)))

    local endTime = perf_clock()
    llog.info("update_collection_on_locale_change", "", "update complete", "")
    llog.perf("update_collection_on_locale_change", "perf", "updateTime=" .. tostring(endTime - startTime), "")    
end 
------------------------------------------------------------------------------------------
-- Update the Count for items belonging to the collection as the Collections Visibility got changed.
------------------------------------------------------------------------------------------
function change.update_collection_items_count (db, collectionId, isVisible)

    local startTime = perf_clock()
    -- Update the collection count for items belonging to the collection.
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(
                          [[ UPDATE Entries
                             SET  p_collectionCount = ]] .. (((isVisible) == "true" and [[ p_collectionCount + 1 ]]) or [[ p_collectionCount - 1 ]] ) .. [[
                             WHERE p_uuid IN
                                        ( SELECT i_member_uuid
                                          FROM Collections
                                          WHERE i_collection_uuid =?
                                         )]])))

    local ok, msg = cc_db_util.package_for_assert(stmt:bind(collectionId))

    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local ok, msg = cc_db_util.package_for_assert(stmt:exec())
    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local endTime = perf_clock()
    llog.info("update_collection_items_count", "", "update complete", "")
    llog.perf("update_collection_items_count", "perf", "updateTime=" .. tostring(endTime - startTime), "")
end

------------------------------------------------------------------------------------------
-- Migrate Collection count for ALL view. Pre J8.5, collection in cloud view would be displaying
-- only "Cloud" and "Downloaded" Items. From J8.5 Collection in cloud view would even display
-- "Side-loaded" contents. This migration logic is to update the count displayed by the collection
-- to include the sideloaded contents as well.
------------------------------------------------------------------------------------------
function change.migrate_collection_count (db)

    local startTime = perf_clock()
    -- Update the member count for only Collections that contain sideloaded content.
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(
                          [[ UPDATE Entries
                             SET  p_memberCount = 
                                        (SELECT count(i_collection_uuid) 
                                         FROM Collections 
                                         WHERE i_collection_uuid=Entries.p_uuid)
                             WHERE p_uuid IN
                                        (SELECT DISTINCT i_collection_uuid 
                                         FROM Collections
                                         WHERE i_is_sideloaded=1)]])))

    local ok, msg = cc_db_util.package_for_assert(stmt:exec())
    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local endTime = perf_clock()
    llog.info("migrate_collection_count", "perf", "migrationTime=" .. tostring(endTime - startTime), "")
end

------------------------------------------------------------------------------------------
-- Reset the read state for all entries to Default (null)
------------------------------------------------------------------------------------------
function change.reset_read_state (db)

    local startTime = perf_clock()

    sql =  [[ UPDATE Entries SET p_readState = null ]]

    -- Update the read state to given value.
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))

    local ok, msg = cc_db_util.package_for_assert(stmt:exec())
    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local rows_updated = db:changes();

    llog.debug4("reset_read_state", "completed", "rowsUpdates=%d", rows_updated)

    local endTime = perf_clock()
    llog.perf("reset_read_state", "perf", "updateTime=" .. tostring(endTime - startTime), "")

    return rows_updated
end

------------------------------------------------------------------------------------------
-- Update the read state of the catalog entry of given cdeKey and cdeType to given read state value
------------------------------------------------------------------------------------------
function change.update_read_state (db, cdeKey, cdeType, readState, companionKey, companionType)

    if cdeKey == nil and cdeType == nil then
        llog.error("update_read_state", "exit", "cdekey_and_cdetype_is_nil", "")
        return 0;
    end

    local shouldUpdateCompanionItem = false,sql,binder

    if companionKey ~= nil and companionType ~= nil then
       shouldUpdateCompanionItem = true
    end

    local startTime = perf_clock()

    -- PVC item has same cdeKey as the latest issue. We need to ignore PVC while updating state
    if cdeType == nil then
        sql =  [[ UPDATE Entries SET  p_readState= ?
             WHERE p_cdeKey= ? AND p_type != "Entry:Item:PVC" ]]
    elseif not shouldUpdateCompanionItem then
        sql =  [[ UPDATE Entries SET  p_readState= ?
             WHERE p_cdeKey= ? AND p_cdeType= ? ]]
    else
        sql = [[ UPDATE Entries SET  p_readState= ?
             WHERE (p_cdeKey= ? AND p_cdeType= ?) OR
               (p_cdeKey= ? AND p_cdeType= ?) ]]
    end

    -- Update the read state to given value.
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))

    if cdeType == nil then
        binder = stmt:bind(readState, cdeKey)
    elseif not shouldUpdateCompanionItem then
        binder = stmt:bind(readState, cdeKey, cdeType)
    else
        binder = stmt:bind(readState, cdeKey, cdeType, companionKey, companionType)
    end

    local ok, msg = cc_db_util.package_for_assert(binder)
    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local ok, msg = cc_db_util.package_for_assert(stmt:exec())
    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local rows_updated = db:changes();

    llog.debug4("update_read_state", "completed", "cdeKey=%s, cdeType=%s, readState=%d, companionKey=%s, companionType= %s, rowsUpdates=%d",
     "", tostring(cdeKey), tostring(cdeType), readState, tostring(companionKey), tostring(companiontype), rows_updated)

    local endTime = perf_clock()
    llog.perf("update_read_state", "perf", "updateTime=" .. tostring(endTime - startTime), "")

    return rows_updated
end
-- vim:set tw=90 sw=4 et: --

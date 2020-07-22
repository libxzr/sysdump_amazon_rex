-- query.lua
--
-- Copyright (c) 2010-2020 Amazon.com, Inc. or its affiliates.  All Rights Reserved.
-- PROPRIETARY/CONFIDENTIAL
--
-- Use is subject to license terms.

require 'cc_string_util'
require 'cc_db_util'
require 'dcm'

local modname = ...
local query = {}
_G[modname] = query


local is_ascii_alnum = cc_string_util.is_ascii_alnum
local is_file_path    = cc_string_util.is_file_path
local get_largest_word = cc_string_util.get_largest_word

local make_binder    = cc_db_util.make_binder
local qc = nil

-- This is the Java Integer.MAX_VALUE.  It is used
-- as a sentinel for indicating that a CC item will
-- not be indexed etc.
local integer_max_value = 2147483647

--Indexing state is decremented with every retry starting at 0. This is
--the max retry count
local indexing_stat_retries_done = -3

-- cdeType to block Content search results
local contentSearchBlockedType = 'FEED'

-- This indicates that the item modified is On Device
local on_device_content_source = "OnDevice"

local db
local table_name

--This is read from the JSON to identify the source of the request
local content_source

-- Note: because these Lua VMs are pretty short-lived (they're torn down if unused for
-- more than 10 seconds), these caches are pretty safe.
--
-- Also, keeping these global lets me avoid trying to pass a handle to a Lua object
-- through SQLite and back out to the content_matches() function, below.
local search_result_cache = { }
local all_paths_cache

local total_content_set = { }
local unindexed_content_set = { }
local number_stemmed_words = 0
local content_location = nil
local searchableString = nil
-- Contains the cache of rank for a given search term for the previous record.
local previous_search_column = nil
local previous_search_column_rank = nil
-- Contains the cache of previous search term to avoid sorting same term multiple times.
local previous_search_term = nil
local previous_sorted_search_words = { }
--As per design, we use U+FFC as delimiter for separating strings.
--Lua does byte comparison.
--This STRING_DELIMITER has the equivalent code for U+FFC
local STRING_DELIMITER     = string.char(0xEF, 0xBF, 0xBC);
local STRING_DELIMITER_LEN = string.len(STRING_DELIMITER);

-- This function is used to return the matched information to the Framework.
local function match_info(location, ids)
    if not location then
        return { }
    end

    -- search_result_cache will always have been filled out appropriately by the time
    -- match_info() is called.
    local rv = { }
    for id, term in pairs(ids) do
        local srct = search_result_cache[term]
        if srct and srct.matching_paths[location] then
            rv[id] = srct.matching_paths[location]
        end
    end
    return rv
end

--Get a string of specified length in which every character is '#'
local function get_shadow_string(length)
    local retVal = ""
    for i = 1, length do
        retVal = retVal .. "#"
    end
    return retVal
end

--Returns an array of field positions. Value at index i gives the end index to ith field
-- For example, if the search column is bookname%bookpron%authname%authpron% this will return 8,17,26,35
local function get_search_field_positions(searchColumn)
    if searchColumn == nil then
        return nil
    end
    local positions = {}
    local start = 1
    while true do
        local indexOfNextDelimiter = string.find(searchColumn, STRING_DELIMITER, start, true)
        if not indexOfNextDelimiter then
            break
        end
        positions[#positions + 1] = indexOfNextDelimiter - 1
        start = indexOfNextDelimiter + STRING_DELIMITER_LEN
    end
    return positions
end

--Iterates over search words and get sum of their computed ranks
local function get_rank_sum(searchWords)
    local wordsRankSum = 0
    for i, word in ipairs(searchWords) do
        wordsRankSum = wordsRankSum + word["rank"]
    end
    return wordsRankSum
end

--Computes field details for the searchWord. This includes which field it is found
--and the field start and end positions. Fields are columns such as book name, author, etc.
local function compute_field_details(fieldsPosition, searchWord)
    local prevFieldEnd = 1
    for j, position in ipairs(fieldsPosition) do
        if(searchWord["at"] <= position) then
            searchWord["field_found"] = j
            searchWord["field_start"] = prevFieldEnd
            searchWord["field_end"] = position
            break
        end
        prevFieldEnd = position + STRING_DELIMITER_LEN + 1
    end
end

--Computes rank of the search word on basis of what position it is found in the field.
--This considers the distance from start for first word and the gap between the successive
--words in search column.
local function word_position_rank_param(searchColumn, searchWord, prevSearchWord)
    local wordPositionRank = 0
    if searchWord["index"] == 1 then
        --count number of words before in the field and add it to rank
        local prefix_str = string.sub(searchColumn, searchWord["field_start"], searchWord["at"] - 1 )
        for space in string.gmatch(prefix_str, "%s+") do
            wordPositionRank = wordPositionRank + 1
        end
    elseif prevSearchWord ~= nil then
        --count distance from previous field and add it to rank
        if prevSearchWord["field_found"] == searchWord["field_found"] then --found in same field as previous word
            local string_gap = "" --the text between previous word and current word
            local word_factor = 1
            if searchWord["at"] > prevSearchWord["at"] then
                string_gap = string.sub(searchColumn, prevSearchWord["at"], searchWord["at"])
            else -- if found at position less than previous word position
                string_gap = string.sub(searchColumn, searchWord["at"], prevSearchWord["at"])
                word_factor = 2 -- multiply by 2 for reverse order
            end
            for space in string.gmatch(string_gap, "%s+") do
                wordPositionRank = wordPositionRank + 1
            end
            wordPositionRank = wordPositionRank * word_factor
        else
            wordPositionRank = (searchWord["field_end"] - searchWord["field_start"])
                                    + (prevSearchWord["field_end"] - prevSearchWord["field_start"])
        end
    end
    return wordPositionRank
end

--Computes rank of the search word on basis of whether it matches fully or partially
--with the word in field
local function word_match_rank_param(searchColumn, searchWord)
    local start_index = searchWord["at"]
    local end_index = start_index + #searchWord["val"] - 1
    searchWord["end"] = end_index

    local field_start = searchWord["field_start"]
    local field_end = searchWord["field_end"]

    while start_index > field_start and string.sub(searchColumn, start_index - 1, start_index - 1) ~= " " do
        start_index = start_index - 1
    end

    while end_index < field_end and string.sub(searchColumn, end_index + 1, end_index + 1) ~= " " do
        end_index = end_index + 1
    end

    local word_factor = 1
    if(start_index < searchWord["at"]) then
        word_factor = 2
    end

    local match_fraction = (end_index - start_index + 1) / (searchWord["end"] - searchWord["at"] + 1)
    if(match_fraction ~= 1) then
        return match_fraction * word_factor
    end

    return 0
end

-- Calculate the rank for each word in the search term
local function calculate_rank_params(fields_positions, search_words, searchColumn)
    local prev_search_word = nil
    for i, search_word in ipairs(search_words) do
        -- Calculating ranks should be done in same order as position rank depends on params set in field rank calculation
        compute_field_details(fields_positions, search_word)
        search_word["rank"] = word_position_rank_param(searchColumn, search_word, prev_search_word)
                                      + word_match_rank_param(searchColumn, search_word)
        prev_search_word = search_word
    end
end

-- This function will be called on each record of the result set
-- This function returns a numerical value "rank" for a given search term for that record.
-- compares searchTerm against title ? title pronunciation ? author ? author pronunication
-- https://wiki.labcollab.net/confluence/pages/viewpage.action?pageId=431638538
local function match_rank(searchColumn, searchTerm)
    local rank = nil
    if(searchColumn == nil or searchTerm == "") then
        return nil
    end

    -- Return the rank saved if the rank has already been calculated for this searchColumn.
    if (previous_search_column == searchColumn) then
        return previous_search_column_rank
    end

    local searchWords = {}
    -- in case the whole search string is exactly matched we will compute ranks from that position
    local searchFromIndex = 1
    -- variable to hold the search column and replace it with dummy chars when
    -- words are found to avoid repeated match in same positions
    local searchColumnTemp = searchColumn
    local wordsInSortedOrder = {} -- list to hold words sorted from longest to shortest

    if (searchTerm == previous_search_term) then
        wordsInSortedOrder = previous_sorted_search_words
    else
        local index = 1
        for y in string.gmatch(searchTerm, "%S+") do --for each word in search term
            local word = {}
            word["val"] = y
            word["index"] = index
            wordsInSortedOrder[#wordsInSortedOrder + 1] = word
            index = index + 1
        end
        -- sort the search words from longest to shortest, to avoid smaller substrings
        -- in search term replace the later ones for example,
        -- if searched word is "ion action" and the book title is "action ion",
        -- without sorting the temp column will become act### ion and this will remove the entry from results
        table.sort(wordsInSortedOrder, function(a,b) return #a["val"]>#b["val"] end)
        previous_search_term = searchTerm
        previous_sorted_search_words = wordsInSortedOrder
    end
    local m, n = string.find(searchColumnTemp, searchTerm, 1, true)
    if(m ~= nil) then
        searchFromIndex = m
    end
    for i, word in ipairs(wordsInSortedOrder) do
        local k, j = string.find(searchColumnTemp, word["val"], searchFromIndex, true) --look for word in searchFields
        if(k == nil) then
            return nil
        end
        word["at"] = k
        word["rank"] = 0
        searchWords[word["index"]] = word
        searchColumnTemp = string.gsub(searchColumnTemp, word["val"], get_shadow_string(#word["val"]), 1)
    end
    local fields_position = get_search_field_positions(searchColumn)

    calculate_rank_params(fields_position, searchWords, searchColumn)
    rank = 1 + (get_rank_sum(searchWords) * 0.01 )

    previous_search_column = searchColumn
    previous_search_column_rank = rank
    return rank
end

do
    local function match_count(location, cdeType, indexed_state, is_visible_in_home, is_archived, is_downloading, term)
        if not location then
            return 0
        end

        if not search_result_cache[term] then
            local matching_paths, all_paths, num_stemmed_words = search(term, content_location)
            number_stemmed_words = num_stemmed_words
            search_result_cache[term] = { matching_paths = matching_paths }
            all_paths_cache = all_paths
        end

        is_visible_in_home = is_visible_in_home or 0
        is_archived = is_archived or 0
        is_downloading = is_downloading or 0
        -- Only include Entry:Item content with a file location
        if is_file_path(location) and indexed_state ~= integer_max_value and indexed_state > indexing_stat_retries_done and is_visible_in_home == 1 and is_archived == 0 and is_downloading == 0 then
            if indexed_state <= 0 then
                unindexed_content_set[location] = true
            end
            total_content_set[location] = true
        end

        local mi = search_result_cache[term].matching_paths[location]
        if mi then
            if mi.matchCount > 0 then
                -- CEL-6345: Block contentSearch match for Blogs
                if cdeType == nil  or tostring(cdeType) ~= contentSearchBlockedType then
                    return mi.matchCount
                else
                    mi.matchCount = 0
                    return 0
                end
            elseif mi.metadataMatches then
                return integer_max_value
            else
                return 0
            end
        else
            return 0
        end
    end

    -- Use cdeType and cdeKey as keys to match the search results
    -- instead of path.
    local function match_count_cde(cdeType, cdeKey, isArchived, term)
        if not cdeType or not cdeKey then
            return 0
        end
        if not isArchived then
            return 0
        end

        local cdeTypeKey = tostring(cdeType) .. "_" .. tostring(cdeKey)
        return match_count(cdeTypeKey, cdeType, 0, 0, 1, 0, term)
    end

    -- This function calculates the match_count based on location.  if that is non-zero, we return it.
    -- If not, it uses the cde_key and cde_type to see if there is an archived item match.
    local function match_count_location_cde(location, cde_key, cde_type, indexed_state, is_visible_in_home, is_archived, is_downloading, term)
        local count = match_count(location, cde_type, indexed_state, is_visible_in_home, is_archived, is_downloading, term)
        if count == 0 then
            count = match_count_cde(cde_type, cde_key, is_archived, term)
        end

        --match_count_location_cde is used for ordering search results based on
        -- search match , with prefix match based on p_metadataStemWords, if match_count
        -- returns zero , it means it was only metadata match, so we can return metadataMatch
        -- value here
        if count == 0 then
            count = integer_max_value
        end
        return count
    end

    -- The function will check if the catalog item is yet to be indexed.
    local function is_unindexed(location, indexed_state, is_visible_in_home, is_archived, is_downloading)
        if not location then
            return 0
        end
        is_visible_in_home = is_visible_in_home or 0
        is_archived = is_archived or 0
        is_downloading = is_downloading or 0
        if is_file_path(location) and indexed_state <= 0 and indexed_state > indexing_stat_retries_done
            and is_visible_in_home == 1 and is_archived == 0 and is_downloading == 0 then
            return 1
        end
        return 0
    end

    function query.set_db(db_)
        db = db_
       table_name = [[ Entries ]]
        assert(db:set_function("match_count", 7, match_count))
        assert(db:set_function("match_count_cde", 4, match_count_cde))
        assert(db:set_function("match_count_location_cde", 8, match_count_location_cde))
        assert(db:set_function("match_rank", 2, match_rank))
        assert(db:set_function("is_unindexed", 5, is_unindexed))
    end
end




----- Query Constructor class ------------------------------------------------------------
--
-- Convenience class for generating SQL; only visible to construct_query_sql.
--
-- This transforms a decoded JSON query object into SQL.  Most of the complication here is
-- mapping a filter specification to a WHERE clause; for example:
--
-- {
--     And = {
--         {
--             WithinRange = {
--                 path = "field1",
--                 upper = 1234,
--                 lower = 1000
--             }
--         },
--         {
--             Not = {
--                 ValueIn = {
--                     path = "field2",
--                     choices = { "xyz", "abc" }
--                 }
--             }
--         }
--     }
-- }
--
-- becomes:
--
-- (field1 < 1234 AND field1 > 1000) AND NOT field2 IN ('xyz', 'abc')
--
-- (Note that the And, Or, and Not constructs can be nested to any depth.)
local construct_query_sql
do
    local QConstruct = { __index = { pred_by_type = { } } }

    -- Save some typing
    function QConstruct.__index:bind(val)
        return self.binder:bind(val)
    end

    -- Hand-written column definitions
    local filter_column_defs
    local filter_column_defs_collections = { }
    local filter_column_defs_series = { }
    do
        local function subselectCollections(uuid_column, match_column, deleted_column)
                prefix = [[ (SELECT   1
                        FROM     Collections
                        WHERE  p_isVisibleInHome = 1
                               AND ]] .. uuid_column .. [[ = p_uuid
                               AND ]]
            if deleted_column then
                prefix = prefix .. deleted_column .. [[ = 0 AND ]]
            end
            local suffix =                [[ LIMIT 1) ]]

            return { prefix, match_column, suffix }
        end

        -- There is a subtle difference between having a NULL first value and having no
        -- first value at all.  If we don't have a first value for titles, credits, or
        -- languages, then "ValueIn":{"choices":[null]} should fail for the appropriate
        -- path.
        local function length_check(match_column, length_column)
            local prefix = [[ ( ]] .. length_column .. [[ >= 1 AND ]]
            local suffix =                                         [[ ) ]]
            return { prefix, match_column, suffix }
        end

        filter_column_defs = {
              uuid = { "", "p_uuid", "" },

              ["collections_*"]                = subselectCollections("i_member_uuid",
                                                           "i_collection_uuid"),
              ["members_*"]                    = subselectCollections("i_collection_uuid",
                                                           "i_member_uuid"),
              credits_0_name_collation = length_check("p_credits_0_name_collation",
                                                      "p_creditCount"),
              credits_0_name_pronunciation = length_check("p_credits_0_name_pronunciation",
                                                      "p_creditCount"),
              languages_0              = length_check("p_languages_0",
                                                      "p_languageCount"),
              titles_0_collation       = length_check("p_titles_0_collation",
                                                      "p_titleCount"),
              titles_0_nominal         = length_check("p_titles_0_nominal",
                                                      "p_titleCount"),
              titles_0_pronunciation   = length_check("p_titles_0_pronunciation",
                                                      "p_titleCount"),
              -- TODO: eliminate "nominal" (once clients have updated)
              titles_0_display         = length_check("p_titles_0_nominal",
                                                      "p_titleCount"),
              rowid =   {"","rowid",""}
          }
    end

    -- Easy cases, following a standard rule
    for _, v in ipairs{
                          "cdeGroup",
                          "cdeKey",
                          "cdeType",
                          "collectionCount",
                          "contentSize",
                          "cover",
                          "credits_0_name_collation",
                          "titles_0_collation",
                          "diskUsage",
                          "expirationDate",
                          "guid",
                          "isArchived",
                          "isDownloading",
                          "isDRMProtected",
                          "isMultimediaEnabled",
                          "isTestData",
                          "isVisibleInHome",
                          "isLatestItem",
                          "isUpdateAvailable",
                          "virtualCollectionCount",
                          "lastAccessedPosition",
                          "lastAccess",
                          "location",
                          "memberCount",
                          "homeMemberCount",
                          "collectionSyncCounter",
                          "collectionDataSetName",
                          "mimeType",
                          "modificationTime",
                          "percentFinished",
                          "position",
                          "publicationDate",
                          "publisher",
                          "thumbnail",
                          "type",
                          "version",
                          "watermark",
                          "contentIndexedState",
                          "noteIndexedState",
                          "metadataUnicodeWords",
                          "ownershipType",
                          "originType",
                          "shareType",
                          "contentState",
                          "referenceCount",
                          "pvcId",
                          "companionCdeKey",
                          "totalContentSize",
                          "visibilityState",
                          "seriesState",
                          "readState",
                          "subType"
                      } do
        filter_column_defs[v] = { "", "p_" .. v, "" }
    end

    for _, v in ipairs{
                          "collection_uuid",
                          "member_uuid",
                          "member_is_present",
                          "member_cde_key",
                          "member_cde_type",
                          "is_sideloaded",
                          "member_is_present"
                       } do
        filter_column_defs_collections[v] = { "", "i_" .. v, "" }
    end

    for _, v in ipairs{
                          "seriesId",
                          "itemCdeKey",
                          "itemType",
                          "itemPosition",
                          "itemPositionLabel"
                       } do
        filter_column_defs_series[v] = { "", "d_" .. v, "" }
    end

    -- Convert a path to a column name.
    function QConstruct.__index:col(name)
        name = name:gsub("[.%[%]]+", "_"):gsub("_+$", "")

        local fcd = filter_column_defs[name]

        if not fcd then
            fcd = filter_column_defs_collections[name]
        end

        if not fcd then
            fcd = filter_column_defs_series[name]
        end

        if fcd then
            return fcd[1], fcd[2], fcd[3]
        end

        local match_id = name:match("^matchInfo_\"([A-Za-z0-9_]+)\"_matchCount")
        if match_id then
            return "", "match_count_location_cde(p_location, p_cdeKey, p_cdeType, p_contentIndexedState, p_isVisibleInHome, p_isArchived, p_isDownloading, "
                    .. self.binder:bind(self.have_fts[match_id])
                    .. ")", ""
	end

        match_id = name:match("^matchInfo_\"([A-Za-z0-9_]+)\"_matchRank")
        if match_id then
            return "", "bp_matchRank", ""
        end
        assert(false, "unknown column " .. name)
    end

    ---- Predicate handlers ----
    -- These functions are stored in the pred_by_type table, indexed by predicate name.
    -- Each one converts its particular predicate type to a SQL expression, and returns
    -- that expression.

    -- A note on NULL: I'm treating NULL as "false".  This conflicts with the "infectious
    -- NULL" behavior of SQL in a couple of places: notably, in NOT and IN expressions:
    -- NOT (NULL) is NULL, NULL IN (NULL) is NULL, and 'X' IN (NULL) is NULL.  We want
    -- NOT (NULL) is TRUE, NULL IN (NULL) is TRUE, and 'X' IN (NULL) is FALSE.

    local pred_by_type = { }

    -- ValueIn maps directly to the SQL IN operator.  Except for NULL handling.
    function pred_by_type:ValueIn(pspec)
        local prefix, field, postfix = self:col(pspec.path)

        local non_null_choices = { }
        local null_is_a_choice = false
        for _, val in ipairs(pspec.choices) do
            if val == nil or val == json.null then
                null_is_a_choice = true
            else
                non_null_choices[#non_null_choices + 1] = val
                if pspec.path == "location" then
                    content_location = val
                end
            end
        end

        if not null_is_a_choice and #non_null_choices == 0 then
            return " 1=0 "
        end

        local null_check = ""
        if null_is_a_choice then
            null_check = field .. " IS NULL OR "
        end

        return prefix .. " " .. null_check .. field .. " IN ("
                      .. self.binder:bind_list(non_null_choices) .. ") " .. postfix
    end

    -- Filter Downloaded Collections based on the filter type
    function pred_by_type:FilterDownloadedCollectionsByType(pspec)
        return "(p_type='Collection' and p_isVisibleInHome=1 and p_uuid in (select distinct(i_collection_uuid) from collections where ".. self:predicate_sql(pspec) .."))"
    end

    -- Filter Collections based on the filter type
    function pred_by_type:FilterCollectionsByType(pspec)
        return "(p_type='Collection' and p_uuid in (select distinct(i_collection_uuid) from collections where ".. self:predicate_sql(pspec) .."))"
    end

    -- Filter Series based on the filter type
    function pred_by_type:FilterSeriesByType(pspec)
        return "(p_type='Entry:Item:Series' and p_isVisibleInHome=1 and p_cdeGroup in (select distinct(d_seriesId) from series where ".. self:predicate_sql(pspec) .."))"
    end

    -- Equals is equivalent to ValueIn with a single choice; maps to SQL = or IS NOT NULL,
    -- depending on the value.
    function pred_by_type:Equals(pspec)
        local prefix, field, postfix = self:col(pspec.path)

        if pspec.value == nil or pspec.value == json.null then
            return prefix .. " " .. field .. " IS NULL " .. postfix
        else
            return prefix .. " " .. field .. " = " .. self.binder:bind(pspec.value)
                .. " " .. postfix
        end
    end

    -- NotNull maps directly to IS NOT NULL.
    --
    -- NotNull is slightly different from Not { ValueIn { choices: [ null ] } }, in that
    -- NotNull is false if applied to a field that does not exist (for example,
    -- credits[0].name.collation, when the entry has no credits).  The Not ValueIn null
    -- construct returns true in that case.
    function pred_by_type:NotNull(pspec)
        local prefix, field, postfix = self:col(pspec.path)
        return prefix .. " " .. field .. " IS NOT NULL " .. postfix
    end

    -- WithinRange is used to specify that a field's value is within some range, defined
    -- by the upper and lower bounds, and optionally including the bounds in the range.
    --
    -- For example, with lower = 100, upper = 200, lowerInclusive = true, and path =
    -- "foo", the property 100 <= foo < 200 must hold for this filter to pass.
    --
    -- This translates in SQL to lower </<= field AND upper >/>= field.
    --
    -- NULL is never part of any range.
    function pred_by_type:WithinRange(pspec)
        local prefix, field, postfix = self:col(pspec.path)
        local gtclause = "1=1"
        local ltclause = "1=1"

        local utype = type(pspec.upper)
        assert(utype == "number" or utype == "nil", "WithinRange: upper bound must be number")
        local ltype = type(pspec.lower)
        assert(ltype == "number" or ltype == "nil", "WithinRange: lower bound must be number")

        if pspec.upper then
            local ltop = " <= "
            if not pspec.inclusiveUpper then
                ltop = " < "
            end
            ltclause = field .. ltop .. self:bind(pspec.upper)
        end

        if pspec.lower then
            local gtop = " >= "
            if not pspec.inclusiveLower then
                gtop = " > "
            end
            gtclause = field .. gtop .. self:bind(pspec.lower)
        end

        return prefix .. " (" .. ltclause .. " AND " .. gtclause .. ") " .. postfix
    end

    -- StartsWith specifies that the field's value must start with some prefix for the
    -- filter to pass.  This can map to LIKE, GLOB, REGEX, MATCH, or <= <.  GLOB is the
    -- simplest, though not quite correct; <= < is the fastest.
    --
    -- NULL does not start with anything, even the empty string.
    function pred_by_type:StartsWith(pspec)
        local prefix, field, postfix = self:col(pspec.path)

        local ptype = type(pspec.prefix)
        assert(ptype == "string", "StartsWith: prefix must be string")

        -- TODO: Change GLOB to <= <
        --
        -- SQLite treats GLOB and LIKE as function calls, and does not use indexes
        -- for them, even when using the built-in GLOB or LIKE and searching for a
        -- value with a fixed prefix.
        --
        -- I can work around this by using:
        --
        -- prefix <= field AND field < (prefix with last char incremented)
        --
        -- I'm not doing this for now because incrementing the last character depends on
        -- the collation specified for the index, which in turn depends on the integration
        -- with ICU.
        --
        -- (Even the default SQLite collation sees strings as UTF-8, where Lua sees
        -- strings as bytes, so a simple increment-last-character scheme won't work
        -- correctly.)

        -- Note the gsub() call, which wraps [, *, ?, and { in [], like "[*]".  This is a
        -- trick to get GLOB to match those characters literally.
        return prefix .. " " .. field .. " GLOB "
                      .. self.binder:bind(pspec.prefix:gsub("([[*?{])", "[%1]") .. '*')
                      .. " " .. postfix
    end

    -- FullTextSearch is used to perform a full text search on the item's content
    -- and metadata using a particula phrase
    function pred_by_type:FullTextSearch(pspec)
        if not self.have_fts then
            self.have_fts = { }
        end

        if pspec.id then
            self.have_fts[pspec.id] = pspec.fragment
        end

        local content_match_query = "((match_count(p_location, p_cdeType, p_contentIndexedState, p_isVisibleInHome, p_isArchived, p_isDownloading, " .. self.binder:bind(pspec.fragment) .. ") <> 0) OR (match_count_cde(p_cdeType, p_cdeKey, p_isArchived, " .. self.binder:bind(pspec.fragment) .. ") <> 0))"

        return content_match_query
    end

    -- Predicate to fetch Unindexed items.
    function pred_by_type:Unindexed(pspec)
        return "(is_unindexed(p_location, p_contentIndexedState, p_isVisibleInHome, p_isArchived, p_isDownloading) <> 0)"
    end

    -- MetadataSearch is used to perform a title/author search on the item's metadata
    -- using the given searchTerm. This is based on the match_rank API which gives us the
    -- top results with the best match.
    function pred_by_type:MetadataSearch(pspec)
        searchableString = pspec.searchTerm
        return "( bp_matchRank > 0 )"
    end

    -- PrefixQueryCount is used to count the number of items that precede the item that starts
    -- with the given prefix in the given field according to the collation set for cc.db.
    function pred_by_type:PrefixQueryCount(pspec)
        if not self.have_pqc then
            self.have_pqc = { }
        end

        if pspec.id then
            self.have_pqc[pspec.id] = pspec.prefix
        end

        local ret_string
        if pspec.field == "credits" then
            ret_string = "(p_credits_0_name_collation IS NOT NULL AND p_creditCount > 0 AND p_credits_0_name_collation < " .. self.binder:bind(pspec.prefix) .. ")"
        else
            ret_string = "(p_titles_0_collation < " .. self.binder:bind(pspec.prefix) .. ")"
        end
        return ret_string
    end

    -- An Or filter passes if any of its list of sub-filters pass.  Maps to a series of
    -- expression OR expression OR expression OR expression ... in SQL.
    function pred_by_type:Or(pspec)
        local clauses = {}
        for idx, subpred in ipairs(pspec) do
            clauses[idx] = self:predicate_sql(subpred)
        end
        return "(" .. table.concat(clauses, " OR ") .. ")"
    end

    -- An And filter passes if all of its list of sub-filters pass.  Maps to a series of
    -- expression AND expression AND expression AND expression ... in SQL.
    function pred_by_type:And(pspec)
        local clauses = {}
        for idx, subpred in ipairs(pspec) do
            clauses[idx] = self:predicate_sql(subpred)
        end
        return "(" .. table.concat(clauses, " AND ") .. ")"
    end

 --[[ sample JSON format for performing JOIN operation

      On -- should contain Join and Clauses JSON
      Join -- should contain joinType and subQuery filter with a valid result type
      Clauses -- should contain join conditions

      If two table needs to be joined, then provide empty JSON in subQuery's filter and provide table name in the result type implementation.


 {
   "filter": {
      "On": {
         "Join": {
            "joinType": "INNER JOIN",
            "subQuery": {
               "filter": {
                  "And": [
                     {
                        "Equals": {
                           "path": "type",
                           "value": "Entry:Item:Comic"
                        }
                     },
                     {
                        "ValueIn": {
                           "path": "isVisibleInHome",
                           "choices": [
                              true
                           ]
                        }
                     }
                  ]
               },
               "resultType": "sub_select"
            }
         },
         "Clauses": {
            "And": [
               {
                  "ColEquals": {
                     "path": "itemCdeKey",
                     "value": "cdeKey"
                  }
               },
               {
                  "Equals": {
                     "path": "seriesId",
                     "value": "12345678"
                  }
               }
            ]
         }
      }
   }
 }

 --]]


    -- A Join filter passes if all of its list of sub-filters pass.
    function pred_by_type:Join(pspec)
        return pspec.joinType .. " (" .. construct_query_sql(pspec.subQuery).sql .. ")"
    end

    -- An On filter passes if all of its list of sub-filters pass.
    function pred_by_type:On(pspec)
        return pred_by_type.Join(self,pspec.Join) .. " ON " .. self:predicate_sql(pspec.Clauses)
    end

	-- ColEquals is used to equate the columns for the Join query's on clause
    function pred_by_type:ColEquals(pspec)
        local prefix1, field1, postfix1  =  self:col(pspec.path)
        local prefix2, field2, postfix2  =  self:col(pspec.value)
        return field1 .. " = " .. field2
    end

    -- A Not filter passes if its child filter does not pass.  Maps to NOT expression,
    -- except that NOT (NULL) should be true, not NULL.
    function pred_by_type:Not(pspec)
        return "NOT ifnull(" .. self:predicate_sql(pspec) .. ", 0)"
    end


    ---- Predicate-handler-selector ----
    -- Unwraps a predicate and passes the guts to the appropriate predicate generator.
    -- predicate_sql({ And = { ... } }) will call pred_by_type:And({ ... }) and return
    -- the result.
    function QConstruct.__index:predicate_sql(predicate)
        if predicate == nil then
            -- If predicate is nil, we're at the top level and no filters were specified
            -- in the request.  Return 1=1 (SQL-speak for "true") so that the WHERE
            -- clause is still syntactically correct.
            return "1=1"
        end

        -- Use pairs() to get the key for the predicate type.
        --
        -- Note that unrecognized or extra predicate types are ignored; this should
        -- probably be fixed at some point.
        for ptype, pspec in pairs(predicate) do
            if pred_by_type[ptype] then
                return pred_by_type[ptype](self, pspec)
            end
        end

        assert(false, cc_db_util.package_error(500, "Bad predicate"))
    end

    ---- Build a query ----
    function QConstruct.__index:query_sql(query, limit, offset)
        local rv = { }
        local rv_count = { }
        local where_clause = self:predicate_sql(query.filter)

        -- if the result type is members append the inner query
        if query.resultType == "members" then
            where_clause = "( SELECT 1 FROM Collections WHERE p_isVisibleInHome = 1 AND ((i_member_cde_key = p_cdeKey AND i_member_cde_type = p_cdeType) OR i_member_uuid = p_uuid ) AND " .. where_clause .. ")"
        end

        -- if the result type is collectionItems, get items from collection table only based on uuid of items stored in collections table.
        if query.resultType == "collectionItems" then
            where_clause = "( SELECT 1 FROM Collections WHERE p_isVisibleInHome = 1 AND i_member_uuid = p_uuid AND " .. where_clause .. ")"
        end

        local tableName = (((content_source == nil) and
                    [[ Entries ]]
                    ) or
                    [[ DeviceContentEntry ]] )
        if query.resultType == "full"
            or query.resultType == "fast"
            or query.resultType == "search_details"
            or query.resultType == "metadata_full"
            or query.resultType == nil then
            rv[#rv + 1] = [[
                SELECT
                ]]
                ..
                ((query.resultType == "full" and [[
                    j_collections,
                    j_members,
                    p_modificationTime,

                ]]) or
                (query.resultType == "fast" and [[
                    p_modificationTime,

                ]]) or
                (query.resultType == "metadata_full" and
                    get_match_rank_column_sql(searchableString, self) .. [[ as bp_matchRank,
                ]]) or
                [[ ]])
                ..
                [[
                    p_lastAccess,
                    p_percentFinished,
                    p_cdeKey,
                    p_cdeType,
                    j_displayTags,
                    p_type,

                    p_uuid,
                    p_location,
                    p_isArchived as bp_isArchived,
                    j_titles,
                    j_credits,
                    p_collectionCount,
                    p_memberCount,
                    p_homeMemberCount,
                    p_collectionDataSetName,
                    p_virtualCollectionCount,
                    p_collectionSyncCounter,

                    p_lastAccessedPosition,
                    p_expirationDate,
                    p_publicationDate,
                    p_pvcId,
                    p_publisher,
                    p_isDownloading as bp_isDownloading,
                    p_isDRMProtected as bp_isDRMProtected,
                    p_isVisibleInHome as bp_isVisibleInHome,
                    p_isLatestItem as bp_isLatestItem,
                    p_isUpdateAvailable as bp_isUpdateAvailable,

                    j_displayObjects,

                    j_languages,
                    p_mimeType,
                    p_cover,
                    p_thumbnail,
                    p_diskUsage,
                    p_cdeGroup,
                    p_version,
                    p_guid,

                    j_excludedTransports,
                    p_isMultimediaEnabled as bp_isMultimediaEnabled,
                    p_watermark,
                    p_contentSize,
                    p_isTestData as bp_isTestData,
                    p_contentIndexedState,
                    p_noteIndexedState,
                    p_ownershipType,
                    p_shareType,
                    p_contentState,
                    p_originType,
                    p_totalContentSize,
                    p_visibilityState,
                    p_companionCdeKey,
                    p_seriesState,
                    p_readState,
                    p_subType

                FROM
                    Entries
                WHERE
                    ]]
        elseif query.resultType == "file_data" then
            rv[#rv + 1] = [[
                SELECT
                    p_uuid,
                    p_location,
                    p_thumbnail,
                    p_modificationTime,
                    p_isVisibleInHome as bp_isVisibleInHome,
                    p_diskUsage,
                    p_version,
                    p_guid,
                    p_cdeKey
                FROM ]]
                    ..
                    tableName
                    ..
                    [[
                WHERE
                    ]]

        elseif query.resultType == "cde_data" then
            rv[#rv + 1] = [[
                SELECT
                    p_cdeType,
                    p_cdeKey
                FROM ]]
                    ..
                    tableName
                    ..
                    [[
                WHERE
                    ]]

        elseif query.resultType == "filter_count_group_by_result" then
            rv[#rv + 1] = [[
                SELECT
                    count(*),
                    p_type,
                    p_readState,
                    p_originType
                FROM ]]
                    ..
                    tableName
                    ..
                    [[
                WHERE
                    ]]
        elseif query.resultType == "min_item_data" then
            rv[#rv + 1] = [[
                SELECT
                    p_uuid,
                    p_cdeType,
                    p_cdeKey,
                    p_location,
                    p_originType
                FROM
                    Entries
                WHERE
                    ]]

        elseif query.resultType == "min_downloaded_data" then
            rv[#rv + 1] = [[
                SELECT
                    p_uuid,
                    p_cdeType,
                    p_cdeKey,
                    p_location,
                    p_titles_0_nominal,
                    p_guid,
                    p_originType
                FROM
                    Entries
                WHERE
                    ]]

        elseif query.resultType == "uuid" then
            rv[#rv + 1] = [[
                SELECT
                    p_uuid,
                    p_originType
                FROM
                    Entries
                WHERE
                    ]]

        elseif query.resultType == "members" or query.resultType == "collectionItems" then
            rv[#rv + 1] = [[
                SELECT
                    p_uuid
                FROM
                    Entries
                WHERE
                    ]]

       elseif query.resultType == "collectionEntries" then
            rv[#rv + 1] = [[
                SELECT
                    p_uuid,
                    p_type,
                    p_isVisibleInHome as bp_isVisibleInHome,
                    p_cover,
                    p_originType,
                    j_titles,
                    j_members
                FROM
                    Entries
                WHERE
                    ]]
        elseif query.resultType == "collectionmembercount" then
            rv[#rv + 1] = [[
                SELECT
                    i_member_uuid
                FROM
                    Collections
                WHERE
                    ]]

        elseif query.resultType == "size_details" then
            rv[#rv + 1] = [[
                SELECT
                    p_uuid,
                    p_location,
                    p_lastAccess,
                    p_totalContentSize,
                    p_companionCdeKey,
                    p_cdeKey
                FROM
                    Entries
                WHERE
                    ]]

        elseif query.resultType == "sumTotalContentSize" then
            rv[#rv + 1] = [[
                SELECT
                    SUM(p_totalContentSize) as p_totalContentSize
                FROM
                    Entries
                WHERE
                    ]]

        elseif query.resultType == "collections" then
            rv[#rv + 1] = [[
                SELECT
                    i_collection_uuid
                FROM
                    Collections
                WHERE
                    ]]

        elseif query.resultType == "collectioncdekeys" then
            rv[#rv + 1] = [[
                SELECT
                    i_member_cde_key
                FROM
                    Collections
                WHERE
                    ]]

        elseif query.resultType == "indexer" then
            rv[#rv + 1] = [[
                SELECT
                    p_type,
                    p_uuid,
                    p_location,
                    p_mimeType,
                    p_cdeKey,
                    p_cdeType,
                    p_contentIndexedState
                FROM ]]
                    ..
                    tableName
                    ..
                    [[
                WHERE
                    ]]
        elseif query.resultType == "metadata_instant" then
            rv[#rv + 1] = [[
                SELECT
                ]] .. get_match_rank_column_sql(searchableString, self) .. [[  as bp_matchRank,
                p_uuid,
                p_type,
                p_originType,
                p_cdeKey,
                p_cdeType,
                p_location,
                j_credits,
                j_titles,
                j_displayObjects,
                p_publicationDate,
                p_homeMemberCount,
                p_virtualCollectionCount,
                p_isArchived as bp_isArchived,
                p_memberCount,
                p_companionCdeKey
            FROM
                Entries
            WHERE
                ]]
        elseif query.resultType == "series" then
           rv[#rv + 1] = [[ SELECT
                    p_modificationTime,
                    p_lastAccess,
                    p_percentFinished,
                    p_cdeKey,
                    p_cdeType,
                    j_displayTags,
                    p_type,

                    p_uuid,
                    p_location,
                    p_isArchived as bp_isArchived,
                    j_titles,
                    j_credits,
                    p_collectionCount,
                    p_memberCount,
                    p_homeMemberCount,
                    p_collectionDataSetName,
                    p_virtualCollectionCount,
                    p_collectionSyncCounter,

                    p_lastAccessedPosition,
                    p_expirationDate,
                    p_publicationDate,
                    p_pvcId,
                    p_publisher,
                    p_isDownloading as bp_isDownloading,
                    p_isDRMProtected as bp_isDRMProtected,
                    p_isVisibleInHome as bp_isVisibleInHome,
                    p_isLatestItem as bp_isLatestItem,
                    p_isUpdateAvailable as bp_isUpdateAvailable,

                    j_displayObjects,

                    j_languages,
                    p_mimeType,
                    p_cover,
                    p_thumbnail,
                    p_diskUsage,
                    p_cdeGroup,
                    p_version,
                    p_guid,

                    j_excludedTransports,
                    p_isMultimediaEnabled as bp_isMultimediaEnabled,
                    p_watermark,
                    p_contentSize,
                    p_isTestData as bp_isTestData,
                    p_contentIndexedState,
                    p_noteIndexedState,
                    p_ownershipType,
                    p_shareType,
                    p_contentState,
                    p_originType,
                    p_titles_0_collation,
                    p_seriesState,
                    p_readState,
                    p_subType,
                    d_itemPositionLabel,
                    d_itemPosition

                    FROM
                    Series ]]

		    elseif query.resultType == 'sub_select' then
			      rv[#rv + 1] = [[ SELECT
                    p_modificationTime,
                    p_lastAccess,
                    p_percentFinished,
                    p_cdeKey,
                    p_cdeType,
                    j_displayTags,
                    p_type,

                    p_uuid,
                    p_location,
                    p_isArchived,
                    j_titles,
                    j_credits,
                    p_collectionCount,
                    p_memberCount,
                    p_homeMemberCount,
                    p_collectionDataSetName,
                    p_virtualCollectionCount,
                    p_collectionSyncCounter,

                    p_lastAccessedPosition,
                    p_expirationDate,
                    p_publicationDate,
                    p_pvcId,
                    p_publisher,
                    p_isDownloading,
                    p_isDRMProtected,
                    p_isVisibleInHome,
                    p_isLatestItem,
                    p_isUpdateAvailable,

                    j_displayObjects,

                    j_languages,
                    p_mimeType,
                    p_cover,
                    p_thumbnail,
                    p_diskUsage,
                    p_cdeGroup,
                    p_version,
                    p_guid,

                    j_excludedTransports,
                    p_isMultimediaEnabled,
                    p_watermark,
                    p_contentSize,
                    p_isTestData,
                    p_contentIndexedState,
                    p_noteIndexedState,
                    p_ownershipType,
                    p_shareType,
                    p_contentState,
                    p_originType,
                    p_titles_0_collation,
                    p_seriesState,
                    p_readState,
                    p_subType
                    FROM
                    Entries WHERE ]]

        elseif query.resultType =="GroupedEntryCount" then
        rv[#rv+1] = [[SELECT
        count(*),
        p_originType,
        p_readState,
        p_cdeType,
        p_type,
        p_isArchived,
        p_contentState,
        p_visibilityState,
        p_seriesState
        FROM
        Entries ]]

       rv[#rv+1]=[[GROUP BY p_originType,p_readState,p_cdetype,p_type,p_isArchived,p_visibilityState,p_contentState,p_seriesState having p_contentState <> 2]];
       rv_count = { "SELECT NULL" }
       return table.concat(rv, ""), table.concat(rv_count, "")


      elseif query.resultType =="GroupedSeriesCount" then
        rv[#rv+1] = [[ SELECT
                       S.d_seriesId,
                       CASE WHEN p_readState in (1,2,4) THEN 1 ELSE 0 END AS p_isRead,
                       E.p_originType,
                       case when p_isArchived=0 and p_contentState=0 then 2 else E.p_isArchived end as p_archivedState,
                       E.p_type,
                       count(*) FROM
                       Series S
                       join Entries E
                       on S.d_itemCdeKey=E.p_cdeKey and NOT E.p_cdeType='EBSP' and E.p_contentState <> 2
                    ]]

       rv[#rv+1]=[[GROUP BY S.d_seriesId,p_isRead,E.p_originType,p_archivedState,E.p_type]];
       rv_count = { "SELECT NULL" }
       return table.concat(rv, ""), table.concat(rv_count, "")

      elseif query.resultType =="GroupedCollectionCount" then
         rv[#rv+1] = [[SELECT
                      CASE
                       WHEN p_readState in (1,2,4) then 1 ELSE 0 END AS p_isRead,
                      case when p_isArchived=0 and p_contentState=0 then 2 else E.p_isArchived end as p_archivedState,
                      E.p_originType,
                      E.p_cdeType,
                      E.p_type,
                      A.p_starred,
                      A.i_collection_uuid,
                      count(*) FROM
                      (SELECT C.i_collection_uuid, C.i_member_cde_key,C.i_member_cde_type, case when C.i_collection_uuid in (SELECT p_uuid from Entries where p_type='Collection' and p_isVisibleInHome=1 ) then 1 else 0 end  as p_starred from Collections C)A
                      JOIN
                      Entries E on A.i_member_cde_key=E.p_cdeKey and A.i_member_cde_type=E.p_cdeType and p_contentState <> 2
                    ]]

       rv[#rv+1]=[[GROUP BY p_isRead,p_archivedState, E.p_originType, A.p_starred, A.i_collection_uuid,E.p_cdeType,E.p_type ]];
       rv_count = { "SELECT NULL" }
       return table.concat(rv, ""), table.concat(rv_count, "")

      elseif query.resultType =="GroupedPeriodicalCount" then
         rv[#rv+1] = [[ SELECT
                        p_titles_0_collation AS p_groupIdentifier,
                       CASE
                       WHEN p_readState in (1,2,4) then 1 ELSE 0 END AS p_isRead,
                       E.p_originType,
                       case when p_isArchived=0 and p_contentState=0 then 2 else E.p_isArchived end as p_archivedState,
                       count(*)
                       FROM
                       Entries E WHERE  p_cdeType in ('NWPR','MAGZ') and E.p_contentState <> 2
                     ]]
       rv[#rv+1]=[[GROUP BY p_groupIdentifier,p_isRead,E.p_originType,p_archivedState]];
       rv_count = { "SELECT NULL" }
       return table.concat(rv, ""), table.concat(rv_count, "")

       elseif query.resultType =="CollectionCountDistribution" then
        rv[#rv+1] = [[SELECT E.p_readState , 
                      case when p_isArchived=0 and p_contentState=0 then 2 else E.p_isArchived end as p_archivedState ,E.p_originType , A.p_starred, count(*) FROM
                      (select i_member_cde_key ,i_member_cde_type ,CASE WHEN i_member_cde_key IN( SELECT i_member_cde_key FROM Collections WHERE i_collection_uuid IN (SELECT p_uuid from Entries WHERE p_type='Collection' and p_isVisibleInHome=1))
                       THEN 1 ELSE 0 END AS p_starred FROM Collections GROUP BY i_member_cde_key ,i_member_cde_type,p_starred)A
                      JOIN Entries E ON A.i_member_cde_key=E.p_cdeKey and A.i_member_cde_type=E.p_cdeType and E.p_contentState <> 2
                     ]]

        rv[#rv+1]=[[GROUP BY E.p_readState , p_archivedState ,E.p_originType , A.p_starred ]];
        rv_count = { "SELECT NULL" }
        return table.concat(rv, ""), table.concat(rv_count, "")

       elseif query.resultType =="CollectionViewCount" then
        rv[#rv+1] = [[ SELECT p_isVisibleInHome,count(*) FROM Entries WHERE p_type='Collection']]
        rv[#rv+1]=[[GROUP BY p_isVisibleInHome]];
        rv_count = { "SELECT NULL" }
        return table.concat(rv, ""), table.concat(rv_count, "")

        else
            assert(nil, "Unknown result type " .. tostring(query.resultType))
        end

        rv[#rv + 1] = where_clause


        if query.groupBy ~= nil then
             rv[#rv + 1] = [[ GROUP BY ]]
             for counter, col in ipairs(query.groupBy) do
                prefix, field, postfix = self:col(col.path)
                rv[#rv + 1] = field

                if counter < #query.groupBy then
                    rv[#rv + 1] = [[, ]]
                end
            end
        end

        if query.sortOrder ~= nil then
             rv[#rv + 1] = [[ ORDER BY ]]
             for counter, col in ipairs(query.sortOrder) do
                prefix, field, postfix = self:col(col.path)
                rv[#rv + 1] = field
                if col.order == "descending" then
                    rv[#rv + 1] = [[ DESC ]]
                elseif col.order == "ascending" then
                    rv[#rv + 1] = [[ ASC ]]
                end
                 if counter < #query.sortOrder then
                    rv[#rv + 1] = [[, ]]
                end
            end
        end

        if query.maxResults ~= nil then
            rv[#rv + 1] = [[ LIMIT ]]
            rv[#rv + 1] = self:bind(query.maxResults)
        end
        if query.startIndex ~= nil then
            rv[#rv + 1] = [[ OFFSET ]]
            rv[#rv + 1] = self:bind(query.startIndex)
        end

        -- With noQuery, don't run the query. This could be useful, if we are interested only in the count.
        if query.noQuery == true then
            rv = { "SELECT NULL" }
        end

        -- With noCount, don't collect the count.
        if query.noCount == true then
            rv_count = { "SELECT NULL" }
        else
            rv_count[#rv_count + 1] = [[
            SELECT
                COUNT(*)
            ]]
            ..
            (((query.resultType == "metadata_full" or query.resultType == "metadata_instant") and [[
                   , ]] .. get_match_rank_column_sql(searchableString, self) .. [[  as bp_matchRank
            ]]) or
            [[ ]])
            ..
            (((query.resultType == "collections" or query.resultType == "collectioncdekeys") and [[
            FROM Collections WHERE
            ]]) or
            ((query.resultType == "series") and [[
            FROM Series
            ]]) or
            [[
            FROM Entries WHERE
            ]]
            ..
            [[  ]])

            rv_count[#rv_count + 1] = where_clause
        end
        return table.concat(rv, ""), table.concat(rv_count, "")
    end

    -- Return sql sub query for matchRank, which includes a condition to check if largest word in the search string
    -- is found in metadataUnicodeWords or not. If found, then only use match_rank method, otherwise return the rank
    -- as 0. This is a first level filter before calling match_rank method.
    function get_match_rank_column_sql(searchableString, self)
        return [[CASE
                   WHEN p_metadataUnicodeWords LIKE ]] .. self.binder:bind( [[%]] .. get_largest_word(searchableString) .. [[%]] ) .. [[ THEN
                       match_rank(p_metadataUnicodeWords, ]] .. self.binder:bind(searchableString) .. [[)
                   ELSE 0
               END]]
    end


    ---- Public constructor function ----
    -- Transforms a query spec (as decoded from the outside world) into a set of SQL
    -- statements to run, and some options for normalize_results() to use while turning
    -- the results of the SQL into a response.
    --
    -- Publicly-visible function.
    construct_query_sql = function(query_spec)
        setmetatable(qc, QConstruct)

        local sql_statement, sql_count_statement = qc:query_sql(query_spec)

        llog.debug4("cqs", "rt", "resultType=%s", "", tostring(query_spec.resultType))
        return { sql             = sql_statement,
                 bind_vars       = qc.binder.bind_vars,
                 count_sql       = sql_count_statement,
                 count_bind_vars = qc.binder.bind_vars },
               { nohack          = query_spec.nohack,
                 noQuery         = query_spec.noQuery,
                 have_fts        = qc.have_fts,
                 have_pqc        = qc.have_pqc,
                 id              = query_spec.id,
                 start_index     = query_spec.startIndex,
                 fc_group_by_result = ((query_spec.resultType == "filter_count_group_by_result") or (query_spec.resultType == "GroupedEntryCount") or (query_spec.resultType == "GroupedSeriesCount") or (query_spec.resultType == "GroupedPeriodicalCount") or (query_spec.resultType == "GroupedCollectionCount") or(query_spec.resultType =="CollectionCountDistribution") or (query_spec.resultType =="CollectionViewCount")),
                 full_search     = (query_spec.resultType == "search_details"
                                    or query_spec.resultType == "full") }
    end
end

-- End Query Constructor class -----------------------------------------------------------


-- Transform an iterator of SQL query results into an object ready for serialization.
local function normalize_results(results, count, options)
    local result_list = {}
    local search_statistics

    if options.have_pqc then
        search_statistics = { }

        local search_stats_by_id
            = {
                   precedingItemCount = count
              }

        for id, _ in pairs(options.have_pqc) do
            search_statistics[id] = search_stats_by_id
        end
    end

    if results and not (options.noQuery and options.noQuery == true)  then
        for row in results do
            local obj = {}
            for col, val in pairs(row) do
                if col == "count(*)" and (options.fc_group_by_result == true )  then
                    obj["matchCount"] = val
                elseif val then
                    local separator = col:find("_", 1, true)
                    local field_type = col:sub(1, separator - 1)
                    local path = col:sub(separator + 1)

                    if field_type == "p" or field_type == "i" or field_type == "d" then
                        obj[path] = val
                    elseif field_type == "bp" then
                        obj[path] = (val ~= 0)
                    elseif field_type == "j" then
                        local ok
                        ok, obj[path] = pcall(function() return json.decode(val) end)
                        if not ok then
                            llog.error("query-norm", "jsonError", "val=%s,error=%s", "", val, obj[path])
                            assert(nil, cc_db_util.package_error(400, obj[path]))
                        end
                    else
                        assert(cc_db_util.package_error(500,"invalid field_type " .. tostring(field_type)))
                    end

                end
            end

            if options.have_fts then
                local loc_match_info
                if obj.location then
                    loc_match_info = match_info(obj.location, options.have_fts)
                else
                    loc_match_info = match_info(obj.cdeType .. "_" .. obj.cdeKey, options.have_fts)
                end
                obj.matchInfo = { }
                for id, mi in pairs(loc_match_info) do
                    obj.matchInfo[id] = { }
                    obj.matchInfo[id].matchCount = mi.matchCount
                    obj.matchInfo[id].metadataMatches = mi.metadataMatches

                    if options.full_search then
                        -- TODO: later, when we have separate calls for count vs position
                        -- data, this will need to change to explicitly request position
                        -- data.
                        obj.matchInfo[id].matches = mi.matches
                    end
                end
            end

            if not options.nohack then
                -- TODO HACK: eliminate this once Home is fixed to handle null credits and
                -- missing language tags in LStrings.
                if obj.credits == nil or #obj.credits == 0 then
                    obj.credits = { { } }
                end
                if obj.titles == nil or #obj.titles == 0 then
                    obj.titles = { { } }
                end
                if obj.titles[1].language == nil then
                    obj.titles[1].language = ""
                end
            end

            result_list[#result_list + 1] = obj
        end
    end

    if options.have_fts then
        search_statistics = { }

        -- This is a little weird, but less weird than most of the alternatives.
        -- Basically, I'm claiming that I searched everything for each keyword; this
        -- might not be what is expected for, say, a search within a collection, but
        -- as far as the CC is concerned, that could just as easily be a collection
        -- filter applied to search results as the other way around.  In fact, since
        -- I'm relying on SQLite to perform the actual filtering, I have no guarantee
        -- that it won't do exactly that.
        --
        -- So, in the interest of consistency, I will always return total books and
        -- total un-indexed books across the whole system.  For now, I think we're
        -- only performing whole-system searches anyway, so it shouldn't matter.
        local total_content_count = 0
        for _, _ in pairs(total_content_set) do
            total_content_count = total_content_count + 1
        end
        local unindexed_content_count = 0
        for _, _ in pairs(unindexed_content_set) do
            unindexed_content_count = unindexed_content_count + 1
        end

        local search_stats_by_id
            = {
                   totalSearched = total_content_count,
                   notIndexed = unindexed_content_count,
                   numberStemmedWords = number_stemmed_words
              }

        for id, _ in pairs(options.have_fts) do
            search_statistics[id] = search_stats_by_id
        end
    end
    return {
               id               = options.id,
               resultSetSize    = count,
               searchStatistics = search_statistics,
               startIndex       = options.start_index,
               type             = "QueryResponse",
               values           = result_list
           }
end

local function json_encode_err_msg(err_msg)
    if err_msg and err_msg:len() > 0 and err_msg:sub(1, 1) ~= "{" then
        err_msg = json.encode({ error = err_mgs, http_status_code = 400 })
    end
    return err_msg
end

query.internal = { }
-- Top-level function to perform queries.  Calls out to get SQL and to transform SQL
-- records into a result object, which it returns.
--
-- This function is called by query.query(), below, and by construct_insert_or_sql(), in
-- change.lua.
function query.internal.query(query_spec)
    qc = { binder = make_binder() }
    local q, options = construct_query_sql(query_spec)

    llog.debug4("pq", "sql", "", "%s", q.sql)
    for idx, val in pairs(q.bind_vars) do
        if type(val) == "string" then
            llog.debug4("pq", "sqlb", '%s="%s"', "", idx, val)
        elseif type(val) == "number" then
            llog.debug4("pq", "sqlb", '%s=%d', "", idx, val)
        elseif type(val) == "boolean" then
            llog.debug4("pq", "sqlb", '%s=%s', "", idx, tostring(val))
        else
            assert(false, cc_db_util.package_error(400,"unexpected type %s", type(val)))
        end
    end

    llog.debug4("pq", "sql", "", "%s", q.count_sql)
    for idx, val in pairs(q.count_bind_vars) do
        if type(val) == "string" then
            llog.debug4("pq", "sqlb", '%s="%s"', "", idx, val)
        elseif type(val) == "number" then
            llog.debug4("pq", "sqlb", '%s=%d', "", idx, val)
        elseif type(val) == "boolean" then
            llog.debug4("pq", "sqlb", '%s=%s', "", idx, tostring(val))
        else
            assert(false, cc_db_util.package_error(400,"unexpected type %s", type(val)))
        end
    end

    -- Note: I'm not doing these in a transaction.  There is a small
    -- chance that we'll end up with inconsistent results (e.g., return
    -- entries 11-20 out of 19) if something else changes the DB in
    -- between, but the chance is very low.
    local stmt_bind_time, stmt_c_bind_time
    local stmt
    local stmt_c
    local function t()
        local rows_result, count_result, msg, code

        if not options.have_pqc then
            if tostring(content_source) == on_device_content_source then
                stmt = assert(cc_db_util.package_for_assert(dcm.prepare_query(q.sql)))
            else
                stmt = assert(cc_db_util.package_for_assert(db:prepare(q.sql)))
            end

            assert(cc_db_util.package_for_assert(stmt:bind(q.bind_vars)))
            stmt_bind_time = perf_clock()

            rows_result, msg, code = stmt:rows()
            if rows_result == nil and code and code ~= 0 then
                assert(cc_db_util.package_for_assert(false, msg, code))
            end
        end

        if tostring(content_source) == on_device_content_source then
            stmt_c = assert(cc_db_util.package_for_assert(dcm.prepare_query(q.sql)))
        else
            stmt_c = assert(cc_db_util.package_for_assert(db:prepare(q.count_sql)))
        end
        assert(cc_db_util.package_for_assert(stmt_c:bind(q.count_bind_vars)))
        stmt_c_bind_time = perf_clock()

        count_result, msg, code = stmt_c:first_cols()
        if count_result == nil and code and code ~= 0 then
            assert(cc_db_util.package_for_assert(false, msg, code))
        end

        return rows_result, count_result or 0
    end
    local ok, results, count = pcall(t)

    local function close()
        if stmt_c then
            stmt_c:close()
        end

        if stmt then
            stmt:close()
        end
    end

    if not ok then
        close()
        llog.info("query", "functionT", "results=%s", "", results)

        assert( false, results )
    end

    local rv = normalize_results(results, count, options)

    close()
    return rv
end


-- Decode JSON, send object to query.internal.query(), then encode the result and return
-- to C.
function query.query(post_data, profile_data)
    local ok, query_spec = pcall(
        function()
            return json.decode(post_data)
        end)

    if not ok then
        local err_msg = json_encode_err_msg(query_spec)
        assert(false, err_msg)
    end

    content_source = query_spec.contentSource

    llog.debug4("ccat", "query.query", "profile_data=%s content_source=%s", "", profile_data, tostring(content_source))

    local ok, query_result = pcall(
        function()
            return query.internal.query(query_spec)
          end)
    -- Clear global variables. See comment at the top.
    search_result_cache = { }
    previous_search_column = nil
    previous_search_column_rank = nil
    all_paths_cache = nil
    unindexed_content_set = { }
    total_content_set = { }
    number_stemmed_words = 0
    content_location = nil
    searchableString = nil
    content_source = nil
    if not ok then
        assert(false, query_result)
    end
    local ok, res_string = pcall( function() return json.encode(query_result) end)

    return "200 OK", res_string .. "\n"
end
-- vim:set tw=90 sw=4 et: --


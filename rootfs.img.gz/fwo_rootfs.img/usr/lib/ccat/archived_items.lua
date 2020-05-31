-- archived_items.lua

-- Copyright (c) 2011-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

-- This file contains code to handle changes to the Archived Items (AI)
-- virtual collection.  The changes can happen due to the archived item
-- being downloaded, or deleted.  When downloaded, the archived item 
-- entry should have isVisibleInHome set to false.  When deleted, the
-- archived item should have isVisibleInHome set to true.

require 'cc_db_util'

local modname = ...
local archived_items = {}
_G[modname] = archived_items

-- This function retrieves the cdekey and cdetype of the item with the given uuid.
-- It is used to update archived items if the item happens to also have an archived item.
function archived_items.fetch_cdekey_and_cdetype (db, uuid)
    llog.debug4("archived_items.fetch_cdekey_and_cdetype", "enter", "uuid=%s", "", uuid)

    local sql = "SELECT p_cdekey AS cdekey, p_cdetype AS cdetype FROM Entries WHERE p_uuid = '" .. uuid .. "'"
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local row, message, code = stmt:first_row()
    stmt:close()    
    if row == nil then
        if code and code ~= 0 then
            llog.error("archived_items.fetch_cdekey_and_cdetype", "error", "%s", "", sql)
            assert(cc_db_util.package_for_assert(nil, message, code))
        end
        return
    end

    llog.debug4("archived_items.fetch_cdekey_and_cdetype", "exit", "uuid=%s", "", uuid)
    return row.cdekey, row.cdetype
end



-- This function is used to set the isVisibleInHome on the archived item indicated by
-- cdekey and cdetype.
-- @param db Database which to perform operations.
-- @param cdeKey cdeKey of the AI.
-- @param cdeType cde Type of the AI.
-- @param isVisibleInHome When the AI needs to be visible in HOME.
-- @param updateLastAccessTime Whether lastAccessTime of AI needs to be updated.
function archived_items.set_archive_item_visibility (db, cdekey, cdetype, isVisibleInHome, updateLastAccessTime)
    if cdekey == nil or cdetype == nil then
        llog.debug4("archived_items.set_archive_item_visibility", "exit", "cdekey_or_cdetype_is_nil", "")
        return
    end

    llog.debug4("archived_items.set_archive_item_visibility", "enter", "cdekey=%s:cdetype=%s:is_visible_in_home=%d:updateLastAccessTime=%s", "", cdekey, cdetype, isVisibleInHome, tostring(updateLastAccessTime))
    
    local sql = [[UPDATE Entries SET p_isVisibleInHome = ]] .. isVisibleInHome .. [[ WHERE (p_cdekey = ']] .. cdekey .. [[' AND (p_cdetype = ']] .. cdetype .. [[' AND p_isArchived = 1 AND p_contentState != 2 ))]]
    if updateLastAccessTime == true then
        local currentTime = tonumber(os.date('%s'))
        sql = [[UPDATE Entries SET p_lastAccess = ]] ..currentTime.. [[ ,p_isVisibleInHome = ]] .. isVisibleInHome .. [[ WHERE (p_cdekey = ']] .. cdekey .. [[' AND (p_cdetype = ']] .. cdetype .. [[' AND p_isArchived = 1 AND p_contentState != 2 ))]]
    end
    
    assert(cc_db_util.package_for_assert(db:exec( sql)))
    llog.debug4("archived_items.set_archive_item_visibility", "exit", "cdekey=%s:cdetype=%s:is_visible_in_home=%d", "", cdekey, cdetype, isVisibleInHome)
end

-- This function sets the isVisibleInHome and virtualCollectionCount columns on the ADC
-- item. Its isVisibleInHome field is set to true when there is at least one
-- dictionary for the account. The virtualCollectionCount is set to the number of
-- dictionaries for the account.
function archived_items.update_adc_item (db)
    llog.debug4("archived_items.update_adc_item", "enter", "", "")

    local count = 0
    local sql = "SELECT COUNT(*) AS count FROM Entries WHERE p_isVisibleInHome = 1 AND (p_isArchived = 1 OR p_contentState = 1) AND p_type = 'Entry:Item:Dictionary'"

    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local row, message, code = stmt:first_row()
    stmt:close()

    if row then
        count = row.count
    else
        if code and code ~= 0 then
            llog.error("archived_items.update_adc_item", "error", "%s", "", sql)
            assert(cc_db_util.package_for_assert(nil, message, code))
        end    
    end
    llog.debug4("archived_items.update_adc_item", "count", "adc_count=%d", "", count)

    local is_visible = 0
    if count > 0 then 
        is_visible = 1
    end

    sql = [[UPDATE Entries SET p_virtualCollectionCount = ]] .. count .. [[, p_isVisibleInHome = ]] .. is_visible .. [[ WHERE p_type = 'Entry:Item:ADC']]
    assert(cc_db_util.package_for_assert(db:exec( sql)))

    llog.debug4("archived_items.update_adc_item", "exit", "adc_count=%d:is_visible_in_home=%d", "", count, is_visible)
end

-- Delete thumbnails for all or specific items type from device where the
-- content is not downloaded to disk. Relative to CCAT, if the entry is
-- visible in home, then remove the associated thumbnail.
--
-- @param db Database which to perform operations.
-- @param itemType Type of the items for which thumbnails to be removed, nil for
-- all item type.
function archived_items.delete_thumbnails (db, itemType)
    llog.debug4("archived_items.delete_thumbnails", "enter", "itemType=%s", "", tostring(itemType))

    local count = 0
    local sql = "SELECT p_thumbnail FROM Entries WHERE p_isVisibleInHome = 1 AND p_isArchived = 1 AND p_thumbnail IS NOT NULL"
    if itemType ~= nil then
        sql = sql .. [[ AND p_type IN (]] .. itemType .. [[)]]
    else
        sql = sql .. [[ AND p_type != 'Entry:Item:PVC' ]]
    end
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local rows, message, code = stmt:rows()

    local startTime = perf_clock()
    if rows then
        for row in rows do
            if row.p_thumbnail ~= nil and row.p_thumbnail ~= "" then
                llog.debug4("archived_items.delete_thumbnails", "deletingThumbnail",
                        "thumbnail=" .. tostring(row.p_thumbnail), "")
                local ok, error = os.remove(row.p_thumbnail)
                if ok == nil then
                    llog.error("archived_items.delete_thumbnails", "deletingThumbnailFailed",
                            "thumbnail=" .. tostring(row.p_thumbnail) .. ",error=" .. tostring(error), "")
                end
            end
        end
    end
    local endTime = perf_clock()

    stmt:close()

    llog.perf("archived_items.delete_thumbnails", "perf", "deleteTime=" .. tostring(endTime - startTime), "")

    llog.debug4("archived_items.delete_thumbnails", "exit", "", "")
end

-- This function deletes all archived items of specific or all type from
-- the Content Catalog and sets the Archived Items virtual collection
-- count to 0.
--
-- @param db Database which to perform operations.
-- @param removeThumbnails Whether to remove archived item thumbnails.
-- @param itemType Type of the items to be removed, nil for all item type.
function archived_items.delete_all_archived_items_item (db, removeThumbnails, itemType)
    llog.debug4("archived_items.delete_all_archived_items_item", "enter", "removeThumbnails=%s itemType=%s", "", tostring(removeThumbnails), tostring(itemType))

    -- Remove thumbnails if requested.
    if removeThumbnails == true then
        archived_items.delete_thumbnails (db, itemType)
    end

    local sql = "DELETE FROM Entries WHERE p_isArchived = 1"
    if itemType ~= nil then
        sql = sql .. [[ AND p_type IN (]] .. itemType .. [[)]]
    else
        sql = sql .. [[ AND p_type != 'Entry:Item:ADC' AND p_type != 'Collection' ]]
    end
    assert(cc_db_util.package_for_assert(db:exec(sql)))

    -- Update the archived dictionary collection count to zero and set it to
    -- not visible.
    archived_items.update_adc_item (db)

    llog.debug4("archived_items.delete_all_archived_items_item", "exit", "", "")
end


-- For a given CDE key and type, update the archived item's visibility in home
-- based on whether the item exists on disk, i.e. having a non-archived entry.
-- If the archived item is downloaded to disk, set the visibility in home to
-- false, otherwise, set it to true. 
--
-- @param db Database which to perform operations.
-- @param cdeKey CDE key.
-- @param cdeType CDE type.
function archived_items.update_archived_item_visibility (db, cdeKey, cdeType)
    llog.debug4("archived_items.update_archived_item_visibility", "enter", "", "")

    local sql = [[ UPDATE Entries SET
                       p_isVisibleInHome = ((
                           SELECT COUNT(*) FROM Entries WHERE
                                   p_cdeKey = "]] .. cdeKey .. [["
                               AND p_cdeType = "]] .. cdeType .. [["
                               AND p_isArchived = 0
                           LIMIT 1
                       ) = 0)
                   WHERE
                           p_cdeKey = "]] .. cdeKey .. [["
                       AND p_cdeType = "]] .. cdeType .. [["
                       AND p_isArchived = 1
                ]]

    assert(cc_db_util.package_for_assert(db:exec(sql)))

    llog.debug4("archived_items.update_archived_item_visibility", "exit", "", "")
end

-- This function applies max archive count constraint by ensuring that number of 
-- archived items visible in HOME(excluding dictionaries)
-- stays under the maxArchiveCount. It does so by deleting the oldest entries based
-- on lastAccess date.
-- @param db Database which to perform operations.
-- @param maxArchiveCount Maximum number of archive items allowed.
function archived_items.apply_max_archive_count_constraint (db, maxArchiveCount)
    llog.debug4("archived_items.apply_max_archive_count_constraint", "enter", "", "")

    local count = 0
    local sql = "SELECT COUNT(*) AS count FROM Entries WHERE p_isArchived = 1 AND NOT p_type = 'Entry:Item:Dictionary'"

    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local row, message, code = stmt:first_row()
    stmt:close()

    if row then
        count = row.count
    else
        if code and code ~= 0 then
            llog.error("archived_items.apply_max_archive_count_constraint", "error", "%s", "", sql)
            assert(cc_db_util.package_for_assert(nil, message, code))
        end    
    end
    llog.debug4("archived_items.apply_max_archive_count_constraint", "count", "archived_items_count=%d", "", count)

    if count > maxArchiveCount then
    	local numberOfAIToDelete = count - maxArchiveCount;
    	
    	llog.debug4("archived_items.apply_max_archive_count_constraint", "deletingExtraArchivedItems", "numberOfAIToDelete=%d", "", numberOfAIToDelete)
     
	    sql = [[ DELETE FROM Entries WHERE p_uuid IN
    	                   (SELECT p_uuid from Entries WHERE 
        	               		p_isVisibleInHome = 1 AND p_isArchived = 1 
            	           		AND p_type = 'Entry:Item' 
                	       		order by p_lastAccess ASC LIMIT ]] .. numberOfAIToDelete .. [[ )
              	]]
    	
    	assert(cc_db_util.package_for_assert(db:exec(sql)))
    
    end
    
    llog.debug4("archived_items.apply_max_archive_count_constraint", "exit", "", "")
end

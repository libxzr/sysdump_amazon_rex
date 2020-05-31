-- periodicals_virtual_collections.lua

-- Copyright (c) 2014-2016 Amazon.com, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

-- This file contains code to handle updates to the Periodical virtual collection.
require 'cc_db_util'

local make_binder = cc_db_util.make_binder

local modname = ...
local periodicals_virtual_collections = {}
_G[modname] = periodicals_virtual_collections

-- constants
local UPDATE_TYPE_INSERT = "Insert"
local UPDATE_TYPE_DELETE = "Delete"
local MIN_ITEM_FOR_PVC = 2
local ARCHIVED_PVC_INDEX = 2
local DOWNLOADED_PVC_INDEX = 1

local INVALID_UUID = -1
-- PVC  states
local NO_PVC = 1
local DOWNLOADED_PVC = 2
local ARCHIVED_PVC = 3
local DOWNLOADED_ARCHIVED_PVC = 4

local DOWNLOADED_ITEM = 0
local ARCHIVED_ITEM = 1

-- Get the CDE group itme count for the given title/cdeGroup
local function getCDEGroupItemCount (db, title, cdeGroup, isArchived)
    llog.debug4("periodicals_virtual_collections.getCDEGroupItemCount", "enter", "title=%s cdeGroup=%s isArchived=%s", "", tostring(title), tostring(cdeGroup), tostring(isArchived))

    -- Query all the item except PVC item based on the following
    -- 1. All the items matching the passed cdeGroup value
    -- 2. All the items where the cdeGroup is empty and title matching with the given title ( fall back logic if the cdeGroup is empty )
    -- 3. Cloud/All view should display cloud+Downloaded+Sideloaded contents. Downloaded view should display Downloaded+Sideloaded contents.
    local sql
    if isArchived == ARCHIVED_ITEM then
        sql = "SELECT count(*) AS count FROM Entries WHERE ((p_cdeGroup = ? or p_titles_0_nominal = ?) AND (p_type != 'Entry:Item:PVC') AND (p_isVisibleInHome = 1) AND (p_cdetype = 'NWPR' or p_cdetype = 'MAGZ'))"
    else
        sql = "SELECT count(*) AS count FROM Entries WHERE ((p_cdeGroup = ? or p_titles_0_nominal = ?) AND (p_type != 'Entry:Item:PVC') AND (p_isVisibleInHome = 1 AND p_isArchived = " .. DOWNLOADED_ITEM .. ") AND (p_cdetype = 'NWPR' or p_cdetype = 'MAGZ'))"
    end
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(cdeGroup,title))

    if not ok then
        stmt:close()
	assert(ok, msg)
    end

    local row, msg, code = stmt:first_row()
    stmt:close()

    local count = 0
    if row then
        count = row.count
    end   

    llog.debug4("periodicals_virtual_collections.getCDEGroupItemCount", "exit", "sql = %s ", "", tostring(count))
    return count
end

-- update Display tags for PVC
local function updateDisplayInfoForPVC(db, title, cdeGroup,displayTags)
    llog.debug4("periodicals_virtual_collections.updateDisplayInfoForPVC", "enter", "title=%s cdeGroup=%s cdeKey=%s", "", tostring(title), tostring(cdeGroup), tostring(cdeKey), tostring(isArchived))
    
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        UPDATE Entries SET j_displayTags=? WHERE ((p_cdeGroup = ? or p_titles_0_nominal = ?) AND (p_type == 'Entry:Item:PVC'))
    ]]))
    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(displayTags,cdeGroup,title))
    if not ok then
        update_stmt:close()
        assert(ok, msg)
    end
    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("periodicals_virtual_collections.updateDisplayInfoForPVC", "exit", "title=%s", "", tostring(title))
end

-- update latest edition information on the PVC item
local function updateLatestEditionInfoForPVC(db, title, cdeGroup, isArchived, displayTags, thumbnail, cdeKey, publicationDate)
    llog.debug4("periodicals_virtual_collections.updateLatestEditionInfoForPVC", "enter", "title=%s cdeGroup=%s cdeKey=%s", "", tostring(title), tostring(cdeGroup), tostring(cdeKey), tostring(isArchived))
    
    -- Update the member count for the PVC item based on the following
    -- 1. PVC item matching the passed cdeGroup value or 
    -- 2. PVC items where the cdeGroup is empty and title matching with the given title ( fall back logic if the cdeGroup is empty )
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        UPDATE Entries SET j_displayTags=?, p_thumbnail  = ? , p_cdeKey = ? , p_publicationDate = ? WHERE ((p_cdeGroup = ? or p_titles_0_nominal = ?) AND (p_type == 'Entry:Item:PVC') AND p_isArchived=?)
    ]]))
    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(displayTags,thumbnail,cdeKey,publicationDate,cdeGroup,title,isArchived))
    if not ok then
        update_stmt:close()
        assert(ok, msg)
    end
    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("periodicals_virtual_collections.updateLatestEditionInfoForPVC", "exit", "title=%s", "", tostring(title))
end

-- Update the p_virtualCollectionCount for the periodical virtual collection
local function updatePVCMembercount (db, title, cdeGroup, isArchived, count)
    llog.debug4("periodicals_virtual_collections.updatePVCMembercount", "enter", "title=%s cdeGroup=%s count=%s", "", tostring(title), tostring(cdeGroup), tostring(count))
   
    -- Update the member count for the PVC item based on the following
    -- 1. PVC item matching the passed cdeGroup value or 
    -- 2. PVC items where the cdeGroup is empty and title matching with the given title ( fall back logic if the cdeGroup is empty )
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        UPDATE Entries SET p_virtualCollectionCount  = ? WHERE ((p_cdeGroup = ? or p_titles_0_nominal = ?) AND (p_type == 'Entry:Item:PVC') AND (p_isArchived = ?))
    ]]))
    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(count,cdeGroup,title,isArchived))
    if not ok then
        update_stmt:close()
        assert(ok, msg)
    end
    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("periodicals_virtual_collections.updatePVCMembercount", "exit", "title=%s", "", tostring(title))
end

-- Populate periodical virtual collection information on the item
local function populatePVCInfo(db, pvc_id, title, cdeGroup)
    llog.debug4("periodicals_virtual_collections.populate_p_pvcId ", "enter", "title=%s pvcId=%s", "", tostring(title), tostring(pvc_id))
    
    -- Update the PVC Id for the item based on the following
    -- 1. items matching the passed cdeGroup value or 
    -- 2. items where the cdeGroup is empty and title matching with the given title ( fall back logic if the cdeGroup is empty )
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        UPDATE Entries SET p_pvcId  = ? WHERE ((p_cdeGroup = ? or p_titles_0_nominal = ?)AND p_type != 'Entry:Item:PVC' AND (p_cdetype = 'NWPR' or p_cdetype = 'MAGZ'))
    ]]))
    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(pvc_id,cdeGroup,title))
    if not ok then
        update_stmt:close()
        assert(ok, msg)
    end
    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("periodicals_virtual_collections.populate_p_pvcId ", "exit", "title=%s", "", tostring(title))
end 

-- Update the p_lastAccess of periodical virtual collection.
function periodicals_virtual_collections.updatePVCLastAccessTime(db, title, cdeGroup, lastAccess)
    llog.debug4("periodicals_virtual_collections.updatePVCLastAccessTime", "enter", "title=%s cdeGroup=%s lastAccess=%s", "", tostring(title), tostring(cdeGroup), tostring(lastAccess))
    
    -- Update the PVC Id for the item based on the following
    -- 1. items matching the passed cdeGroup value or 
    -- 2. items where the cdeGroup is empty and title matching with the given title ( fall back logic if the cdeGroup is empty )
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        UPDATE Entries SET p_lastAccess  = ? WHERE ((p_cdeGroup = ? or p_titles_0_nominal = ?) AND p_type='Entry:Item:PVC')
    ]]))
    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(lastAccess,cdeGroup,title))
    if not ok then
        update_stmt:close()
        assert(ok,msg)
    end
    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)
    
    llog.debug4("periodicals_virtual_collections.updatePVCLastAccessTime ", "exit", "title=%s", "", tostring(title))
end


-- Update the p_pvcId for the periodical virtual collection
local function updatePVCInfo (db, pvc_id, cdeKey, isArchived)
    llog.debug4("periodicals_virtual_collections.updatePVCInfo ", "enter", "pvcId=%s cdeKey=%s isArchived=%s", "", tostring(pvc_id), tostring(cdeKey), tostring(isArchived))
    
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        UPDATE Entries SET p_pvcId  = ? WHERE ( p_cdeKey == ? AND p_isArchived = ? AND p_type != 'Entry:Item:PVC')
    ]]))
    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(pvc_id,cdeKey,isArchived))
    if not ok then
        update_stmt:close()
        assert(ok, msg)
    end
    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("periodicals_virtual_collections.updatePVCInfo ", "exit", "cdeKey=%s", "", tostring(cdeKey))
end

-- Get the uuid of the periodical virtual collection
local function getPVCId (db, title, cdeGroup)
    llog.debug4("periodicals_virtual_collections.getPVCId", "enter", "title=%s", "", tostring(title))

    -- Get the UUDI of PVC Item based on the following
    -- 1. PVC item matching the passed cdeGroup value or 
    -- 2. PVC item where the cdeGroup is empty and title matching with the given title ( fall back logic if the cdeGroup is empty )
    local sql = "SELECT p_uuid AS uuid,p_isArchived AS isArchived,p_cdeKey as cdeKey,p_isLatestItem as isLatestItem FROM Entries WHERE ((p_cdeGroup = ? or p_titles_0_nominal = ?)AND p_type = 'Entry:Item:PVC')"
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(cdeGroup,title))
    if not ok then
        stmt:close()
        assert(ok, msg)
    end
   

    pvcs = {{},{}}
    pvcs[1]["uuid"] = INVALID_UUID
    pvcs[2]["uuid"] = INVALID_UUID

    local rows, msg, code = stmt:rows()
    if rows then
        llog.debug4("periodicals_virtual_collections.getPVCId", "exit", "title=%s", "", tostring(rows))
        for row in rows do
            if row.isArchived ~= nil then
                pvcs[row.isArchived + 1] = row
            end
        end
    end   
    stmt:close()
    return pvcs
end

-- Create the periodical virtual collection
local function createPVC(db, title, cdeGroup, language, isArchived, count, lastAccess, isSearchable)
    llog.debug4("periodicals_virtual_collections.createPVC", "enter", "title=%s cdeGroup=%s", "", tostring(title), tostring(cdeGroup))
    
    -- Create the periodical virtual collection with pre-populated values
    local binder = make_binder()
    local uuid = get_uuid();
    insert_spec = {}
    insert_spec["type"] = "Entry:Item:PVC"
    insert_spec["titles"] = {{}}
    insert_spec["titles"][1]["display"] = title
    insert_spec["titles"][1]["language"] = language
    insert_spec["languages"] = {}
    insert_spec["languages"][1] = language
    insert_spec["mimeType"]= "application/x-kindle-pvc"
    insert_spec["uuid"] = uuid;
    insert_spec["isVisibleInHome"] = 1;
    insert_spec["pvcId"] = NO_PVC;
    insert_spec["isArchived"] = isArchived;
    insert_spec["virtualCollectionCount"] = count;
    insert_spec["lastAccess"] = (lastAccess == nil)  and tonumber(os.date('%s')) or lastAccess;
    insert_spec["isLatestItem"] = isSearchable
    if cdeGroup ~= nil and cdeGroup ~= "" then
        insert_spec["cdeGroup"] = cdeGroup
    end
    
    local sqls, collection_uuid = construct_insert_sql(binder, insert_spec, "REPLACE");
    cc_db_util.exec_sql(db, sqls[1].sql, sqls[1].bind_vars)
    
    llog.debug4("periodicals_virtual_collections.createPVC", "exit", "title=%s uuid=%s", "", tostring(title), tostring(insert_spec["uuid"]))
    return uuid,isSearchable
end

-- Delete the periodical Back issues
local function deletePBI(db)
    llog.debug4("periodicals_virtual_collections.deletePBI", "enter", "", "")

    -- Delte the periodical virtual collection based on the following
    -- 1. PVC item matching the passed cdeGroup value or 
    -- 2. PVC item where the cdeGroup is empty and title matching with the given title ( fall back logic if the cdeGroup is empty )
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        DELETE FROM Entries WHERE p_type='Entry:Item:PBI'
    ]]))
    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(uuid))
    if not ok then
        update_stmt:close()
        assert(ok, msg)
    end
    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("periodicals_virtual_collections.deletePBI", "exit", "", "")
end

-- Delete all periodical virtual collections
local function deleteAllPVC(db)
    llog.debug4("periodicals_virtual_collections.deleteAllPVC", "enter", "", "")

    -- Delte the periodical virtual collection based on the following
    -- 1. PVC item matching the passed cdeGroup value or 
    -- 2. PVC item where the cdeGroup is empty and title matching with the given title ( fall back logic if the cdeGroup is empty )
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        DELETE FROM Entries WHERE p_type='Entry:Item:PVC'
    ]]))
    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(uuid))
    if not ok then
        update_stmt:close()
        assert(ok, msg)
    end
    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("periodicals_virtual_collections.deleteAllPvc", "exit", "", "")
end

-- Delete the periodical virtual collection
local function deletePVC(db, uuid)
    llog.debug4("periodicals_virtual_collections.deletePVC", "enter", "uuid=%s", "", tostring(uuid))

    -- Delte the periodical virtual collection based on the following
    -- 1. PVC item matching the passed cdeGroup value or 
    -- 2. PVC item where the cdeGroup is empty and title matching with the given title ( fall back logic if the cdeGroup is empty )
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        DELETE FROM Entries WHERE p_uuid = ?
    ]]))
    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(uuid))
    if not ok then
        update_stmt:close()
        assert(ok, msg)
    end
    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("periodicals_virtual_collections.deletePVC", "exit", "uuid=%s", "", tostring(uuid))
end

-- Get the latest periodical edition
local function getLatestEditionDisplayInfo (db, title, cdeGroup, isArchived)
    llog.debug4("periodicals_virtual_collections.getLatestEditionDisplayInfo", "enter", "title=%s cdeGroup=%s isArchived=%s", "", tostring(title), tostring(cdeGroup), tostring(isArchived))

    local sql
    if isArchived == ARCHIVED_ITEM then
        sql = "SELECT p_cdeKey as cdeKey, p_cdeType as cdeType, p_thumbnail as thumbnail, j_displayTags as displayTags, p_publicationDate as publicationDate FROM Entries WHERE ( (p_cdeGroup = ? or p_titles_0_nominal = ?)  AND (p_cdetype = 'NWPR' or p_cdetype = 'MAGZ') AND p_isVisibleInHome=1) ORDER BY p_publicationDate DESC LIMIT 1"
    else
        sql = "SELECT p_cdeKey as cdeKey, p_cdeType as cdeType, p_thumbnail as thumbnail, j_displayTags as displayTags, p_publicationDate as publicationDate FROM Entries WHERE ( (p_cdeGroup = ? or p_titles_0_nominal = ?)  AND (p_cdetype = 'NWPR' or p_cdetype = 'MAGZ') AND p_isArchived = " .. DOWNLOADED_ITEM .. " AND p_isVisibleInHome=1) ORDER BY p_publicationDate DESC LIMIT 1"
    end
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(cdeGroup, title))
    if not ok then
        stmt:close()
	assert(ok, msg)
    end

    local row, msg, code = stmt:first_row()
    stmt:close()

    local thumbnail = nil
    local cdeKey = nil
    local cdeType = nil
    local displayTags = nil
    local publicationDate = nil
    if row then
        thumbnail  = row.thumbnail
        cdeKey  = row.cdeKey
        cdeType  = row.cdeType
        displayTags = row.displayTags
        publicationDate = row.publicationDate

        -- Keep only New tags for PVC
        if displayTags ~= nil and string.find(displayTags, "\"NEW\"") then
            displayTags = "[\"NEW\"]"
        else
            displayTags = nil
        end
    end   

    -- populate thumbnails
    if thumbnail == nil and cdeKey ~= nil and cdeType ~= nil then
        thumbnail = "/mnt/us/system/thumbnails/thumbnail_" .. cdeKey .. "_" .. cdeType .. "_portrait.jpg"
    end 

    llog.debug4("periodicals_virtual_collections.getLatestEditionDisplayInfo", "exit", "displayTags=%s thumbnail=%s cdeKey=%s cdeType=%s", "", tostring(displayTags), tostring(thumbnail), tostring(cdeKey), tostring(cdeType))
    return displayTags,thumbnail,cdeKey,publicationDate
end

-- Get the language for the item
function getLatestItemInfo(db, title, cdeGroup, isArchived)
    local sql
    if isArchived == ARCHIVED_ITEM then
        sql = "SELECT p_languages_0,p_lastAccess FROM Entries WHERE ( ( p_cdeGroup = ? or p_titles_0_nominal = ?)  AND (p_cdetype = 'NWPR' or p_cdetype = 'MAGZ')) ORDER BY p_publicationDate DESC LIMIT 1"
    else
        sql = "SELECT p_languages_0,p_lastAccess FROM Entries WHERE ( ( p_cdeGroup = ? or p_titles_0_nominal = ?)  AND (p_cdetype = 'NWPR' or p_cdetype = 'MAGZ') AND p_isArchived = " .. DOWNLOADED_ITEM .. ") ORDER BY p_publicationDate DESC LIMIT 1"
    end
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(cdeGroup, title))
    if not ok then
        stmt:close()
	assert(ok, msg)
    end

    local row, msg, code = stmt:first_row()
    stmt:close()

    local language = "en"
    local lastAccess = nil
    if row then
        language = row.p_languages_0
        lastAccess = row.p_lastAccess
    end
    return language,lastAccess
end

-- Get the last Access of the most recently accessed Item belonging to that PVC
function getMostRecentLastAccess(db, title, cdeGroup)
    local sql = "SELECT p_lastAccess FROM Entries WHERE ( ( p_cdeGroup = ? or p_titles_0_nominal = ?)  AND (p_cdetype = 'NWPR' or p_cdetype = 'MAGZ')) ORDER BY p_lastAccess DESC LIMIT 1"
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(cdeGroup, title))
    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local row, msg, code = stmt:first_row()
    stmt:close()
    local lastAccess = nil

    if row then
 	lastAccess = row.p_lastAccess
    end
    return lastAccess
end

-- Update the p_latestItem of periodical virtual collection.
function updatePVCSearchItem(db, title, cdeGroup, isSearchItem, isArchived)
    llog.debug4("periodicals_virtual_collections.updatePVCSearchItem", "enter", "title=%s cdeGroup=%s isSearchItem=%s", "", tostring(title), tostring(cdeGroup), tostring(isSearchItem))
    
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        UPDATE Entries SET p_isLatestItem  = ? WHERE ((p_cdeGroup = ? or p_titles_0_nominal = ?) AND p_type='Entry:Item:PVC' AND p_isArchived = ?)
    ]]))
    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(isSearchItem,cdeGroup,title,isArchived))
    if not ok then
        update_stmt:close()
        assert(ok,msg)
    end
    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)
    
    llog.debug4("periodicals_virtual_collections.updatePVCSearchItem ", "exit", "title=%s", "", tostring(title))
end

-- Get the correspondign PVC state
function getPVCState(pvc_device_uuid, pvc_archive_uuid)
    if pvc_device_uuid == INVALID_UUID and pvc_archive_uuid == INVALID_UUID then
        return NO_PVC
    elseif pvc_device_uuid ~= INVALID_UUID and pvc_archive_uuid == INVALID_UUID then
        return DOWNLOADED_PVC
    elseif pvc_device_uuid == INVALID_UUID and pvc_archive_uuid ~= INVALID_UUID then
        return ARCHIVED_PVC
    else
        return DOWNLOADED_ARCHIVED_PVC
    end
end

-- This fucntion gets the content state for downloaded/sideloaded entries
function getContentState (db, cdeKey)
    llog.debug4("getContentState", "enter", "cdeKey=%s", "", tostring(cdeKey))

    local sql = "SELECT count(*) as count FROM Entries WHERE p_cdeKey = ? AND p_isArchived = 1"
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(cdeKey))
    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local row, msg, code = stmt:first_row()
    stmt:close()
    local contentState = nil

    if row then
	contentState = row.count
    end

    llog.debug4("getContentState", "exit", "sql = %s ", "", tostring(contentState))
    return contentState
end

-- This function is used to update the periodical virtual collection information when items are inserted/deleted
function periodicals_virtual_collections.update_periodicals_collections (db, title, cdeKey, cdeGroup, language, isArchived, updateType)
    if isArchived == "0" then
        update_periodicals_collection (db, title, cdeKey, cdeGroup, language, 0, updateType)
        if getContentState(db, cdeKey) == 0 then
            update_periodicals_collection (db, title, cdeKey, cdeGroup, language, 1, updateType)
        end
    else
        update_periodicals_collection (db, title, cdeKey, cdeGroup, language, 1, updateType)
    end
end

-- This function is used to update the periodical virtual collection information
function update_periodicals_collection (db, title, cdeKey, cdeGroup, language, isArchived, updateType)
    llog.debug4("periodicals_virtual_collections.update_periodicals_collection", "enter", "title=%s cdeKey=%s cdeGroup=%s language=%s updateType=%s", "", tostring(title), tostring(cdeKey), tostring(cdeGroup), tostring(language), tostring(updateType))

    if title == nil then
        return
    end
    
    if cdeGroup == nil then
        cdeGroup = ""
    end 

    if cdeKey == nil then
        cdeKey = ""
    end

    -- Get the PVC id for the given item
    local pvcs = getPVCId (db, title, cdeGroup)
    local pvc_is_Archived_index = isArchived + 1

    -- Get the cde group item for the given title/cdeGroup
    local group_member_count = nil
 
    if updateType == UPDATE_TYPE_INSERT then
        group_member_count = getCDEGroupItemCount (db, title, cdeGroup, isArchived)

        -- check if pvc is already exist for the item
        if pvcs[pvc_is_Archived_index].uuid ~= INVALID_UUID then
             llog.debug4("periodicals_virtual_collections.", "Already has PVC entry", "title=%s", "", tostring(title))
             
             -- pvc already exist, update the member count
             updatePVCMembercount (db, title, cdeGroup, isArchived, group_member_count)
 
             -- update the PVC id on the item
             updatePVCInfo (db, getPVCState(pvcs[DOWNLOADED_PVC_INDEX].uuid, pvcs[ARCHIVED_PVC_INDEX].uuid), cdeKey, isArchived)
 
        elseif group_member_count >= MIN_ITEM_FOR_PVC then 
             llog.debug4("periodicals_virtual_collections.", "create PVC item", "title=%s", "", tostring(title))
 
            -- pvc does not exist and the group count is greater than MIN_ITEM_FOR_PVC, create pvc entry
            local isSearchable = ( pvc_is_Archived_index == ARCHIVED_PVC_INDEX ) and 1 or ( pvcs[ARCHIVED_PVC_INDEX].uuid ~= INVALID_UUID and 0 or 1 )
	    local lastAccess = getMostRecentLastAccess(db, title, cdeGroup)
            pvcs[pvc_is_Archived_index].uuid,pvcs[pvc_is_Archived_index].isLatestItem  = createPVC(db, title, cdeGroup, language, isArchived, group_member_count,lastAccess,isSearchable)

            -- populate the PVC id for all the items matching title/cdeGroup
            populatePVCInfo(db, getPVCState(pvcs[DOWNLOADED_PVC_INDEX].uuid, pvcs[ARCHIVED_PVC_INDEX].uuid), title, cdeGroup)
        else
            updatePVCInfo (db, getPVCState(pvcs[DOWNLOADED_PVC_INDEX].uuid, pvcs[ARCHIVED_PVC_INDEX].uuid), cdeKey, isArchived)
        end
        
        -- update the last access time for both the PVC's
        if pvc_is_Archived_index == DOWNLOADED_PVC_INDEX then
            local lastAccess = tonumber(os.date('%s')); 
            periodicals_virtual_collections.updatePVCLastAccessTime(db, title, cdeGroup, lastAccess)
        end
    elseif updateType == UPDATE_TYPE_DELETE then 
        if pvcs[pvc_is_Archived_index].uuid  then
            llog.debug4("periodicals_virtual_collections.", "Has pvc entry", "title=%s", "", tostring(title))
            group_member_count = getCDEGroupItemCount (db, title, cdeGroup, isArchived)

            if group_member_count < MIN_ITEM_FOR_PVC then
                llog.debug4("periodicals_virtual_collections.", "delete pvc item", "title=%s", "", tostring(title))
                
                -- Delete the PVC Item
                deletePVC(db, pvcs[pvc_is_Archived_index].uuid)
                pvcs[pvc_is_Archived_index].uuid = INVALID_UUID

                populatePVCInfo(db, getPVCState(pvcs[DOWNLOADED_PVC_INDEX].uuid, pvcs[ARCHIVED_PVC_INDEX].uuid), title, cdeGroup, isArchived)
            else 
                -- Update the member count for the PVC item
                updatePVCMembercount (db, title, cdeGroup, isArchived, group_member_count)
            end
        end
    end

    if pvcs[pvc_is_Archived_index].uuid ~= INVALID_UUID then
        -- If PVC is available then update the latest edition cdeKey in PVC
        local displayTags,thumbnail,latestEditionCDEKey,publicationDate = getLatestEditionDisplayInfo(db, title, cdeGroup, isArchived)
        -- current item is the latest edition.
        updateLatestEditionInfoForPVC(db, title, cdeGroup, isArchived, displayTags, thumbnail, latestEditionCDEKey, publicationDate)
    end

    if isArchived == DOWNLOADED_ITEM and 
       pvcs[ARCHIVED_PVC_INDEX].uuid ~= INVALID_UUID and 
       cdeKey == pvcs[ARCHIVED_PVC_INDEX].cdeKey then
           local displayTags,thumbnail,latestEditionCDEKey,publicationDate = getLatestEditionDisplayInfo(db, title, cdeGroup, ARCHIVED_ITEM)
           updateLatestEditionInfoForPVC(db, title, cdeGroup, ARCHIVED_ITEM, displayTags, thumbnail, latestEditionCDEKey, publicationDate)
    end 


     -- Search related cases
     if pvcs[ARCHIVED_PVC_INDEX].uuid  ~= INVALID_UUID then
         if pvcs[DOWNLOADED_PVC_INDEX].uuid ~= INVALID_UUID and pvcs[ARCHIVED_PVC_INDEX].isLatestItem == 1 then
            updatePVCSearchItem(db, title, cdeGroup, 0, DOWNLOADED_ITEM)
         end
     elseif pvcs[DOWNLOADED_PVC_INDEX].uuid ~= INVALID_UUID and pvcs[ARCHIVED_PVC_INDEX].isLatestItem == 0 then 
         updatePVCSearchItem(db, title, cdeGroup, 1, DOWNLOADED_ITEM)
     end

    llog.debug4("periodicals_virtual_collections.update_periodicals_collection", "exit", "title=%s", "", tostring(title))
end

-- Refresh the periodical virtual collection during de-registeration usecase
function periodicals_virtual_collections.refreshPeriodicalVirtualCollection(db)
    llog.debug4("periodicals_virtual_collections.refreshPeriodicalVirtualCollection", "enter", "", "")

    -- Query all PVC items
    local count = 0
    local sql = "SELECT p_uuid, p_cdeGroup, p_titles_0_nominal, p_isArchived FROM Entries WHERE p_isArchived=0"

    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local rows, message, code = stmt:rows()

    if rows then
        for row in rows do
            if row.p_uuid ~= nil then
                local cdeGroup = row.p_cdeGroup
                local title = row.p_titles_0_nominal
                local uuid = row.p_uuid
                local isArchived = row.p_isArchived

                local pvcs = getPVCId (db, title, cdeGroup)
                populatePVCInfo(db, getPVCState(pvcs[DOWNLOADED_PVC_INDEX].uuid, pvcs[ARCHIVED_PVC_INDEX].uuid), title, cdeGroup)
                updatePVCSearchItem(db, title, cdeGroup, 1, isArchived)
            end
        end
    end
    stmt:close()

    llog.debug4("periodicals_virtual_collections.refreshPeriodicalVirtualCollection", "exit", "", "")
end

-- update display tags and last access time for periodical virtual collection
function periodicals_virtual_collections.pvcInfoUpdated (db, title, cdeGroup, cdeKey)
    if title == nil or cdeKey == nil then
        return
    end
  
    local displayTagsOnDevice, thumbnailOnDevice,latestEditionCDEKeyOnDevice,publicationDate = getLatestEditionDisplayInfo(db, title, cdeGroup, DOWNLOADED_ITEM)
    if latestEditionCDEKeyOnDevice == cdeKey then
        llog.debug4("periodicals_virtual_collections.displayTagUpdated title=%s cdeKey=%s", "", "", "",title,cdeKey) 
        local displayTagsArchive, thumbnailArchive,latestEditionCDEKeyArchive,publicationDate = getLatestEditionDisplayInfo(db, title, cdeGroup, ARCHIVED_ITEM)
        if latestEditionCDEKeyOnDevice == latestEditionCDEKeyArchive then
            updateDisplayInfoForPVC(db, title, cdeGroup,displayTagsArchive)
        else
            updateLatestEditionInfoForPVC(db, title, cdeGroup, DOWNLOADED_ITEM, displayTagsOnDevice, thumbnailOnDevice, latestEditionCDEKeyOnDevice, publicationDate)
        end
    end

    --Also update last access time
    periodicals_virtual_collections.updatePVCLastAccessTime(db, title, cdeGroup, tonumber(os.date('%s')))
end

function periodicals_virtual_collections.fetchItemDetails(db, cdeKey, isArchived)
    llog.debug4("periodical_virtual_collection.fetchItemDetails", "enter", "cdeKey=%s isArchived=%s", "", tostring(cdeKey), tostring(isArchived))
    
    if cdeKey == nil then
        return
    end

    isArchived =  (isArchived == "1") and 1 or 0

    local sql = "SELECT p_titles_0_nominal AS title, p_cdeGroup AS cdeGroup, p_languages_0 AS language FROM Entries WHERE ( p_cdekey = ? AND p_isArchived = ? )"
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(cdeKey, isArchived))
		
    local row, message, code = stmt:first_row()
    stmt:close()    
    if row == nil then
        if code and code ~= 0 then
            llog.error("periodical_virtual_collection.fetchItemDetails", "error", "%s", "", sql)
            assert(cc_db_util.package_for_assert(nil, message, code))
        end
        return
    end

    llog.debug4("periodical_virtual_collection.fetchItemDetails", "exit", "cdeKey=%s isArchived=%s", "", tostring(cdeKey), tostring(isArchived))
    return row.title, row.cdeGroup, row.language
end

-- Update the count of cloud PVCs that have sideloaded periodicals during migration from PVC version 1 to PVC version 2.
function updateCloudPVCCount(db)
    llog.debug4("updateCloudPVCCount", "start", "", "")
    local sql = "SELECT DISTINCT p_titles_0_nominal,p_isArchived,p_cdeGroup FROM Entries WHERE p_type = 'Entry:Item:PVC' and p_isArchived = " .. ARCHIVED_ITEM .. " and p_titles_0_nominal in (SELECT DISTINCT p_titles_0_nominal FROM Entries WHERE (p_cdetype = 'NWPR' or p_cdetype = 'MAGZ') and p_isArchived = " .. DOWNLOADED_ITEM .. " and p_contentState = 0)"
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local rows, message, code = stmt:rows()

    if rows then
        for row in rows do
            local cdeGroup = row.p_cdeGroup
            local title = row.p_titles_0_nominal
            local isArchived = row.p_isArchived

            llog.debug4("updateCloudPVCCount looking at", "", "title=%s", "", tostring(title))
            local group_member_count = getCDEGroupItemCount (db, title, cdeGroup, isArchived)
            -- Update the member count for the PVC item
            updatePVCMembercount (db, title, cdeGroup, isArchived, group_member_count)
        end
    end
    llog.debug4("updateCloudPVCCount", "end", "", "")
end

-- Create PVCs during migration
function createMigrationPVCs(db, sql)
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local rows, message, code = stmt:rows()

    if rows then
        for row in rows do
            local cdeGroup = row.p_cdeGroup
            local title = row.p_titles_0_nominal
            local isArchived = row.p_isArchived
            local pvc_is_Archived_index = isArchived + 1

            llog.debug4("periodicals_virtual_collections.looking at", "", "title=%s", "", tostring(title))
            local group_member_count_downloaded = getCDEGroupItemCount (db, title, cdeGroup, isArchived)

            local pvcs = getPVCId (db, title, cdeGroup)
            if group_member_count_downloaded >= MIN_ITEM_FOR_PVC then
                local language,lastAccess = getLatestItemInfo(db, title, cdeGroup, isArchived)

                -- pvc does not exist and the group count is greater than MIN_ITEM_FOR_PVC, create pvc entry
                local isSearchable = ( isArchived == ARCHIVED_ITEM ) and 1 or ( pvcs[ARCHIVED_PVC_INDEX].uuid ~= INVALID_UUID and 0 or 1 )
                pvcs[pvc_is_Archived_index].uuid, pvcs[pvc_is_Archived_index].isLatestItem  = createPVC(db, title, cdeGroup, language, isArchived, group_member_count_downloaded,lastAccess, isSearchable)

                local displayTags, thumbnail,latestEditionCDEKey,publicationDate = getLatestEditionDisplayInfo(db, title, cdeGroup, isArchived)
                updateLatestEditionInfoForPVC(db, title, cdeGroup, isArchived, displayTags, thumbnail, latestEditionCDEKey, publicationDate)
            end

            -- populate the PVC id for all the items matching title/cdeGroup
            populatePVCInfo(db, getPVCState(pvcs[DOWNLOADED_PVC_INDEX].uuid, pvcs[ARCHIVED_PVC_INDEX].uuid), title, cdeGroup)

            -- Cloud PVC will be shown in search if both the PVCs exist
            if pvcs[ARCHIVED_PVC_INDEX].uuid ~= INVALID_UUID and pvcs[DOWNLOADED_PVC_INDEX].uuid ~= INVALID_UUID then
                if pvcs[ARCHIVED_PVC_INDEX].isLatestItem == 1 then
                    updatePVCSearchItem(db, title, cdeGroup, 0, DOWNLOADED_ITEM)
                else
                    updatePVCSearchItem(db, title, cdeGroup, 1, DOWNLOADED_ITEM)
                end
            end
        end
    end
    stmt:close()
end

-- migration case
function periodicals_virtual_collections.migrateToPvc(db, currentPVCVersion)
    llog.debug4("periodicals_virtual_collections.migration", "start with currentPVCVersion", "%d", "",currentPVCVersion)

    if currentPVCVersion == 0 then
        -- delete all PVC, incase if PVC is partially created
        deleteAllPVC(db);
        -- delete  PBI
        deletePBI(db)

        -- Query all PVC items
        local sql = "SELECT DISTINCT p_titles_0_nominal,p_isArchived,p_cdeGroup FROM Entries WHERE (p_cdetype = 'NWPR' or p_cdetype = 'MAGZ')"
        createMigrationPVCs(db, sql)
    else
        updateCloudPVCCount(db)
    end
    -- Create cloud PVCs for sideloaded periodicals
    local sql = "SELECT DISTINCT p_titles_0_nominal, " .. ARCHIVED_ITEM .. " as p_isArchived, '' as p_cdeGroup FROM Entries WHERE (p_cdetype = 'NWPR' or p_cdetype = 'MAGZ') and p_isArchived = " .. DOWNLOADED_ITEM .. " and p_contentState = 0 and p_titles_0_nominal not in (SELECT p_titles_0_nominal from Entries WHERE p_type = 'Entry:Item:PVC' and p_isArchived = " .. ARCHIVED_ITEM .. ")"
    createMigrationPVCs(db, sql)

    llog.debug4("periodicals_virtual_collections.migration", "end", "", "") 
end

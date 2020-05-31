-- series.lua

-- Copyright (c) 2017-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

-- This file contains code to handle updates to the Series and Series Items
require 'cc_db_util'

local make_binder = cc_db_util.make_binder

local modname = ...
local series = {}
_G[modname] = series

-- constants
local SEPARATOR = ","
local SINGLE_QUOTE = "'"
local TABLE_SERIES = "SERIES"
local ENTRY_TYPE_SERIES = 'Entry:Item:Series'
local BOOK_SAMPLE_CDETYPE = 'EBSP'

local MIN_ITEMS_FOR_SERIES = 2

local INVALID_UUID = -1
-- SERIES_GROUP  states
local NO_SERIES = 1
local DOWNLOADED_SERIES = 2
local ARCHIVED_SERIES = 3
local DOWNLOADED_ARCHIVED_SERIES = 4

local DOWNLOADED_ITEM = 0
local ARCHIVED_ITEM = 1

local SHOW_ITEM = 1
local HIDE_ITEM = 0
-- state denotes a single Downloaded item in a series
local SINGLE_SERIES_ITEM = 2
local PROCESSED = 1

-- Get the count of books under the given seriesId. Don't count sample books.
local function getSeriesItemsCount(db, seriesId, isArchived)
    llog.debug4("getSeriesItemsCount", "enter", "seriesId=%s isArchived=%s",  "", tostring(seriesId), tostring(isArchived))
    -- We are getting entries with unique CdeKey to avoid taking samples into account while counting
    local stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        SELECT count(DISTINCT p_cdeKey) as count from Entries WHERE p_isArchived = ? AND NOT p_cdeType = ? AND p_cdeKey IN
        (SELECT d_itemCdeKey from Series WHERE d_seriesId = ?)
    ]]))

    local ok, msg = cc_db_util.package_for_assert(stmt:bind(isArchived, BOOK_SAMPLE_CDETYPE, seriesId))

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

    llog.debug4("getSeriesItemsCount", "exit", "count=%s", "", tostring(count))
    return count
end

-- Get series state of the series with the given seriesId
local function getSeriesState(db, seriesId)
    llog.debug4("getSeriesState", "enter", "seriesId=%s", "", tostring(seriesId))
    local stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        SELECT p_seriesState from Entries WHERE p_cdeGroup = ? AND p_type = ?
    ]]))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(seriesId, ENTRY_TYPE_SERIES))

    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local row, msg, code = stmt:first_row()
    stmt:close()

    local series_state = NO_SERIES
    if row then
        series_state = row.p_seriesState
    end

    llog.debug4("getSeriesState", "exit", "series_state=%s", "", tostring(series_state))
    return series_state
end

-- Update the meta data (params) for the series matching the passed cdeGroup(seriesId)
local function updateSeriesMetaData(db, cdeGroup, cloud_items_count, downloaded_items_count, thumbnail, lastAccess, publicationDate)
    llog.debug4("updateSeriesMetaData", "enter", "cdeGroup=%s cloud_items_count=%s downloaded_items_count=%s thumbnail=%s lastAccess=%s  publicationDate=%s", "", tostring(cdeGroup), tostring(cloud_items_count), tostring(downloaded_items_count), tostring(thumbnail), tostring(lastAccess), tostring(publicationDate))
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare("UPDATE Entries SET p_memberCount  = ?, p_homeMemberCount = ?, p_thumbnail = ?, p_lastAccess = ?,  p_isProcessed = ?" .. (publicationDate and [[ , p_publicationDate = ]] .. publicationDate or '') .. "  WHERE p_cdeGroup = ? AND p_type = ?")))

    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(cloud_items_count, downloaded_items_count, thumbnail, lastAccess, PROCESSED, cdeGroup, ENTRY_TYPE_SERIES))

    if not ok then
        update_stmt:close()
        assert(ok,msg)
    end

    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("updateSeriesMetaData ", "exit", "cdeGroup=%s", "", tostring(cdeGroup))
end

-- Update the cloud items count for the series item matching the passed cdeGroup(seriesId)
local function updateCloudItemsCount(db, cdeGroup, items_count)
    llog.debug4("updateCloudItemsCount", "enter", "cdeGroup=%s items_count=%s", "", tostring(cdeGroup), tostring(items_count))
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        UPDATE Entries SET p_memberCount  = ? WHERE p_cdeGroup = ? AND p_type = ?
    ]]))

    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(items_count, cdeGroup, ENTRY_TYPE_SERIES))

    if not ok then
        update_stmt:close()
        assert(ok,msg)
    end

    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("updateCloudItemsCount ", "exit", "cdeGroup=%s", "", tostring(cdeGroup))
end

-- Update the downloaded items count for the series item matching the passed cdeGroup(seriesId)
local function updateDownloadedItemsCount(db, cdeGroup, items_count)
    llog.debug4("updateDownloadedItemsCount", "enter", "cdeGroup=%s items_count=%s", "", tostring(cdeGroup), tostring(items_count))
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        UPDATE Entries SET p_homeMemberCount  = ? WHERE p_cdeGroup = ? AND p_type = ?
    ]]))

    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(items_count, cdeGroup, ENTRY_TYPE_SERIES))

    if not ok then
        update_stmt:close()
        assert(ok,msg)
    end

    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("updateDownloadedItemsCount ", "exit", "cdeGroup=%s", "", tostring(cdeGroup))
end

-- Update the series state for the series item matching the passed cdeGroup value
local function updateSeriesState(db, cdeGroup, new_state)
    llog.debug4("updateSeriesState", "enter", "cdeGroup=%s new_state=%s", "", tostring(cdeGroup), tostring(new_state))
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        UPDATE Entries SET p_seriesState  = ? WHERE p_cdeGroup = ? AND p_type = ?
    ]]))

    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(new_state, cdeGroup, ENTRY_TYPE_SERIES))

    if not ok then
        update_stmt:close()
        assert(ok,msg)
    end

    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("updateSeriesState ", "exit", "cdeGroup=%s", "", tostring(cdeGroup))
end

-- Update the series state for the books matching the passed cdeKey(ASIN)
local function updateSeriesItemState(db, cdeKey, new_state, isArchived)
    llog.debug4("updateSeriesItemState", "enter", "cdeKey=%s new_state=%s", "", tostring(cdeKey), tostring(new_state))
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare([[
        UPDATE Entries SET p_seriesState  = ? WHERE p_cdeKey = ? ]] .. (isArchived and [[  AND p_isArchived = ]] .. isArchived or ''))))

    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(new_state, cdeKey))

    if not ok then
        update_stmt:close()
        assert(ok,msg)
    end

    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("updateSeriesItemState ", "exit", "cdeKey=%s", "", tostring(cdeKey))
end

-- converts the given input to string
local function stringify(input)
    return SINGLE_QUOTE .. input .. SINGLE_QUOTE
end

-- Get the cde key list of all items under the given seriesId
local function getSeriesItemsCDEKeysList(db, seriesId)
    llog.debug4("getSeriesItemsCDEKeysList", "enter", "seriesId=%s", "", tostring(seriesId))
    local stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        SELECT d_itemCdeKey as cdeKey from Series WHERE d_seriesId = ?
    ]]))

    local ok, msg = cc_db_util.package_for_assert(stmt:bind(seriesId))

    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local cdeKeysList = {}
    local rows, code, msg = stmt:rows()

    if rows then
        for row in rows do
            cdeKeysList[#cdeKeysList + 1] = stringify(row.cdeKey)
        end
    end

    stmt:close()
    -- Concat the list of cdekeys using comma separator
    cdeKeysList = table.concat(cdeKeysList, SEPARATOR)

    llog.debug4("getSeriesItemsCDEKeysList", "exit", "cdeKeysList=%s", "",  cdeKeysList)
    return cdeKeysList
end

-- Update the series state value for all items within under the given seriesId
local function updateSeriesItemsState(db, seriesId, new_item_state, seriesItemsCDEKeyList, isArchived)
    llog.debug4("updateSeriesItemsState", "enter", "seriesId=%s new_item_state=%s", "", tostring(seriesId), tostring(new_item_state))
    -- Update the series state for the books matching the passed seriesId value
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare ([[UPDATE Entries SET p_seriesState  = ? WHERE p_cdeKey IN (]]
    .. seriesItemsCDEKeyList ..
    (isArchived and [[ ) AND p_isArchived = ]] .. isArchived or ')'))))

    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(new_item_state))

    if not ok then
        update_stmt:close()
        assert(ok,msg)
    end

    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("updateSeriesItemsState ", "exit", "seriesId=%s", "", tostring(seriesId))
end

-- Get publicationDate of the latest item from seriesItemsCDEKeyList
local function getLatestEditionPublicationDate(db, seriesItemsCDEKeyList)
    llog.debug4("getLatestEditionPublicationDate", "enter", "", "")

     -- Get the latest item from the cdeKey list based on publicationDate and retrive its publicationDate
    local sql = "SELECT p_publicationDate as publicationDate FROM Entries WHERE ( p_cdeKey IN (" .. seriesItemsCDEKeyList .. " )) ORDER BY p_publicationDate DESC LIMIT 1"

    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind())
    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local row, msg, code = stmt:first_row()
    stmt:close()

    local publicationDate = nil

    if row then
        publicationDate  = row.publicationDate
    end

    llog.debug4("getLatestEditionPublicationDate", "exit", "publicationDate=%s", "",  tostring(publicationDate))

    return publicationDate
end

-- Get the most recently accessed item from seriesItemsCDEKeyList and retrive its last access time and thumbnail
local function getLatestItemInfo(db, seriesItemsCDEKeyList)
    llog.debug4("getLatestItemInfo", "enter", "",  "" )

    -- Retrive the most recently accessed item's last access time and thumbnail from the cdeKey list
    local sql = "SELECT p_lastAccess as lastAccess, p_thumbnail as thumbnail FROM Entries WHERE ( p_cdeKey IN (" .. seriesItemsCDEKeyList .. " )) ORDER BY p_lastAccess DESC LIMIT 1"

    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind())
    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local row, msg, code = stmt:first_row()
    stmt:close()

    local lastAccess = 0
    local thumbnail

    if row then
        lastAccess  = row.lastAccess
        thumbnail = row.thumbnail
    end

    llog.debug4("getLatestItemInfo", "exit", "lastAccess=%s  thumbnail=%s", "",  tostring(lastAccess), tostring(thumbnail))

    return thumbnail,lastAccess
end

-- Get last access time of a series
local function getLastAccessTimeForSeries(db, seriesId)
    llog.debug4("getLastAccessTimeForSeries", "enter", "seriesId=%s", "", tostring(seriesId))
    local stmt = assert(cc_db_util.package_for_assert(db:prepare [[
        SELECT p_lastAccess as lastAccess from Entries WHERE p_cdeGroup = ? AND p_type = ?
    ]]))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(seriesId, ENTRY_TYPE_SERIES))

    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local row, msg, code = stmt:first_row()
    stmt:close()

    local seriesLastAccess = 0
    if row then
        seriesLastAccess = row.lastAccess
    end

    llog.debug4("getLastAccessTimeForSeries", "exit", "seriesLastAccess=%s", "", tostring(seriesLastAccess))
    return seriesLastAccess
end

-- Get lastAccess, publicationDate and thumbnail of the latest item corresponding to the given seriesId 
local function getLatestItemInfoForSeries(db, seriesId, seriesItemsCDEKeyList, shouldUpdatePublicationDate)
    llog.debug4("getLatestItemInfoForSeries", "enter", "seriesId=%s", "", tostring(seriesId)) 

    -- Get thumbnail, lastAccess of the latest item present in itemCdeKeyList
    local thumbnail, lastAccess = getLatestItemInfo(db,seriesItemsCDEKeyList)
    local seriesLastAccess = getLastAccessTimeForSeries(db, seriesId)
    if seriesLastAccess > lastAccess then
        lastAccess = seriesLastAccess
    end
    local publicationDate = nil

    if shouldUpdatePublicationDate then
        -- Get publicationDate of the latest item present in itemCdeKeyList
        publicationDate = getLatestEditionPublicationDate(db,seriesItemsCDEKeyList)
    end
    llog.debug4("getLatestItemInfoForSeries", "exit", "seriesId=%s  thumbnail=%s  publicationDate=%s  lastAccess=%s", "",  tostring(seriesId), tostring(thumbnail), tostring(publicationDate), tostring(lastAccess))
    return thumbnail, lastAccess, publicationDate
end

-- Get the list of series Ids that have not yet been processed
local function getSeriesIdsToProcess(db)
    llog.debug4("getSeriesIdsToProcess", "enter", "", "")
    local stmt = assert(cc_db_util.package_for_assert(db:prepare ([[
        SELECT p_cdeGroup as seriesId from Entries WHERE p_isProcessed IS NOT ? AND p_type = ? ]]))) 

    local ok, msg = cc_db_util.package_for_assert(stmt:bind(PROCESSED, ENTRY_TYPE_SERIES))

    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local seriesIdsList = {}
    local rows, code, msg = stmt:rows()

    if rows then
        for row in rows do
            seriesIdsList[#seriesIdsList + 1] = row.seriesId
        end
    end

    stmt:close()
    llog.debug4("getSeriesIdsToProcess", "exit", "seriesIdsList=%s", "", table.concat(seriesIdsList, SEPARATOR))
    return seriesIdsList
end

-- Get the series id list of all items under the given cdeKey
local function getSeriesIdsList(db, cdeKey)
    llog.debug4("getSeriesIdsList", "enter", "cdeKey=%s", "", tostring(cdeKey))
    local stmt = assert(cc_db_util.package_for_assert(db:prepare ([[
        SELECT DISTINCT d_seriesId as seriesId from Series WHERE d_itemCdeKey = ? ]]))) 

    local ok, msg = cc_db_util.package_for_assert(stmt:bind(cdeKey))

    if not ok then
        stmt:close()
        assert(ok, msg)
    end

    local seriesIdsList = {}
    local rows, code, msg = stmt:rows()

    if rows then
        for row in rows do
            seriesIdsList[#seriesIdsList + 1] = row.seriesId
        end
    end

    stmt:close()
    llog.debug4("getSeriesIdsList", "exit", "seriesIdsList=%s", "", table.concat(seriesIdsList, SEPARATOR))
    return seriesIdsList
end

-- Update d_type column in Series table with value from p_type column in Entries table.
local function updateSeriesItemsType(db, seriesId)
    llog.debug4("updateSeriesItemsType", "enter", "seriesId=%s", "", tostring(seriesId))
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare([[ UPDATE Series SET d_itemType = (select p_type
        from Entries where Entries.p_cdeKey = d_itemCdeKey limit 1) WHERE d_seriesId = ? ]] )))

    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(seriesId))

    if not ok then
        update_stmt:close()
        assert(ok,msg)
    end

    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("updateSeriesItemsType", "exit", "seriesId=%s", "", tostring(seriesId))
end

-- Perform post processing updates for the series with the  given seriesId
local function postProcessSeries(db, seriesIdsList, shouldUpdatePublicationDate)
    llog.debug4("postProcessSeries", "enter", "", "")
    for _, seriesId in ipairs(seriesIdsList) do
        local seriesItemsCDEKeyList = getSeriesItemsCDEKeysList(db, seriesId)
        local cloudCount = getSeriesItemsCount(db, seriesId, ARCHIVED_ITEM)
        local downloadedCount = getSeriesItemsCount(db, seriesId, DOWNLOADED_ITEM)
        local thumbnail, lastAccess, publicationDate = getLatestItemInfoForSeries(db, seriesId, seriesItemsCDEKeyList, shouldUpdatePublicationDate)
        if cloudCount >= MIN_ITEMS_FOR_SERIES and downloadedCount >= MIN_ITEMS_FOR_SERIES then
            updateSeriesItemsState(db, seriesId, HIDE_ITEM, seriesItemsCDEKeyList)
        elseif cloudCount >= MIN_ITEMS_FOR_SERIES then
            updateSeriesItemsState(db, seriesId, HIDE_ITEM, seriesItemsCDEKeyList, ARCHIVED_ITEM)
            updateSeriesItemsState(db, seriesId, SINGLE_SERIES_ITEM, seriesItemsCDEKeyList, DOWNLOADED_ITEM)
        else
            updateSeriesItemsState(db, seriesId, SHOW_ITEM, seriesItemsCDEKeyList)
        end
        updateSeriesMetaData(db, seriesId, cloudCount, downloadedCount, thumbnail, lastAccess, publicationDate)
        updateSeriesItemsType(db, seriesId)
    end
    llog.debug4("postProcessSeries", "exit", "", "")
end

-- Update the series state and count to enforce proper grouping operation after updates like
-- downloading, deletion or cloud deletion
function series.refreshSeriesInfo(db, cdeKey, shouldUpdatePublicationDate)
    llog.debug4("series.refreshSeriesInfo", "enter", "cdeKey=%s", "", tostring(cdeKey))
    local seriesIdsList = getSeriesIdsList(db, cdeKey)
    postProcessSeries(db, seriesIdsList, shouldUpdatePublicationDate)
    llog.debug4("series.refreshSeriesInfo", "exit", "cdeKey=%s", "", tostring(cdeKey))
end

-- Update the series group's Info which contains the given cdeKey
function series.updateSeriesInfo(db, cdeKey)
    llog.debug4("series.updateSeriesInfo", "enter", "cdeKey=%s", "", tostring(cdeKey))
    local seriesIds = {}
    -- Get thumbnail, lastAccess of the item belongs to given cdeKey
    local thumbnail, lastAccess = getLatestItemInfo(db,stringify(cdeKey))

    -- Get the list of series Ids to which the given cdeKey belongs to
    local seriesIdsList = getSeriesIdsList(db, cdeKey)
    for _, seriesId in ipairs(seriesIdsList) do
        seriesIds[#seriesIds + 1] = stringify(seriesId)
    end
    seriesIds = table.concat(seriesIds, SEPARATOR)

    -- update the series with latest thumbnail and lastAccess
    local sql = "UPDATE Entries set p_thumbnail = ? , p_lastAccess = ? WHERE p_cdeGroup IN (".. seriesIds .. ") AND p_type = ?"
    local update_stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local ok, msg = cc_db_util.package_for_assert(update_stmt:bind(thumbnail, lastAccess, ENTRY_TYPE_SERIES))

    if not ok then
        update_stmt:close()
        assert(ok,msg)
    end

    local ok, msg = cc_db_util.package_for_assert(update_stmt:exec())
    update_stmt:close()
    assert(ok, msg)

    llog.debug4("series.updateSeriesInfo", "exit", "cdeKey=%s seriesIds=%s", "", tostring(cdeKey), tostring(seriesIds))
end

-- Delete all entries from the series table that have the given seriesId
local function deleteSeriesMapping(db, seriesId)
    llog.debug4("deleteSeriesMapping", "enter", "seriesId=%s", "", tostring(seriesId))
    local stmt = assert(cc_db_util.package_for_assert(db:prepare ([[DELETE FROM Series]] .. (seriesId and [[ WHERE d_seriesId = ? ]] or ''))))

    if seriesId ~= nil then
        local ok, msg = cc_db_util.package_for_assert(stmt:bind(seriesId))
        if not ok then
            stmt.close()
            assert(ok, msg)
        end
    end

    local ok, msg = cc_db_util.package_for_assert(stmt:exec())
    stmt:close()
    assert(ok, msg)

    llog.debug4("deleteSeriesMapping", "exit", "seriesId=%s", "", tostring(seriesId))
end

-- Update the seriesId's corresponding Items' states and Delete Existing Mappings
function series.prepareForSeriesUpdate(db, seriesId)
    llog.debug4("series.prepareForSeriesUpdate", "enter", "seriesId=%s", "", tostring(seriesId))
    local seriesItemsCDEKeyList = getSeriesItemsCDEKeysList(db, seriesId)
    updateSeriesItemsState(db, seriesId, SHOW_ITEM, seriesItemsCDEKeyList)
    deleteSeriesMapping(db, seriesId)
    llog.debug4("series.prepareForSeriesUpdate", "exit", "seriesId=%s", "", tostring(seriesId))
end

-- Make all Downloaded Entries visible
local function showAllDownloadedEntries(db)
    llog.debug4("showAllDownloadedEntries", "enter", "", "")
    local stmt = assert(cc_db_util.package_for_assert(db:prepare [[UPDATE ENTRIES SET p_seriesState = ? WHERE p_isArchived = ? ]]))
    local ok, msg = cc_db_util.package_for_assert(stmt:bind(SHOW_ITEM, DOWNLOADED_ITEM))
    if not ok then
        stmt.close()
        assert(ok, msg)
    end

    local ok, msg = cc_db_util.package_for_assert(stmt:exec())
    stmt:close()
    assert(ok, msg)

    llog.debug4("showAllDownloadedEntries", "enter", "", "")
end

-- Make all Downloaded Entries visible and delete all Existing Series Mappings
function series.cleanUpSeries(db)
    llog.debug4("series.cleanUpSeries", "enter", "", "" )
    showAllDownloadedEntries(db)
    deleteSeriesMapping(db)
    llog.debug4("series.cleanUpSeries", "exit", "", "" )
end

-- Series related post processing trigger
function series.triggerPostProcessing(db)
    local seriesIdsList = getSeriesIdsToProcess(db)
    postProcessSeries(db, seriesIdsList, true)
end

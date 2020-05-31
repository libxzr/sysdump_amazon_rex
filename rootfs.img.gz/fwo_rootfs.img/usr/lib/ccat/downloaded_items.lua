-- downloaded_items.lua

-- Copyright (c) 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

-- This file contains code to handle changes to the Downloaded Items
-- collection.

require 'cc_db_util'

local modname = ...
local downloaded_items = {}
_G[modname] = downloaded_items

-- This function deletes all downloaded items of specific or all type from
-- the Content Catalog.
--
-- @param db Database which to perform operations.
-- @param itemType Type of the items to be removed, nil for all item type.
function downloaded_items.delete_all_downloaded_items_item (db, itemType)
    llog.debug4("downloaded_items.delete_all_downloaded_items_item", "enter", "itemType=%s", "", tostring(itemType))

    local sql = "DELETE FROM Entries WHERE p_isArchived = 0"

    if itemType ~= nil then
        sql = sql .. [[ AND p_type IN (]] .. itemType .. [[)]]
    else
        sql = sql .. [[ AND p_type != 'Entry:Item:HDC' ]]
    end

    assert(cc_db_util.package_for_assert(db:exec(sql)))

    llog.debug4("downloaded_items.delete_all_downloaded_items_item", "exit", "", "")
end

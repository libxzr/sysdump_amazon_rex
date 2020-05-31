-- home_dictionary_collection.lua

-- Copyright (c) 2011 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

-- This file contains code to handle changes to the Home Dictionary
-- virtual collection (HDC).  Changes to the collection's isVisibleInHome
-- and virtualCollectionCount occur when a dictionary is added or deleted.
-- The isVisibleInHome field is set to true when there is at least one
-- dictionary on the device. The virtualCollectionCount is set to the
-- number of dictionaries found on the device.

require 'cc_db_util'

local modname = ...
local home_dictionary_collection = {}
_G[modname] = home_dictionary_collection


-- This function sets the isVisibleInHome and virtualCollectionCount columns on the
-- HDC item. The isVisibleInHome field is set to true when there is at least one
-- dictionary on the device. The virtualCollectionCount is set to the number of
-- dictionaries found on the device.
function home_dictionary_collection.update_hdc_item (db)
    llog.debug4("home_dictionary_collection.update_hdc_item", "enter", "", "")
    
    local count = 0
    local sql = "SELECT COUNT(*) AS count FROM Entries WHERE p_type = 'Entry:Item:Dictionary' AND p_isArchived = 0 AND p_isVisibleInHome = 1"

    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    local row, message, code = stmt:first_row()
    stmt:close()
    
    if row then
        count = row.count
    else
        if code and code ~= 0 then
            llog.error("home_dictionary_collection.update_hdc_item", "error", "%s", "", sql)
            assert(cc_db_util.package_for_assert(nil, message, code))
        end    
    end
    llog.debug4("home_dictionary_collection.update_hdc_item", "count", "hdc_count=%d", "", count)
    
    local is_visible = 0
    if count > 0 then 
        is_visible = 1
    end

    sql = [[UPDATE Entries SET p_virtualCollectionCount = ]] .. count .. [[, p_isVisibleInHome = ]] .. is_visible .. [[ WHERE p_type = 'Entry:Item:HDC']]
    assert(cc_db_util.package_for_assert(db:exec(sql)))
    llog.debug4("home_dictionary_collection.update_hdc_item", "exit", "hdc_count=%d:is_visible_in_home=%d", "", count, is_visible)
end


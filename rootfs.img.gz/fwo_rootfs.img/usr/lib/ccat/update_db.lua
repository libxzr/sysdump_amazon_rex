-- update_db.lua
--
-- Copyright (c) 2013 Amazon.com, Inc. or its affiliates. All Rights Reserved.
--
-- PROPRIETARY/CONFIDENTIAL
--
-- Use is subject to license terms.

local modname = ...
local update_db = {}
_G[modname] = update_db

require 'sqlite3'
require 'llog'

package.path = package.path .. ";/usr/lib/ccat/?.lua"

require 'cc_db_util'
require 'sql_functions'

-- read database table version, possibly creating bookkeeping tables if they do
-- not exist
-- @param db - data base handle
local function read_db_table_versions(db)
    -- Get current database version, and do bare-minimum bootstrap if no
    -- database is there
    local update_version_number
    local ok = pcall(function()
        local version_stmt = assert(db:prepare[[select x_version from BACKFILLING]])
        local version_rows = assert(version_stmt:rows(nil, true))
        for row in version_rows do
            update_version_number = row.x_version
        end
    end)
    if not ok then
        llog.info("update_db", "newdb", "backfilling", "Initializing new DB.")

        cc_db_util.exec_sql(db,
                [[
                    CREATE TABLE BACKFILLING
                    (
                        x_version
                    )
                ]])
        cc_db_util.exec_sql(db,[[INSERT INTO BACKFILLING VALUES(0)]])
        update_version_number = 0
    end
    return update_version_number
end

-- Updates db, called for the first time after migration. 
-- Updates database by executing update commands from sqls
-- @param config containing db path and sqls.
function update_db.update_or_backfill_db(update_config)
    local start_time = os.clock()
    local db = update_config.db
    install_icu_collator(db)
    local lipc_event_sent = false

    -- Parse the SQL schema file to create the content catalog database.
    local max_update_version_number = read_db_table_versions(db)
    local sql_blocks = read_sqls(update_config)

    -- Execute necessary actions
    for _, block in ipairs(sql_blocks) do
        llog.info("update_db", "upgrade_db","old_version:%d","",block.start_version)
        if block['type'] == "Execute" then
            if max_update_version_number == block.start_version then
                max_update_version_number = block.end_version
                llog.info("update_db", "upgrade_db", "oldver=%d, newer=%d",
                    "Updating table", block.start_version, max_update_version_number)
                -- Set prop to kaf to indicate that framework start may be delayed due to updating cc.db
                if lipc_event_sent == false then
                    llog.info("update_db", "set_delay_framework_start_prop", "", "")
                    lipc_event_sent = lipc_set_int_property("com.lab126.kaf", "delayFrameworkStart", 1)
                end
                cc_db_util.exec_sql(db,table.concat(block, "\n"))
                cc_db_util.exec_sql(db,[[UPDATE BACKFILLING SET x_version = :version]],
                         {version = max_update_version_number })
            end
        end
    end

    local end_time = os.clock()
    local elapsed_time = end_time - start_time
    llog.info("update_db", "upgrade_db", "total_elapsed_time=%f", "", elapsed_time)
end

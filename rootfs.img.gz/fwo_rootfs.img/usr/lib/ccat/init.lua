-- init.lua
--
-- Copyright (c) 2010-2014 Amazon.com, Inc. or its affiliates. All Rights Reserved.
--
-- PROPRIETARY/CONFIDENTIAL
--
-- Use is subject to license terms.

require 'sqlite3'
require 'llog'
require 'devcap'
package.path = package.path .. ";/usr/lib/ccat/?.lua"
require 'cc_db_util'
require 'sql_functions'
require 'update_db'

-- get the type of DB, SQLS path being initialized
local db_path, sqls_path = ...

-- Constants. This points the index declared in ccat-internal.h
local cc_db_type = 0
local dcm_db_type = 1

-- get the configuration, if it was passed in as a script parameter
local cc_config = nil
local db_type = 0

local finished = function() end
if not cc_config then
    if tostring(db_path) == tostring(cc_db_path) then
        db_type = cc_db_type
    else
        db_type = dcm_db_type
    end
    
    llog.info("init", "DB initalization", "db_path=%s sqls_path=%s db_type=%d", "", 
        tostring(db_path), tostring(sqls_path), tonumber(db_type))

    cc_config = { db   = assert(cc_db_util.package_for_assert(sqlite3.open(db_path))),
                  sqls = io.lines(sqls_path) }
    finished = function() cc_config.db:close() end
end

local db = cc_config.db
local is_low_ram_device = devcap.islowramdevice()
if is_low_ram_device == true then
    assert(cc_db_util.package_for_assert(db:exec[[PRAGMA cache_size = 100]]))
end
local start_time = os.time()
local ok, msg = pcall(function()
                          return cc_db_util.upgrade_db(db, cc_config, db_type, db_type == cc_db_type)
                       end)
assert(ok, msg)

if db_type == 0 then
    cc_config.sqls = io.lines("/usr/share/cc/cc.update.sqls")
    local ok,msg = pcall(function()
                              return update_db.update_or_backfill_db(cc_config)
                         end)
end
local end_time = os.time()
finished()
llog.info("init", "init_db", "total_elapsed_time=%d", "", end_time - start_time)

assert(ok, msg)

-- vim:set tw=90 sw=4 et: --

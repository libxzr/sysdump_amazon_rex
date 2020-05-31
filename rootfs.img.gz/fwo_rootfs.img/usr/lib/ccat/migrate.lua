-- migrate.lua
-- Copyright (c) 2012-2014 Amazon.com, Inc. or its affiliates.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

require 'sqlite3'
require 'llog'
package.path = package.path .. ";/usr/lib/ccat/?.lua"
require 'cc_db_util'
require 'sql_functions'

--get the configuration , if it was passed in as a script parameter
local migration_config = ...

local finished = function() end

-- if configuration is not passed correctly, initialize it with local values.
if not migration_config or not migration_config.db then
    migration_config = { db   = assert(cc_db_util.package_for_assert(sqlite3.open("/var/cc-migrated.db"))),
    sqls = io.lines("/usr/share/cc/migrate.sqls") }
    finished = function() migration_config.db:close() end
end

local function do_migration()
    assert(cc_db_util.package_for_assert(migration_config.db:exec[[PRAGMA legacy_file_format=OFF]]))
    install_icu_collator(migration_config.db)
    -- Install the user functions in SQLite.
    assert(install_user_db_functions(migration_config.db), cc_db_util.package_error(500, "cannot add functions"))
    
    local sql_blocks = read_sqls(migration_config)
     -- Execute necessary actions
    for _, block in ipairs(sql_blocks) do
        if block['type'] == "Create" then
            llog.info("Migration", "newtbl", "table=%s", "Creating Table", block.table)
            cc_db_util.exec_sql(migration_config.db, table.concat(block, "\n"))
        elseif block['type'] == "CreateInterface" then
            llog.info("Migration", "aatDB", "", "Creating Table Interface")
            cc_db_util.exec_createInterfacesql(migration_config.db, table.concat(block, "\n"))
        elseif block['type'] == "Insert" then
            llog.info("Migration", "attDB", "", "Inserting rows")
            cc_db_util.exec_sql(migration_config.db, table.concat(block, "\n"))
        elseif block['type'] == "Attach" then
            llog.info("Migration", "attDB", "", "Attaching DB")
            cc_db_util.exec_sql(migration_config.db, table.concat(block, "\n"))
        end
    end
   llog.info("Migration", "do_migration", "", "** Migration Done **")
end

local ok , msg = pcall(function()
                       return do_migration()
                   end)
finished()
if not ok then
assert(false,msg)
end
-- vim:set tw=90 sw=4 et: --

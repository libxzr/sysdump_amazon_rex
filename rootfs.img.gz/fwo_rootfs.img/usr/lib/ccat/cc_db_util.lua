-- Copyright (c) 2010-2017 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

local modname = ...
local cc_db_util = {}
_G[modname] = cc_db_util

require 'llog'
json = require 'cjson'

----- SQL Binder class -------------------------------------------------------------------
--
-- Used for automagically naming and tracking SQL bind variables.
--
-- Simply create a binder:
--
-- binder = make_binder()
--
-- Then use it to bind values into SQL instead of directly embedding them:
--
-- sql = [[ SELECT * FROM table WHERE column = ]] .. binder.bind(search_value)
--
-- Then prepare the statement, bind the values, and run:
--
-- stmt = db:prepare(sql)
-- stmt:bind(binder.bind_vars)
-- stmt:rows()
local Binder = { __index = { } }

function Binder.__index:bind(val)
    local name = "n" .. self.n
    self.n = self.n + 1
    self.bind_vars[name] = val
    return ":" .. name
end

function Binder.__index:bind_list(list)
    local names = { }
    for _, v in ipairs(list) do
        names[#names + 1] = self:bind(v)
    end
    return table.concat(names, ",")
end

function cc_db_util.make_binder()
    local b = { n = 1, bind_vars = { } }
    setmetatable(b, Binder)
    return b
end

-- Contstants
local dcm_db_type = 1
local dcm_update_event_value = 3

--[[
These are int codes return by SQLite3.  They have been taken from sqlite3.c
#define SQLITE_OK           0   /* Successful result */

-- This block of errors is a transient error in SQLite3.  They should be retried.
#define SQLITE_BUSY         5   /* The database file is locked */
#define SQLITE_LOCKED       6   /* A table in the database is locked */
#define SQLITE_NOMEM        7   /* A malloc() failed */
#define SQLITE_INTERRUPT    9   /* Operation terminated by sqlite3_interrupt()*/
#define SQLITE_IOERR       10   /* Some kind of disk I/O error occurred */

-- This block of errors is a user / client error.  They should be corrected on the client.
#define SQLITE_ERROR        1   /* SQL error or missing database */
#define SQLITE_ABORT        4   /* Callback routine requested an abort */
#define SQLITE_TOOBIG      18   /* String or BLOB exceeds size limit */
#define SQLITE_CONSTRAINT  19   /* Abort due to constraint violation */
#define SQLITE_MISMATCH    20   /* Data type mismatch */
#define SQLITE_MISUSE      21   /* Library used incorrectly */
#define SQLITE_NOLFS       22   /* Uses OS features not supported on host */
#define SQLITE_AUTH        23   /* Authorization denied */
#define SQLITE_RANGE       25   /* 2nd parameter to sqlite3_bind out of range */

-- This block of errors is a critical / fatal error in cc.db.  It should be recreated.
#define SQLITE_INTERNAL     2   /* Internal logic error in SQLite */
#define SQLITE_PERM         3   /* Access permission denied */
#define SQLITE_READONLY     8   /* Attempt to write a readonly database */
#define SQLITE_CORRUPT     11   /* The database disk image is malformed */
#define SQLITE_NOTFOUND    12   /* NOT USED. Table or record not found */
#define SQLITE_FULL        13   /* Insertion failed because database is full */
#define SQLITE_CANTOPEN    14   /* Unable to open the database file */
#define SQLITE_PROTOCOL    15   /* NOT USED. Database lock protocol error */
#define SQLITE_EMPTY       16   /* Database is empty */
#define SQLITE_SCHEMA      17   /* The database schema changed */
#define SQLITE_FORMAT      24   /* Auxiliary database format error */
#define SQLITE_NOTADB      26   /* File opened that is not a database file */
--]]


function cc_db_util.get_http_status_code(sqlite_error)
    if sqlite_error == 0 then
        return 200
    elseif sqlite_error == 5 or sqlite_error == 6 or sqlite_error == 7 or sqlite_error == 9 or sqlite_error == 10 then
        return 503  -- this is a transient error and should be retried.
    elseif sqlite_error == 1 or sqlite_error == 4 or sqlite_error == 18 or sqlite_error == 19 or sqlite_error == 20 or sqlite_error == 21 or sqlite_error == 22 or sqlite_error == 23 or sqlite_error == 25 then
        return 400  -- this is a user / client error and should not be retried without modification.
    else
        return 502  -- this is a fatal server error which needs cc.db to be recreated.
    end 
end

function cc_db_util.get_http_status_message(sqlite_error)
    local http_status_code = cc_db_util.get_http_status_code(sqlite_error)
    if http_status_code == 200 then
        return "200 OK"
    elseif http_status_code == 503 then
        return "503 Transient Server Error"  -- this is a transient error and should be retried.
    elseif http_status_code == 400 then
        return "400 Client Error"  -- this is a user / client error and should not be retried without modification.
    else
        return "502 Fatal Server Error"  -- this is a fatal server error which needs cc.db to be recreated.
    end 
end


-- This method packages the SQLite3 code, message, and corresponding http
-- status code as a JSON string for assert().
function cc_db_util.package_for_assert(result, sqlite3_msg, sqlite3_code)
    if sqlite3_msg and sqlite3_msg:find("no such table:") then
        sqlite3_code = 2
    end
    local ret_table = {
        sqlite3_msg = sqlite3_msg or "",
        sqlite3_code = sqlite3_code or 0,
        http_status_code = cc_db_util.get_http_status_code(sqlite3_code or 0)
    }
        
    local ret_string = json.encode(ret_table)
    if not result then
        llog.error("sql_error", "", "error=%s", "", ret_string)
    end

    return result, ret_string
end

-- return a jsn object with an http error code and optional error string
function cc_db_util.package_error( http_error, error_msg )
    local ret_table = {
        message = error_msg or "",
        http_status_code = http_error
    }
        
    return json.encode(ret_table)
end

-- Begain a transaction, rolling back for failure.
function cc_db_util.begin(db)
    local ok, ret_value, ret_code = db:exec[[BEGIN TRANSACTION]]

    if not ok then
	db:exec[[ROLLBACK]]
	return cc_db_util.package_for_assert( ok, ret_value, ret_code )
    end

    return ok
end

-- Commit a transaction, rolling back for failure.
function cc_db_util.commit(db)
    local ok, ret_value, ret_code = db:exec[[COMMIT]]

    if not ok then
	db:exec[[ROLLBACK]]
	return cc_db_util.package_for_assert( ok, ret_value, ret_code )
    end

    return ok
end

-- Utility function to execute a create interface sql statement
-- @param db - data base handle
-- @param sql - sql statement
function cc_db_util.exec_createInterfacesql(db, sql)
    local row_result, msg, code = db:first_row(sql)
    if row_result == nil and code and code ~= 0 then
        assert(cc_db_util.package_for_assert(false, msg, code))
    end
    cc_db_util.exec_sql(db, row_result.sql)

end

-- Utility function to execute a sql statement
-- @param db - data base handle
-- @param sql - sql statement
-- @param bind_var - list of bind variables
function cc_db_util.exec_sql(db,sql,bind_vars)
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    if bind_vars then
    local ok,msg = cc_db_util.package_for_assert(stmt:bind(bind_vars))
        if not ok then
            stmt:close()
            assert(ok,msg)
        end
    end

    local ok,msg = cc_db_util.package_for_assert(stmt:exec())
    if not ok then
        stmt:close()
        assert(ok,msg)
    end
    stmt:close()
end

-- Utility function to execute a sql statement and return the first row
-- @param db - data base handle
-- @param sql - sql statement
-- @param bind_var - list of bind variables
function cc_db_util.select_first_row(db,sql,bind_vars)
    local stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
    if bind_vars then
        local ok,msg = cc_db_util.package_for_assert(stmt:bind(bind_vars))
        if not ok then
            stmt:close()
            assert(ok,msg)
        end
    end

    local row, message, code = stmt:first_row()

    stmt:close()
    
    if row then
        return row
    end
    if code and code ~= 0 then
        assert(cc_db_util.package_for_assert(row, message, code))
    end
    return nil
end


-- read database table version, possibly creating bookkeeping tables if they do
-- not exist
-- @param db - data base handle
local function read_db_table_versions(db)
    -- Get current database version, and do bare-minimum bootstrap if no
    -- database is there
    local new_db = true
    local tables = {}
    pcall(function()
        local version_stmt = assert(db:prepare[[select x_table, x_version from Versions]])
        local version_rows = assert(version_stmt:rows(nil, true))
        new_db = false -- if we got here, then we have a Versions table.
        for row in version_rows do
            tables[row.x_table] = row.x_version
        end
        version_stmt:close()
    end)

    if new_db then
        llog.info("init", "newdb", "", "Initializing new DB.")

        cc_db_util.exec_sql(db,
                [[
                    CREATE TABLE Versions
                    (
                        x_table PRIMARY KEY NOT NULL UNIQUE,
                        x_version
                    )
                ]])
        cc_db_util.exec_sql(db,[[DROP TABLE IF EXISTS DBOK]])
    end


    -- Create DBOK table, if it's missing
    cc_db_util.exec_sql(db,
            [[
                CREATE TABLE IF NOT EXISTS DBOK
                (
                    x_ok

                        PRIMARY KEY
                        NOT NULL
                        UNIQUE
                        CHECK (x_ok = 1)
                        CHECK (typeof(x_ok) = "integer")
                )
            ]])

    return tables, new_db
end

-- Scan the sqls file, find actions
-- @param config - db congfiguration. Collection of db and sql scripts.
function read_sqls(config)
    local sql_blocks = {}
    local current_block = {}

    -- Note: comment block at the beginning of the file is ignored; that's why
    -- we don't add current_block to sql_blocks at the start
    for line in config.sqls do
        line = line:gsub("^%s+","")
        line, is_directive = line:gsub("^%-%-%#%#", "", 1)
        if is_directive == 1 then

            -- Directive lines start new blocks
            current_block = {}

            -- Gather :-separated elements from the directive line
            local elements = {}
            for field in line:gmatch("[^:]+") do
                elements[#elements + 1] = field:gsub(" +$", ""):gsub("^ +", "")
            end

            -- Depending on the type, put everything together
            current_block['type'] = elements[1]
            if elements[1] == "Create" then
                current_block.table   = elements[2]
                current_block.version = tonumber(elements[3])
                sql_blocks[#sql_blocks + 1] = current_block

            elseif elements[1] == "Update" then
                current_block.table         = elements[2]
                current_block.start_version = tonumber(elements[3])
                current_block.end_version   = tonumber(elements[4])
                if elements[5] == "metadata" then
                    current_block.metadata = elements[6]
                end
                sql_blocks[#sql_blocks + 1] = current_block

            elseif elements[1] == "Attach" then
                sql_blocks[#sql_blocks + 1] = current_block
            elseif elements[1] == "CreateInterface" then
                current_block.table   = elements[2]
                current_block.version = tonumber(elements[3])
                sql_blocks[#sql_blocks + 1] = current_block
            elseif elements[1] == "Insert" then
                sql_blocks[#sql_blocks + 1] = current_block
            elseif elements[1] == "Execute" then
                current_block.start_version = tonumber(elements[2])
                current_block.end_version   = tonumber(elements[3])
                sql_blocks[#sql_blocks + 1] = current_block
            else
                assert(false, cc_db_util.package_error(500, string.format(
                                  "unrecognized directive type %s, line: %s",
                                  elements[1],
                                  line)))
            end

        elseif line ~= nil and line ~= "" then
            current_block[#current_block + 1] = line
        end
    end

    return sql_blocks
end



-- Update database.  This will be called via pcall so that we can do db:close()
-- @param db - data base handle
-- @param config - db congfiguration. Collection of db and sql scripts.
-- @param db_type - Type of db being updated
-- @param notifyUpdate to send a dbchanged notification
function cc_db_util.upgrade_db(db, config, db_type, notifyUpdate)
    install_icu_collator(db)

    -- Install the user functions in SQLite.
    assert(install_user_db_functions(db), cc_db_util.package_error(500, "cannot add functions"))

    -- Parse the SQL schema file to create the content catalog database.
    local tables, new_db = read_db_table_versions(db)
    local sql_blocks = read_sqls(config)

    -- Mark database as bad while we create/update it
    cc_db_util.exec_sql(db,[[DELETE FROM DBOK]])

    --Will be set to true if any changes are made to the database
    local is_db_changed = false
    -- Used to check if frameworkDelay property has been set
    local lipc_event_sent = false

    --Will be set to true if CreateInterface command is executed to the table.
    -- Table Name -> isSchemaChanged (true/false)
    local schemaChangedMap = {}

    local max_table_versions = {}
    local metadata = ""
    -- Execute necessary actions
    for _, block in ipairs(sql_blocks) do

        if block['type'] == "Create" then

            if not max_table_versions[block.table]
                or max_table_versions[block.table] < block.version then
                max_table_versions[block.table] = block.version
            end

            if tables[block.table] == nil then
                llog.info("init", "newtbl", "table=%s, version=%d",
                          "Creating table",
                          block.table,
                          block.version)

                is_db_changed = true

                cc_db_util.exec_sql(db,table.concat(block, "\n"))

                cc_db_util.exec_sql(db,[[INSERT INTO Versions (x_table, x_version)
                                         VALUES (:table, :version)]],
                         { table   = block.table,

                           version = block.version })

                tables[block.table] = block.version
            end

        elseif block['type'] == "Update" then

            if not max_table_versions[block.table]
                or max_table_versions[block.table] < block.end_version then
                max_table_versions[block.table] = block.end_version
            end

            if tables[block.table] == block.start_version then
                llog.info("init", "updtbl", "table=%s, oldver=%d, newer=%d",
                          "Updating table",
                          block.table,
                          block.start_version,
                          block.end_version)

                -- We should not honor update, if we already ran CreateInterface command.
                if schemaChangedMap[block.table] ~= true then
                    is_db_changed = true
                    -- Set prop to kaf to indicate that framework start may be delayed due to updating cc.db
                    if lipc_event_sent == false then
                        llog.info("upgrade_db", "set_delay_framework_start_prop", "", "")
                        lipc_event_sent = lipc_set_int_property("com.lab126.kaf", "delayFrameworkStart", 1)
                    end
                    if #block > 0 then
                        cc_db_util.exec_sql(db,table.concat(block, "\n"))
                    end
                    if block.metadata then
                        metadata = metadata .. ":" .. tostring(block.metadata)
                    end
                end

                cc_db_util.exec_sql(db,[[UPDATE Versions SET x_version = :version
                                           WHERE x_table = :table]],
                         { table   = block.table,
                           version = block.end_version })

                tables[block.table] = block.end_version
            end

        elseif block['type'] == "CreateInterface" then
            if not max_table_versions[block.table]
                or max_table_versions[block.table] < block.version then
                max_table_versions[block.table] = block.version
            end

            if tables[block.table] == block.start_version then
                llog.info("init", "CreateInterface","table=%s, version=%d",
                    "table create interface",
                    block.table,
                    block.version)

                is_db_changed = true
                cc_db_util.exec_createInterfacesql(db, table.concat(block, "\n"))

                cc_db_util.exec_sql(db,[[INSERT INTO Versions (x_table, x_version)
                                         VALUES (:table, :version)]],
                         { table   = block.table,
                           version = block.version })

                tables[block.table] = block.version
                schemaChangedMap[block.table] = true		
            end

        elseif block['type'] == "Insert" then
            llog.info("init", "insert","","Insert values")
            cc_db_util.exec_sql(db,table.concat(block, "\n"))

        elseif block['type'] == "Attach" then
            llog.info("init", "atttbl","","attaching db")
            cc_db_util.exec_sql(db,table.concat(block, "\n"))
        end

    end


    -- Make sure all of our tables are at the latest version
    local have_lagging_tables = false
    for table, version in pairs(max_table_versions) do
        if tables[table] < version then
            llog.error("init", "oodtbl", "table=%s, version=%d, expected=%d",
                       "Table not up-to-date",
                       table,
                       tables[table],
                       max_table_versions[table])
            have_lagging_tables = true
        end
    end
    assert(not have_lagging_tables, cc_db_util.package_error(500, "not-up-to-date tables detected"))

    --Notify that the db has been changed
    if is_db_changed and db_changed and notifyUpdate then
        if tonumber(db_type) == dcm_db_type then  
        	db_changed(dcm_update_event_value, metadata)
        else
        	db_changed(new_db, metadata)
        end
    end

    -- Mark database as OK
    assert(cc_db_util.package_for_assert(db:exec[[INSERT INTO DBOK (x_ok) VALUES (1)]]))
end
-- vim:set columns=95 tw=90 sw=4: --

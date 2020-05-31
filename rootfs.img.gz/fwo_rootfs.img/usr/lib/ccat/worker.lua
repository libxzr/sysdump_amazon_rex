-- worker.lua
--
-- Copyright (c) 2010-2014 Amazon.com, Inc. or its affiliates. All rights reserved.
--
-- PROPRIETARY/CONFIDENTIAL
--
-- Use is subject to license terms.

require 'sqlite3'
require 'llog'
require 'devcap'

package.path = package.path .. ";/usr/lib/ccat/?.lua"

require 'cc_db_util'
require 'query'
require 'change'
require 'collectionJournal'
require 'sql_functions'
require 'dcm'

local cc_config = nil
local db = nil
local dcm_db = nil

function open_db_connection()
    if not cc_config then
        cc_config = { db = assert(cc_db_util.package_for_assert(sqlite3.open("/var/local/cc.db"))) ,
                      dcm_db = assert(cc_db_util.package_for_assert(sqlite3.open("/var/local/dcm.db"))) }
    end
    db = cc_config.db

    db:set_busy_timeout(60000)

    dcm_db = cc_config.dcm_db
    dcm_db:set_busy_timeout(60000)

    local is_low_ram_device = devcap.islowramdevice()
    if is_low_ram_device == true then
        assert(cc_db_util.package_for_assert(db:exec[[PRAGMA cache_size = 100]]))
    end

    install_icu_collator(db)
    query.set_db(db)
    change.set_db(db)
    collectionJournal.set_db(db)
    dcm.set_db(dcm_db)
    
    -- Install the user functions in SQLite.
    assert(install_user_db_functions(db), cc_db_util.package_error(500, "Can't assign db functions"))
end

open_db_connection()

-- Install the user functions in SQLite.
assert(install_user_db_functions(db))

_G["process_/query"] = query.query
_G["process_/change"] = change.change
_G["process_/collectionJournal"] = collectionJournal.collectionJournal


function close_db_connection()
    db:close()
    db = nil
    cc_config = nil

    dcm_db:close()
    dcm_db = nil
end

----- Finalizer --------------------------------------------------------------------------
--
-- so we don't leak SQLite connections

function finalize()
    close_db_connection()
end

-- vim:set tw=90 sw=4 et: --

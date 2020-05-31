-- collectionJournal.lua
--
-- Copyright (c) 2011 Amazon Technologies, Inc.  All rights reserved.
--
-- PROPRIETARY/CONFIDENTIAL
--
-- Use is subject to license terms.

require 'cc_string_util'
require 'cc_db_util'
require 'llog'

local modname = ...
local collectionJournal = {}
_G[modname] = collectionJournal

-- Database connection
local db_connection

-- Sets the local database
function collectionJournal.set_db(db_)
    db_connection = db_
end


----- SQL Constructors ------------------------------------------------------------------

--
-- Returns a JSON response object, containing an array of journaled collection entries
-- from from_date to to_date for a give page index with the maximum number of results.
--
-- Sample request JSON:
-- {
--     "type":"query",
--     "startIndex":0,
--     "maxResults":10,
--     "from":"1296125334",
--     "to":"1301096495"
-- }
--
-- Sample response JSON, including all possible journal entries:
-- {
--     "ok":true,
--     "type":"query",
--     "resultSetSize":5,
--     "journal":[
--         {"action":"add","collectionName":"newCollection","collectionLanguage":"en-US","time":1296189667},
--         {"action":"addEntry","collectionName":"newCollection","collectionLanguage":"en-US","content":{
--             "cdeKey":"key","cdeType":"type"
--         },"time":1296189667},
--         {"action":"removeEntry","collectionName":"newCollection","collectionLanguage":"en-US","content":{
--             "cdeKey":"key","cdeType":"type"
--         },"time":1296189667},
--         {"action":"rename","collectionName":"newCollection","collectionLanguage":"en-US",
--             "newCollectionName","testCollection","newCollectionLanguage":"en-US","time":1296189667},
--         {"action":"delete","collectionName":"testCollection","collectionLanguage":"en-US","time":1296189667},
--     ]
-- }
--
-- @param db
--         Database connection
-- @param start_index
--         Results page index.
-- @param max_results
--         Maximum number of results to return.
-- @param from_date
--         Query for journal entries including or after this time, in seconds
--         since the epoch.
-- @param to_date
--         Query for journal entries including or before this time, in seconds
--         since the epoch.
-- @return boolean, table; Whether the request was successful, and the response
--         JSON.
--
local function process_query_request(db, start_index, max_results, from_date, to_date)
    -- PLEASE NOTE:
    -- LIMIT/OFFSET pagination is used here with the knowledge that it is sub-optimal
    -- since we do not expected to have a large number of rows in the table. Even if this
    -- was the case, we can still safely ignore this, since it is expected to only be
    -- called on a background thread.
    local sql = 
        [[ SELECT
               j_event
           FROM CollectionsJournal
           WHERE
               i_event_time BETWEEN
                       IFNULL(:from_date, "0")
                   AND IFNULL(:to_date, STRFTIME('%s','NOW'))
           ORDER BY i_event_time ASC
           LIMIT :max_results
           OFFSET :start_index
        ]]

    local stmt
    local function t()
        stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
        assert(cc_db_util.package_for_assert(stmt:bind({
            from_date=from_date,
            to_date=to_date,
            max_results=max_results,
            start_index=start_index
        })))

        return assert(cc_db_util.package_for_assert(stmt:rows()))
    end
    local ok, results = pcall(t)

    local function close()
        if stmt then
            stmt:close()
        end
    end
    
    local result = {
        ok = ok,
        type = "query",
        resultSetSize = 0
    }

    if not ok then
        close()
        llog.info("collectionJournal", "process_query_request_failed", "",
            "No results returned")

        return false, result
    end


    local list = { }
    for row in results do
        list[#list + 1] = json.decode(row.j_event)
    end

    close()

    result.journal = list
    result.resultSetSize = #list

    return true, result
end


--
-- Delete all collections journal entries from from_date to to_date, returning whether
-- the request was successful. Success will be returned even if no rows are deleted from
-- the database.
--
-- Sample request JSON:
-- {
--     "type":"delete",
--     "from":"1296125334",
--     "to":"1296189668"
-- }
--
-- Sample response JSON:
-- {
--     "ok":true,
--     "type":"delete"
-- }
--
-- @param db
--         Database connection
-- @param start_index
--         Ignored.
-- @param max_results
--         Ignored.
-- @param from_date
--         Delete journal entries including or after this time, in seconds
--         since the epoch.
-- @param to_date
--         Delete journal entries including or before this time, in seconds
--         since the epoch.
-- @return boolean, table; Whether the request was successful, and the response
--         JSON.
--
local function process_delete_request(db, start_index, max_results, from_date, to_date)
    local sql = 
        [[ DELETE
           FROM CollectionsJournal
           WHERE
               i_event_time BETWEEN
                       IFNULL(:from_date, "0")
                   AND IFNULL(:to_date, STRFTIME('%s','NOW'))
        ]]

    local stmt
    local function t()
        stmt = assert(cc_db_util.package_for_assert(db:prepare(sql)))
        assert(cc_db_util.package_for_assert(stmt:bind({
            from_date=from_date,
            to_date=to_date
        })))

        assert(cc_db_util.package_for_assert(stmt:exec()))
    end
    local ok, msg = pcall(t)

    local function close()
        if stmt then
            stmt:close()
        end
    end

    close()

    if not ok then
        llog.info("collectionJournal", "process_delete_request_failed", "",
            "Nothing to delete")
        return ok, msg
    end

    local result = {
        ok = ok,
        type = "delete"
    }

    return ok, result
end


-- Request type to SQL constructor list.
local request_types = {
    query = process_query_request,
    delete = process_delete_request,
}

-- Processes the request based on the "type" JSON key.
local function process_request(request_spec)
    local request_type = request_spec.type
    if not request_types[request_type] then
        llog.info("collectionJournal", "process_request_failed", "requestType=%s",
            "Unknown request type", tostring(request_type))
        return false, { ok = false, type = request_type }
    end

    return assert(request_types[request_type](db_connection, request_spec.startIndex,
            request_spec.maxResults, request_spec.from, request_spec.to))
end


-----------------------------------------------------------------------------------------
-- Main entry point for this file: take post_data, decode it, send it to the SQL
-- generators, run the resulting SQL statements, and assemble a reply.
-----------------------------------------------------------------------------------------
function collectionJournal.collectionJournal(post_data, profile_data)
    llog.debug5("collectionJournal", "request", "request=%s profile_data=%s", "", post_data, profile_data)

    local request_spec = json.decode(post_data)
    local ok, result = process_request(request_spec)

    llog.debug5("collectionJournal", "response", "response=%s", "", json.encode(result))

    if ok then
        return "200 OK", json.encode(result) .. "\n"
    else
        return "500 Server Error", json.encode(result) .. "\n"
    end
end

-- vim:set tw=90 sw=4 et: --

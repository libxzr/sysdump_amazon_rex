-- content_state.lua

-- Copyright (c) 2013-2018 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

-- This file contains code to update the content_state field of DB.

require 'cc_db_util'

local modname = ...
local content_state = {}
_G[modname] = content_state

-- For a given CDE key and type, update the contentState of a downloaded item.
--
-- @param cdeKey CDE key.
-- @param cdeType CDE type.
function content_state.update_content_state ( db, cdeKey, cdeType )

    if cdeKey == nil or cdeType == nil then
        llog.debug4("content_state.update_content_state", "exit", "cdekey_or_cdetype_is_nil", "")
        return
    end

    llog.debug4("content_state.update_content_state", "enter", "", "")
    local contentState = 0
    local archivedEntry = 0
    local notArchivedEntry = 0
    local sql_query = [[SELECT distinct p_isArchived FROM Entries WHERE
                                   p_cdeKey = "]] .. cdeKey .. [["
                               AND p_cdeType = "]] .. cdeType .. [["]]
    for row in db:rows(sql_query) do
        if row.p_isArchived == 1 then
            archivedEntry = 1
        elseif row.p_isArchived == 0 then
            notArchivedEntry = 1
        end
    end
    if notArchivedEntry == 1 then
        if archivedEntry == 1 then
            contentState = 1
        end
        local sql = [[ UPDATE Entries SET
                           p_contentState = ]] .. contentState .. [[
                       WHERE
                               p_cdeKey = "]] .. cdeKey .. [["
                           AND p_cdeType = "]] .. cdeType .. [["
                           AND p_isArchived = 0
                    ]]

        assert(cc_db_util.package_for_assert(db:exec(sql)))
        if contentState == 1 then
            send_content_state_updated_event(cdeKey,cdeType)
        end
    end
    llog.debug4("content_state.update_content_state", "exit", "", "")
end

-- Clear the content state of all the items in CC.db
--
-- @param cdeKey CDE key.
-- @param cdeType CDE type.
function content_state.clear_content_state_for_all (db)
    llog.debug4("content_state.clear_content_state_for_all", "enter", "", "")

    local sql = [[ UPDATE Entries SET
                       p_contentState = 0
                ]]

    assert(cc_db_util.package_for_assert(db:exec(sql)))
    llog.debug4("content_state.clear_content_state_for_all", "exit", "", "")
end

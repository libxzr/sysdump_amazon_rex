-- Copyright (c) 2010 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

require 'llog_c'

local modname = ...
local llog = {}
_G[modname] = llog

local LLOG_FACILITY = llog_c.LLOG_FACILITY
local LLOG_MSG_ID   = llog_c.LLOG_MSG_ID
local LLOG_LEVEL    = llog_c.LLOG_LEVEL
local SYSLOG        = llog_c.SYSLOG


local function log(syslog_level, llog_level, llog_msg_id, addTimestamp, subcomp,
                   msg_id, args, msg, ...)
    
    -- validate log level before format call
    if (llog_c.check_log_level(llog_level)) then
        local format = llog_msg_id .. " " .. subcomp .. ":" .. msg_id .. ":" .. args .. ":" .. msg
        local ok, string = pcall(string.format, format, ...)
                       
        if ok then
            llog_c.log(syslog_level, llog_level, string, addTimestamp)
        else
            llog_c.log(SYSLOG.ERR, LLOG_LEVEL.ERROR,
                       string.format([[E luallog:fmterr:fmt=\"%s\":bad formatting attempt]], format), false)
        end
    end
end

function llog.init(...) llog_c.init(...); end

function llog.event(...)  log(SYSLOG.INFO + LLOG_FACILITY.EVENTS, LLOG_LEVEL.EVENT, LLOG_MSG_ID.EVENT, false, ...); end
function llog.crit(...)   log(SYSLOG.EMERG,   LLOG_LEVEL.CRIT,   LLOG_MSG_ID.CRIT, false, ...);  end
function llog.error(...)  log(SYSLOG.ERR,     LLOG_LEVEL.ERROR,  LLOG_MSG_ID.ERR, false, ...);   end
function llog.warn(...)   log(SYSLOG.WARNING, LLOG_LEVEL.WARN,   LLOG_MSG_ID.WARN, false, ...);  end
function llog.info(...)   log(SYSLOG.NOTICE,  LLOG_LEVEL.INFO,   LLOG_MSG_ID.INFO, false, ...);  end
function llog.perf(...)   log(SYSLOG.DEBUG,   LLOG_LEVEL.PERF,   LLOG_MSG_ID.PERF, false, ...);  end
function llog.debug(...)  log(SYSLOG.DEBUG,   LLOG_LEVEL.DEBUG0, LLOG_MSG_ID.DEBUG, false, ...); end
function llog.debug0(...) log(SYSLOG.DEBUG,   LLOG_LEVEL.DEBUG0, LLOG_MSG_ID.DEBUG, false, ...); end
function llog.debug1(...) log(SYSLOG.DEBUG,   LLOG_LEVEL.DEBUG1, LLOG_MSG_ID.DEBUG, false, ...); end
function llog.debug2(...) log(SYSLOG.DEBUG,   LLOG_LEVEL.DEBUG2, LLOG_MSG_ID.DEBUG, false, ...); end
function llog.debug3(...) log(SYSLOG.DEBUG,   LLOG_LEVEL.DEBUG3, LLOG_MSG_ID.DEBUG, false, ...); end
function llog.debug4(...) log(SYSLOG.DEBUG,   LLOG_LEVEL.DEBUG4, LLOG_MSG_ID.DEBUG, false, ...); end
function llog.debug5(...) log(SYSLOG.DEBUG,   LLOG_LEVEL.DEBUG5, LLOG_MSG_ID.DEBUG, false, ...); end
function llog.debug6(...) log(SYSLOG.DEBUG,   LLOG_LEVEL.DEBUG6, LLOG_MSG_ID.DEBUG, false, ...); end
function llog.debug7(...) log(SYSLOG.DEBUG,   LLOG_LEVEL.DEBUG7, LLOG_MSG_ID.DEBUG, false, ...); end
function llog.debug8(...) log(SYSLOG.DEBUG,   LLOG_LEVEL.DEBUG8, LLOG_MSG_ID.DEBUG, false, ...); end
function llog.debug9(...) log(SYSLOG.DEBUG,   LLOG_LEVEL.DEBUG9, LLOG_MSG_ID.DEBUG, false, ...); end
function llog.timestamp(...) log(SYSLOG.DEBUG,   LLOG_LEVEL.PERF, LLOG_MSG_ID.PERF, true, ...); end

-- Copyright (c) 2012 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

require ("llog")

-- Llog does not make a copy of component name,
-- so it's made global to prevent its deallocation by Lua
g_log_component = "winmgr"
llog.init(g_log_component, "")

-- log at debug private
function log_debug_private(s, ...)
    llog.debug9("lua", "dbg", "", s, ...)
end

-- log at debug low
function log_debug_low(s, ...)
    llog.debug2("lua", "dbg", "", s, ...)
end

-- log at debug middle
function log(s, ...)
    llog.debug1("lua", "dbg", "", s, ...)
end

-- log at debug high
function log_debug_high(s, ...)
    llog.debug0("lua", "dbg", "", s, ...)
end

-- log
function log_info(s, ...)
    llog.info("lua", "window_manager", "", s, ...)
end

-- Copyright (c) 2011 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

-- concat up strings and log
function logStrings(sTable)
    
    if sTable == nil then
        return nil
    end
--[[
NOTE if number of strings were large it would be more efficient
to concat the table something like

function listvalues(s)
    local t = { }
    for k,v in pairs(s)
        t[#t+1] = tostring(v)
    end
    return table.concat(t,"\n")
end

]]--

    local s = ""
    for k,v in ipairs(sTable) do 
        s = s .. tostring(v)
    end

    llog.debug("lua", "dbg", "", s)

    return s
end

--[[ 
Recursive table printout for dev
]]--
function print_table_contents(tableName, table, formatPrePend)
    formatPrePend = formatPrePend or ""

    llog.debug("lua", "table", "", formatPrePend .. "+++printing table : " .. tostring(tableName))
    for k,v in pairs(table) do 
        if type(v) == "table" then
            print_table_contents(k, v, formatPrePend .. "  ")
        else
            llog.debug("lua", "table", "", formatPrePend .. "  " .. tostring(k) .. " " .. tostring(v)) 
        end
    end
    llog.debug("lua", "table", "", formatPrePend .. "---printing table : " .. tostring(tableName))
end

--[[
Handle caught error, log error and stack trace
]]--
function logErrorAndStackTrace(errorString, stackTrim)
    -- avoid any recursive errors by wrapping this with pcall
    pcall(function()
        llog.warn("WindowManager", "Exception", "", errorString)
        
        -- log each line of trace separately
        -- skip over the stack leading from the error to 
        -- this call
        local fullTrace = debug.traceback()
        local depth = 0
        for traceLine in stringSplit(fullTrace, '\n') do
            if depth > stackTrim then
                llog.warn("WindowManager", "StackTrace", "", traceLine)
            end
            
            depth = depth + 1
        end
    end)
end

--[[
logs a timestamp
@param tag tag to go with timestamp
]]--
function logTimeStamp(tag, ...)
    -- assume all timestamp logs are perfScenario. 
    -- May need to go back and create separate calls here
    llog.timestamp("lua", "perfScenario", "", tag, ...)
end



-- Copyright (c) 2010-2018 Amazon.com, Inc. or its affiliates.  All Rights Reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

----- Some utility functions -------------------------------------------------------------

local modname = ...
local cc_string_util = {}
_G[modname] = cc_string_util

local b = string.byte
local ba, bz, bA, bZ = b('a'), b('z'), b('A'), b('Z')
local b0, b9, b_     = b('0'), b('9'), b('_')

-- is_ascii_alnum(str) verifies that all characters in str are from the set A-Za-z0-9_
function cc_string_util.is_ascii_alnum(str)
    for i = 1, #str do
        local v = b(str, i)
        if (v < ba or bz < v) and (v < bA or bZ < v)
            and (v < b0 or b9 < v) and (v ~= b_)
        then
            return false
        end
    end
    return true
end

local function uri_unescape(fragment)
    local rv = { }

    local idx = 0
    while idx < fragment:len() do
        local next_escape = fragment:find("%%", idx)
        if next_escape then
            rv[#rv + 1] = fragment:sub(idx, next_escape - 1)
            rv[#rv + 1] = string.char(tonumber(fragment:sub(next_escape + 1, next_escape + 2), 16))
            idx = next_escape + 3
        else
            rv[#rv + 1] = fragment:sub(idx)
            idx = fragment:len()
        end
    end

    return table.concat(rv)
end

function cc_string_util.uri_to_path(uri)
    local rv = { }
    local file_prefix = "file://"

    if not uri or uri:sub(1, file_prefix:len()) ~= file_prefix then
        return nil
    end

    local path_start = file_prefix:len() + 1
    local path_end = uri:find("[%#%?]", idx) or -1
    local path = uri:sub(path_start, path_end)
    path = path:gsub("+"," ")

    return uri_unescape(path)
end

function cc_string_util.uri_to_title(uri)
    if not uri then
        return ""
    end

    local name_start = -(uri:reverse():find("/") or uri:reverse():find(":") or 0) + 1
    local name_end = -(uri:reverse():find("%.") or 0) - 1
    if name_end < name_start then
        name_end = -1
    end

    return uri_unescape(uri:sub(name_start, name_end))
end

function cc_string_util.is_file_path(path)
    if not path then
        return false
    end
    
    local path_string = tostring(path)
    if path_string:len() == 0 then
        return false
    end
    if path_string:sub(1,1) == "/" then
        return true
    end
end

-- Helper function to get lua_nil if obj is nil
function cc_string_util.getObj(obj)
    if not obj then
	obj = "lua_nil"
    end
    return obj
end

-- Dump a given object
function cc_string_util.dump(o)
    if type(o) == 'table' then
        local s = '{ '
        for k,v in pairs(o) do
            if type(k) ~= 'number' then k = '"'..k..'"' end
            s = s .. '['..k..'] = ' .. cc_string_util.dump(v) .. ','
        end
        return s .. '} ' 
    else    
        return tostring(o)
    end
end

-- Return the largest in the text string passed.
function cc_string_util.get_largest_word(text)
    if(text == nil or text == "") then
        return text
    end
    local largest_word = ""
    for word in string.gmatch(text, "%S+") do
        if(#word > #largest_word) then
            largest_word = word
        end
    end
    return largest_word
end

-- vim:set tw=95 sw=4: --

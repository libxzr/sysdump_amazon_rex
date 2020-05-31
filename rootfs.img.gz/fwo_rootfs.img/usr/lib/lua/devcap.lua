-- devcap.lua
--
-- Copyright (c) 2014 Amazon.com, Inc. or its affiliates. All Rights Reserved.
--
-- PROPRIETARY/CONFIDENTIAL
--
-- Use is subject to license terms.

require 'devcap_lua'
local modname = ...
local devcap = {}
_G[modname] = devcap 

-- Wrapper function for calling devcap_is_available
function devcap.isavailable(feature,property)
   return devcap_lua.devcap_is_available(feature, property)
end

-- Wrapper function for calling devcap_get_int
function devcap.getint(feature, property)
   return devcap_lua.devcap_get_int(feature, property)
end

-- Wrapper function for calling devcap_get_string
function devcap.getstring(feature, property)
    return devcap_lua.devcap_get_string(feature, property)
end

-- Wrapper function for calling is_low_ram_device 
function devcap.islowramdevice()
    return devcap_lua.is_low_ram_device()
end

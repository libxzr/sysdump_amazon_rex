-- Copyright (c) 2015-2018 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.
require 'lab126_logging'

local json = require("json")

-- Maintain if ASR is enabled or not 
local s_isASREnabled = false;
local currentActiveAppTtile = "";

local propertyASRMode
local propertyGetActiveAppTitle

-- Helper function to set the current active app title
function setActiveAppTitle(value)
    currentActiveAppTtile = value
    -- setting the updated property value
    propertyGetActiveAppTitle.value = currentActiveAppTtile
end

-- Register lipc events for ASR
function asr_subscribe_events()
    subscribeLipcEvent("com.lab126.asr", "ASRState", function(publ, event, data)
         if (data[1] == "started") then
             s_isASREnabled =  true
             propertyASRMode.value = 1
         elseif (data[1] == "stopped") then
             s_isASREnabled = false
             propertyASRMode.value = 0
         end
    end)
end


--[[
--Registers lipc properties for ASR
]]-- 
function registerAsrProperties()
    propertyVisibleWindows = registerLipcStringProp("visibleWindows", "w")
    propertyVisibleWindows.listener= function (name, value)
            logTimeStamp("GetAllWindows listener begin")
            local prop = {}
            local index = 1
            for param in stringSplit(value, ":") do
                prop[index] = param
                index = index + 1
            end
            setLipcStringProp(prop[1], prop[2], getVisibleWindowsJson())
	    logTimeStamp("GetAllWindows listener end")
        end
    propertyGetAllWindows = registerLipcStringProp("getAllWindows", "w")
    propertyGetAllWindows.listener= function (name, value)
        local prop = {}
        local index = 1
        for param in stringSplit(value, ":") do
            prop[index] = param
            index = index + 1
        end
        winTab = {}
        i = 1
        for k, v in pairs(getAllWindows()) do
            winTab[i] = { name = v.c.name, layer = v.params.L, x = v.geometry.x, y = v.geometry.y, width = v.geometry.width, height=v.geometry.height, id = v.params.ID, windowId = v.c:getWindowId() }
            i=i+1
        end
        setLipcStringProp(prop[1], prop[2], json.encode(winTab))
    end

    propertyGetActiveAppTitle = registerLipcStringProp("getActiveAppTitle", "r")
    propertyGetActiveAppTitle.value = currentActiveAppTtile

    --Expose a property in winmgr to indicate winmgr is up for ASR upstart node
    propertyWinmgrReady = registerLipcIntProp("winmgrReady", "r")
    propertyWinmgrReady.value = 1
    
    --Expose ASR mode on lipc.
    propertyASRMode = registerLipcIntProp("ASRMode", "rw")
    propertyASRMode.value = 0
    propertyASRMode.listener = function (name, value)
	propertyASRMode.value = value
	if value == 0 then 
	    s_isASREnabled = false
        else 
	    s_isASREnabled = true
        end
    end

    llog.info("Emitting winmgr_ready event", "", "", "")
    local emitEvent = execAndGrabResult("initctl emit --no-wait winmgr_ready")
    sendLipcEvent("winmgrState", {"started"})
end

-- Returns if ASR is enabled or not
function isASRMode()
    return s_isASREnabled
end

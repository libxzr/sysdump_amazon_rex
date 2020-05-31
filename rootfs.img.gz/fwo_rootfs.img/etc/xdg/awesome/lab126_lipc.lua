-- Copyright (c) 2013-2018 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.


require("awful")
require("awful.rules")

require("liblipclua")

local lipcH = nil

--[[
set lipc string property/value to pub
]]--
function setLipcStringProp(pub, prop, value)
    if lipcH then
        lipcH:set_string_property(pub, prop, value)
    end
end

--[[
set lipc Integer property/value to pub
]]--
function setLipcIntProp(pub, prop, value)
    if lipcH then
        lipcH:set_int_property(pub, prop, value)
    end
end

--[[
get lipc Integer property
]]--
function getLipcIntProp(pub, prop)
    local returnVal = -1
    if lipcH then
        returnVal, errMsg, errNum = lipcH:get_int_property(pub, prop)
    end
    return returnVal
end

--[[
get lipc String property
]]--
function getLipcStringProp(pub,prop)
    local returnVal = ""
    if lipcH then
        returnVal, errMsg, errNum = lipcH:get_string_property(pub,prop)
    end
    return returnVal
end

--[[
send lipc event
]]--
function sendLipcEvent(event, values)
    if lipcH then
        lipcH:send_event(event, values)
    end
end

--[[
subcribe to lipc event
]]--
function subscribeLipcEvent(eventSrc, eventName, callBack)
    if lipcH then
        local status = lipcH:subscribe(eventSrc, eventName, callBack)
        if 0 ~= status then
            log("=failed to subscribe to event")
        end
    end
end

--[[
register lipc string property
]]--
function registerLipcStringProp(prop, permission)
    if lipcH then
        return lipcH:register_string_property(prop, permission)
    end
end

--[[
register lipc Integer property
]]--
function registerLipcIntProp(prop, permission)
    if lipcH then
        return lipcH:register_int_property(prop, permission)
    end
end

--[[
initializes lipc interface and all of the lipc properties.
]]--
function initLipcInterface()
    local errNum, errMsg
    -- create lipc interface
    lipcH, errNum, errMsg = lipc.init("com.lab126.winmgr")
    if not lipcH then
        log ("!!!!!!!!!!!failed to init lipc " .. tostring(errNum) .. ", " .. errMsg)
        return
    else
        lipc.set_error_handler(function(error)logErrorAndStackTrace(error, 5) end)
    end

    -- register properties
    registerScreensaverLipcProperties()
    registerAsrProperties()
    registerOrientationProperties()
    chrome_register_properties()
    ligl_register_properties()
    registerGripSuppressionProperties()
    preference_register_properties()
    registerDebugInfo()
    registerEatTapModeProperties()

    -- subscribe events
    dialog_events_setup()
    ligl_subscribe_events()
    asr_subscribe_events()
    subscribeAccelerometerEvents()
end


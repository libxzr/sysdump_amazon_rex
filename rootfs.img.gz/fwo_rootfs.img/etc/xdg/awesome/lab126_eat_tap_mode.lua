-- Copyright (c) 2018 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.
require 'lab126_logging'

local propertyEatTapMode
local s_InEatTapMode = false

-- Generate fake tap
-- Example lipc commond lipc-set-prop com.lab126.winmgr fakeTap -s "1:48:33:1"
function fakeTap(name, value)
    if not isASRMode() and not s_InEatTapMode then
        llog.info("Not in ASR mode or Eat all tap mode, Hence blocking fake taps", "", "", "")
        return
    end

    -- Parse the parameters and get the button tap information
    local params = {}
    local index = 1
    for param in stringSplit(value, ":") do
        params[index] = tonumber(param)
        index = index + 1
    end

    local buttonNumber = params[1]
    local x = params[2]
    local y = params[3]
    local isPress = params[4]
    local c = client.get_client_at(x, y)
    if not c then
        log("no client found x=%d y=%d",x,y)
    end

    log ("fake Tap:  buttonNumber=%d, x=%d , y=%d,  isPress=%d", buttonNumber, x, y, isPress)
    -- check with window manager whether this tap has to be handled
    c.signalHandled = false
    if buttonNumber == 1 then
        if isPress then
            handleClientButton0Press(c)
            handleClientButton1Press(c, true)
        else
            handleClientButton0Release(c)
            handleClientButton1Release(c)
        end
    end

    if c.signalHandled == false then
        c:sendButtonEvent(buttonNumber, x, y, isPress)
    else
        log ("not sending because handled by windowmanager")
    end
end

-- Generate fake keyEvent
-- Example lipc commond lipc-set-prop com.lab126.winmgr fakeKeyEvent -s "windowId:keyType:keyCode:state"
function fakeKeyEvent(name, value)
    if not isASRMode() then
        llog.info("Not in ASR mode, Hence blocking fake keyevents", "", "", "")
	return
    end

    -- Parse the parameters and get the keyEvent information
    local params = {}
    local index = 1
    for param in stringSplit(value, ":") do
        params[index] = tonumber(param)
        index = index + 1
    end

    local windowId = params[1]
    local keyType  = params[2]
    local keycode  = params[3]
    local state    = params[4]
    local c = client.get_client_by_windowId(windowId)
    if not c then
        log("no client found for windowId = %d", windowId)
        return
    end

    log ("fake keyEvent:  windowId=%d, keyType=%d , keyCode=%d,  state=%d", windowId, keyType, keycode, state)
    c:sendKeyEvent(keyType, keycode, state);
end

--[[
--Registers lipc properties for eat all tap mode
]]--
function registerEatTapModeProperties()
    local propertyFakeTap
    propertyEatTapMode = registerLipcIntProp("eatTapMode", "w")
    propertyEatTapMode.listener = function (name, value)
        propertyEatTapMode.value = value
        if value == 0 then
            s_InEatTapMode = false
        else
            s_InEatTapMode = true
        end
    end
    propertyFakeTap = registerLipcStringProp("fakeTap", "w")
    propertyFakeTap.listener = fakeTap
    propertyFakeTap = registerLipcStringProp("fakeKeyEvent", "w")
    propertyFakeTap.listener = fakeKeyEvent
end

--[[
--Returns true if all the taps to be eaten else returns false
]]--
function isInEatAllTapMode()
    return s_InEatTapMode
end

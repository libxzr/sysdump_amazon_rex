-- Copyright (c) 2013-2015 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

--- Wispher touch handling routines

require ("llog")

local TOP_INDEX = 1 
local whisperTouchWindows = {}

--- Current Fsr state.
local s_isFsrEnabled = nil
local s_isPreviousButtonEnabled = nil
local s_isNextButtonEnabled = nil
local s_wtKeyUpClient = nil
local s_isKeyPadFeatureAvailable = execAndGrabResult("devcap-get-feature -a button.keypad")
local s_isFsrFeatureAvailable    = execAndGrabResult("devcap-get-feature -i button keypad.fsr")
local s_isKeypadInverted         = execAndGrabResult("devcap-get-feature -a button.keypad.inverted")
local s_isGlobalSettingFsrEnabled = nil

local PAGE_UP   = 112
local PAGE_DOWN = 117

local UP  = 'U'
local RIGHT  = 'R'

local invertedKeyCode = {
    [PAGE_UP] = PAGE_DOWN,
    [PAGE_DOWN] = PAGE_UP
}

-- returns if key pad feature is available or not
local function isKeypadAvailable()
    return s_isKeyPadFeatureAvailable == "1"
end 

-- retruns if the FSR feature is available or not
local function isFsrAvailable()
    return s_isFsrFeatureAvailable == "1" 
end 

-- returns if the inverted keypad feature is available or not
local function isInvertedKeypadAvailable()
    return s_isKeypadInverted == "1"
end 


local function getKeyCode(orientation, keyCode)
   local resultKeyCode = keyCode
   if ( getCurrentOrientation() == UP or  getCurrentOrientation() == RIGHT ) and 
      isInvertedKeypadAvailable() then
          llog.info("Inverting the page turns. currentOrientation=%s", "", "", "", tostring(getCurrentOrientation()))
          resultKeyCode = invertedKeyCode[keyCode]
   end
  
   -- Invert the keycode if Inverted config is set
   if getPropertyFromPreference("key") == "Inverted" then
       llog.info("Inverting the page turns as per user config. currentOrientation=%s", "", "", "", tostring(getCurrentOrientation()))
       resultKeyCode =  invertedKeyCode[resultKeyCode]
   end 

   return resultKeyCode
end

-- Make sure the correct whisper touch window
-- is on top of the stack
local function processWhisperTouchStack()
  for k, v in ipairs(whisperTouchWindows) do
        if not v.c:is_obscured() then
            -- If the client is already on the top 
            -- of the stack then dont do anything
            if k ~= TOP_INDEX then
                table.remove(whisperTouchWindows, k)
                table.insert(whisperTouchWindows, TOP_INDEX, v)
            end
            break
        end
    end
end

--[[
remove whisperTouch window from stack
@params c client to remove
]]--
local function deleteWTWindow(window)
    if not window then
        return
    end

    for k, v in ipairs(whisperTouchWindows) do
        if v == window then
            table.remove(whisperTouchWindows, k)
            -- if the removed window is on top of the stack 
            -- then reprocess the stack
            if  k == TOP_INDEX then
                processWhisperTouchStack()
            end
            break
        end
    end
end


--[[
insert whisper touch window into stack
@params window to insert
]]--
local function insertWTWindow(window)
    if not window or not window.params.WT then
        return
    end

    -- Remove the client if its in stack
    deleteWTWindow(window)
    table.insert(whisperTouchWindows, TOP_INDEX, window)

    processWhisperTouchStack()
end

-- get current Toplevel whisperTouch window
local function getTopMostWtWindow()
    return whisperTouchWindows[TOP_INDEX]
end

-- prints out whisper touch  stack for debugging
function dumpWTStack()
    local idx = TOP_INDEX
    for k, v in ipairs(whisperTouchWindows) do
        log("whisperTouch client (idx=%d), %s", idx, v.c.name)
        idx = idx + 1
    end
end

-- Handle whisper touch key up events
function handleWhisperTouchRelease(c, keyType, keyCode, state)
    -- as we dont use replay pointer always block release keys we get to 
    -- make sure we send to the same client as press
    c.signalHandled = true
    if s_wtKeyUpClient and windowTableFindByClient(s_wtKeyUpClient) then
        llog.info("WindowManager", "handleWhisperTouchRelease", "sending wt release to " .. tostring(s_wtKeyUpClient.name), "")
        -- validate c is still there 
	if isASRMode() then
            sendLipcEvent("KeyEvent", { s_wtKeyUpClient:getWindowId(), keyType, getKeyCode(getCurrentOrientation(), keyCode), state })
        else 
            s_wtKeyUpClient:sendKeyEvent(keyType, getKeyCode(getCurrentOrientation(), keyCode), state);
        end
        s_wtKeyUpClient = nil
    end
end


-- Handle whisper touch key down events
function handleWhisperTouchPress(c, keyType, keyCode, state)
    -- default to handled case
    c.signalHandled = true
    s_wtKeyUpClient = nil
    
    if isKeypadAvailable() and 
       (not isFsrAvailable()  or s_isFsrEnabled)then
        if liglIsTapsBlocked() then
            llog.info("WindowManager", "whisperTocuhButton Handled By WinMgr", "reason=screenPaused", "")
            return
        end
      
        if getTopMostWtWindow() then

            --signal that the user has touched the screen
            ligl_signal_user_action()
 
            -- Send key event to whisper touch supported application window 
            if not getTopMostWtWindow().c:is_obscured() then

                -- Focus the client
                setFocusedClient(getTopMostWtWindow().c)

                -- send key event
                if isASRMode() then
                    sendLipcEvent("KeyEvent", { getTopMostWtWindow().c:getWindowId(), keyType, getKeyCode(getCurrentOrientation(), keyCode), state })
                else 
                    getTopMostWtWindow().c:sendKeyEvent(keyType, getKeyCode(getCurrentOrientation(), keyCode), state);
                end
                
                -- send the up to this same client
                s_wtKeyUpClient = getTopMostWtWindow().c
                
                llog.info("WindowManager", "handleWhisperTouchPress", "forwarding wt press to " .. tostring(s_wtKeyUpClient.name), "")
                return
            end
        end
    end
end

-- Configure FSR.
-- @param true to enable / false to disable
local function setFsr(enableFsr, windowParams)

    if s_isGlobalSettingFsrEnabled == nil then
        s_isGlobalSettingFsrEnabled = ( getLipcIntProp("com.lab126.deviced", "keypadEnableUserSetting") == 1 ) and true or false

        subscribeLipcEvent("com.lab126.deviced", "fsrkeypadStateChanged", function(publ, event, data)
            s_isGlobalSettingFsrEnabled = ( getLipcIntProp("com.lab126.deviced", "keypadEnableUserSetting") == 1 ) and true or false
            if s_isGlobalSettingFsrEnabled then
                setLipcIntProp("com.lab126.deviced", "fsrkeypadEnable", s_isFsrEnabled and 1 or 0)
                setLipcIntProp("com.lab126.deviced", "fsrkeypadPrevEnable", s_isPreviousButtonEnabled and 1 or 0)
                setLipcIntProp("com.lab126.deviced", "fsrkeypadNextEnable", s_isNextButtonEnabled and 1 or 0)
            end
        end)
    end
    
    -- by default FSR is disabled
    if enableFsr == nil then
        enableFsr = false
    end

    if s_isFsrEnabled ~= enableFsr then
       if s_isGlobalSettingFsrEnabled == true then
           setLipcIntProp("com.lab126.deviced", "fsrkeypadEnable", enableFsr and 1 or 0)
       end 
        s_isFsrEnabled = enableFsr; 
        log("FSR: configuration updated ")
    end

    local enablePreviousButton = false
    local enableNextButton = false
    if enableFsr then
        -- reset Previous button settings
        if windowParams.WTPB == nil or windowParams.WTPB == true then
            enablePreviousButton = true
        end
        if enablePreviousButton ~= s_isPreviousButtonEnabled then
            if s_isGlobalSettingFsrEnabled == true then
                setLipcIntProp("com.lab126.deviced", "fsrkeypadPrevEnable", enablePreviousButton and 1 or 0)
	    end
            s_isPreviousButtonEnabled = enablePreviousButton
        end

        -- reset Next button settings
        if windowParams.WTNB == nil or windowParams.WTNB == true then
            enableNextButton = true
        end
        if enableNextButton ~= s_isNextButtonEnabled then
            if s_isGlobalSettingFsrEnabled == true then
                setLipcIntProp("com.lab126.deviced", "fsrkeypadNextEnable", enableNextButton and 1 or 0)
            end
            s_isNextButtonEnabled = enableNextButton
        end
    end
end
 
-- Configure FSR based on focused window.
-- @param focused window
local function reconfigureFsr()
    if not isFsrAvailable() or not isScreenPortrait() then
        return
    end
    
    if getTopMostWtWindow() and 
       not getTopMostWtWindow().c:is_obscured() then
       setFsr(getTopMostWtWindow().params.WT, getTopMostWtWindow().params)
    else
        setFsr(false, {})
    end
end
 
-- Configure FSR based on un focused window.
-- @param unfocused window
function configureFsrForWindowToHiddenLayer(window)
  if not isKeypadAvailable() or not window then
     return
  end

  deleteWTWindow(window)
  reconfigureFsr()
end


-- @param unfocused window
function configureFsrWindowToVisibleLayer(window)
  if not isKeypadAvailable() or not window then
     return
  end

  insertWTWindow(window)
  reconfigureFsr()
end


-- Configure whisper touch based on orientation.
-- @param orientation
function configureFsrForOrientation(orientation)
    if not isKeypadAvailable() then
        return
    end 
    
    if (getTopMostWtWindow()) then
        -- current window supports whisper touch. 
        -- reconfigure whisper touch based on orientation change
        setFsr(isScreenPortrait(), getTopMostWtWindow().params)
        log("whisper touch: orientation changes. reconfigure fsr") 
    end
end

-- Configure Whisper Touch related settings if there is a change in the WT param
-- @param updated window
function updateWTSettings(updatedWindow)
    if not isKeypadAvailable() or 
       updatedWindow == nil or
       isScreenPortrait() == false then
           return
    end
    
    if updatedWindow.oldParams.WT ~= updatedWindow.params.WT or
       updatedWindow.oldParams.WTPB ~= updatedWindow.params.WTPB or
       updatedWindow.oldParams.WTNB ~= updatedWindow.params.WTNB then
    
       if updatedWindow.params.WT then
           insertWTWindow(updatedWindow)
       else
           deleteWTWindow(updatedWindow)
       end
    
       reconfigureFsr()
    end
end

-- Copyright (c) 2011-2019 Amazon.com, Inc. or its affiliates. All Rights Reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.  
require("liblab126IGL")
require("lab126_flash_triggers")

-- ligl handle
local g_liglRef = nil 

--- Flash mode
local s_flashMode = {fid = ligl.FLASH_MODE.NONE}
--- List of flash triggers
local s_flashTriggers = {}

-- if set to true remap sensitivity reader to
-- the legacy flash every page mode
local s_readerSensitivityEveryPage = false

-- denotes whether Lipc event 'paused'
-- has been sent.
local isPauseEventSent = false

--- T0 is started whe we expect XDamage as a result of window creation,
-- destruction or layer change. Expiration of T0 means that we did not 
-- receive XDamage event on time. In this case we flash and unpause the screen.
local T0 = timer {}
--- T1 is started after we received all the expected damages. When it expires 
-- we flash the screen. The reason for having T1 is to avoid multiple flashes. 
-- For example if dialog destruction is followed by creation of another dialog, 
-- we should catch the second event before expiration of T1, then arm T0, 
-- wait for damage, arm T1, and only after expiration of T1 flash the screen. 
local T1 = timer {}
--- TReenable is started when we disable flash during an app switch.
-- When it expires we unpause the screen. 
local TReenable = timer {}

-- default after damage timeout is howlong we wait to let consecutive damages 
-- acumulate after flash tiggers are done. This can be over ridden by client.
local AFTER_DAMAGE_RESET_TIMEOUT = .005

-- set after damage timeouts tuned to specific behavior (in ms)
local AFTER_DAMAGE_TIMEOUT_SHOW_EWC = 100
local AFTER_DAMAGE_TIMEOUT_SHOW_EWH = 100
local AFTER_DAMAGE_TIMEOUT_SHOW_KB = 30
local AFTER_DAMAGE_TIMEOUT_SHOW_RKB_DIALOG = 50
local AFTER_DAMAGE_TIMEOUT_HIDE_MENU = 5
local AFTER_DAMAGE_TIMEOUT_HIDE_CHROME = 5
local AFTER_DAMAGE_TIMEOUT_HIDE_PASSCODE_DIALOG = 100

local FLAG_ANIMATED_WIPE_EFFECT = 0x00FF
local FLAG_NON_BLOCKING_TRIGGER = 0x0100

-- initialize to minimum value
local s_t1_damageTimeout = AFTER_DAMAGE_RESET_TIMEOUT

--- How long to wait for XDamage events
local WAIT_DAMAGE_TIMEOUT = 0.6
--- How long to wait for XDamage events in case of app switch
local APP_SWITCH_TIMEOUT = 5.0
--- How long to wait for XDamage events after app window appeared
local APP_DAMAGE_TIMEOUT = 0.5
--- How long to wait for damages on roation
local ROTATE_DAMAGE_TIMEOUT = 7.0
--- How long to wait for events from App Manager to re-enable flash
local FLASH_REENABLE_TIMEOUT = 10

local SCREENSAVER_DAMAGE_TIMEOUT = 5.0

--- How long to wait for passwdlg to appear and render itself
local PASSWDLG_WAIT_TIMEOUT = 10.0

local TRIGGER_EVENT_WAIT_FOR_ROTATE = "waitForRotate"
local TRIGGER_EVENT_WAIT_FOR_KB_SHOW = "waitForKbShow"
local TRIGGER_EVENT_WAIT_FOR_KB_HIDE = "waitForKbHide"
local TRIGGER_EVENT_WAIT_FOR_APP_SHOW = "waitForAppShow"
local TRIGGER_EVENT_WAIT_FOR_PASSWDLG_SHOW = "waitForPasswdlgShow"

-- TriggerTypes. These are defined as part of the protocol for the incoming
-- Custom X Client Message. Changing these breaks external dependencies.
local TRIGGER_TYPE_CLIENT_NEXT_DRAW = 0       
local TRIGGER_TYPE_CLIENT = 1
local TRIGGER_TYPE_CLIENT_SIGNAL = 2
local TRIGGER_TYPE_CLIENT_RECT = 3
local TRIGGER_TYPE_CLIENT_RECT_ONLY = 4
local TRIGGER_TYPE_WAIT_FOR_KB_SHOW = 5
local TRIGGER_TYPE_WAIT_FOR_KB_HIDE = 6
local TRIGGER_TYPE_WAIT_FOR_RESHOW = 7

-- TODO: make these timeouts smaller
-- So far the following scenarios prevent that:
--   going from Reader to Home (affects APP_SWITCH_TIMEOUT)
--   going from Home to Settings (affects APP_DAMAGE_TIMEOUT)

local liglAppUri 
local lastLiglAppUri

local s_unpausedRect = {enabled=false, c=nil, prioritySpinnerIsActive=false, locked=false}

local s_flashEnabled = true

-- guard against updating draw mode or sensitivity when screen is paused
-- screen is paused initially and unpaused when we see the first window
local s_paused = true

-- draw modes current state
local s_drawMode = {mode="N", rect={x=0,y=0,width=0,height=0}}

-- sensitivity current state
local s_sensitivity = {sensitivity = -1,rect={x=0,y=0,width=0,height=0}}

local s_propertyLiglReaderSensitivityEveryPage = nil

-- Disables the Taps 
local s_blockedTaps = false;

local sWaitingForPasswdlg = false;
local firstPasswdlgLoad = true;
local sPasswdlgWentDown = false;
local sScreenSaverAboutToComeUp = false;
local sPostPasswdlgEvent = false;
--[[
Block the taps
]]--
local function liglBlockTaps()
  s_blockedTaps = true
end

--[[
Resume the taps
]]--
local function liglResumeTaps()
  s_blockedTaps = false
end

local function getExtents(geom)
    return geom.x + geom.width, geom.y + geom.height
end

local function checkOverlap(oneLeft, oneTop, oneRight, oneBottom, twoLeft, twoTop, twoRight, twoBottom)
    -- check for overlap
    return oneLeft <= twoRight and twoLeft <= oneRight and
            oneTop <= twoBottom and twoTop <= oneBottom
end

--- Check if Taps are blocked or not
-- @return true if Taps are blocked
function liglIsTapsBlocked(window)
    -- special case keyboard as other windows are coming and going
    if s_blockedTaps and keyboard_window_is_keyboard(window) then
        local clientGeom = window.c:geometry()
        clientRight, clientBottom = getExtents(clientGeom)
        for i,v in ipairs(s_flashTriggers) do
            
            if getmetatable(v) == TriggerClient then
            
                -- check for overlapping trigger geom
                local trigGeom = v:geometry()
                trigRight, trigBottom = getExtents(trigGeom)

                -- check for overlapping triggers besides root
                if checkOverlap(clientGeom.x, clientGeom.y, clientRight, clientBottom,
                                    trigGeom.x, clientGeom.y, trigRight, trigBottom) then
                    return true
                end

            elseif getmetatable(v) ~= TriggerRoot then
                -- any other trigger besides a root trigger, we still block
                return true
            end
        end
        
        return false
    end
    
    return s_blockedTaps
end

--- Reset draw mode back to normal. On a next call to liglResume() draw mode will be restored back.
-- 
local function liglResetDrawModeAndSensitivity()

    log("Reverting draw mode to N from " .. tostring(s_drawMode.mode))
    if s_drawMode.mode ~= "N" then
        s_drawMode.mode = "N"
        ligl.display_disable_fastmode(g_liglRef)
    end
    
    if s_sensitivity.sensitivity ~= -1 then
        s_sensitivity.sensitivity = -1
        ligl.display_set_sensitivity(g_liglRef, 0, 0, g_screenOne.geometry.width, g_screenOne.geometry.height, -1)
    end

end

--[[
pause the display and set paused flag
]]--
local function liglPause()
    -- In ASR mode, broadcast the event
    if shouldEmitDisplayEvents() and 
       isPauseEventSent == false then

        local screenSaver = findWindow("SS", "screenSaver")
        local activeScreenSaver = findWindow("SS", "activeSS")
        local isScreenSaverUp = ((screenSaver ~= nil) or (activeScreenSaver ~= nil))
        
        if #s_flashTriggers == 1 and 
           getmetatable(s_flashTriggers[1]) == TriggerClientNextDraw and
           not isScreenSaverUp then
        
            local window = windowTableFindByClient(s_flashTriggers[1].client)
            if window ~= nil and window.params.HC ~= nil then
                log("===== carat dialog case. sent pause")
		sendScreenPauseEvent()
                isPauseEventSent = true
            else 
                isPauseEventSent = false
            end
        else
	    sendScreenPauseEvent()
            isPauseEventSent = true
        end
    end


    if g_liglRef and not s_paused then
	
        -- By default Block the taps when the screen is paused
        liglBlockTaps()

        logTimeStamp("pause begin")
        ligl.display_pause(g_liglRef)
        logTimeStamp("pause end")
        log("=====PAUSED")
        s_paused = true
        propertyLiglPause.value = 1
        
        liglResetDrawModeAndSensitivity()
    end
end

--- Maps the mode string to the appropriate number for ligl
-- @param mode String mode value. One of N, PZ, KB, H, AB
-- @return Corresponding ligl.FAST_MODE value or nil if fast mode should be disabled 
local function modeToLiglModeNum(mode)
    if mode == "PZ" then
        return ligl.FAST_MODE.PZ
    elseif mode == "KB" then
        return ligl.FAST_MODE.KB
    elseif mode == "H" then
        return ligl.FAST_MODE.HL
    elseif mode == "AB" then
        return ligl.FAST_MODE.AB
    else 
        return nil
    end
end

--[[
sets the underlying draw mode (example DU)
@ mode 
    drawmode
@ rect 
    rect to apply draw mode to 
]]--
function liglSetDrawMode(mode, rect)
    log("+++++draw mode call " .. mode)

    if rect then
        log("setting draw mode rect %d, %d :: %d x %d --  %s",rect.x, rect.y, 
                            rect.width, rect.height, mode)
        
        if g_liglRef and not s_paused then
            log("sending draw mode to ligl")

            if mode == s_drawMode.mode and 
                s_drawMode.rect.x == rect.x and
                s_drawMode.rect.y == rect.y and
                s_drawMode.rect.width == rect.width and
                s_drawMode.rect.height == rect.height then
                log("draw mode not changing")
                return
            end

            local liglModeNum = modeToLiglModeNum(mode)
            if liglModeNum == nil then
                ligl.display_disable_fastmode(g_liglRef)
            else
                log("fast mode set %d", liglModeNum)
                ligl.display_fastmode_rect(g_liglRef, rect.x, rect.y, rect.width, rect.height, liglModeNum)
            end
            s_drawMode.mode = mode
            s_drawMode.rect = rect;
        end
    else
        log("no rect")
    end
    
end

--[[
sets sensitive mode on/off and sets value
@ on 
    bool value, on or off
@ sensitivity
    sensitivity level
]]--
function liglSetSensitive(sensitivity, rect)
    log("liglSetSensitive %s", tostring(sensitivity))
    
    local valueToSet
    
    -- look for reader sensitivity and remap if need be
    if sensitivity == ligl.SENSITIVITY_MODE.reader and s_readerSensitivityEveryPage == true then
        log("========== remapping sensitivity to reader flash every page")
        sensitivity = ligl.SENSITIVITY_MODE.flashfastpages
    end

    if g_liglRef and not s_paused then
        if sensitivity == s_sensitivity.sensitivity and 
                s_sensitivity.rect.x == rect.x and
                s_sensitivity.rect.y == rect.y and
                s_sensitivity.rect.width == rect.width and
                s_sensitivity.rect.height == rect.height then
            log("sensitivity not changing")
            return
        end
        
        ligl.display_set_sensitivity(g_liglRef, rect.x, rect.y, rect.width, rect.height, sensitivity)
        s_sensitivity.sensitivity = sensitivity
        s_sensitivity.rect = rect
    end
    
end

local function liglResume()
    if g_liglRef and s_paused then
        logTimeStamp("unpause begin")
        ligl.display_resume(g_liglRef)
        logTimeStamp("unpause end")
        log("=====UNPAUSE")
        s_paused = false
        setDrawModeAndSensitivity()
        propertyLiglPause.value = 0

        -- Resume Taps when the screen is resumed
        liglResumeTaps()
    end
end

--- Check if screen paused or not
-- @return true if screen is paused
function liglIsPaused()
    return s_paused
end

--[[
flashes whole screen through ligl
]]--
function liglReflashWholeScreen()
    if g_liglRef then
        liglPause()
        liglDisplayFlashRect(0, 0, g_screenOne.geometry.width, g_screenOne.geometry.height)
        liglResume()
    end
end

--- Enable/disable flash
-- @param enable If true enable flash, otherwise disable
local function liglFlashEnable(enable)
    log("liglFlashEnable %s", tostring(enable))
    if s_flashEnabled == enable then
        return
    end

    s_flashEnabled = enable

    if TReenable.started then
        TReenable:stop()
    end

    if not s_flashEnabled then
        liglPause()
        if T0.started then
            T0:stop()
        end
        if T1.started then
            T1:stop()
        end
        TReenable.timeout = FLASH_REENABLE_TIMEOUT
        TReenable:start()
    end        
end

--- Put client to flash list
-- @param trigger When to flash
-- @param mode Flash mode, one of ligl.FLASH_MODE constants
-- @param timeout How long to wait before flash
local function liglFlash(trigger, mode, timeout, flags)
    
    -- invalid triggers are nil, check
    if not trigger then
        log("invalid trigger")
        return
    end
    
    log ("liglFlash %s", tostring(trigger.name))

    if g_liglRef then
        -- add to flash list if not added yet
        local found = false
        for i,v in ipairs(s_flashTriggers) do
            if trigger == v then
                log("replacing existing trigger")
                -- replace trigger if found
                s_flashTriggers[i] = trigger
                found = true
                break
            end
        end
        if not found then
            log("adding a new trigger...")
            s_flashTriggers[#s_flashTriggers + 1] = trigger
        end

        if mode > s_flashMode.fid then
            s_flashMode.fid = mode
            s_flashMode.flags = ligl.bitwiseAnd(flags,FLAG_ANIMATED_WIPE_EFFECT);
        end

        if s_flashEnabled then
            liglPause()
            
            if ligl.bitwiseAnd(flags,FLAG_NON_BLOCKING_TRIGGER) == 1 then
              -- Incase of non blocking triggers enable Tapping
              liglResumeTaps()
            end

            -- rearm T0
            local tout = timeout and timeout or WAIT_DAMAGE_TIMEOUT
            if not T0.started then
                log("starting T0 %d", tout)
                T0.timeout = tout
                T0:start()
            elseif T0.remaining < tout then
                log("restarting T0 %d", tout)
                T0:stop()
                T0.timeout = tout
                T0:start()

            end
        
            -- stop T1
            if T1.started then
                T1:stop()
            end
        else
            log("========== flash not enabled")
        end
    end
end

--- Get flash rectangle 
-- @return Rectange to flash
local function getFlashRect()
    local rgn = pixman.region.new()

    -- Iterate over damage list, combining all the rectangles into one
    for i,v in ipairs(s_flashTriggers) do
        -- Active App Change always flash full screen
        if getmetatable(v) == TriggerActiveApp then
            return g_screenOne.geometry
        end
        
        local res, g = pcall(v.geometry, v)
        if res then
            if g.width > 0 and g.height > 0 then
                rgn = rgn + pixman.region.new(g.x, g.y, g.width, g.height)
            end
        else
            llog.error("lua", "gfail", "", 
                "Failed to get geometry for " .. tostring(v.name) .. ": " .. tostring(g))
        end
    end

    local x0, y0, x1, y1 = rgn:extents()
    log ("getFlashRect %d, %d :: %d x %d", x0, y0, x1, y1)

    -- Ensure that rect is inside of the screen
    if x0 < 0 then
        x0 = 0
    end
    if y0 < 0 then
        y0 = 0
    end
    if x1 > g_screenOne.geometry.width then
        x1 = g_screenOne.geometry.width
    end
    if y1 > g_screenOne.geometry.height then
        y1 = g_screenOne.geometry.height
    end

    if y1 >= g_screenOne.geometry.height then
        local titleBar = findWindow("A", "titleBar")
        if titleBar and not titleBar.c.hiddenLayer and y0 == titleBar.c:geometry().height then
            y0 = 0
        end
    end

    return { x = x0, y = y0, width = x1 - x0, height = y1 - y0}
end

--[[
enable/diable the unpaused rectangle in ligl layer.
@param enabled true to enable
@param geom geometry of rectangle which will continue
    to update even if screen is paused
]] 
function liglEnableUnpausedRectangle(enabled)

    log("liglEnableUnpausedRectangle %s", tostring(enabled))
    
    if enabled == s_unpausedRect.enabled then
        return
    end
    
    if g_liglRef then
        local titleBarWin = findWindow("A", "titleBar")
        if titleBarWin and titleBarWin.c and enabled then
            log("ENABLING UNPAUSED RECT")
            s_unpausedRect.enabled = true
            s_unpausedRect.c = titleBarWin.c
            local geom = titleBarWin.c:geometry()
            ligl.display_unpaused_rect(g_liglRef, geom.x, geom.y, geom.width, geom.height)
        else
            log("DISABLING UNPAUSED RECT")
            s_unpausedRect.enabled = false
            s_unpausedRect.c = nil
            ligl.display_unpaused_rect(g_liglRef, 0, 0, 0, 0)
        end
    end
end

--[[
locks the unpaused rect so it can not be set/unset
used during rotation to control when we re-enable 
titlebar
@param value true to lock
]]--
function liglLockUnpausedRect(value)
    log("set unpaused rect lock " .. tostring(value))
    s_unpausedRect.locked = value
end

--[[
sets/unsets the unpaused rect
]]--
function liglUnpausedRectResolve()
    if s_unpausedRect.locked then
        log("unpaused rect locked, defer resolve")
        return
    end
    
    log("liglUnpausedRectResolve")
    if not findWindow("SS", "screenSaver") and 
        s_unpausedRect.prioritySpinnerIsActive then
        liglEnableUnpausedRectangle(true)
    else
        liglEnableUnpausedRectangle(false)
    end
end

--[[
indicates that the priority spinner is on the titlebar
and we should check for the need to set the unpaused rect
]]--
function liglUnpausedRectPrioritySpinnerIsActive(isActive)
    log("liglUnpausedRectPrioritySpinnerIsActive %s", tostring(isActive))
    s_unpausedRect.prioritySpinnerIsActive = isActive
    liglUnpausedRectResolve()
end

--- Flash the pending rectangle if it is not empty
local function liglFlashPendingClients()
    -- if we have pending rectangle that need to be flashed on the
    -- screen do it now

    if g_liglRef then

        local rect
        
        -- option 1 : when multiple triggers come it we fall back and flash the whole screen
        --[[
        if #s_flashTriggers == 1 and getmetatable(s_flashTriggers[1]) ~= TriggerActiveApp then
            log("using single trigger geometry")
            rect = s_flashTriggers[1]:geometry()
        else
            rect = g_screenOne.geometry
        end]]--
        
        -- option 2 : when multiple triggers come in we add the rect together
        if s_flashMode.fid ~= ligl.FLASH_MODE.SLOW_WHITE then
            rect = getFlashRect()
        else
            rect = g_screenOne.geometry
        end

        if rect.width > 0 and rect.height > 0 then
            -- flash rect
            log("flashing rect %d, %d :: %d x %d -- %s", rect.x, rect.y, 
                    rect.width, rect.height, tostring(s_flashMode.fid))
            logTimeStamp("start flash rect")
	   liglDisplayFlashRect(rect.x, rect.y, rect.width, rect.height,s_flashMode.fid,s_flashMode.flags)
  
            logTimeStamp("end flash rect")
        end
    end

    -- Unpause display
    if not findWindow("SS", "screenSaver") or findWindow("SS", "dialog") or findWindow("SS", "activeSS") then
        liglResume()
        liglUnpausedRectResolve()
    end

    liglLockUnpausedRect(false)

    -- clear out pending clients
    s_flashTriggers = {}
    s_flashMode.fid = ligl.FLASH_MODE.NONE
    s_flashMode.flags = 0
end

--[[
called when all ligl triggers are finished
]]--
local function liglTriggersComplete()
    -- We are not waiting for more damages, stop T0, start T1
    if T0.started then
        logTimeStamp("T0 stop")
        T0:stop()
    end

    -- do not rearm, look to remove T1 timeout
    if not T1.started then
   
        if s_t1_damageTimeout > 0.0 then
        
            logTimeStamp("T1 start %f", s_t1_damageTimeout)
            
            T1.timeout = s_t1_damageTimeout
            T1:start()
    
            -- set it back to reset timeout
            s_t1_damageTimeout = AFTER_DAMAGE_RESET_TIMEOUT
        else
            -- trigger immediately
            log("no T1, trigger immediately")
            liglFlashPendingClients()
        end
    end
end

--[[
clear out pending event triggers of a given name
]]--
local function liglClearEventTrigger(eventName)
    log("+++++liglClearEventTrigger %s", eventName)
    local waiting = false
    for i,v in ipairs(s_flashTriggers) do
        if getmetatable(v) == TriggerEvent then
            local damageNotDone = v:eventIn(eventName)
            if damageNotDone then
                logTimeStamp("still waiting for event")
                waiting = true
            end
        elseif v:iswaiting() then
            logTimeStamp("still waiting for damage")
            waiting = true
        end
    end
    
    if not waiting then
        log("done waiting for triggers")
        liglTriggersComplete()
    end
end

function ligl_wait_for_kb_show()
    if not keyboard_is_visible() then
        log("create wait for KB show trigger")
        liglFlash(TriggerEvent.create(TRIGGER_EVENT_WAIT_FOR_KB_SHOW), ligl.FLASH_MODE.FULL, WAIT_DAMAGE_TIMEOUT)
    end
end

function ligl_wait_for_kb_hide()
    if keyboard_is_visible() then
        log("create wait for KB hide trigger")
        liglFlash(TriggerEvent.create(TRIGGER_EVENT_WAIT_FOR_KB_HIDE), ligl.FLASH_MODE.FULL, WAIT_DAMAGE_TIMEOUT)
    end
end

--- Called when visibility state changes, i.e. window mapped/unmapped or moved to/from hidden layer
-- @param window Window
-- @param visible True if window is visible
function visibilityChanged(window, visible)

    local layerName = window.params.L
    local screenSaver = findWindow("SS", "screenSaver")
    local activeScreenSaver = findWindow("SS", "activeSS")
    
    logStrings({"vis changed ", window.c.name, " vis =", visible})

    if screenSaver and layerName ~= "SS" then
        -- Screen saver is active - ignore anything except screensaver itself
        return
    end
    
    local t1_afterDamageTimeout = 0
    if visible then
        
        -- Screen saver is up make sure we set unpaused rect off
        if layerName == "SS" and window.params.N == "screenSaver" then
            liglUnpausedRectResolve()
            sendLipcEvent("titleBarVisiblityChange",{"invisible"})
        end
        
        if window.params.EWC then
            t1_afterDamageTimeout = AFTER_DAMAGE_TIMEOUT_SHOW_EWC
        end
        
        -- When client appears - flash its window
        if window.params.EWH then

            -- check to see if EWC is already there because no need to
            -- do anything in that case. EWC can in some cases when CPU is taxed
            -- take a while so use a relatively high time out
            if not ew_get_client(window) then
                log("damage on EWH is tied to EWC")
                liglFlash(TriggerEWH.create(window.c), ligl.FLASH_MODE.FULL, 4.0)
            else
                log("EWC already present, no trigger needed on EWH")
            end
            
            t1_afterDamageTimeout = AFTER_DAMAGE_TIMEOUT_SHOW_EWH
            
        elseif layerName == "KB" then
            liglFlash(TriggerClient.create(window.c), ligl.FLASH_MODE.FULL)
            liglClearEventTrigger(TRIGGER_EVENT_WAIT_FOR_KB_SHOW)
            
            -- TODO figure out why KB draws twice, fix lazy draw
            -- on KB and we wont need to use an after damage timeout here
            t1_afterDamageTimeout = AFTER_DAMAGE_TIMEOUT_SHOW_KB
        elseif window.params.ID == "passwdlg" then
            if sWaitingForPasswdlg then
                liglClearEventTrigger(TRIGGER_EVENT_WAIT_FOR_PASSWDLG_SHOW)
                sWaitingForPasswdlg = false;
            elseif sPasswdlgWentDown then
                liglClearEventTrigger(TRIGGER_EVENT_WAIT_FOR_APP_SHOW);
                sPasswdlgWentDown = false;
            end
            sPostPasswdlgEvent = true;
            liglFlash(TriggerClient.create(window.c), ligl.FLASH_MODE.FULL, SCREENSAVER_DAMAGE_TIMEOUT)
        elseif (layerName == "SS" and window ~= screenSaver and window ~= activeScreenSaver) then
            liglFlash(TriggerClient.create(window.c), ligl.FLASH_MODE.FULL, SCREENSAVER_DAMAGE_TIMEOUT)
        elseif window.params.N == "screenSaver" then
            if firstPasswdlgLoad and isPasswordDialogEnabled() then
                -- Here we create a TriggerEvent which will get cleared by passwdlg when it appears
                llog.info("winmgr", "visibilityChanged", "Creating event trigger for password dialog", "..")
                firstPasswdlgLoad = false
                sWaitingForPasswdlg = true
                liglFlash(TriggerEvent.create(TRIGGER_EVENT_WAIT_FOR_PASSWDLG_SHOW), ligl.FLASH_MODE.SLOW_WHITE, PASSWDLG_WAIT_TIMEOUT)
            else
                liglFlash(TriggerClient.create(window.c), ligl.FLASH_MODE.SLOW_WHITE, SCREENSAVER_DAMAGE_TIMEOUT)
            end
        elseif window.params.N == "activeSS" then
            liglFlash(TriggerClientNextDraw.create(window.c), ligl.FLASH_MODE.FAST_FULL, SCREENSAVER_DAMAGE_TIMEOUT)
        elseif window.params.N == "titleBar" then
            log("non flashing trigger for titlebar")
            liglFlash(TriggerClient.create(window.c), ligl.FLASH_MODE.NONE)
	    -- This case never gets hit on visibility change
            sendLipcEvent("titleBarVisiblityChange",{"visible"})
        elseif window.c.name and string.find(window.c.name,"N:titleBar") then
            log("non flashing trigger for titlebar - legacy compliant flow")
            liglFlash(TriggerClient.create(window.c), ligl.FLASH_MODE.NONE)
	    -- titleBar window params is renamed to 'topBar' for legacy backward compatibility in chromeLayer_layout(..), handle that case as well
            sendLipcEvent("titleBarVisiblityChange",{"visible"})
        elseif layerName == "D" then
            -- "has carat" dialogs dont draw entirely
            -- so use a Next Draw Trigger. Note we could 
            -- inset the value of the carat. For now, white 
            -- listing the word selection and bookmarks carat
            -- dialogs. Once they set the HC flag on their 
            -- windows this can come out
            local trigger = {}
            if window.params.HC then
                trigger = TriggerClientNextDraw.create(window.c)
            else
                trigger = TriggerClient.create(window.c)
            end
            
            if window.params.FS == "S" then  
                -- supress FULL flash                                                                                                                                      
                liglFlash(trigger, ligl.FLASH_MODE.GCFAST)
            else                                                                                                                                
                liglFlash(trigger, ligl.FLASH_MODE.FAST_FULL)                                                            
            end 
            
            if window.params.RKB then
                -- TODO figure out why KB draws twice, fix lazy draw
                -- for now put after damage timeout on KB dialogs back up 
                t1_afterDamageTimeout = AFTER_DAMAGE_TIMEOUT_SHOW_RKB_DIALOG
                ligl_wait_for_kb_show()
            end
        elseif window.params.N ~= "application" then
            liglFlash(TriggerClient.create(window.c), ligl.FLASH_MODE.NONE)
        else
            liglFlash(TriggerActiveApp.create(window.params.ID), ligl.FLASH_MODE.FULL, APP_DAMAGE_TIMEOUT)
        end
        
        -- look if window triggers a show event 
        if window.params.SE then
            liglClearEventTrigger(window.params.SE)
        end
        
        -- look for window over ride for after damage timeout 
        if window.params.SHOWT1 then
            
            local windowAfterDamageTimout = tonumber(window.params.SHOWT1)
            
            if windowAfterDamageTimout then
                t1_afterDamageTimeout = windowAfterDamageTimout
            end
        end 
        
        -- convert to seconds
        t1_afterDamageTimeout = t1_afterDamageTimeout/1000

    else
        if not window.params.EWC then
            -- When non-EWC client disappears - flash app window
            if layerName == "D" then
                if window.params.FH == nil or window.params.FH == "F" or window.params.FH == "D" then
                    -- default is a full flash
                    liglFlash(TriggerRoot.create(window.c:geometry(), window.rc_inset), ligl.FLASH_MODE.FULL)
                else
                    -- create a non full flashing trigger
                    liglFlash(TriggerRoot.create(window.c:geometry(), window.rc_inset), ligl.FLASH_MODE.GCFAST)
                end

                if window.params.RKB then
                    ligl_wait_for_kb_hide()
                end

                if window.params.TAB and window.params.TAB == "menu" then
                    --adjust T1 up if menu is there
                    t1_afterDamageTimeout = AFTER_DAMAGE_TIMEOUT_HIDE_MENU
                end
            elseif window.params.BARTYPE == "T" or window.params.N == "titleBar" then
                liglFlash(TriggerRoot.create(window.c:geometry(), window.rc_inset), ligl.FLASH_MODE.NONE)
                sendLipcEvent("titleBarVisiblityChange",{"invisible"})
            elseif layerName == "KB" then
                liglFlash(TriggerRoot.create(window.c:geometry(), window.rc_inset), ligl.FLASH_MODE.FULL)
                liglClearEventTrigger(TRIGGER_EVENT_WAIT_FOR_KB_HIDE)
            elseif layerName == "C" then
                if  window.params.FHC == "S" then
                    liglFlash(TriggerRoot.create(window.c:geometry(), window.rc_inset), ligl.FLASH_MODE.NONE)
                    log_info("Flash on Chromebar hide is supressed")
                else
                    liglFlash(TriggerRoot.create(window.c:geometry(), window.rc_inset), ligl.FLASH_MODE.FULL)
                    -- TODO sync up with Reader and see if we can optimize the multiple draws
                    -- from Reader on chrome down. We could look at raising app window, then
                    -- lowering chrome to eliminate the multiple exposes Reader likely get here.
                    -- reader sometimes draws twice when chrome goes down.
                    -- need some T1 so far
                end
                t1_afterDamageTimeout = AFTER_DAMAGE_TIMEOUT_HIDE_CHROME
            elseif layerName == "SS" then
                if shouldEmitDisplayEvents() then
		    sendScreenPauseEvent()
                end

                
                if window.params.ID ~= "passwdlg" and getActiveApplicationWindow() and getActiveApplicationWindow().params.PC ~= 'N' then
                    -- TODO: remove titleBarVisibilityChange events after adding X11 window visible events in CVM
                    -- Refer JSEVENONE-3100
                    sendLipcEvent("titleBarVisiblityChange",{"visible"})
                end

                if window.params.N == "activeSS" and window.params.FH ~= "S" then
                    liglFlash(TriggerRoot.create(window.c:geometry(), window.rc_inset), ligl.FLASH_MODE.FULL)
                elseif window.params.FH == "S" then
                    liglFlash(TriggerRoot.create(window.c:geometry(), window.rc_inset), ligl.FLASH_MODE.NONE)
                elseif window.params.ID == "passwdlg" then
                    sPasswdlgWentDown = true
                    liglFlash(TriggerEvent.create(TRIGGER_EVENT_WAIT_FOR_APP_SHOW), ligl.FLASH_MODE.SLOW_WHITE, SCREENSAVER_DAMAGE_TIMEOUT)
                    t1_afterDamageTimeout = AFTER_DAMAGE_TIMEOUT_HIDE_PASSCODE_DIALOG
                elseif window.params.module == "splash" then
                    if firstPasswdlgLoad and isPasswordDialogEnabled() then
                        -- Here we create a TriggerEvent which will get cleared by passwdlg when it appears
                        llog.info("winmgr", "visibilityChanged", "Creating event trigger for password dialog", ".")
                        firstPasswdlgLoad = false
                        sWaitingForPasswdlg = true
                        liglFlash(TriggerEvent.create(TRIGGER_EVENT_WAIT_FOR_PASSWDLG_SHOW), ligl.FLASH_MODE.SLOW_WHITE, PASSWDLG_WAIT_TIMEOUT)
                    else
                        liglFlash(TriggerRoot.create(window.c:geometry(), window.rc_inset), ligl.FLASH_MODE.SLOW_WHITE, SCREENSAVER_DAMAGE_TIMEOUT)
                    end
                elseif window.params.FH ~= "S" then
                    liglFlash(TriggerRoot.create(window.c:geometry(), window.rc_inset), ligl.FLASH_MODE.SLOW_WHITE, SCREENSAVER_DAMAGE_TIMEOUT)
                end

                if window.params.N == "screenSaver" then
                
                    -- when proper screensaver goes away, make sure the focused client draws
                    -- before we flash
                      
                    -- look for the next focusable client after this SS win which is going away
                    local foundThisSS = false                                             
                    local nextFocusClient = focusHistorySearch(function(c) 
                                                                   
                                                                   if not c.hiddenLayer and foundThisSS then
                                                                       -- found match true for client after SS
                                                                       return true
                                                                   end
                                                                   
                                                                   -- mark true such that next client gets matched
                                                                   if c == window.c then
                                                                       foundThisSS = true
                                                                   end
                                                                   
                                                                   return false 
                                                              end)
                    
                    
                    if nextFocusClient then
                        log("nextFocus after SS going to %s", nextFocusClient.name)
                        -- expect a draw on the focused client 
                        -- this shoul dcatch case where there is a dialog up over the active app
                        -- but the app draw around the dialog satisfying the root trigger
                        -- use none as we are just delaying the draw, defer to flash mode determined on root
                        liglFlash(TriggerClientNextDraw.create(nextFocusClient), ligl.FLASH_MODE.NONE)
                    end
                end
            elseif layerName == "A" and window.params.N == "application" and window.params.FH == "F" then
                liglFlash(TriggerRoot.create(window.c:geometry(), window.rc_inset), ligl.FLASH_MODE.FULL)
            end

            -- look for window over ride
            if window.params.HIDET1 then

                local windowAfterDamageTimout = tonumber(window.params.HIDET1)
                
                if windowAfterDamageTimout then
                    t1_afterDamageTimeout = windowAfterDamageTimout
                end
            end 
            
            -- convert to seconds
            t1_afterDamageTimeout = t1_afterDamageTimeout/1000
        
        end
        
        -- remove any triggers set for this window
        local numRemoved = filterTable(s_flashTriggers, function(entry) return entry.client == window.c end)
        log("remove client %d triggers on hide window=%s", numRemoved, window.c.name)
        
    end

    -- if the requested T1 is greater than what we have 
    -- adjust it up
    if t1_afterDamageTimeout > s_t1_damageTimeout then
        log("adjusting T1 up to %f", t1_afterDamageTimeout)
        s_t1_damageTimeout = t1_afterDamageTimeout
    end
end

local s_inLayoutFunc = nil

--- Callback function called when layer layout changes
-- @param layer Layer
-- @param window Added/updated/removed window
-- @param action One of "added", "removed", "updatedParams", "updatedGeometry"
function ligl_layout(layoutFunc)
    return function(layer, window, action)
        if action == "added" then
            s_inLayoutFunc = window
            layoutFunc(layer, window, action)
            s_inLayoutFunc = nil
        elseif action == "removed" then
            s_inLayoutFunc = window
            layoutFunc(layer, window, action)
            s_inLayoutFunc = nil
        else
            layoutFunc(layer, window, action)
        end
    end
end

--- Callback called when client layer changes to/from hidden
-- @param client Awesome client
function liglHandleClientLayerChanged(c)
    local window = windowTableFindByClient(c)
    if window and window.params and window ~= s_inLayoutFunc then
        log("client layer changed from hidden %s", c.name)
        visibilityChanged(window, not c.hiddenLayer)
    end 
end

function liglClientUnmanaged(c)
    local window = windowTableFindByClient(c)
    if window and window.params and not c.hiddenLayer then
        visibilityChanged(window, false)
    end
end

--[[
called after the screen is rotated
]]--
function liglScreenRotated()
    log("liglScreenRotated")
    
    -- clear out any older root triggers
    local numRemoved = filterTable(s_flashTriggers, function(entry) return getmetatable(entry) == TriggerRoot end)
    log("remove %d root triggers on rotate", numRemoved)

    -- create a root trigger for new geometry
    liglFlash(TriggerRoot.create(g_screenOne.geometry, nil), ligl.FLASH_MODE.FULL, ROTATE_DAMAGE_TIMEOUT)

    -- clear the wait for rotation trigger we created to block until rotation came in
    liglClearEventTrigger(TRIGGER_EVENT_WAIT_FOR_ROTATE)
end

--[[
called after client is resized
]]--
function liglHandleClientResize(c)
    logTimeStamp("start liglHandleClientResize")
    if next(s_flashTriggers) then
        for i,v in ipairs(s_flashTriggers) do
            v:resizeCheck(c)
        end
    end
    logTimeStamp("end liglHandleClientResize")
end

--[[
map fidelity requested to ligl fidelity value
@params flashFidRequest the API exposed for creating 
        flash triggers allows for certain flash fidelities.
        map them to the corresponding value
        
        The reason for this is that the specific values are exposed to 
        Java, pillow etc. Internal value order in LIGL determines which
        fidelity trumps what. The below mapping allows us to maintain
        the externally exposed values and the internal higher valued fidelity 
        wins functionality.
    
reference from ligl     
    fid_normal=0,  /**< fid_normal : auto refreshing in WFM_AUTO, partial updates */
    fid_xor,       /**< fid_xor : force an inverted full monochrome to create an xor */ 
    fid_a2,        /**< fid_a2 : fast black/white mode (apprx 120ms). best effor black and white with extreme ghosting */
    fid_du,        /**< fid_du : black and white full monochrome */ 
    fid_two_pass,  /**< fid_twoPass : force DU than clean up with GC */
    fid_gl_fast,   /**< fid_gl_fast : update with "fast" gl waveform */
    fid_gl,        /**< fid_gl : update with normal gl */
    fid_gc_fast,   /**< fid_fast : update with "fast" gc waveform */
    fid_gc,        /**< fid_gc : update with normal length gc */
    fid_gl_fast_full, /**< fid_gl_fast_full : gl16 fast full waveform */
    fid_gl_slow_full, /**< fid_gl_slow_full : gl16 full length waveform */
    fid_full,      /**< fid_full : auto refreshinng in WFM_AUTO, full updates */
    fid_fast_full, /**< fid_fast_full : full flashing fast gc update */
    fid_slow_full, /**< fid_slow_full : full flashing gc normal length update */ 
    fid_fast_white, /**< fid_fast_white : DU to white followed by fast gc to content */
    fid_slow_white, /**< fid_slow_white : special version of fid_slow, doing a DU to white before a fid_slow */
    fid_slow_white2,/**< fid_slow_white2 : GC16 FAST to white followed by GC16 FAST to content */
    fid_partial_then_full /**< fid_partial_then_full : (experimental) partial gc folowed by full gc clean up */
]]--
local s_fid_map = {ligl.FLASH_MODE.FAST_FULL,         -- 1
                   ligl.FLASH_MODE.TWOPASS,           -- 2
                   ligl.FLASH_MODE.GLFAST,            -- 3
                   ligl.FLASH_MODE.GL,                -- 4
                   ligl.FLASH_MODE.SLOW_WHITE,        -- 5
                   ligl.FLASH_MODE.GC,                -- 6
                   ligl.FLASH_MODE.FULL,              -- 7
                   ligl.FLASH_MODE.XOR,               -- 8
                   ligl.FLASH_MODE.SLOW_FULL,         -- 9
                   ligl.FLASH_MODE.GCFAST,            -- 10
                   ligl.FLASH_MODE.FAST_WHITE,        -- 11
                   ligl.FLASH_MODE.SLOW_WHITE2,       -- 12
                   ligl.FLASH_MODE.PARTIAL_THEN_FULL, -- 13
                   ligl.FLASH_MODE.GL_FAST_FULL,      -- 14
                   ligl.FLASH_MODE.GL_SLOW_FULL,      -- 15
                   ligl.FLASH_MODE.DU,                -- 16
                   ligl.FLASH_MODE.A2,                -- 17
                   ligl.FLASH_MODE.WIPE,              -- 18
                   ligl.FLASH_MODE.REAGL,             -- 19
                   ligl.FLASH_MODE.REAGLD,            -- 20
                   }
local function remap_flash_fidelity(flashFidRequest)
    local returnval

    if flashFidRequest == 0 then 
        -- exposed fidelity for non flashing
        -- use NONE which maps equals auto
        returnval = ligl.FLASH_MODE.NONE
    else
        returnval = s_fid_map[flashFidRequest]
    end
    
    return returnval
end

--[[
force an immediate flash
coords are screen relative
]]--
function ligl_flash_rect(x, y, w, h, fid, flags)
    if g_liglRef then
       liglDisplayFlashRect(x, y, w, h,remap_flash_fidelity(fid),flags)
    end
end

--[[
Next wipe sensitivity triggered will flow to asked direction
@params direction of next sensitivity
]]--
function ligl_set_sensitivity_triggered_direction(direction)
    ligl.sensitivity_direction(g_liglRef, direction)
end

--[[
create a new flash trigger for a given window
@params win             : window to set trigger for
@params triggerType     : ex. flash on next draw to client
@params flashFid        : fidelity to flash at when trigger is done
@params waitTimeout     : max time to wait for trigger
@params afterDamageTimeout  : timeout after trigger is done before flash
]]--
function ligl_set_trigger(win, triggerType, flashFid, waitTimeout, afterDamageTimeout, x, y, w, h, flags)

    log_info("creating new trigger window=%s, triggerType=%d, flashFid=%d, timeout=%d, afterDamageTimeout=%d, flags=%d", win.c.name, triggerType, flashFid, waitTimeout, 
                            afterDamageTimeout, flags)
    local trigger
    
    -- value in is in ms, timeout takes seconds
    if waitTimeout then
        waitTimeout = waitTimeout/1000
    else
        waitTimeout = WAIT_DAMAGE_TIMEOUT
    end
    
    if afterDamageTimeout then
        afterDamageTimeout = afterDamageTimeout/1000
    else
        afterDamageTimeout = 0
    end

    -- determine type of trigger
    if triggerType == TRIGGER_TYPE_CLIENT_NEXT_DRAW then
        if w > 0 and h > 0 then
            log_info("setting signal trigger rect only %d,%d %d x %d", x, y, w, h)
            local rect={x=x,y=y,width=w,height=h}
            trigger = TriggerClientNextDraw.create(win.c, rect)
        else
            trigger = TriggerClientNextDraw.create(win.c)
        end
        
    elseif triggerType == TRIGGER_TYPE_CLIENT then
        trigger = TriggerClient.create(win.c)
    elseif triggerType == TRIGGER_TYPE_CLIENT_RECT then
        if x and y and w and h then
            local rect={x=x,y=y,width=w,height=h}
            trigger = TriggerClient.create(win.c, rect, false)
        else
            llog.warn("lua", "set-trigger-fail", "client=" .. tostring(win.c.name), "expect rect for trigger type client rect")
        end
    elseif triggerType == TRIGGER_TYPE_CLIENT_RECT_ONLY then
        if x and y and w and h then
            local rect={x=x,y=y,width=w,height=h}
            trigger = TriggerClient.create(win.c, rect, true)
        else
            llog.warn("lua", "set-trigger-fail", "client=" .. tostring(win.c.name), "expect rect for trigger type client rect")
        end
    elseif triggerType == TRIGGER_TYPE_CLIENT_SIGNAL then
        if w > 0 and h > 0 then
            local rect={x=x,y=y,width=w,height=h}
            trigger = TriggerClientSignal.create(win.c, rect)
        else
            trigger = TriggerClientSignal.create(win.c)
        end
    elseif triggerType == TRIGGER_TYPE_WAIT_FOR_KB_SHOW and not keyboard_is_visible() then
        trigger = TriggerEvent.create(TRIGGER_EVENT_WAIT_FOR_KB_SHOW)
    elseif triggerType == TRIGGER_TYPE_WAIT_FOR_KB_HIDE and keyboard_is_visible() then
        trigger = TriggerEvent.create(TRIGGER_EVENT_WAIT_FOR_KB_HIDE)
    elseif triggerType == TRIGGER_TYPE_WAIT_FOR_RESHOW and win.params.SE then
        trigger = TriggerEvent.create(win.params.SE)
    else
        llog.warn("lua", "set-trigger-fail", "client=" .. tostring(win.c.name), "unsupported trigger type")
        return
    end
    
    if trigger then
        -- set the flash trigger
        liglFlash(trigger, remap_flash_fidelity(flashFid), waitTimeout, flags)
        
        log("adjusted after damage timeout = %f, global is %f", afterDamageTimeout, s_t1_damageTimeout)
        -- if after damage timeout is set and greater than what we have set it 
        if afterDamageTimeout > s_t1_damageTimeout then
            log("adjusting T1 up to %f", afterDamageTimeout)
            s_t1_damageTimeout = afterDamageTimeout
        end
    end
end

--[[
clears a custom signal trigger
@params win         : window trigger set for
]]--
function ligl_clear_client_signal_trigger(win, justDestroy)
    if not next(s_flashTriggers) then
        return
    end
    
    local waiting = false
    for i,v in ipairs(s_flashTriggers) do
        if getmetatable(v) == TriggerClientSignal then
            local damageNotDone = v:signalIn(win.c)
            if damageNotDone then
                logTimeStamp("still waiting for custom signal")
                waiting = true
            end
        elseif v:iswaiting() then
            logTimeStamp("still waiting for damage")
            waiting = true
        end
    end

    if not waiting and (not justDestroy or justDestroy == 0) then
        log("done waiting for signal triggers")
        liglTriggersComplete()
    end
end

--[[
prepares and initiates a screen rotation
]]--
function liglRotateScreen(rot)
    log("liglRotateScreen %s", tostring(rot))
    local returnVal = -1
    
    if g_liglRef then
        liglEnableUnpausedRectangle(false)
        liglLockUnpausedRect(true)
        liglPause()
        
        -- set a trigger we will clear when the rotation comes back
        -- this handles case where the screen draws before liglScreenRotated comes back
        liglFlash(TriggerEvent.create(TRIGGER_EVENT_WAIT_FOR_ROTATE), ligl.FLASH_MODE.FULL, ROTATE_DAMAGE_TIMEOUT)
      
        -- initiate roation
        returnVal = ligl.orientation_set(g_liglRef, rot)
        
        if returnVal ~= 0 then
            liglLockUnpausedRect(false)
	    sendScreenResumeEvent()
            liglResume()
        end
    end

    return returnVal
end

--[[
set grip suppression
]]--
function liglSetGripSuppresion(grip_enabled)
    local returnVal = -1
    
    if g_liglRef then
        -- initiate grip suppression
        returnVal = ligl.set_grip_suppression(g_liglRef, grip_enabled)
    end

    return returnVal
end


function logActiveTriggers()
    local clearedTriggers = 0
    for i,v in ipairs(s_flashTriggers) do
        if v:iswaiting() then
            llog.info("WindowManager", "pendingTrigger", "name=%s", "", v.name)
        else
            clearedTriggers = clearedTriggers + 1
        end
    end
    
    llog.info("WindowManager", "clearedTriggers", "number=%d", "", clearedTriggers)
end


function ligl_subscribe_events()
    --
    -- Flash-related callbacks
    --
    subscribeLipcEvent("com.lab126.powerd", "goingToScreenSaver", function(publ, event, data)
        llog.info("winmgr", "goingToScreenSaver", "event received" , "");
        sScreenSaverAboutToComeUp = true;
    end)

    subscribeLipcEvent("com.lab126.appmgrd", "appStateChange", function(publ, event, data)
        logTimeStamp("Received %s.%s data = %s %s %s", publ, event, 
            tostring(data[1]), tostring(data[2]), tostring(data[3]))
        if ((data[2] == "load" and data[3] == 0)
            or (data[2] == "go" and data[3] == 0)) then
            -- load or go started to diff app then current
            lastLiglAppUri = liglAppUri
            liglAppUri = data[1]
            if not findWindow("SS", "screenSaver") then
                liglUnpausedRectResolve()
                liglFlash(TriggerActiveApp.create(data[1]), ligl.FLASH_MODE.FULL, APP_SWITCH_TIMEOUT)   
            end

        elseif liglAppUri == data[1] and
            ((data[2] == "load" and data[3] < 0) 
            or (data[2] == "go" and data[3] < 0)) then
            -- 'fail in load' or 'fail in go'
            llog.info("WindowManager", "handleAppLaunchFail", "unpause display and clear timeouts", "")
            liglAppUri = lastLiglAppUri
            if T0.started then
                T0:stop()
            end
            if T1.started then
                T1:stop()
            end
            liglFlashPendingClients()
        end
    end)

end

function ligl_signal_user_action()
    ligl.signal_user_action(g_liglRef)
end

function shouldEmitDisplayEvents()
    return propertyEmitDisplayEvents.value == 1 or isASRMode() 
end

function ligl_register_properties()
    --
    -- Properties
    --
    propertyLiglPause = registerLipcIntProp("liglPause", "rw")
    propertyLiglPause.value = s_paused and 1 or 0
    propertyLiglPause.listener = function (name, value)
        if value == 0 then
            liglReflashWholeScreen()
        else
            liglPause()
        end
    end
 
    propertyEmitDisplayEvents = registerLipcIntProp("enableDispalyEvents", "rw")
    propertyEmitDisplayEvents.value = 0
    propertyEmitDisplayEvents.listener = function (name, value)
        propertyEmitDisplayEvents.value = value == 0 and 0 or 1
    end

    propertyExtendDamageTimeout = registerLipcIntProp("extendDamageTimeout", "w")
    propertyExtendDamageTimeout.listener = function (name, value)
        -- This is a workaround introduced to overcome JSEVENONE-5096
        -- Doing this in a more elegant way (if any) would come as part of JSEVENONE-5222
        if g_liglRef and T0.started then
           if T0.remaining < value then
              T0:stop()
              T0.timeout = value
              T0:start()
           end
           llog.info("WindowManager", "propertyExtendDamageTimeout", "T0 timer value after property change is =%d", "", T0.remaining)
        else
            llog.error("WindowManager", "propertyExtendDamageTimeout", "","Failed to reset the T0 value to=" .. tostring(value))
        end
    end

    -- Test property which forces a given flash on a rect on the screen
    -- params come in the string prop value in the form
    -- x:y:w:h:fid:flags
    propertyLiglFlash = registerLipcStringProp("liglFlash", "w")
    propertyLiglFlash.listener = function (name, value)
        
        local params = {}
        local index = 1 
        for param in stringSplit(value, ":") do
            params[index] = tonumber(param)
            index = index + 1
        end
        llog.info("WindowManager", "lipc-liglFlash", "", "debugging only call")
	if not s_paused then
            ligl_flash_rect(params[1], params[2], params[3], params[4], params[5], params[6])
        end
    end


    -- Set debug/test params on LIGL
    propertyDebugParams = registerLipcStringProp("liglDebugParams", "w")
    propertyDebugParams.listener = function (name, value)
        log("debug params call" .. value)
        local k = ""
        local v = 0
        local index = 1
        for param in stringSplit(value, ":") do
            log("got param at index %d, value %s", index, param)
            if index == 1 then
                log("key set to %s", param)
                k = param
            elseif index == 2 then
                log("value set to %s", param)
                v = tonumber(param)
            end
            index = index + 1
        end
        llog.info("WindowManager", "lipc-liglFlash", "", "debugging only call")
        log("debug param key = %s, value = %d", k, v)
        ligl.debug_params(g_liglRef, k, v)
    end
    
    -- override wipe "curve" definition LIGL uses on animated wipe effect
    propertyDefineWipeCurve = registerLipcStringProp("defineWipeCurve", "w")
    propertyDefineWipeCurve.listener = function (name, value)
        
        local params = {}
        local index = 1 
        for param in stringSplit(value, ":") do
            params[index] = tonumber(param)
            index = index + 1
        end
        llog.info("WindowManager", "lipc-defineWipeCurve", "", "debugging only call")
        ligl.define_wipe_curve(g_liglRef, params)
    end
    

    s_propertyLiglReaderSensitivityEveryPage = registerLipcStringProp("refreshOnTurn", "w")
    s_propertyLiglReaderSensitivityEveryPage.listener = function (name, value)
        logStrings({"refreshOnTurn property called ", value})
        if value == "true" then
            s_readerSensitivityEveryPage = true
        else
            s_readerSensitivityEveryPage = false
        end
    end

    -- property to enable/disable colorInverse mode
    propertyColorInverseMode = registerLipcStringProp("epdcMode", "rw")
    propertyColorInverseMode.value =  execAndGrabResult("get-dynconf-value winmgr.colorinverse.pref")
    propertyColorInverseMode.listener = function (name, value)

        local ret = ligl.set_epdc_grayscale_mode(g_liglRef, tostring(value))
        if (ret == 1) then
            execAndGrabResult("set-dynconf-value winmgr.colorinverse.pref " .. tostring(value))
            execAndGrabResult("xrefresh -root")
            sendLipcEvent("nightModeStateChanged",{tostring(value)})
        else
            llog.error("WindowManager", "propertyColorInverseMode", "","Failed to set EPDC MODE to " .. tostring(value))
            propertyColorInverseMode.value =  execAndGrabResult("get-dynconf-value winmgr.colorinverse.pref")
        end
    end

end

--- liglInitialize is called after the initial 
-- windows present when awesome start are all loaded.
function liglInitialize()
    if not g_liglRef then
      g_liglRef = ligl.init()
    end
    

    T0:add_signal("timeout", function()
        logTimeStamp("T0 expired")
        T0:stop()
        for i,v in ipairs(s_flashTriggers) do
            if v:iswaiting() then
                llog.info("WindowManager", "flashTimeoutExpired", "window=" .. tostring(v.name), "")
            end
        end
        liglFlashPendingClients()
    end)

    T1:add_signal("timeout", function()
        logTimeStamp("T1 expired")
        T1:stop()
        liglFlashPendingClients()
    end)

    TReenable:add_signal("timeout", function()
        llog.warn("lua", "TReenable", "liglAppUri=" .. tostring(liglAppUri), "TReenable expired, unpausing")
        TReenable:stop()
	sendScreenResumeEvent()
        liglResume()
    end)

    g_screenOne:add_signal("damage", function(s, x, y, w, h)
        
        log("screen.damage rect %d x %d", w, h)
        
        if g_liglRef then
            ligl.display_damage_notify(g_liglRef, x, y, w, h)
        end
    end)

    client.add_signal("damage", function(c, x, y, w, h)

        logTimeStamp("client.damage signal start %s rect = %d x %d", c.name, w, h)
        log_debug_private("damage coord %d:%d", x, y)

        -- border damages have negative x and y
        if x < 0 or y < 0 then
            logTimeStamp("border damage")
            return
        end

        if c.hiddenLayer or string.find(c.name, "ID:blankBackground") then
            -- ignore hidden clients, blank background
            log("ignoring damage on hidden window")
            return
        end

        --In ASR mode, broadcast the event
        if shouldEmitDisplayEvents()  then
                local clientGeom = c:geometry()
            sendLipcEvent("screenDamage", { c:getWindowId(), clientGeom.x + x,  clientGeom.y + y, w, h })
        end

        -- if we want to show status bar while rotating and launching an
        -- application this will re-enable the unpaused rect when the damage
        -- comes in. This may not be the best UI effect, but works for now
        if s_unpausedRect.c == c and w == g_screenOne.geometry.width then
            log("DAMAGE rec for titlebar, resolving unpaused area")
            liglUnpausedRectResolve()
        end
        
        if not next(s_flashTriggers) and string.find(c.name, "screenSaver") then
            liglFlash(TriggerClient.create(c, {x = x, y = y, width = w, height = h}),
                ligl.FLASH_MODE.NONE)
        elseif sPasswdlgWentDown and
                (string.find(c.name, "N:application") or string.find(c.name, "N:activeSS")) then
                liglClearEventTrigger(TRIGGER_EVENT_WAIT_FOR_APP_SHOW);
                sPasswdlgWentDown = false;
        elseif sScreenSaverAboutToComeUp and string.find(c.name, "N:screenSaver") then
                if sPasswdlgWentDown then
                    liglClearEventTrigger(TRIGGER_EVENT_WAIT_FOR_APP_SHOW);
                end
                sPasswdlgWentDown = false;
                sScreenSaverAboutToComeUp = false;
        elseif string.find(c.name, "ID:passwdlg") then
                if sPostPasswdlgEvent then
                    sendLipcEvent("passwdlgPosted",{})
                    sPostPasswdlgEvent = false;
                end
        end

        if next(s_flashTriggers) then
            local waiting = false

            for i,v in ipairs(s_flashTriggers) do
                log("look at damage trigger " .. v.name)
                local damageNotDone = v:damage(c, x, y, w, h)
                if damageNotDone then
                    logTimeStamp("still waiting for damage")
                    waiting = true
                else
                    logTimeStamp("damage done for %s", tostring(c.name))
                    local win = windowTableFindByClient(c)
                    if x >= 0 and win and win.needDialogBorders then
                        -- The reason to delay the border drawing until now is that is we do
                        -- not then the xdamages for the dialog are sometimes collapsed into the 
                        -- x damages for the borders, making it impossible to distinguish between
                        -- the two.
                        dialog_borders_and_corners(win)
                        logTimeStamp("corners done")
                        win.needDialogBorders = false
                    end
                end
            end
        
            if not waiting then
                liglTriggersComplete()
            end
        end

    end)
end

---- To send resume evet before actually screen drawn, such that screen draw and query widget will happen parallely
---- @param x-cordinate,y-cordinate width, height, fid and flags

function liglDisplayFlashRect(xval,yval,width,height,fid,flags)
    local dontSendResumeEvent = false
        if shouldEmitDisplayEvents()  then
            local screenSaver = findWindow("SS", "screenSaver")
            local activeScreenSaver = findWindow("SS", "activeSS")
            local isScreenSaverUp = ((screenSaver ~= nil) or (activeScreenSaver ~= nil))

            if isPauseEventSent == false  then
                 if #s_flashTriggers > 1 then
		     sendScreenPauseEvent();
                 elseif #s_flashTriggers == 1 and not isScreenSaverUp then
                     log("===== dontSendResumeEvent = true")
                     dontSendResumeEvent = true
                 end
            end

            if dontSendResumeEvent == false and s_paused == true then
		sendScreenResumeEvent()
                dontSendResumeEvent = true
            end

            -- reset pause sent flag
            isPauseEventSent = false
        end
    ligl.display_flash_rect(g_liglRef, xval, yval, width, height, fid, flags)
end

-- Send a screen resume event after sending the visible windows updated event
function sendScreenPauseEvent()
    statusTable = {}
    statusTable[0] = {status = "Paused"}
    sendLipcEvent("screenStatus", { "{\"status\":\"Paused\"}" })
end

-- Send a screen resume event after sending the visible windows updated event
function sendScreenResumeEvent()
    sendLipcEvent("screenStatus", { "{\"status\" : \"Resumed\", \"visibleWindows\" : "..getVisibleWindowsJson().."}" })
end

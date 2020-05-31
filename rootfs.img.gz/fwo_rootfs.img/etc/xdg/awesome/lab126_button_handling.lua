-- Copyright (c) 2012-2018 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms


local s_homeKeyDownState = {
    isDown = false,
    timeStamp = 0
}

--[[
handles the press of homekey and call appmgrd
]]--
function handleHomeKeyUp()

    log("received home key")

    -- clear state
    s_homeKeyDownState.isDown = false
    s_homeKeyDownState.timeStamp = 0

    if s_homeKeyDownState.screenShotTaken then

        s_homeKeyDownState.screenShotTaken = false
        llog.info("WindowManager", "tapHandledByWinMgr", "ID=HomeKeyUp, reason=screenShot", "")
        return
    end

    -- if the home key was used for a home key combo or screen saver is up then dont launch home
    if not findWindow("SS", "screenSaver") then
        chrome_lower()
        
        local blockHomeButton = false
        if client.focus then
            local focusedWin = windowTableFindByClient(client.focus)
            if focusedWin.params.L == "D" and focusedWin.params.N == "pillowAlert" then
                llog.info("WindowManager", "homeKeyBlocked", "reason=alertIsVisible", "")
                blockHomeButton = true
            end
        end
        
        if not blockHomeButton then
            -- launch the default app
            log("==============Sending Home Button")
            logTimeStamp("home button press")
            client.validate_stacking_order()
            setLipcIntProp("com.lab126.appmgrd", "startdefault", 0)
        end
    end
    
end

--[[
handle down. grab a time stamp to use to determine a home hold
]]--
function handleHomeKeyDown()
    log("home key down")
    -- set state so we can catch press and hold onhome key
    s_homeKeyDownState.screenShotTaken = false
    s_homeKeyDownState.isDown = true
    s_homeKeyDownState.timeStamp = os.time()
end


--[[
Tap Handling code to follow
]]--

local s_tapComboBeingHandled = false

--[[
button 1 is screen tap
set c.signalHandled to true to block button from being
propogated to the client
]]--
function handleClientButton1Press(c, forceButtonHandling)

    logTimeStamp("button 1 down")
    
    s_tapComboBeingHandled = false
    
    if not c then
        return
    end
  
    -- Eat all taps when the device is in ASR mode or when the fake button events allowed
    -- TODO: Use isFakeButtonEventAllowed() in ASR mode as well
    if not forceButtonHandling and (isASRMode() or isInEatAllTapMode()) then
        log("eating all taps")
        c.signalHandled = true
        s_tapComboBeingHandled = true
        return
    end

    --signal that the user has touched the screen
    ligl_signal_user_action()
        
    -- check to see if home is held down to put us into screen shot mode and
    -- validate if we have already taken a screen shot on this hold
    if not s_homeKeyDownState.screenShotTaken and s_homeKeyDownState.isDown and os.difftime(os.time(), s_homeKeyDownState.timeStamp) > 1 then
        llog.info("WindowManager", "tapHandledByWinMgr", "ID=Button1Down, reason=pendingScreenShot", "")

        -- mark handled
        c.signalHandled = true
        s_tapComboBeingHandled = true
        s_homeKeyDownState.screenShotTaken = true

        -- take screen shot
        screenshot()

        return
    end

    local c = c
    local window = windowTableFindByClient(c)
    
    if not window or not window.params then
        -- Sometimes invalid/hidden windows are given for tap by X. Under those case we will check whether the window is a valid window else eat the tap
        if not isValidClient(c) then
            llog.info("WindowManager", "tapHandledByWinMgr", "ID=Button1Down, reason=bad-client name/invalid window. client name =%s", "",c.name)
            s_tapComboBeingHandled = true
            c.signalHandled = true
        end
        return
    end
    
    -- eat taps when the Taps are blocked
    if liglIsTapsBlocked(window) then
        llog.info("WindowManager", "tapHandledByWinMgr", "ID=Button1Down, reason=screenPaused, screenSaver=%s", "", 
            tostring(findWindow("SS", "screenSaver") ~= nil) )
        logActiveTriggers()
        s_tapComboBeingHandled = true
        c.signalHandled = true
        return
    end
    
    logStrings({"client button 1 press", c.name})
    
    c.signalHandled = false
    local focusedClient = client.focus
    local focusedWindow = focusedClient and windowTableFindByClient(focusedClient)
    
    if focusedWindow and focusedWindow.params and focusedWindow.params.M then
        log("tap 1 while modal dialog has focus")
        
        -- eat any and all taps/gestures not directed at the modal window or KB
        -- Note: taps only go to KB if the focused window is RKB.
        -- Note: if the focused window is modal but the tapped client is obscurring
        -- the modal focused window let the tap go through
        if c ~= focusedClient and not isPairedWindow(focusedWindow, window) and 
            (focusedWindow.params.M == "dismissible" or not focusedClient:is_obscured_by(c)) then
            
            llog.info("WindowManager", "tapHandledByWinMgr", "ID=Button1Down, reason=tapOffModal, modal=%s", "", focusedWindow.c.name)

            -- Taps off modal never go through to the window underneath.
            s_tapComboBeingHandled = true
            c.signalHandled = true

            -- If the modal dialog is dismissible we need to do the following.
            --      * Send the destroy signal to the dialog.
            --      * Set the focused client accordingly.
            if (focusedWindow.params.M == "dismissible") then
                focusedWindow.c:destroy()
                if focusedWindow.pairDismiss then
                    log("dismiss paired window")
                    focusedWindow.pairDismiss.c:destroy()
                end

                if not chrome_is_chrome_window(window) and window.params.L ~= "KB" then
                    log("tap off dismissible was not on chrome or keyboard; resetting chrome")
                    if chrome_is_up() then
                        chrome_lower()
                    end
                    notifyChromeToReset()
                end
            end
        else
            -- no focusable windows ignored inside setFocusedClient
            setFocusedClient(c)
        end
    elseif focusedWindow and focusedWindow.params and focusedWindow.params.L == "D"
        and window.params.N == "titleBar" then
        
        -- TODO this can probably be deleted. It covered taps on titlebar
        -- in reader before we had tap-away dialogs. Legacy code.
        log("tap on titleBar while non-modal dialog has focus")
        s_tapComboBeingHandled = true
        c.signalHandled = true
    elseif c.nofocus or window.params.NKF then
        log("non focusable window, do not eat the tap")
        setControlClient(c)
    elseif focusedClient == c then
        log("window already has focus, do not eat the tap")
        setControlClient(c)
    else
        -- check for current focus is on chrome and chrome is up
        log("focusable window")

        if focusedClient then
            -- check to see if tap was off of chrome while
            -- we are on chrome now
            if (chrome_is_up() or keyboard_is_visible()) and 
                    focusedWindow and chrome_is_chrome_window(focusedWindow) and 
                    not chrome_is_chrome_window(window) then
                llog.info("WindowManager", "tapHandledByWinMgr", "ID=Button1Down, reason=chromeDown", "tap will result in chrome being dismissed")
                c.signalHandled = true
                s_tapComboBeingHandled = true
            end
        end 
        
        setFocusedClient(c)
    end

end

--[[
button 1 is screen tap
set c.signalHandled to true to block button from being
propogated to the client
]]--
function handleClientButton1Release(c)
    if s_tapComboBeingHandled then
        c.signalHandled = true
        s_tapComboBeingHandled = false
    end
end

--[[
button 0 is a generic mapping to any button
set c.signalHandled to true to block button from being
propogated to the client
]]--
function handleClientButton0Press(c)
    log ("client button 0 press")
    if s_tapComboBeingHandled then
        llog.info("WindowManager", "tapHandledByWinMgr", "ID=Button0Down", "")
        c.signalHandled = true
    end
end

--[[
button 0 is a generic mapping to any button
set c.signalHandled to true to block button from being
propogated to the client
]]--
function handleClientButton0Release(c)
    log ("client button 0 press release")
    if s_tapComboBeingHandled then
        llog.info("WindowManager", "tapHandledByWinMgr", "ID=Button0Up", "")
        c.signalHandled = true
    end
end
--[[
End Tap Handling
]]--

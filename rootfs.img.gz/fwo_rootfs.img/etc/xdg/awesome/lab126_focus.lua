-- Copyright (c) 2012 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

local focusHistory = {}

--[[
prints out current focus stack for debugging
]]--
function focusHistoryLogStack()
    local idx = 1
    for k, v in ipairs(focusHistory) do
        log("focus client (idx=%d), %s", idx, v.name)
        idx = idx + 1
    end
end

--[[
remove client from focus history stack
@params c client to remove
]]--
function focusHistoryDeleteClient(c)
    if not c then
        return
    end
    
    for k, v in ipairs(focusHistory) do
        if v == c then
            table.remove(focusHistory, k)
            break
        end
    end
end

--[[
get next focusable client
]]--
function focusHistoryNext()
    log("+++++ focusHistoryNext")
    
    local nextFocusClient = nil
    for k, v in ipairs(focusHistory) do
        if not v.hiddenLayer then 
            log("found next focusable client %s", v.name)
            nextFocusClient = v
            break
        end 
    end
    
    return nextFocusClient
end

--[[
insert client into focus history stack
@params idx index to enter at
@params c client to insert
]]--
function focusHistoryInsert(idx, c)
    if not c then
        return
    end
    
    log("+++++focusHistoryInsert")
    
    -- Remove the client if its in stack
    focusHistoryDeleteClient(c)
    -- add at index
    table.insert(focusHistory, idx, c)
end

--[[
search focus history for a matching client
]]--
function focusHistorySearch(f)
    log("+++++ focusHistorySearch")
    
    local foundClient = nil
    for k, v in ipairs(focusHistory) do
        if f(v) then 
            log("found focusable client %s", v.name)
            foundClient = v
            break
        end 
    end
    
    return foundClient
end
--[[
sets the focused to the new client
c : client to switch focus to
]]--
function setFocusedClient(c)

    log("+++++ setFocusedClient")
    
    if not c then
        log("setFocusedClient called with nil client")
        return
    end

    -- try this to see if it helps wit the phantom focus lose
    if c == client.focus then
        log("client already has focus")
    end

    local window = windowTableFindByClient(c)

    if not window or not window.params then
        return
    end

    if window.params.HIDE == "background" then
        log("backgrounded windows dont take focus")
        return
    end

    -- if client does not accept focus then
    -- bail
    if c.nofocus or window.params.NKF then
        log("==== client does not accept focus")

        -- set as control window even if
        -- it does not take focus.
        setControlClient(c)
        return
    end

    --[[
        If client is a screensaver, focus it.
        If there is a screensaver, insert client into the focus history
        before the first screensaver but do not focus it.
        If there are no screensavers, focus client.
    ]]--
    local ssCount = 0
    local alertDialogCount = 0

    if window.params.L ~= "SS" then
        for i, v in ipairs(awful.client.data.focus) do
            -- still a little quicker in the loop to use a
            -- starts with rather than look up client
            if stringStartsWith(v.name, "L:SS") then
                ssCount = ssCount + 1
            else
                break
            end
        end

        -- look for a non hidden pillow alert
        local existingAlert = findWindow("D", "pillowAlert")
        if window.params.N ~= "pillowAlert" and existingAlert and not existingAlert.c.hiddenLayer then
            alertDialogCount = 1
        end
    end

    -- check for an app coming in underneath a dialog with matching ID
    -- TODO there ought to be a more systematic way to handle this that is
    -- less one off for this particular case. But there are cases where a window
    -- can come in underneath and still keep key focus. For now this code
    -- handles a very specific case. On app launch, if an shows a dialog
    -- contextually bound to the app and then AFTERWARDS shows its application
    -- window. Inthis case we leave the focus on the dialog and insert the
    -- app underneat the dialog in the focus stack
    if window.params.L == "A" and window.params.N == "application" then

        local topOfFocusStack = windowTableFindByClient(focusHistoryNext())
        if topOfFocusStack and topOfFocusStack.params.L == "D" and not topOfFocusStack.c.hiddenLayer and
                    topOfFocusStack.params.ID and window.params.ID == topOfFocusStack.params.ID then
             log("new focus insert underneath active dialog")
             alertDialogCount = 1
        end
    end

    if ssCount > 0 or alertDialogCount > 0 then
        focusHistoryInsert(ssCount + alertDialogCount + 1, c)
    else
        -- change the focus
        log("focus set to : %s", c.name)
        focusHistoryInsert(1, c)
        client.focus = c
    end
end


--[[
remove client from focus stack and fix focus if need be
@params c 
]]--
function removeFromFocusHistory(c)
    if not c then
        return
    end
    
    log("+++++remove from focus %s", c.name)
    
    -- remove client from focus history when it forces hide
    focusHistoryDeleteClient(c)
        
    -- adjust focus if this was the focus
    if not client.focus or client.focus == c then
        setFocusedClient(focusHistoryNext())
    end
    
    if c == getControlClient() then
        log("control client unmanaged - set it to focused client")
	setControlClient(client.focus)
        -- karuna s_controlClient = client.focus
    end
end

-- Awesome client currently assosiated with a keyboard
g_keyboardDialogClient = nil

function getKeyboardDialogClient()
    return g_keyboardDialogClient
end

--[[
awesome callback sent when focus is set to new client
]]--
function handleClientFocus(c) 

    local expectedFocusedClient = focusHistoryNext()

    if expectedFocusedClient and c ~= expectedFocusedClient then
        -- There is an issue that we see speriodic focus 
        -- events from outside of the winmgr. This is to 
        -- catch that case. I need to further investigate
        -- if we want to fix this onthe awesome c side instead
        log("outside focus event rejected")
        client.focus = expectedFocusedClient
        return
    end
    
    logStrings({"focus changed to ", c.name}) 

    if s_tempHackToStopFocusAfterChromeRaise then
        log("temp hack in place for home button chroming")
        s_tempHackToStopFocusAfterChromeRaise = false
        return
    end

    local window = windowTableFindByClient(c)
    
    if not window or not window.params then
        return
    end

    if c.name then
        setControlClient(c)
    
        -- if focus goes off of chrome while chrome is up then 
        -- dismiss chrome. the exception is titleBar or pillowAlert
        -- or a dialog that marks itself as Chrome
        if chrome_is_up() then
            
            if not chrome_is_chrome_window(window) and 
                    not (window.params.L == "D" and window.params.N == "pillowAlert") then
                log("user tapped off of chrome hiding chrome")
                chrome_lower()
            end
        end    
    
        if window.params.RKB then
            logStrings ({"setting g_keyboardDialogClient to ", c.name})
            g_keyboardDialogClient = c

            
            log("++++++++++++OPENING KB ON keyboard dialog take focus")
	    setLipcStringProp("com.lab126.keyboard", "open", ":" .. window.params.RKB .. ":256")
        end

        if application_is_application_window(window) or 
            window.params.L == "SS" then
            setAppOrientation(window.params.O)
        else 
            if getActiveApplicationWindow() then 
                setAppOrientation(getActiveApplicationWindow().params.O)
            end
        end
        -- configure Grip suppression based on currently focused window
	configureGSForFocusedWindow(c)
	configureFsrWindowToVisibleLayer(window)
    end

end

--[[
awesome callback sent when a client loses focus
]]--
function handleClientUnfocus(c) 

    log("focus lost from %s", c.name)

    -- if the removed dialog is the keyboard dialog
    if g_keyboardDialogClient == c then
        log ("g_keyboardDialogClient lost focus")
        
        -- call KB to HIDE
        log("++++++++++++CLOSING KB ON FOCUS LOST")
	setLipcStringProp("com.lab126.keyboard", "close", ":256")
        
        log ("clearing g_keyboardDialogClient")
        g_keyboardDialogClient = nil
    end
end

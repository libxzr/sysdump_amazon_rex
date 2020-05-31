-- Copyright (c) 2011-2016 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

-- layering window of current application
local g_activeApplicationWindow = nil

function getActiveApplicationWindow()
    return g_activeApplicationWindow
end

function isActiveAppId(id)
    return g_activeApplicationWindow and g_activeApplicationWindow.params.ID == id
end

function isActiveAppAlias(id)
    if g_activeApplicationWindow and g_activeApplicationWindow.params.ALS then
       log("Matching with active window alias")
       return g_activeApplicationWindow.params.ALS == id
    end
    return false
end

--[[
size application client c's window based on space between 
bottom and top anchored applicationLayer clients
]]--
local function prv_position_application(appLayer, appWindow)

    local topOffset = 0
    local bottomOffset = 0
    
    log("application is normal")
    
    -- normal 
    topOffset = chrome_get_persistent_top_offset(appWindow.params.PC)
    bottomOffset = appLayer.bottomOffset

    -- use orientation screen size which will correct for the case
    -- that the orientation is in process of changing but has not yet.
    -- This eleminates an unneeded resize on app launch
    local screenWidth
    local screenHeight 
    screenWidth, screenHeight = getOrientationScreenSize()
    
    -- set the app client geometry
    local appClientGeometry = {}
    appClientGeometry.x = g_screenOne.geometry.x
    appClientGeometry.y = g_screenOne.geometry.y + topOffset
    appClientGeometry.height = screenHeight - (topOffset + bottomOffset)
    appClientGeometry.width = screenWidth

    print_table_contents("new appClientGeometry", appClientGeometry, "")

    changeWindowGeometry(appWindow, appClientGeometry)
    
    if appWindow.params.ID == "blankBackground" then
        setClientLayer(appWindow, LAYERS.BLANK)
    else
        setClientLayer(appWindow, LAYERS.APP)
    end
end 


--[[
position tiled bottom to top
]]--
local function prv_position_tiled_bottom(appLayer, tiledBottomWindow)
    local clientGeometry = getClientGeometry(tiledBottomWindow.c)
    
    logStrings({"layout: bottom overlay with height : ", clientGeometry.height})

    appLayer.bottomOffset = clientGeometry.height

    -- fix up geometry if need be
    if clientGeometry.x ~= 0 or 
            clientGeometry.y ~= g_screenOne.geometry.height - clientGeometry.height or 
            clientGeometry.width ~= g_screenOne.geometry.width then

        -- anchor bottom
        clientGeometry.x = 0
        clientGeometry.y = g_screenOne.geometry.height - clientGeometry.height

        --set back the geometry
        changeWindowGeometry(tiledBottomWindow, clientGeometry)
    end
    
    setClientLayer(tiledBottomWindow, LAYERS.APP)
end

--[[
loop through and adjust all app windows
]]--
function application_resize_all_app_clients(appLayer)
    -- adjust all application windows to what is left
    windowTableForEach(function(window)
        if window.params and window.params.L == "A" and window.params.N == "application" and window.c then
            logStrings({"found an application to adjust - ", window.c.name})
            prv_position_application(appLayer, window)
        end
    end )
end

-- relayout the whole application layer
-- note the declaration of self because this 
-- func is not declared with : operator
function applicationLayer_layout(self, updatedWindow, action)
    logStrings({"+++++applicationLayer_relayout ", updatedWindow.c.name})

    local redoAllAppWindows = false 

    -- when a new application comes in we can handle just it
    -- because nothing depends on app, rather app reacts to 
    -- to everybody elses sizes
    if updatedWindow.params.N == "application" then

        if action == "added" and not findWindow("SS", "screenSaver") or 
            (action == "updatedParams" and client.focus == updatedWindow.c) then
               if isValidActiveApp(updatedWindow) then
                  setAppOrientation(updatedWindow.params.O)
               end
        end
    
        if action ~= "removed" then

            log("updated application window, just resize it to fit")
            
            -- handle older ASB and WS flags if set
            -- should be able to remove this once we convert over
            -- to only use the PC flag
            if not updatedWindow.params.PC then
                if updatedWindow.params.WS then
                    updatedWindow.params.PC = "N"
                elseif updatedWindow.params.ASB then
                    updatedWindow.params.PC = "TS"
                else
                    updatedWindow.params.PC = "T"
                end
            end
            
            if updatedWindow.params.ID == "blankBackground" then

                log("handling special blankBackground app window")
                
                -- the blankBackground app is a special app window
                -- that exists to keep lowered windows such as
                -- keyboard, header, footer, etc. invisible
                -- even in the case where there is no proper
                -- app window. It does not take focus and always
                -- should be lower on the app layer 
                prv_position_application(self, updatedWindow)
                
                return
            end

            if action == "added" then
                -- when new app window is added it becomes active app
                application_update_active_app_window(updatedWindow)
            elseif action == "updatedParams" then 
                if updatedWindow == g_activeApplicationWindow then
                  
                   if updatedWindow.oldParams.PC ~= updatedWindow.params.PC then
                       chrome_set_app_chrome_state(updatedWindow)
                   end
                    
                   updateGSSettings(updatedWindow);
                   updateWTSettings(updatedWindow);
                   setActiveAppTitle(updatedWindow.c.name)
                end
                
                -- if there is a change in the hide params then update the client layer accordingly 
                if updatedWindow.params and updatedWindow.params.HIDE ~= updatedWindow.oldParams.HIDE then

                    -- if name has changed, HIDE is not set and the window is hidden
                    -- then raise it and focus it
                    if not updatedWindow.params.HIDE and updatedWindow.c.hiddenLayer then
                        -- update it as current active application
                        application_update_active_app_window(updatedWindow)
                        setFocusedClient(updatedWindow.c)
                    end 

                    -- setClientLayer will check for the HIDE param 
                    -- and set the window to the correct layer
                    setClientLayer(updatedWindow, LAYERS.APP)
                end
              
            end

            -- just do this client
            prv_position_application(self, updatedWindow)

            -- set focus after positioning as focus change requires geometry and 
            -- stacking order to be set already
            if action == "added" then
                setFocusedClient(updatedWindow.c)
            end

        else
            log("removed application client")
            
            -- if this is the active application and chrome is up, take down chrome
            if updatedWindow == g_activeApplicationWindow then
                
                if chrome_is_up() then
                    log("remove client is g_activeApplicationWindow, also lower chrome")
                    chrome_lower()
                end

                local found = false
                -- look in focus stack for the next application
                for k, v in ipairs(awful.client.data.focus) do
                    if v ~= nil then
                        local win = windowTableFindByClient(v)
                        if win and 
                           application_is_application_window(win) and 
                           isValidActiveApp(win) then
                               log("found new app to be global active app")
                               application_update_active_app_window(win)
                               found = true
                               break
                        end
                    end
                end
                
                if found == false then
                    llog.info("lua", "applicationLayer_layout", "", "active application removed, could not find another application in focus stack")
                    application_update_active_app_window(nil)
                end
    
            end
        end
        
        logTimeStamp("end application window layout")
        return;

    elseif updatedWindow.params.N == "titleBar" then
        -- backwards compat, sending titlebar to chrome layer
        log("titlebar being sent to chrome layer")
        local chromeLayer =  findLayer("C")
        chromeLayer_layout(chromeLayer, updatedWindow, action)
        
    elseif updatedWindow.params.N == "tiledBottom" then
    
        -- NOTE this is not in the UI spec at this time and 
        -- should not be used in production
        if action == "removed" then
            self.bottomOffset = 0
        else
            prv_position_tiled_bottom(self, updatedWindow)
        end
        
        redoAllAppWindows = true
    else
        log("application layer other window")
        setClientLayer(updatedWindow, LAYERS.APP)
        
    end


    if redoAllAppWindows then 
        logTimeStamp("++++ calling redo apps")
        application_resize_all_app_clients(self)
        logTimeStamp("++++ done calling")
    end

end 

--[[
Returns true if window is an application on applciation layer
]]--
function application_is_application_window(w)
    return (w.params.L == "A" and w.params.N == "application")
end

-- checks if it a valid active application
function isValidActiveApp(appWindow)
  if appWindow and 
     appWindow.params and 
     appWindow.params.HIDE and 
     appWindow.params.ID ~= "blankBackground" then
         return false
  end
  return true
end

--- Update active application window
-- If client's name has "L:A_N:application" and active application is different,
-- set active application window to client
-- @param c Client
-- updateActiveApplicationWindow
function application_update_active_app_window(appWindow)
    if appWindow == g_activeApplicationWindow then
        log("active app not changing")
        return
    end


    if not isValidActiveApp(appWindow) then
       return  
    end 
    
    -- set the active application before footerBar and searchBar update
    g_activeApplicationWindow = appWindow

    -- TODO: remove titleBarVisibilityChange events after adding X11 window visible events in CVM
    -- Refer JSEVENONE-3100
    local screenSaver = findWindow("SS", "screenSaver")
    local activeScreenSaver = findWindow("SS", "activeSS")
    local isScreenSaverUp = ((screenSaver ~= nil) or (activeScreenSaver ~= nil))
    if appWindow and appWindow.params.PC ~= 'N' and not isScreenSaverUp then
        sendLipcEvent("titleBarVisiblityChange",{"visible"})
    else
        sendLipcEvent("titleBarVisiblityChange",{"invisible"})
    end

    setActiveAppTitle(appWindow and appWindow.c.name or "")

    if not g_activeApplicationWindow then
        -- do not do anything - we will update chrome etc. when new app will appear
        return
    end

    log("g_activeApplicationWindow is " .. tostring(appWindow.c.name))
            
    local chromeLayer = findLayer("C")
            
    --set footer and search bar accordingly
    chrome_check_bars(chromeLayer)
    
    chrome_set_app_chrome_state(g_activeApplicationWindow)

    log("look at all dialogs")
    -- hide all dialogs that dont match the new owner
    -- TODO look at doing this on the app go lipc event 
    -- as it should fire earlier. If there are orphaned 
    -- dialogs that match incoming app unorphan them
    windowTableForEach(function(window)
        if window.params.L == "D" or ( window.params.L == "C" and window.params.N == "searchResults" ) then
            logStrings ({"look at window ", window.c.name})
            logStrings ({"owner is ", window.owner})
            if window.owner == "system" or isActiveAppId(window.owner) or isActiveAppAlias(window.owner) then
                log ("found good dialog")
                if window.c.hiddenLayer or window.orphandedDialog then
                    log ("unorphan")
                    local layer = nil
                    if window.params.L == "D" then
                        window.orphandedDialog = false
                        layer = findLayer("D")
                    elseif window.params.N == "searchResults" then
                        window.orphandedDialog = false
                        layer = findLayer("C")
                    end

                    if layer ~= nil then
                        layer:layoutFunc(window, "added")
                    end
                end
            else
                logStrings({"lowering orphaned window ", window.c.name})
                window.orphandedDialog = true
                setClientLayer(window, LAYERS.HIDDEN)
            end
        end
    end)

end



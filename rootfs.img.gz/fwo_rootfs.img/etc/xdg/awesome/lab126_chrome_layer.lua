-- Copyright (c) 2011-2016 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

--- Lipc properties
local s_propertyChromeState
local s_focusChrome

-- NOTE s_chromeIsUp differs
-- from s_propertyChromeState in that
-- the latter is a lipc property and changes when 
-- from the outside, s_chromeIsUp only changes once
-- chrome is actually brought up
local s_chromeIsUp = false

--[[
Getter for s_chromeIsUp bool
]]--
function chrome_is_up()
    return s_chromeIsUp
end

--[[
validates that the a given chrome window is the correct chrome
for the current window
@params window      : window to validate
@return                  
  false if not valid
  true if valid
]]--
local function prv_validate_window(window)

    if not window or not window.params or 
            not (window.params.L == "C" or (window.params.CD and not window.params.HIDE)) then
        return false
    end

    local matchToAppOrAlias = false
    
    -- no current applciation, only system bars are valid
    if not getActiveApplicationWindow() then
        log("no active app, only system provided bars valid")
    else
        if window.params.N == "footerBar" then
            -- footerbar matched to current app
            matchToAppOrAlias = true
        elseif window.params.N == "topBar" then
            -- search topBars match to custom search bar apps
            -- app toolbar matched to current app
            if (getActiveApplicationWindow().params.CSB and 
                    window.params.BARTYPE == "S") or
                    window.params.BARTYPE == "A" then
                matchToAppOrAlias = true
            end
        else
            -- other chrome windows are assumed to be okay regardless
            return true
        end
    end

    -- match to app or app alias (ALS param) or system
    if matchToAppOrAlias then
        -- bar ID must match that of current app or current app alias (ALS)
        return isActiveAppId(window.params.ID) or isActiveAppAlias(window.params.ID)
    else
        -- ID must be system
        if window.params.ID ~= "system" then
            return false
        else
            return true
        end
    end
    
    return true   
end

--[[
layers a single "bar" window based on its own properties and the 
application setting chrome state
@params window      : chrome window to layer
@params appWin      : application window settign chrome state
]]--
local function prv_layer_chrome_window(window, appWin)
    local returnVal = false
    if prv_validate_window(window) then 
        if not appWin then
            log("no application window, hide chrome window")
            setClientLayer(window, LAYERS.HIDDEN)
        elseif (window.params.N == "topBar" and string.find(appWin.params.PC, window.params.BARTYPE)) or
                window.params.TV then
            setClientLayer(window, LAYERS.CHROME)        
        elseif s_chromeIsUp then
            setClientLayer(window, LAYERS.CHROME)
            returnVal = true
        else
            local focusedWindow = getFocusedWindow()
            if focusedWindow and focusedWindow ~= window and window.params.PAIRID and window.params.PAIRID == focusedWindow.params.PAIRID then
                log("PAIRED chrome " .. window.params.N)
                -- PAIRED with focused dialog leaveup
                setClientLayer(window, LAYERS.CHROME)
            else
                -- chrome dialogs get dismissed on lower
                if window and window.params.CD then
                    window.c:destroy()
                else
                    setClientLayer(window, LAYERS.HIDDEN)
                end
                
                removeFromFocusHistory(window.c)
            end
        end
    else
        -- any "invalid" window on the chrome layer shoud be lowered
        if not window.c.hiddenLayer and (window.params.L == "C" or window.params.CD) then
            setClientLayer(window, LAYERS.HIDDEN)
        end
    end

    return returnVal
end


--[[
layer (adjust z order) of all valid chrome windows
@params chromeLayer     : chrome layer object
@params appWin          : application defining current chrome
@return
    true if a window was raised
]]--
local function prv_apply_layer_rules(chromeLayer, appWin)
    log("+++++ apply layer rules")

    local raised = false
    -- look at all chrome windows
    windowTableForEach(function(window, appWin)

        if prv_layer_chrome_window(window, appWin) then
            raised = true
        end
    end, appWin)

    return raised
end

--[[
raises the correct chrome windows on the screen
]]--
function chrome_raise() 
   
    local old_s_chromeIsUp = s_chromeIsUp
    if s_chromeIsUp then
        log("chrome already up, do nothing")
        return;
    end

    log("adding chrome++++")

    local chromeLayer = findLayer("C")
    
    s_chromeIsUp = true
    
    if prv_apply_layer_rules(chromeLayer, getActiveApplicationWindow()) then
        log("Chrome was raised")
        s_propertyChromeState.value = 1

        -- active search bar takes focus when chrome comes up
        setFocusedClient(chromeLayer.activeBars["S"].win.c)
    else
        log("no chrome to raise")
        s_propertyChromeState.value = 0
        s_chromeIsUp = false
    end

    if old_s_chromeIsUp ~= s_chromeIsUp then
        -- emit chrome visbility change event
        local chromeVisiblity = s_chromeIsUp and "chromeUp" or "chromeDown"
        sendLipcEvent("chromeVisiblityChange", { chromeVisiblity })
    end
end

--[[
lowers the chrome to below layer
]]--
function chrome_lower() 
    if not s_chromeIsUp then
        log("no chrome to remove, do nothing")
        return;
    end
   
    s_chromeIsUp = false
    s_propertyChromeState.value = 0
    
    log("lowering chrome")

    local chromeLayer = findLayer("C")

    -- remove search bar from focus stack first to avoid 
    -- extra focus jumps
    if chromeLayer.activeBars["S"].win then
        removeFromFocusHistory(chromeLayer.activeBars["S"].win.c)
    end

    prv_apply_layer_rules(chromeLayer, getActiveApplicationWindow())
    
    -- when lowering chrome if KB is visible
    -- expect it to go down.
    -- If screensaver window is coming up then avoid waiting 
    -- for kb hide, as all the triggers will be ingored when 
    -- screensaver is present.
    local ssWindow = findWindow("SS", "screenSaver")
    if keyboard_is_visible() and not ssWindow then
        ligl_wait_for_kb_hide()
    end
    
    -- emit chrome visibility change event
    sendLipcEvent("chromeVisiblityChange", { "chromeDown" })
end

--[[
find the valid chrome window with the given name/role
@params name        : name/role, ex: "footerBar" or "searchBar"
@return
    window if found
    otherwise nil
]]--
local function prv_find_valid_window(name)
    return windowTableFindByFunc (function(window)
        log("looking for " .. name)
        if window.params and
            window.params.N == name and 
            prv_validate_window(window) then
            log("found new valid chrome window " .. window.c.name)
            return true
        end
    end)

end

--[[
positions and layers media bar
@params chromeLayer         : chrome layer as define in lab126LayerLogic
@params mediaBarWindow      : window as defined in lab126LayerLogic
]]--
local function prv_position_media_bar(chromeLayer, mediaBarWindow)

    -- fix up mediabar geometry if need be
    local clientGeometry = getClientGeometry(mediaBarWindow.c)
    
    if clientGeometry.x ~= 0 or 
        clientGeometry.y ~= g_screenOne.geometry.height - clientGeometry.height - chromeLayer.footerBarOffset or 
        clientGeometry.width ~= g_screenOne.geometry.width then

        log("sizing mediaBar")

        -- anchor bottom above footerbar
        clientGeometry.x = 0
        clientGeometry.y = g_screenOne.geometry.height - clientGeometry.height - chromeLayer.footerBarOffset
        clientGeometry.width = g_screenOne.geometry.width

        print_table_contents("mediaBarGeom", clientGeometry, "")

        --set back the geometry
        changeWindowGeometry(mediaBarWindow, clientGeometry)

    end
    
    if chrome_is_up() and prv_validate_window(mediaBarWindow) then
        log("new chrome window moved to above")
        setClientLayer(mediaBarWindow, LAYERS.CHROME)
    else
        log("new chrome window moved to below")
        setClientLayer(mediaBarWindow, LAYERS.HIDDEN)
    end
    
    chromeLayer.mediaBarOffset = clientGeometry.height
end

--[[
positions and layers footer bar
@params chromeLayer         : chrome layer as define in lab126LayerLogic
@params footerBarWindow     : window as defined in lab126LayerLogic
]]--
local function prv_position_footer_bar(chromeLayer, footerBarWindow)
        local isCurrentFooterBar = prv_validate_window(footerBarWindow)
        
        log("footerBar " .. tostring(footerBarWindow.params.ID) .. "," .. tostring(isCurrentFooterBar))
        
        -- fix up footer geometry if need be
        local clientGeometry = getClientGeometry(footerBarWindow.c)
        
        if clientGeometry.x ~= 0 or 
            clientGeometry.y ~= g_screenOne.geometry.height - clientGeometry.height or 
            clientGeometry.width ~= g_screenOne.geometry.width then

            log("sizing footerBar")

            -- anchor bottom
            clientGeometry.x = 0
            clientGeometry.y = g_screenOne.geometry.height - clientGeometry.height
            clientGeometry.width = g_screenOne.geometry.width

            print_table_contents("footerBarGeometry", clientGeometry, "")

            --set back the geometry
            changeWindowGeometry(footerBarWindow, clientGeometry)

        end
        
        if isCurrentFooterBar then
        
            chromeLayer.activeFooterBar = footerBarWindow
            chromeLayer.footerBarOffset = clientGeometry.height
        
            local mediaBarWindow = findWindow("C", "mediaBar")
            if mediaBarWindow then
                prv_position_media_bar(chromeLayer, mediaBarWindow)
            end 
            
        end
        
        if chrome_is_up() and isCurrentFooterBar then
            log("new chrome window moved to above")
            setClientLayer(footerBarWindow, LAYERS.CHROME)
        else
            log("new chrome window moved to below")
            setClientLayer(footerBarWindow, LAYERS.HIDDEN)
        end
end

--[[
switches top to new top bar, lowering old one if there
@params chromeLayer
@params win             : new window to set
]]--
local function prv_choose_top_bar(chromeLayer, win)

    -- check to see is new window is valid
    local isValid = prv_validate_window(win)

    if not isValid then
        log("bar not valid %s", win.c.name)
        setClientLayer(win, LAYERS.HIDDEN)
        return false
    end

    -- if valid and different from current active bar, lower the old one
    -- and set
    if chromeLayer.activeBars[win.params.BARTYPE].win ~= win then
        if chromeLayer.activeBars[win.params.BARTYPE].win then
            --lower the old one
            setClientLayer(chromeLayer.activeBars[win.params.BARTYPE].win, LAYERS.HIDDEN)
        end

        chromeLayer.activeBars[win.params.BARTYPE].win = win
    end
end

--[[
position any top oriented bar
@params chromeLayer
@params win
@params offset
]]--
local function prv_position_top_bar(chromeLayer, win, offset)

    if not win then
        return offset
    end

    logTimeStamp("start get geom")
    local clientGeometry = getClientGeometry(win.c)
    logTimeStamp("end get geom")

    -- anchor top, below offset
    clientGeometry.x = 0
    clientGeometry.y = offset
    clientGeometry.width = g_screenOne.geometry.width

    print_table_contents("top bar geom", clientGeometry, "")

    chromeLayer.activeBars[win.params.BARTYPE].y = clientGeometry.y
    chromeLayer.activeBars[win.params.BARTYPE].height = clientGeometry.height

    --set back the geometry
    logTimeStamp("start set geom")
    changeWindowGeometry(win, clientGeometry) 
    logTimeStamp("end set geom")

    -- return adjusted offset
    return clientGeometry.y + clientGeometry.height

end

--[[
Set top bars, all top achored
@params chromeLayer
]]--
function chrome_position_top_bars(chromeLayer)
    logTimeStamp("start layer top bars")
    local offset = prv_position_top_bar(chromeLayer, chromeLayer.activeBars["T"].win, 0)
    offset = prv_position_top_bar(chromeLayer, chromeLayer.activeBars["S"].win, offset)
    prv_position_top_bar(chromeLayer, chromeLayer.activeBars["A"].win, offset)
    logTimeStamp("done layer top bars")
end

--[[
finds correct footer bar and makes it the active one
@params chromeLayer             : chrome layer as defined in lab126LayerLogic
]]
local function prv_set_footer_bar(chromeLayer)
    local newFooterBar = prv_find_valid_window("footerBar")
    
    -- if no updatedWindow was found just set it as such
    if not newFooterBar then
        log("no matching footerBar found")
        chromeLayer.activeFooterBar = nil
        chromeLayer.footerBarOffset = 0
        -- NOTE making the decision to NOT adjust alerts position
        -- in case where an alert is up and chrome is up and the
        -- footer is removed. It is not worth the flicker
        
        local mediaBarWindow = findWindow("C", "mediaBar")
        if mediaBarWindow then
            prv_position_media_bar(chromeLayer, mediaBarWindow)
        end 
    
        return
    end
    
    
    chromeLayer.activeFooterBar = newFooterBar
    
    -- if the heights match up just set the new one, otherwise
    -- we need to adjust mediaBar
    local clientGeometry = getClientGeometry(newFooterBar.c)
    if clientGeometry.height ~= chromeLayer.footerBarOffset then
        log("footerBar height updated to " .. clientGeometry.height)
        chromeLayer.footerBarOffset = clientGeometry.height
        
        -- update media bar if there
        local mediaBarWindow = findWindow("C", "mediaBar")
        if mediaBarWindow then
            prv_position_media_bar(chromeLayer, mediaBarWindow)
        end
         
        return
    end
end

--[[
finds correct top bar and makes it the active one
@params chromeLayer     : chrome layer as defined in lab126LayerLogic
@params N               : topbar name
@params BARTYPE         : type of topbar
]]--
local function prv_find_and_set_top_bar(chromeLayer, N, BARTYPE)

    -- look for new topBar
    local newBarFound = windowTableFindByFunc (function(window)
        if window.params and
            window.params.N == N and 
            window.params.BARTYPE == BARTYPE and
            prv_validate_window(window) then
            log("found new valid chrome search bar window " .. window.c.name)
            return true
        end
    end)
    
    if not newBarFound then
        log ("prv_find_and_set_top_bar :: no search bar found")

        chromeLayer.activeBars[BARTYPE].win = nil

    else
        prv_choose_top_bar(chromeLayer, newBarFound)
        prv_layer_chrome_window(newBarFound, getActiveApplicationWindow())
    end
end


--[[ 
chrome layer callback called whenever a chrome window is managed
or unmanaged
@params self            : chrome layer
@params updatedWindow   : window object as defined in lab126LayerLogic
@params action          : "removed", "updatedGeometry", "updatedParams" or "added"
]]--
function chromeLayer_layout(self, updatedWindow, action)


    if action == "removed" then
    
        log("chrome layer removed");
        
        -- handle removal of footerbar or searchbar now that we can have
        -- multiple. We may need to adjust offsets and or move media bar if
        -- heights are not the same. In such cases. look for the new activeSearchBar
        -- or activeFooterBar and substitute as updatedWindow and continue as if
        -- it just came in
        
        if updatedWindow == self.activeFooterBar then
            -- look for new activeFooterBar
            prv_set_footer_bar(self)
            
        elseif updatedWindow.params.N == "topBar" and
                updatedWindow == self.activeBars[updatedWindow.params.BARTYPE].win then

            self.activeBars[updatedWindow.params.BARTYPE].win = nil
            self.activeBars[updatedWindow.params.BARTYPE].height = 0
            self.activeBars[updatedWindow.params.BARTYPE].y = 0

            if updatedWindow.params.BARTYPE ~= "A" then
                local appLayer = findLayer("A")
                application_resize_all_app_clients(appLayer)
            end
        elseif updatedWindow.params.N == "mediaBar" then
            self.mediaBarOffset = 0
            
        end
        
        return
        
    end
    

    -- backward compat handle older search bar role
    if updatedWindow.params.N == "searchBar" then
        updatedWindow.params.N = "topBar"
        -- hack in bartype
        updatedWindow.params.BARTYPE = "S"
    end
    
    -- backward compat handle older titlebar role
    if updatedWindow.params.N == "titleBar" then
        updatedWindow.params.L = "C"
        updatedWindow.params.N = "topBar"
        -- hack in bartype
        updatedWindow.params.BARTYPE = "T"
    end
    
    if (updatedWindow.params.N == "footerBar") then
    
        prv_position_footer_bar(self, updatedWindow)
        
    elseif (updatedWindow.params.N == "topBar") then
        
        log("updated/added a search bar");

        -- TODO caling validate an extra time here, remove 
        --local isActiveBar = prv_validate_window(updatedWindow)
        
        -- title bar force mode keeps titlebar up 
        if updatedWindow.params.BARTYPE == "T" and
                updatedWindow.params.TV then
            liglUnpausedRectPrioritySpinnerIsActive(true)
        else
            liglUnpausedRectPrioritySpinnerIsActive(false)
        end

        if action ~= "updatedParams" then
            prv_choose_top_bar(self, updatedWindow)
            chrome_position_top_bars(self, updatedWindow)
        end

        prv_layer_chrome_window(updatedWindow, getActiveApplicationWindow())
        
        -- when valid top bars change update apps
        -- TODO could optimize around only updating 
        -- apps with persistent chrome of this topbar
        -- but this is not too common
        if action ~= "updatedParams" then
            local appLayer = findLayer("A")
            application_resize_all_app_clients(appLayer)
        end

    elseif (updatedWindow.params.N == "mediaBar") then
        
        prv_position_media_bar(self, updatedWindow)

    elseif (updatedWindow.params.N == "searchResults") or (updatedWindow.params.N == "searchBarPopup") then
    
        updatedWindow.clientPositioned = true
        
        log("search results window added");
        
        if updatedWindow.params.RC then
            dialog_borders_and_corners(updatedWindow)
            --updatedWindow.needDialogBorders = true
        end
        
        if (chrome_is_up() and prv_validate_window(updatedWindow)) or
            (getActiveApplicationWindow() and getActiveApplicationWindow().params.PC == "TS")  then
            log("chrome search results window moved to above")
            setClientLayer(updatedWindow, LAYERS.CHROME)
            setFocusedClient(updatedWindow.c)
        else
            log("new chrome window moved to below")
            setClientLayer(updatedWindow, LAYERS.HIDDEN)
        end

    else
        updatedWindow.clientPositioned = true
        
        if chrome_is_up() and prv_validate_window(updatedWindow) then
            log("new chrome window moved to above")
            setClientLayer(updatedWindow, LAYERS.CHROME)
            setFocusedClient(updatedWindow.c)
        else
            log("new chrome window moved to below")
            setClientLayer(updatedWindow, LAYERS.HIDDEN)
        end
    end
end

--[[
validate all of the bars are correct
find and setup the valid one
@params chromeLayer         : chrome layer as defined in lab126LayerLogic
]]--
function chrome_check_bars(chromeLayer)
    log("+++++chrome_check_bars")

    if not prv_validate_window(chromeLayer.activeFooterBar) then
        prv_set_footer_bar(chromeLayer)
    end
    
    -- check the top bars
    -- commenting out check on titlebar, we only support 1
    --if not prv_validate_window(chromeLayer.activeBars["T"].win) then
    --    prv_find_and_set_top_bar(chromeLayer, "topBar", "T")
    --end

    if not prv_validate_window(chromeLayer.activeBars["S"].win) then
        prv_find_and_set_top_bar(chromeLayer, "topBar", "S")
    end

    if not prv_validate_window(chromeLayer.activeBars["A"].win) then
        prv_find_and_set_top_bar(chromeLayer, "topBar", "A")
    end

end

--[[
raises or lowers the activeFooterBar and mediaBar
raise               : if true raise,otherwise lower
]]--
-- TODO I dont think I need this because keyboard and chrome are on different
-- layers now
function chrome_raise_lower_footer_bar(raise)
    local chromeLayer = findLayer("C")
    
    if not chromeLayer.activeFooterBar then
        log("no active footer bar")
        return
    end
    
    local mediaBar = findWindow("C", "mediaBar")
    if raise then
        logStrings({"raising footerbar to above ", chromeLayer.activeFooterBar.ID})
        setClientLayer(chromeLayer.activeFooterBar, LAYERS.CHROME)
        
        if mediaBar then
            setClientLayer(mediaBar, LAYERS.CHROME)
        end
    else
        logStrings({"lowering footerbar to above ", chromeLayer.activeFooterBar.ID})

        setClientLayer(chromeLayer.activeFooterBar, LAYERS.HIDDEN)
        
        if mediaBar then
            setClientLayer(mediaBar, LAYERS.HIDDEN)
        end
    end
end

--- Register Lipc properties
function chrome_register_properties()

    -- register property
    s_propertyChromeState = registerLipcIntProp("chromeState", "rw")
    s_propertyChromeState.value = 0
    s_propertyChromeState.listener = function (name, value)
        
        -- s_propertyChromeState.value is a rw property. So there is a chance that between the time
        -- the lipc property was set (and the value was set) and the time the listener is now being 
        -- invoked that the value has been changed inside the LUA code. Use value as passed into the
        -- listener, because this is the value as set at the time of the lipc call
        s_propertyChromeState.value = value
        
        if value == 1 then 
            chrome_raise() 
        else
            chrome_lower() 
        end

    end

    s_focusChrome = registerLipcStringProp("focusChrome", "w")
    s_focusChrome.value = ""
    s_focusChrome.listener = function (name, value)

        local window = findWindow("C", value) or findWindow("A", value)

        if window and chrome_is_chrome_window(window) then
            setFocusedClient(window.c)
        end

    end

end

--[[
checks window to see if this window is part of chrome
Note that there are windows not on the "chrome" layer that
are in effect part of chrome
@param window       : client window name
]]--
function chrome_is_chrome_window(window)
    if window.params.L == "C" or
            window.params.CD then
        return true
    end
    
    return false
end

--[[
sets chrome state to match request of given window
@param win      : window which dictates chrome state
]]
function chrome_set_app_chrome_state(win)
    
    log("++++chrome_set_app_chrome_state")

    local chromeLayer = findLayer("C")

    -- relayer
    prv_apply_layer_rules(chromeLayer, win)
    
end

--[[
Gets the the searchbar topbar with bar type "S" active for this app)
This can be the system search bar or in the case of a custom search bar
aplication their own custom search bar
@return 
    win obj 
]]--
function chrome_get_active_search_bar()
    local chromeLayer = findLayer("C")

    return chromeLayer.activeBars["S"].win 
end

--[[
calculate the the height of the persistent chrome at the top
for a given persistent chrome
@param PC       : persistent chrome to check
@return 
    height in pixels of persistent chrome
]]--
function chrome_get_persistent_top_offset(PC)
    local chromeLayer = findLayer("C")

    local offset = 0
    if PC == "T" then
        offset = chromeLayer.activeBars["T"].height
    elseif PC == "TS" then
        offset = chromeLayer.activeBars["S"].height + chromeLayer.activeBars["S"].y
    end

    return offset
end

--[[
get the correct vertical top and bottom offsets for a given window
@params useTransient        : if true calculate with transient chrome windows
]]--
function chrome_get_vertical_offsets(useTransient)
    local topOffset = 0
    local bottomOffset = 0

    -- figure out topOffset and bottomOffset to center
    -- Note that dialogs take focus and will dismiss chrome
    -- so no need to take chrome into account for positioning
    -- unless search bar is tiled into app space
    local chromeLayer = findLayer("C")


    local bottomMostTopBar = nil
    if chrome_is_up() and useTransient then

        bottomOffset = chromeLayer.footerBarOffset + chromeLayer.mediaBarOffset
        bottomMostTopBar = chromeLayer.activeBars["A"].win or chromeLayer.activeBars["S"].win or 
                    chromeLayer.activeBars["T"].win
        
    elseif getActiveApplicationWindow() then
        
        -- TODO use win state rather than g active app
        if getActiveApplicationWindow().params.PC == 'TS' then
            bottomMostTopBar = chromeLayer.activeBars["S"].win or chromeLayer.activeBars["T"].win
        elseif getActiveApplicationWindow().params.PC ~= 'N' then
            bottomMostTopBar = chromeLayer.activeBars["T"].win
        end
    end

    if bottomMostTopBar then
        local clientGeometry = getClientGeometry(bottomMostTopBar.c)
        topOffset = clientGeometry.y + clientGeometry.height
    end

    return topOffset, bottomOffset
end

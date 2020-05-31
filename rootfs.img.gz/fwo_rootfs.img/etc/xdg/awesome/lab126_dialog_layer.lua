-- Copyright (c) 2011-2016 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

require "lab126_utils"

--- Dialog border width and corner radius
local DEFAULT_BORDER_WIDTH = utilsPointsToPixels(1.4)
local DEFAULT_CORNER_RADIUS = utilsPointsToPixels(2.2)

llog.info("WindowManager", "dialogDefaults", "borderWidth=%d, cornerRadius", "", DEFAULT_BORDER_WIDTH, DEFAULT_CORNER_RADIUS)

-- use percent of screen larger dimension
local VERTICAL_ADJUST_SCREEN_PERCENT = 1/200
local DIALOG_MARGIN_SCREEN_PERCENT = 1/160

-- UI wants to move dialog up slightly
local s_dialog_vertical_adjustment
-- minimum margin for dialogs
local s_dialog_margin
if g_screenOne.geometry.height > g_screenOne.geometry.width then
    s_dialog_vertical_adjustment = math.floor(g_screenOne.geometry.height * VERTICAL_ADJUST_SCREEN_PERCENT) 
    s_dialog_margin = math.floor(g_screenOne.geometry.height * DIALOG_MARGIN_SCREEN_PERCENT)
else
    s_dialog_vertical_adjustment = math.floor(g_screenOne.geometry.width * VERTICAL_ADJUST_SCREEN_PERCENT) 
    s_dialog_margin = math.floor(g_screenOne.geometry.width * DIALOG_MARGIN_SCREEN_PERCENT)
end

--[[
determines if the dialog will fit and returns centered position
]]--
local function prv_get_centered_position(dialogSize, screenSize, offset1, offset2)
    local freeSpace = screenSize - offset1 - offset2
    local returnVal = 0
    
    if dialogSize <= ( freeSpace - (2 * s_dialog_margin) ) then
        returnVal = offset1 + ((freeSpace - dialogSize)/2)
    elseif offset1 > 0 then
        -- if there is a bottom offset, try ignoring top offset (chrome)
        -- and positioning over chrome
        log("dialog does not fit, try without top chrome")
        
        returnVal = prv_get_centered_position(dialogSize, screenSize, 0, offset2)
    end

    return returnVal
end

--[[
util method to create a rounded corner obj to set on client
]]--
local function create_rounded_corner_obj(tl, tr, bl, br)
    return {top_left = tl, top_right = tr, bottom_left = bl, bottom_right = br}
end

--[[
returns border width given input string value
]]
local function get_border_width(value)
    return tonumber(value) or DEFAULT_BORDER_WIDTH
end

--[[
returns border radius given input string value
]]--
local function get_border_radius(value)
    return tonumber(value) or DEFAULT_CORNER_RADIUS
end

--[[
resolves the cr table to send to the client to round corners
]]--
local function resolve_rounded_corners(win)
    local cr = {}
    local val = get_border_radius(win.params.RC)

    if win.params.RC == false then
        -- square corners
        log("square cornered dialog")
        cr = create_rounded_corner_obj(0, 0, 0, 0)
        win.rc_inset = 0
    elseif win.params.RC == "custom" then
        log("custom cornered dialog")
        -- custom rounded corners read each radius in
        local tl = get_border_radius(win.params.RCTL)
        local tr = get_border_radius(win.params.RCTR)
        local bl = get_border_radius(win.params.RCBL)
        local br = get_border_radius(win.params.RCBR)
        cr = create_rounded_corner_obj(tl,tr,bl,br)
        win.rc_inset = math.max(tl, tr, bl, br)
    else
        -- all 4 corners get value
        log("numbered cornered dialog " .. tostring(val))
        cr = create_rounded_corner_obj(val, val, val, val)
        -- TODO we could minus off border width here
        win.rc_inset = val
    end

    return cr
end

--[[
round corners and set borders based on window params
]]--
function dialog_borders_and_corners(window)
    logTimeStamp("borders and corners")
    
    -- get border width
    local bw = get_border_width(window.params.BW)

    if bw > 0 then
        window.c.border_width = bw
        window.c.border_color = "#000000"
        -- set corners
        window.c:corner_radius(resolve_rounded_corners(window))
    end
end

--[[
center dialog or alert onscreen given offsets
dialogWindow            : dialog window as defined in lab126LayerLogic
topOffset               : offset from the top of the screen
bottomOffset            : offset from the bottom of the screen 
]]--
function dialog_center(dialogWindow, topOffset, bottomOffset)
    
    -- get current geometry
    local clientGeometry = getClientGeometry(dialogWindow.c)
    
    -- when we add border width it will grow the window but 
    -- leave x, y pos alone, so adjust for it in positioning
    local borderOffset = 0
    if dialogWindow.c.border_width == 0 then
        -- adjust for borders that have not been added yet
        borderOffset = 2 * get_border_width(dialogWindow.params.BW)
    end
    
    -- center x and y coords
    clientGeometry.x = prv_get_centered_position(clientGeometry.width + borderOffset, g_screenOne.geometry.width, 0, 0)
    clientGeometry.y = prv_get_centered_position(clientGeometry.height + borderOffset, g_screenOne.geometry.height, topOffset, bottomOffset)

    -- updated dialog geometry
    print_table_contents("newDialogGeometry", clientGeometry, "")

    --set back the geometry
    changeWindowGeometry(dialogWindow, clientGeometry)

    -- set this to true to add borders and corners after the damages for the
    -- window come in. The reason to delay the border drawing is that is we do
    -- not then the xdamages for the dialog are sometimes collapsed into the 
    -- x damages for the borders, making it impossible to distinguish between
    -- the two. Le3aving commented out until we investigate the borders in separate win method
    -- dialogWindow.needDialogBorders = true
    dialog_borders_and_corners(dialogWindow)

end

--[[
sets layering and positionof a dialog
dialogLayer             : dialogLayer as defined in lab126LayerLogic
dialogWindow            : dialog window as defined in lab126LayerLogic
]]--
local function prv_position_dialog(dialogLayer, dialogWindow)
    
    local topOffset = 0
    local bottomOffset = 0
    
    if dialogWindow.params.M then
        dialogWindow.c.modal = true
    end
    
    -- RKB dialogs require KB so position expecting
    -- KB to come up
    local kbLayer = findLayer("KB")
    
    if dialogWindow.params.RKB then
        
        
        -- RKB dialogs require keyboard
        if kbLayer.kbHeight > 0 then
            bottomOffset = kbLayer.kbHeight + s_dialog_vertical_adjustment
        else
            log ("?????using kbLayer.kbDefaultHeight ", kbLayer.kbDefaultHeight)
            bottomOffset = kbLayer.kbDefaultHeight + s_dialog_vertical_adjustment
        end
        
        -- enforce modality of RKB dialogs
        dialogWindow.params.M = true
    end
    
    setClientLayer(dialogWindow, LAYERS.DIALOG)

    -- dialogs take focus, which will bring down chrome
    logStrings({"setting focus to app layer updatedClient ", dialogWindow.c.name})
    
    dialog_center(dialogWindow, topOffset, bottomOffset)
    
    -- setting the focus will call up the keyboard
    -- to a RKB dialog
    setFocusedClient(dialogWindow.c)
end

--[[
sets layering and position of an alert
dialogLayer             : dialogLayer as defined in lab126LayerLogic
alertWindow             : alert window as defined in lab126LayerLogic
]]--
local function prv_position_alert(dialogLayer, alertWindow)
    
    local topOffset = 0
    local bottomOffset = 0
    
    -- alerts go on top
    setClientLayer(alertWindow, LAYERS.ALERT)
    alertWindow.c.modal = true
    
    --alertWindow.c.save_under = true
    
    dialog_center(alertWindow, topOffset, bottomOffset)
    
    setFocusedClient(alertWindow.c)
end

--[[
set ownership up
@ updatedWindow
    window to check
]]--
local function checkOwner(updatedWindow)
    -- set the owner
    updatedWindow.owner = updatedWindow.params.owner or updatedWindow.params.ID

    if updatedWindow.params.ID == "system" then
        log("owner is system")
        updatedWindow.owner = "system"
    elseif not updatedWindow.owner or not stringStartsWith(updatedWindow.owner, "com.lab126.") then
        -- assume current applciation but log an error
        llog.info("WindowManager", "checkOwnerFail", "owner=updatedWindow.owner", "dialog is incorrectly named")
        
        local activeApp = getActiveApplicationWindow()
        updatedWindow.owner = activeApp and activeApp.params.ID

    else
        log("dialog owner is " .. updatedWindow.owner)

        
        if not isActiveAppId(updatedWindow.owner) and not isActiveAppAlias(updatedWindow.owner) then
            
            log("dialog from non UI app attempting to show %s", updatedWindow.c.name)
            
            -- hide but do not orphan. If we orphan it here 
            -- the randomness of when the window gets mapped
            -- on the incomming app versus the app paused event 
            -- can cause odd behavior. This window will be resolved
            -- as an orphan or promoted to a real dialog
            -- when the next app window gets mapped
            setClientLayer(updatedWindow, LAYERS.HIDDEN)

            -- return false as there is no additional handling required on this dialog
            return false
        end
    end

    return true
end

--[[ 
dailog layer callback called whenever a dialog window in managed
or unmanaged
self                : dialogLayer
updatedWindow       : window object as defined in lab126LayerLogic
action              : "removed", "updatedGeometry", "updatedParams" or "added"
]]--
function dialogLayer_layout(self, updatedWindow, action)
    log ("dialogLayer_layout action: " .. tostring(action))

    -- on removal of client thisClient is NIL
    if action == "removed" then
        log("no dialog layout needs on remove")
        
        if updatedWindow.params.PAIRID then
            log("remove pairs on dialog with pair id removal")
            -- pop the focus stack
            removeFromFocusHistory(updatedWindow.c)
            
            -- remove any paired dialogs/chrome
            chrome_set_app_chrome_state(getActiveApplicationWindow())
        end
        
        
    elseif action == "added" or action == "updatedGeometry" then
        -- Handle "updatedGeometry" and "added" the same
        
        -- if checkOwner returns false then the window
        -- is a bad window and there is no further handling 
        -- required
        if not checkOwner(updatedWindow) then
            return
        end

        -- save current geometry
        local old_g
        if action == "updatedGeometry" and updatedWindow.geometry then
            old_g = { x = updatedWindow.geometry.x, y = updatedWindow.geometry.y,
                width = updatedWindow.geometry.width, height = updatedWindow.geometry.height}
        end

        if updatedWindow.params.N == "dialog" then
            updatedWindow.clientPositioned = false
            
            prv_position_dialog(self, updatedWindow)
        elseif updatedWindow.params.N == "pillowAlert" then
            updatedWindow.clientPositioned = false
            
            prv_position_alert(self, updatedWindow)
        else
            updatedWindow.clientPositioned = true
            
            -- option in rounded corners
            if updatedWindow.params.RC then
                dialog_borders_and_corners(updatedWindow)
                --updatedWindow.needDialogBorders = true
            end

            -- if modal flag is set make modal
            if updatedWindow.params.M then
                updatedWindow.c.modal = true
            end

            setClientLayer(updatedWindow, LAYERS.DIALOG)
            setFocusedClient(updatedWindow.c)

        end
    elseif action == "updatedParams" then
    
        -- if name has changed, HIDE is nto set and the window is hidden
        -- then raise it and focus it
        if updatedWindow.params and not updatedWindow.params.HIDE and updatedWindow.c.hiddenLayer then
            -- raising alert
            setFocusedClient(updatedWindow.c)
        end

        -- reconfigure WT settings accordingly
        updateWTSettings(updatedWindow);
        
        -- setClientLayer will check for the HIDE flag and 
        -- and set the window to the correct layer (hidden or alert/dialog)
        if updatedWindow.params.N == "dialog" then
            updatedWindow.clientPositioned = false
            setClientLayer(updatedWindow, LAYERS.DIALOG)
        elseif updatedWindow.params.N == "pillowAlert" then
            updatedWindow.clientPositioned = false
            setClientLayer(updatedWindow, LAYERS.ALERT)
        else
            updatedWindow.clientPositioned = true
            setClientLayer(updatedWindow, LAYERS.DIALOG)
        end
    end

end

--[[
find and destroy any orphan windows
]]--
local function killOrphans()
    log("check for ophaned windows to kill")
    windowTableForEach(function(window)
        if window.params.L == "D" and window.orphandedDialog then
            -- validate if orphaned dialog has become correct on the app switch
            -- this handles the case where a dialog comes in a bit too early 
            -- in the ap switch 
            if isActiveAppId(window.params.ID) or isActiveAppAlias(window.params.ID) then
                -- unorphan and raise
                logStrings("unorpaning dialog, %s ", tostring(window.c.name))
                window.orphandedDialog = false
                local layer = findLayer("D")
                layer:layoutFunc(window, "added")
            else
                -- kill it and log warning
                llog.warn("WindowManager", "killOrphans", "winID=" .. window.c.name, "destroying an orphaned window that should have been cleaned up ")
                window.c:destroy()
            end
        end
    end)
end

--- Register Lipc properties
function dialog_events_setup()

    --hook into app paused event and clean up orphan windows
    subscribeLipcEvent("com.lab126.appmgrd", "appPaused", killOrphans)
end

-- Copyright (c) 2011-2018 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

local sPasswordDialogEnabled = false

--[[
register isScreenSaverLayerWindowActive property for lipc
]]--
function registerScreensaverLipcProperties()
    propertyIsScreenSaverLayerWindowActive = registerLipcIntProp("isScreenSaverLayerWindowActive", "r")
    propertyIsScreenSaverLayerWindowActive.value = 0

    propertyPasswordDialogEnabled = registerLipcIntProp("passwordDialogEnabled", "rw")
    propertyPasswordDialogEnabled.value = 0
    propertyPasswordDialogEnabled.listener = function (name, value)
        if value == 0 then
            propertyPasswordDialogEnabled.value = 0
            sPasswordDialogEnabled = false
        else
            propertyPasswordDialogEnabled.value = 1
            sPasswordDialogEnabled = true
        end
    end
end

function isPasswordDialogEnabled()
    return sPasswordDialogEnabled
end

--[[
setSSWindowAvailablity called whenever a a screensaver window is managed
set isScreenSaverLayerWindowActive property to 1-up 0- no screensaver 
]]--
function setSSWindowAvailablity(ssUp)
    propertyIsScreenSaverLayerWindowActive.value =  (ssUp and 1) or 0
end

--[[
updateScreenSaverStatus called whenever a screensaver window is managed
updatedWindow       : window object as defined in lab126LayerLogic
action              : "removed", "updatedGeometry", "updatedParams" or "added"
]]--
function updateScreenSaverStatus(updateWindow, action)
    if action == "added" then
        setSSWindowAvailablity(true);
    elseif action == "removed" then
	local screenSaver = findWindow("SS", "screenSaver")
	if nil == screenSaver then
            setSSWindowAvailablity(false);
	else
	   setSSWindowAvailablity(true);
	end
    end
end

--[[ 
screensaver layer callback called whenever a screensaver window is managed
or unmanaged
self                : screensaver layer
updatedWindow       : window object as defined in lab126LayerLogic
action              : "removed", "updatedGeometry", "updatedParams" or "added"
]]--
function screenSaverLayer_layout(self, updatedWindow, action)
    updateScreenSaverStatus(updatedWindow, action)
    if action == "added" then
        if updatedWindow.params.N == "screenSaver" then
        
            -- when rotating we relayout all windows after rotate
            setAppOrientation(updatedWindow.params.O)
            
            -- validate stacking order is good when transitioning to 
            -- screensaver
            client.validate_stacking_order()

            -- screen saver windows are on top of everything
            setClientLayer(updatedWindow, LAYERS.SCREENSAVER)

            local geom = {}
            geom.x = 0
            geom.y = 0
            geom.width, geom.height = getOrientationScreenSize()
            changeWindowGeometry(updatedWindow, geom)
            
            setFocusedClient(updatedWindow.c)

            -- notify interested windows that there is a screensaver up
            notifyScreenSaverWatchers(true)
            
        elseif updatedWindow.params.N == "dialog" then
            -- screen saver dialog is for things like password dialog
            log("adding a screen saver dialog")

            dialog_center(updatedWindow, 0, 0)
            setClientLayer(updatedWindow, LAYERS.SCREENSAVER)
            setFocusedClient(updatedWindow.c)
        elseif updatedWindow.params.N == "activeSS" then
            setClientLayer(updatedWindow, LAYERS.SCREENSAVER)

            local geom = {}
            geom.x = 0
            geom.y = 0
            geom.width, geom.height = getOrientationScreenSize()
            changeWindowGeometry(updatedWindow, geom)

            setFocusedClient(updatedWindow.c)
        end
        
    elseif action == "updatedParams" then

        if client.focus == updatedWindow.c then
            setAppOrientation(updatedWindow.params.O)
        end

    elseif action == "updatedGeometry" then

        if updatedWindow.params.N == "screenSaver" then
            changeWindowGeometry(updatedWindow, g_screenOne.geometry)
        elseif updatedWindow.params.N == "dialog" then
           dialog_center(updatedWindow, 0, 0)
        end 

    elseif action == "removed" and updatedWindow.params.N ~= "activeSS" then

        -- notify interested windows that the screensaver is going down but not the activeSS
        -- since that will go down sometimes while still leaving an SS layer window on top
       notifyScreenSaverWatchers(false)
    end
    
end


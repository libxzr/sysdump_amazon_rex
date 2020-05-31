-- Copyright (c) 2013 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

--- Grip suppression handling routines

require ("llog")
require("lab126_ligl");

--- Current grip suppression state.
local s_isGripSuppressionEnabled = nil
local s_isGSSupportEnabled = true

local gripSuppressionTable = {
    [true] = 1,
    [false] = 0
}

-- register grip suppression related lipc properties
function registerGripSuppressionProperties()
    -- LIPC property to enable/disable Grip suppression
    propertyGSEnabled = registerLipcIntProp("grip_enabled", "rw")
    propertyGSEnabled.value = s_isGSSupportEnabled and 1 or 0
    propertyGSEnabled.listener = function (name, value)
        if value == 0 then
            -- Enable Grip suppression
            s_isGSSupportEnabled = false
        else
            -- Disable Grip suppression
            s_isGSSupportEnabled = true
        end
    end

end


-- check if the application supports grip suppression.
local function isGSSupportedbyApp(window)
    if s_isGSSupportEnabled and 
       window and 
       (window.params.GS == nil or window.params.GS) then
       return true
    end
    return false
end

-- Configure grip suppression.
-- @param true to enable / false to disable
local function setGripSuppression(enableGripSuppression)
   
    -- by default grip suppression is enabled
    if enableGripSuppression == nil then
        enableGripSuppression = true
    end
    
    if s_isGripSuppressionEnabled ~= enableGripSuppression then
        local res = liglSetGripSuppresion(gripSuppressionTable[enableGripSuppression])
        if res == 0 then
            s_isGripSuppressionEnabled = enableGripSuppression; 
        else
            llog.error("lua", "GS", "", "Grip suppression configuration failed to update")
        end
    end
end
  

-- Configure grip suppression based on un focused window.
-- @param unfocused window
function configureGSForUnFocusedWindow(c)
    -- check if unfocused window makes the application window visible
    if isGSSupportedbyApp(getActiveApplicationWindow()) and 
       not getActiveApplicationWindow().c:is_obscured()then
      
       -- application supports Grip Suppression is completely visible now.
        if isScreenPortrait() then
            log("Grip suppression: application window was obscured by unfocused window. reconfigure GS") 
            setGripSuppression(getActiveApplicationWindow().params.GS)
        else
            log("Grip suppression: application window was obscured by unfocused window. Don't reconfigure GS as we are in landscape mode") 
        end
    end
end


-- Configure grip suppression based on focused window.
-- @param focused window
function configureGSForFocusedWindow(c)
    if isScreenPortrait() then
        local window = windowTableFindByClient(c)
        if not window or not window.params then
            return
        end

        -- As of now we are implementing grip suppression for application window alone
        if application_is_application_window(window) then
            
        -- focused window is application window (assumption: focused window is completely visible).
            if isGSSupportedbyApp(window) then
                -- application supports GS
            log("Grip suppression: application window is getting focus. configure GS") 
                setGripSuppression(window.params.GS)
            else
            -- application window does not support grip suppression
                setGripSuppression(false)
            end

        else

            -- focused window is not an application window. 
        -- check if the newly focused non GS window obscure GS supported application window
            if isGSSupportedbyApp(getActiveApplicationWindow()) and
           not isGSSupportedbyApp(window) and 
               getActiveApplicationWindow().c:is_obscured_by(c) then
               log("Grip suppression: focused window obscure application. disable GS") 
                   setGripSuppression(false)
            end

        end
    else
        log("Grip suppression : Not configuring as we are in landscape mode")
    end
end


-- Configure grip suppression based on orientation.
-- @param focused window
function configureGSForOrientation(orientation)

    -- check if current application supports grip suppression
    if isGSSupportedbyApp(getActiveApplicationWindow()) then
       -- current application supports grip suppresion. 
	   -- reconfigure Grip suppression based on orientation change
        setGripSuppression(isScreenPortrait())
        log("Grip suppression: orientation changes. reconfigure GS") 
    end
end


-- Configure Grip suppression related settings if there is a change in the GS param
-- @param updated window
function updateGSSettings(updatedWindow)

     -- Check if the current application in focus has updated GS params. 
    if updatedWindow == nil or
       application_is_application_window(updatedWindow) == false or 
       client.focus ~= updatedWindow.c or
       updatedWindow.oldParams.GS == updatedWindow.params.GS  or 
       isScreenPortrait() == false then
           return
    end
  
    setGripSuppression(updatedWindow.params.GS);
end


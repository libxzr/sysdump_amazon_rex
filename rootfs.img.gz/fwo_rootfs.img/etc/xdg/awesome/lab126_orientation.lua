-- Copyright (c) 2011-2015 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

--- Orientation handling routines

require ("llog")
require("lab126_ligl")
require("lab126_grip_suppression")
require("lab126_whisper_touch")

--- Device Orientation constants
-- Portrait
local UP = 'U'
-- Portrait, upside down
local DOWN = 'D'
-- Landscape, home button on a left side
local LEFT = 'L'
-- Landscape, home button on a right side
local RIGHT = 'R'

--- Supported orientations
local supportedOrientations = {
    [UP] = true, 
    [LEFT] = true,
    [RIGHT] = true,
    [DOWN] = true
}

-- if app does not declare any supported
-- supported orienations,a ssume portrait only
local appDefaultLock = {
    [UP] = true, 
    [LEFT] = false,
    [RIGHT] = false,
    [DOWN] = true
}

local ANGLE_0   = '0'
local ANGLE_90  = '90'
local ANGLE_180 = '180'
local ANGLE_270 = '270'

local angleMap = {
    [ANGLE_0]   = UP,
    [ANGLE_90]  = LEFT,
    [ANGLE_180] = DOWN,
    [ANGLE_270] = RIGHT
}

local UP_DOWN = "UD"
local LEFT_RIGHT = "LR"
local UP_DOWN_LEFT_RIGHT = "UDRL"

--- Mapping to ligl rotation
local liglMapping = {
    [UP] = ligl.ROTATION.UP, 
    [LEFT] = ligl.ROTATION.LEFT,
    [RIGHT] = ligl.ROTATION.RIGHT,
    [DOWN] = ligl.ROTATION.DOWN
}

--- Accelerometer reading.
local accelerometerState = UP
--- Orientation lock. If nil, there is no lock.
local orientationLock = nil
--- Orientations supported by an active app.
local appFlags = appDefaultLock
--- Current screen orientation.
local currentOrientation = UP

local currentAngle = ANGLE_0

--- Lipc properties
local propertyOrientLock
local propertyOrientation
local propertyAccelerometer

--- Accelerometer feature availability
local s_isAccelerometerFeatureAvailable = execAndGrabResult("devcap-get-feature -a accelerometer")

--- Check if orientation is supported by app
-- @param app Table of orientations supported by app. See supportedOrientations for format
-- @param orientation Orientation
-- @return orientation if it is supported, nil otherwise
local function isSupportedByApp(app, orientation)
    if supportedOrientations[orientation] and app[orientation] then
        return orientation
    else
        return nil
    end
end

--- Find orientation supported by application which is a closest match
-- @param app Orientations supported by application. See supportedOrientations for an example
-- @param orientation Orientation
-- @return Orientation found
local function findClosestMatch(app, orientation)
    if isSupportedByApp(app, orientation) then
        return orientation
    end
    -- Order is important here - we'd like to avode rotation to 180 degrees
    if orientation == UP then
        return isSupportedByApp(app, DOWN) or isSupportedByApp(app, RIGHT) or isSupportedByApp(app, LEFT)
    elseif orientation == DOWN then
        return isSupportedByApp(app, UP) or isSupportedByApp(app, RIGHT) or isSupportedByApp(app, LEFT)
    elseif orientation == LEFT then
        return isSupportedByApp(app, RIGHT) or isSupportedByApp(app, UP) or isSupportedByApp(app, DOWN)
    elseif orientation == RIGHT then
        return isSupportedByApp(app, LEFT) or isSupportedByApp(app, UP) or isSupportedByApp(app, DOWN)
    end
    llog.error("lua", "nsor", "", "Cannot find a matching app orientation for " .. tostring(orientation))
    return nil
end

--- Set screen orientation.
-- @param orientation Orientation to set.
local function setScreenOrientation(orientation)
    local rotated = false
    if orientation ~= currentOrientation 
        and isSupportedByApp(appFlags, orientation) then

        log("Changing orientation to '" .. orientation .. "'")

        local res = liglRotateScreen(liglMapping[orientation])
        if res == 0 then
            currentOrientation = orientation
            propertyOrientation.value = currentOrientation

	    -- configure grip suppression on orientation change
	    configureGSForOrientation(orientation)
        
	    -- configure fsr on orientation change
	    configureFsrForOrientation(orientation)

            sendLipcEvent("orientationChange", { currentOrientation })
            rotated = true
        else
            llog.error("lua", "rotfail", "", "Screen rotation failed")
        end
    end
    
    return rotated
end

-- Returns true if accelerometer feature is avilable
function isAccelerometerSupported()
    return s_isAccelerometerFeatureAvailable == "1"
end

--- returns if the current or "pending" screen orientation is
--- portrait. The value here is set when the WinMgr requests an
--- orientation change not when the orientation change is
--- reported as done by X.
function isScreenPortrait()
    return currentOrientation == UP or currentOrientation == DOWN
end

--- returns if the current or "pending" screen orientation is
--- landscape. The value here is set when the WinMgr requests an
--- orientation change not when the orientation change is
--- reported as done by X.
function isScreenLandscape()
    return currentOrientation == LEFT or currentOrientation == RIGHT
end

--- Change screen orientation if accelerometer reading changes.
-- @param value New accelerometer reading
local function accelerometerUpdated(value)
    log("Accelerometer updated to '" .. value .. "'")
    if supportedOrientations[value] then
        accelerometerState = value
        propertyAccelerometer.value = accelerometerState
        setScreenOrientation(computeOrientation())
    end
end


function getCurrentOrientation()
    return currentOrientation
end
    
--- Callback called when device orientation changes to Portrait Up.
function accelerometerPortraitUp()
    if isAccelerometerSupported() then
        if currentAngle ~= ANGLE_0 then
            currentAngle = ANGLE_0
            accelerometerUpdated(computeOrientation())
        end
    else
        accelerometerUpdated(UP)
    end
end

--- Callback called when device orientation changes to Portrait Down.
function accelerometerPortraitDown()
    if isAccelerometerSupported() then
        if currentAngle ~= ANGLE_180 then
            currentAngle = ANGLE_180
            accelerometerUpdated(computeOrientation())
        end
    else
        accelerometerUpdated(DOWN)
    end
end

--- Callback called when device orientation changes to Landscape Left.
function accelerometerLandscapeLeft()
    if isAccelerometerSupported() then
        if currentAngle ~= ANGLE_90 then
            currentAngle = ANGLE_90
            accelerometerUpdated(computeOrientation())
        end
    else
        accelerometerUpdated(LEFT)
    end
end

--- Callback called when device orientation changes to Landscape Right.
function accelerometerLandscapeRight()
    if isAccelerometerSupported() then
        if currentAngle ~= ANGLE_270 then
            currentAngle = ANGLE_270
            accelerometerUpdated(computeOrientation())
        end
    else
        accelerometerUpdated(RIGHT)
    end
end

--- Set/unset orientation lock.
-- Rotate screen if needed.
-- @param value If nil, unset orientation lock. Otherwise if orientation is supported, set lock to it.
function setOrientationLock(value)
    log("Request to change global orientation lock: " .. tostring(value))

    if value == nil or supportedOrientations[value] then
        orientationLock = value
	
        setScreenOrientation(computeOrientation())
    else
        llog.error("lua", "invlock", "", "Invalid global lock: " .. tostring(value))
    end
    return orientationLock
end

-- Gets the orientation lock value when accel feature is not available
function getOrientationWithNoAccel()
    return (orientationLock or accelerometerState)
end

-- Gets the orientation lock value when accel feature is available
function getOrientationWithAccel()
    if isSupportedByApp(appFlags, orientationLock) then
        -- check the current angle
	if ((angleMap[currentAngle] == LEFT or angleMap[currentAngle] == RIGHT) and 
            (orientationLock == LEFT or orientationLock == RIGHT)) then
                return angleMap[currentAngle]
	elseif ((angleMap[currentAngle] == LEFT or angleMap[currentAngle] == RIGHT) and 
                 (orientationLock == UP or orientationLock == DOWN)) then
		 if isScreenPortrait() then
                     return currentOrientation
		 else 
                     return orientationLock
		 end
	elseif ((angleMap[currentAngle] == UP or angleMap[currentAngle] == DOWN) and 
                 (orientationLock == UP or orientationLock == DOWN)) then
	        return angleMap[currentAngle]
	elseif ((angleMap[currentAngle] == UP or angleMap[currentAngle] == DOWN) and 
                 (orientationLock == LEFT or orientationLock == RIGHT)) then
                 if isScreenLandscape() then
                     return currentOrientation
		 else 
                     return orientationLock
		 end
	end
    elseif isSupportedByApp(appFlags, angleMap[currentAngle]) then
        return angleMap[currentAngle]
    else 
        if isSupportedByApp(appFlags, currentOrientation) then
            return currentOrientation
	else
            return findClosestMatch(appFlags, orientationLock or accelerometerState)
	end
    end
end

-- Computes the orientation value based on orientation lock and accel feature availability.
function computeOrientation()
    if isAccelerometerSupported() then
        return getOrientationWithAccel()
    else
        return getOrientationWithNoAccel()
    end
end


--- Convert orientation mask from string to table
-- @param str Orientation mask, for example "ULR". 
--            Could be nil, which means app supports all the orientations. 
-- @return Orientation table. See supportedOrientations for format.
local function convertFromString(str)
    local res = {}
    if str then
        for c in str:gmatch(".") do
            res[c] = supportedOrientations[c] and true
        end
    end
    return next(res) and res or appDefaultLock
end


local function getAccAppOrientation(appOrientationValue)
    local appOrientationFlag = convertFromString(appOrientationValue)
    if (isSupportedByApp(appOrientationFlag, UP)  or isSupportedByApp(appOrientationFlag, DOWN)) then
        if (isSupportedByApp(appOrientationFlag, LEFT)  or isSupportedByApp(appOrientationFlag, RIGHT)) then
            return UP_DOWN_LEFT_RIGHT
        else
            return UP_DOWN
	end
    elseif (isSupportedByApp(appOrientationFlag, RIGHT)  or isSupportedByApp(appOrientationFlag, LEFT)) then
        return LEFT_RIGHT
    end
end


--- Set orientations supported by active application. Rotate screen if needed.
-- @param str Orientation mask, for example "ULR". 
-- Could be nil, which means app supports default set (Up/Down).
function setAppOrientation(str)
    log("Supported app orientations changed: " .. tostring(str))
    if isAccelerometerSupported() then
        str = getAccAppOrientation(str)
    end
    appFlags = convertFromString(str)
    if isAccelerometerSupported() then
        return setScreenOrientation(computeOrientation())
    else
        return setScreenOrientation(findClosestMatch(appFlags, orientationLock or accelerometerState))
    end
end

function subscribeAccelerometerEvents()
    subscribeLipcEvent("com.lab126.accel", "accel_rotate", function(publ, event, data)
        if currentAngle ~= data[1] then
            currentAngle = data[1]
            accelerometerUpdated(computeOrientation())
        end
    end)
end


--- Register Lipc properties
-- @param lipcH Lipc handle
function registerOrientationProperties()

    -- register accelerometer state property
    propertyAccelerometer = registerLipcStringProp("accelerometer", "r")
    propertyAccelerometer.value = accelerometerState

    -- register orientationLock property
    propertyOrientLock = registerLipcStringProp("orientationLock", "rw")
    propertyOrientLock.value = ""
    propertyOrientLock.listener = function (name, value)
        -- convert empty string to nil
        if value == "" or value == "off" then 
            value = nil
        elseif value == "current" then
            value = accelerometerState
        end
        propertyOrientLock.value = setOrientationLock(value) or ""
    end

    propertySetAccOriention = registerLipcStringProp("setAccOrientation", "rw")
    propertySetAccOriention.value = currentAngle
    propertySetAccOriention.listener = function (name, value)
	  
	if currentAngle ~= value then
	    currentAngle = value
	    accelerometerUpdated(computeOrientation())
        end
    end

    -- register orientation property
    propertyOrientation = registerLipcStringProp("orientation", "r")
    propertyOrientation.value = currentOrientation
end

--- Get screen width and height for the current or "pending" orientation
--- of screen. In other words if orientation change has been requested by winmgr but
--- the screen is still in process of changing this call will return the width and
--- height the screen will have after the pending orientation change finishes
-- @return width, height  
function getOrientationScreenSize()
    local shortSide
    local longSide
    if g_screenOne.geometry.width > g_screenOne.geometry.height then
        shortSide = g_screenOne.geometry.height
        longSide = g_screenOne.geometry.width
    else
        shortSide = g_screenOne.geometry.width
        longSide = g_screenOne.geometry.height
    end
    
    if isScreenPortrait() then
        return shortSide, longSide
    else
        return longSide, shortSide
    end
end

function handleScreenRotation()
    log("Screen rotated " .. g_screenOne.geometry.width .. " x " .. g_screenOne.geometry.height)
    
    -- unlock the unpaused rect on titlebar so it can show again
    liglLockUnpausedRect(false)
    liglScreenRotated()
    
    logTimeStamp("start relayout windows on rotation")
    
    -- layout app widow first
    if getActiveApplicationWindow() then
        local activeAppLayer = findLayer("A")
        activeAppLayer:layoutFunc(getActiveApplicationWindow(), "updatedGeometry")
    end
    
    -- layout chrome
    chrome_position_top_bars(findLayer("C"));
    
    -- layout any other visible windows which change on rotation
    layoutLayers(function(window) return getActiveApplicationWindow() ~= window and window.params.N ~= "topBar" and 
            not window.clientPositioned end)
            
    logTimeStamp("done relayout windows on rotation")
end

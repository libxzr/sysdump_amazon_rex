-- Copyright (c) 2013 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

local s_controlClient = nil

--[[
device features
TODO look at LUA devcap bindings
]]--
local device = {}
device.dpi = execAndGrabResult("devcap-get-feature -i screen dpi")

-- store ratio to convert 
local pixelPointRatio = device.dpi/72

function utilsPointsToPixels(points)
    return math.floor(points * pixelPointRatio)
end

-- register a dbg property to open up additional debug 
-- info calls
function registerDebugInfo()
local s_debugInfo = registerLipcStringProp("debugInfo", "rw")
s_debugInfo.value = ""
s_debugInfo.listener = function (name, value)
        if value == "dumpFocusStack" then
            dumpFocusInfo()
        elseif value == "drawMode" then
            logDrawMode()
            if s_controlClient and s_controlClient.name then
                logStrings("control window is %s", s_controlClient.name)
            else
                log("no control window")
            end
        elseif value == "luaMem" then
            log("Lua memory is " .. collectgarbage("count") .. " Kbytes")
        elseif value == "luaGC" then
            collectgarbage("collect")
        elseif value == "forceRestack" then
            client.force_restack()
        elseif value == "logAllClients" then
            client.log_all_clients()
        elseif value == "validateStack" then
            client.validate_stacking_order()
        elseif value == "activeTriggers" then
            logActiveTriggers()
        elseif value == "resizeAppWindow" then
            log("debug resizeAppWindow called")
            changeWindowGeometry(getActiveApplicationWindow(), g_screenOne.geometry)
        elseif value == "dumpWTStack" then
            dumpWTStack()
        end
    end
end

--[[
logging call to log out focus info
]]--
function dumpFocusInfo()

   if client.focus then
       log("focused client is %s", client.focus.name)
   else
       log("no focused client")
   end

   focusHistoryLogStack()
end


--[[
get the currently key focused window
]]--
function getFocusedWindow()
    return client.focus and windowTableFindByClient(client.focus)
end


--[[
get drawmode from client and set ligl
]]--
function setDrawModeAndSensitivity()

    log("+++++setDrawModeAndSensitivity")

    if not s_controlClient then
        return
    end

    local c = s_controlClient

    local window = windowTableFindByClient(c)

    if not window or not window.params then
        return
    end

    local clientGeom = c:geometry()
    local geom = clientGeom
    local dm = window.params.DM or "N"
    if window.params.DMINSETLEFT and
        window.params.DMINSETTOP and
        window.params.DMINSETRIGHT and
        window.params.DMINSETBOTTOM then

        -- DM rect is a subrect of window gemoetry
        local insetLeft = tonumber(window.params.DMINSETLEFT)
        local insetTop = tonumber(window.params.DMINSETTOP)
        local insetRight = tonumber(window.params.DMINSETRIGHT)
        local insetBottom = tonumber(window.params.DMINSETBOTTOM)
        if clientGeom.width > (insetLeft + insetRight) and
                clientGeom.height > (insetTop + insetBottom) then
            geom.x = clientGeom.x + insetLeft
            geom.y = clientGeom.y + insetTop
            geom.width = clientGeom.width - insetLeft - insetRight
            geom.height = clientGeom.height - insetTop - insetBottom
        end

    end

    liglSetDrawMode(dm, geom)

    local sensitivity = -1
    -- Apply sensitivity only if draw mode is normal 
    if dm == "N" then
        -- EWH hosts defer to the sensitivity of their
        -- EWC client
        if window.params.EWH then
            log("====EWH in control")
            local ewc = ew_get_client(window)
            if ewc then
                log("setting sens to client's value'")
                sensitivity = tonumber(ewc.params.S)
            end
        else
            sensitivity = tonumber(window.params.S)
        end
    end

    if sensitivity ~= nil then
        log("sending sensitivity value " .. tostring(sensitivity))
        liglSetSensitive(sensitivity, clientGeom)
    else
        -- ligl uses -1 to mean off
        log("no sensitivity value, send -1")
        liglSetSensitive(-1, clientGeom)
    end
end

--[[
called when geometry has changed on a control client
]]--
local function updateControlWindowGeometry()
    if not s_controlClient then
        return
    end

    setDrawModeAndSensitivity()
end


--[[
called when name changes on control client
]]--
local function updateControlWindowName()
    if not s_controlClient then
        return
    end

    setDrawModeAndSensitivity()
end


--[[
called when the control client changes via focus change or user
tap
@ c
    new control client
]]--
function setControlClient(c)
    log("+++++setControlClient ")
    if s_controlClient == c then
        return
    end

    if not c or not c.name then
        return
    end

    if s_controlClient then
        logStrings({"control window changing from ", s_controlClient.name})
    end

    logStrings({"control window changing to ", c.name})

    s_controlClient = c

    setDrawModeAndSensitivity()
end

function getControlClient()
    return s_controlClient
end



-- when we change geometry on a client 
-- -- set it here such that the geometry change 
-- -- callback can be identified as a result of 
-- -- an external or internal request
local s_geometryChangingClient = nil


--[[
changes window geometry
w               : window to act on
newGeometry     : geometry object with x, y, width and height
]]--
function changeWindowGeometry(w, newGeometry)

    if not w or not w.c or not newGeometry then
        log("!!changeWindowGeometry called with invalid window")
    end

    logStrings({"changeWindowGeometry w.c.name = ", w.c.name})
    log("changeWindowGeometry newGeometry = " .. newGeometry.x .. " " .. newGeometry.y ..
        " " .. newGeometry.width .. " " .. newGeometry.height)

    -- store new geometry
    if not w.geometry then
        w.geometry = {}
    end
    w.geometry.x = newGeometry.x
    w.geometry.y = newGeometry.y
    w.geometry.width = newGeometry.width
    w.geometry.height = newGeometry.height

    -- set s_geometryChangingClient as noted above
    s_geometryChangingClient = w.c

    -- change geometry
    w.c:geometry(newGeometry)

    -- done, clear state
    s_geometryChangingClient = nil
end

--[[
returns geometry of client
c               : client to act on
]]--
function getClientGeometry(c)
    return c:geometry()
end

function notifyTapAwayParent(win, visible)
    log("+++++notifyTapAwayParent")
    if win and win.c and win.params and win.params.TAC then
        log("client is a tap-away child: %s", tostring(win.c.name))
        -- find the tap-away parent
        local parent = windowTableFindByFunc(function(w)
            return w.c and w.params and w.params.TAP and w.params.TAP == win.params.TAC
        end)
        if parent then
            log("found parent: %s", tostring(parent.c.name))
            local data = clientData.alloc()
            if data then
                -- include the visible state of the child in the message
                clientData.set_uint8(data, (visible and 1) or 0)
                -- include the "tap-away button" string in the message
                if win.params.TAB then
                    local tab = win.params.TAB
                    log("tap-away button string is %s", tostring(tab))
                    for i = 1, math.min(MAX_SIZE_MESSAGE_DATA - 2, #tab) do
                            clientData.set_uint8(data, string.byte(tab:sub(i, i)))
                    end
                end
                clientData.set_uint8(data, 0)
                clientData.send(parent.c, "lab126_tap_away_child", data)
                clientData.free(data)
            end
        else
            llog.info("WindowManager", "tapAwayParentNotFound", "ID=" .. tostring(win.params.TAC), "")
        end
    end
    log("-----notifyTapAwayParent")
end

SHORT_MESSAGE_NAMES = {}
SHORT_MESSAGE_NAMES.lab126_screen_saver = "ss"
SHORT_MESSAGE_NAMES.lab126_chrome_reset = "cr"

function sendToSubscribers(msgName, fillMessage)
    log("+++++sendToSubscribers " .. msgName)
    local msgId = SHORT_MESSAGE_NAMES[msgName]
    if not msgId then
        llog.info("WindowManager", "unknownMessageToSend", "name=" .. msgName, "")
        return
    end
    local msg = nil
    windowTableForEach(function(window)
        if window and window.params and window.params.CMS and window.params.CMS[msgId] then
            if not msg then
                msg = clientData.alloc()
                if msg and fillMessage then
                    fillMessage(msg)
                end
            end
            if msg then
                clientData.send(window.c, msgName, msg)
                log("sent " .. msgName .. " message to " .. window.c.name)
            end
        end
    end)
    if msg then
        clientData.free(msg)
    end
    log("-----sendToSubscribers " .. msgId)
end

function notifyScreenSaverWatchers(ssUp)
    sendToSubscribers("lab126_screen_saver", function(msg)
        clientData.set_uint8(msg, (ssUp and 1) or 0)
    end)
end

function notifyChromeToReset()
    sendToSubscribers("lab126_chrome_reset", nil)
end

--[[
prints out various info oncurrent windows for debugging purposes
]]--
function print_dbg_info()
    log("+++++print_dbg_info")
    local tagTable = g_screenOne:tags()
    print_table_contents("tagTable", tagTable, "")

    -- print out all clients and their geometry
--[[
    local allClients = client.get(1)
    for i,c in ipairs(allClients) do
        logStrings({"client : ", c.name})
        print_table_contents("clientGeometry", c:geometry(), "")
    end
]]--
    logOutAllLayers()
    
    if client.focus then
        logStrings({"current focus is ", client.focus.name})
    else
        log("no focus")
    end

end


function screenshot()
    os.execute ("xwininfo -root -tree | logger; screenshot -x &")
    liglReflashWholeScreen()
end


--[[
check to see if the 2 windows are paired with each other for tap handling
]]--
function isPairedWindow(focusedWindow, secondWindow)
    -- RKB windows pair with KB dialogs and tap away modals
    -- there ar e a few cases where tap away modals have a KB
    -- that comes up over the bottom of the dialog
    if secondWindow.params.L == "KB" and (focusedWindow.params.RKB or focusedWindow.params.AKB ) then
        log("RKB/AKB pair")
        return true
    end

    -- windows transient for each other are paired
    if focusedWindow.c.transient_for == secondWindow.c or
              secondWindow.c.transient_for == focusedWindow.c then
        log("transient PAIR")
        return true
    end
    
    -- look at pair ID
    if secondWindow.params.PAIRID and secondWindow.params.PAIRID == focusedWindow.params.PAIRID then
        log("PAIRID match")
        return true
    end
    
    
    -- other wise not paired
    return false
end

--[[
awesome callback on a client when the title is changed
]]--
function clientSignalNameChanged(c)

    -- because we use the title as a set of key/value pairs
    -- describing how to use this client, if the name changed
    -- to remanage it 
    log("client name changed, new name %s", c.name)
    updateClientName(c)
    
    if c == s_controlClient then
        updateControlWindowName()
    end
end

--[[
awesome callback on a client when geometry changed
]]--
function clientSignalGeometryChanged(c)
    log("client geometry changed %s", c.name)
    
    -- if this is a result of us resizing a client 
    -- there is nothing to do. However, if the client
    -- was resized external to awesome (on the client side)
    -- we need to remanage the client to ensure positioning
    -- is still correct for the updated geometry
    if (c == s_geometryChangingClient) then
        log ("geometry change is internal")
        
        -- fix trigger if present
        liglHandleClientResize(c)
    else
        log ("geometry change is external")
        updateClientGeometry(c)
        
        -- look to see if geometry update was on the control window
        if c == s_controlClient then
            updateControlWindowGeometry()
        end
    end
end

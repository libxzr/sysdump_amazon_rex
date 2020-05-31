-- Copyright (c) 2011 - 2018 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.


require("awful")
require("awful.rules")

-- maximum size of client message data
MAX_SIZE_MESSAGE_DATA = 20

-- local copy of the screen
g_screenOne = screen[1]

--[[
execute a cmd and return results
]]--
function execAndGrabResult(cmd)
    local f = io.popen(cmd, 'r')
    
    if not f then
        llog.info("WindowManager", "execFailed", "cmd=" .. tostring(cmd), "")
        return nil
    end
    
    local s = f:read('*a')
    f:close()
    
    -- clean off spaces
    s = string.gsub(s, '^%s+', '')
    s = string.gsub(s, '%s+$', '')
    s = string.gsub(s, '[\n\r]+', ' ')
    return s
end

--lab126 libraries
require("lab126_lipc")
require("lab126_logging")
require("lab126_focus")
require("lab126LayerLogic")
require("lab126_chrome_layer")
require("lab126_screensaver_layer")
require("lab126_dialog_layer")
require("lab126_keyboard_layer")
require("lab126_application_layer")
require("lab126_orientation")
require("lab126_whisper_touch")
require("lab126_ew")
require("lab126_ligl")
require("lab126_grip_suppression")
require("lab126_button_handling")
require("lab126_asr")
require("lab126_preference")
require("lab126_eat_tap_mode")

-- Configure garbage collector to start when total memory in use increases by 25% 
local oldGcPause = collectgarbage("setpause", 125)
log("collectgarbage.pause = 125. Was " .. tostring(oldGcPause)) 
log_info("Initialize: begin")

initLipcInterface()

-- Default modkey.
-- Usually, Mod4 is the key with a logo between Control and Alt.
-- If you do not like this or do not have such a key,
-- I suggest you to remap Mod4 to another key using xmodmap or other tools.
-- However, you can use another modifier like Mod1, but it may interact with others.
modkey = "Mod4"

-- Table of layouts to cover with awful.layout.inc, order matters.
layouts =
{
    awful.layout.suit.floating,
    awful.layout.suit.tile,
    awful.layout.suit.tile.left,
    awful.layout.suit.tile.bottom,
    awful.layout.suit.tile.top,
    awful.layout.suit.fair,
    awful.layout.suit.fair.horizontal,
    awful.layout.suit.spiral,
    awful.layout.suit.spiral.dwindle,
    awful.layout.suit.max,
    awful.layout.suit.max.fullscreen,
    awful.layout.suit.magnifier
}
-- }}}
-- single window, two tags
globalTag = awful.tag({ 1, 2 }, 1, layouts[1])

-- {{{ Key bindings
globalkeys = awful.util.table.join(
    awful.key({ "Any",      }, "F1", nil, accelerometerPortraitUp),
    awful.key({ "Any",      }, "F2", nil, accelerometerPortraitDown),
    awful.key({ "Any",      }, "F3", nil, accelerometerLandscapeLeft),
    awful.key({ "Any",      }, "F4", nil, accelerometerLandscapeRight),
    awful.key({ "Any",      }, "Home", handleHomeKeyDown, handleHomeKeyUp),
    awful.key({ "Any",      }, "Scroll_Lock", nil, screenshot),
    awful.key({ "Shift",    }, "j", print_dbg_info),
    awful.key({ "Shift",    }, "f", dumpFocusInfo),
    awful.key({ "Shift",    }, "c", function() log("shift c down") end, chrome_raise),
    awful.key({ "Shift",    }, "x", function() log("shift x down") end, chrome_lower)
)
-- }}}


-- {{{ button bindings to add to every client
clientbuttons = awful.util.table.join(
    awful.button({    }, 0, handleClientButton0Press, handleClientButton0Release),
    awful.button({    }, 1, handleClientButton1Press, handleClientButton1Release)
)
-- }}}

-- key bindings 
-- Added scroll_lock key here to fix infinte screenshots (JFIVE-4379)
clientkeys = awful.util.table.join(
    awful.key({             }, "Page_Up", handleWhisperTouchPress,handleWhisperTouchRelease),
    awful.key({             }, "Page_Down", handleWhisperTouchPress,handleWhisperTouchRelease)
)

-- Set keys
root.keys(globalkeys)

--[[
awesome callback sent when a new client appears and can be managed.
There is also a "new" signal that fires but it seems the manage is the right
one to use
c               : awesome client
]]--
client.add_signal("manage", function (c, startup)

    -- Log client information
    logTimeStamp("*****manage signal fired ")
    logStrings({"name : ", c.name})
    logStrings({"type : ", c.type})
    logStrings({"class: ", c.class})

    -- check buttons as is
    local inButtonsTable = c:buttons()
    print_table_contents("inButtonsTable", inButtonsTable, "")
    
    --grab buttons
    c:buttons(clientbuttons)
    c:keys(clientkeys)
    
    --look for property name changed
    c:add_signal("property::name", clientSignalNameChanged)
    
    c:add_signal("property::geometry", clientSignalGeometryChanged)

    c:add_signal("property::hiddenLayer", clientLayerChanged)

    addClient(c)

    log("*****manage finished")
end)

--[[
Handle X client message from a particular window
@params c           : client who sent the message
@params messageName : atom name of message
@params data        : data object with 20 byte message data
]]--
client.add_signal("message", function (c, messageName, data)

    -- Log client information
    logTimeStamp("client message %s, %s", messageName, c.name)
    local win = windowTableFindByClient(c)

    if not win then
        llog.warn("WindowManager", "clientMessageUnknownWindow", "windowName=" .. tostring(c.name), "") 
        return
    end
  
    if messageName == "lab126_flash" then
    
        -- flash call can only be made by fully unobscured window
        if c:is_obscured() then
            llog.info("WindowManager", "clientMessageBadRequest", "windowName=" .. tostring(c.name) ..",messageName=" .. tostring(messageName), "client message from obscured window")
            return 
        end
        
        log("handling %s", messageName)
        
        local geom = getClientGeometry(c)
        local x = clientData.get_uint16(data) + geom.x
        local y = clientData.get_uint16(data) + geom.y
        local w = clientData.get_uint16(data)
        local h = clientData.get_uint16(data)
        fid = clientData.get_uint8(data)

        log ("force flash %d,%d %dx%d fid=%d", x, y, w, h, fid)
        ligl_flash_rect(x, y, w, h, fid)
    elseif messageName == "lab126_create_trigger" then
    
        -- the current application can always create a flash trigger
        -- other windows can only create a flash trigger if fully unobscured
        if (getActiveApplicationWindow() == nil or getActiveApplicationWindow().c ~= c) and c:is_obscured() then
            llog.info("WindowManager", "clientMessageBadRequest", "windowName=" .. tostring(c.name) ..",messageName=" .. tostring(messageName), "client message from obscured window")
            return 
        end
        
        log("handling %s", messageName)
        
        local geom = getClientGeometry(c)
        local triggerType = clientData.get_uint8(data)
        local flashFid = clientData.get_uint8(data)
        local waitTimeout = clientData.get_uint16(data)
        local afterDamageTimeout = clientData.get_uint16(data)
        
        local x = clientData.get_uint16(data)
        local y = clientData.get_uint16(data)
        local w = clientData.get_uint16(data)
        local h = clientData.get_uint16(data)   
        local flags = clientData.get_uint32(data)
        
        ligl_set_trigger(win, triggerType, flashFid, waitTimeout, afterDamageTimeout, x, y, w, h, flags)
    elseif messageName == "lab126_clear_trigger" then
    
        -- NOTE always allow the clear trigger call to go through
        -- regardless of the state of the window
        log("handling %s", messageName)
        local justDestroy = clientData.get_uint8(data)
        
        ligl_clear_client_signal_trigger(win, justDestroy)
    elseif messageName == "lab126_wipe_direction" then
    
        -- the current application can set sensitivity wipe direction
        -- other windows can only set animated wipe direction if fully unobscured
        if (getActiveApplicationWindow() == nil or getActiveApplicationWindow().c ~= c) and c:is_obscured() then
            llog.info("WindowManager", "clientMessageBadRequest", "windowName=" .. tostring(c.name) ..",messageName=" .. tostring(messageName), "client message from obscured window")
            return 
        end
        
        local direction = clientData.get_uint8(data)
        ligl_set_sensitivity_triggered_direction(direction)
    else
        llog.info("WindowManager", "clientMessageUnknownRequest", "windowName=" .. tostring(c.name) ..",messageName=" .. tostring(messageName), "unsupported message type")
    end

    logTimeStamp("*****client message finished")
end)

--[[
awesome callback sent when a client is unmapped or otherwise
no longer in scope of the winmgr
]]--
client.add_signal("unmanage", function (c)

    -- wrap in xpcall to make sure that if an exception does occur 
    -- before we remove the client from our internal list 
    -- we still get far enough to remove the client
    xpcall(function()
        -- notify ligl as fast as possible
        liglClientUnmanaged(c)

        -- Log client information
        log("*****unmanage signal fired")
        log("name : ", tostring(c.name))
        log("type : ", tostring(c.type))
        log("class: ", tostring(c.class))
        
        notifyTapAwayParent(windowTableFindByClient(c), false) 
        
    end, 
    -- skip 4 lines of stack as call goes to logging call
    function(error) logErrorAndStackTrace(error, 4) end)
    
    local window = windowTableFindByClient(c)

    -- remove client from internal list of clients
    removeClient(c)

    log("removing from focus stack")
    removeFromFocusHistory(c)

    -- For unmapped windows reconfigure GS and WT
    configureFsrForWindowToHiddenLayer(window)
    configureGSForUnFocusedWindow(c)

    log("*****unmanage finished")
end)

--[[
awesome callback sent when focus is set to new client
]]--
client.add_signal("focus", function(c) 
    handleClientFocus(c)
end)

--[[
awesome callback sent when a client loses focus
]]--
client.add_signal("unfocus", function(c) 
    handleClientUnfocus(c)
end)

g_screenOne:add_signal("rotate", function()
    handleScreenRotation()
end)


-- }}} Signals

--[[
-- {{{ Rules - Note that rules fire before the manage signal
awful.rules.rules = {
    -- All clients will match this rule.
    { rule = { },
      callback = function() print("*****all rule fired*****") end },
    { rule = { name = "pillowTopBar" },
      callback = function() print("*****pillowTopBar rule fired*****") end },
}
--]]

-- }}}

awesome.add_signal("onawesomeready", function()
  log_info("onawesomeready event")
  liglInitialize()
end)

-- handle errors so we can log stack trace
-- skip 5 lines of stack as call goes through c layer and to logging call from 
-- point of error
awesome.add_signal("debug::error", function(error) logErrorAndStackTrace(error, 5) end)

--initialize all layers
initLayers()

log_info("Initialize: end")


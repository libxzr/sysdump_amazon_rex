-- Copyright (c) 2011 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

require("libpixmanlua")

--[[
validates region against screen, clipping if need be
@params x0 left offset coord of rect on screen
@params y0 top offset coord of rect on screen
@params rect rect to validate
@params name of trigger
]]--
local function getValidatedRegion(x0, y0, rect, name)
 
    -- get pixel coords for topLeft, bottomRight
    local x1 = x0 + rect.x
    local y1 = y0 + rect.y
    local x2 = x0 + rect.x + rect.width - 1
    local y2 = y0 + rect.y + rect.height - 1
    
    -- check for completely offscreen 
    if x1 >= g_screenOne.geometry.width or y1 >= g_screenOne.geometry.height or
            x2 < 0 or y2 < 0 then
        llog.info("WindowManager", "invalid-trigger", "trigger is fully offscreen %s", "", 
            name)
        -- return nil as invalid trigger
        return nil        
    end
    
    -- adjust extents to screen
    if x1 < 0 then
        llog.info("WindowManager", "clipping-trigger", "clipping x %s", "", 
            name)
        x1 = 0
    end
    
    if y1 < 0 then
        llog.info("WindowManager", "clipping-trigger", "clipping y %s", "", 
            name)
        y1 = 0
    end

    if x2 >= g_screenOne.geometry.width then
        llog.info("WindowManager", "clipping-trigger", "clipping width %s", "", 
            name)
        x2 = g_screenOne.geometry.width -1
    end
   
    if y2 >= g_screenOne.geometry.height then
        llog.info("WindowManager", "clipping-trigger", "clipping height %s", "", 
            name)
        y2 = g_screenOne.geometry.height -1
    end

    return pixman.region.new(x1 - x0, y1 - y0, x2 - x1 + 1, y2 - y1 + 1)
end

--[[
gets an inset sub rect of the passed in rect
@params rect outer rect
@params inset number of pixels ot inset from outer rect
]]--
local function getInsetGeometry(rect, inset)
    if not inset then
        return rect
    end
    
    return {x=rect.x+inset, y=rect.y+inset, width=rect.width-(2*inset), height=rect.height-(2*inset)}
end

-------------------------------------------------------

--- TriggerClient class
-- Triggers flash when we get all the XDamage events for a rect inside of particilar client
TriggerClient = {}
TriggerClient.__index = TriggerClient

--- TriggerClient constructor
-- @param c Client
-- @param rect Rectangle (optional). If omitted use client geometry.
-- @return New TriggerClient object
function TriggerClient.create(c, rect, flashOnlyRect)
    logTimeStamp("client trigger create %s", c.name)
    local obj = {}                            -- our new object
    setmetatable(obj, TriggerClient)  -- lookup methods in TriggerClient
    obj.name = c.name
    obj.client = c
    local g = c:geometry()
    if rect then
        obj.region = getValidatedRegion(g.x, g.y, rect, obj.name)
        if flashOnlyRect then
            local x, y, x2, y2 = obj.region:extents()
            obj.geom = {x=x+g.x, y=y+g.y, width=x2-x, height=y2-y}
        end
        
        obj.expectClientFullDamage = false
    else
        local bw = c.border_width
        obj.region = getValidatedRegion(g.x, g.y, {x=0, y=0, width=g.width - 2 * bw, height=g.height - 2 * bw}, obj.name) 
        obj.expectClientFullDamage = true
    end
    
    -- invalid region, return nil
    if not obj.region then
        return nil
    end
    
    obj.undamaged = obj.region
    return obj
end

--- Compare two triggers
-- @param t1 Trigger
-- @param t2 Trigger
-- @return true if t1 == t2
function TriggerClient.__eq(t1, t2)
    return t1.client == t2.client and t1.region == t2.region
end

--- Check to see if matching trigger and resize if needed
-- @param c Client
function TriggerClient:resizeCheck(c)
    if self.client == c and not self.undamaged:isempty() and self.expectClientFullDamage then
        local g = c:geometry()
        local bw = c.border_width
        local newRegion = pixman.region.new(0, 0, g.width - 2 * bw, g.height - 2 * bw)
        if newRegion ~= self.region then
            log("client trigger resized")
            self.region = newRegion 
            self.undamaged = self.region
        end
    end
end

--- Handle XDamage event. 
-- @param c Client
-- @param x X coordinate of damaged area
-- @param y Y coordinate of damaged area
-- @param w Width of damaged area
-- @param h Height of damaged area
-- @return true if we waiting for more damages
function TriggerClient:damage(c, x, y, w, h)
    if not self.undamaged:isempty() and self.client == c and x >= 0 and y >= 0 then
        self.undamaged = self.undamaged - pixman.region.new(x, y, w, h)
    end
    return not self.undamaged:isempty()
end        

--- Return trigger geometry, which is used for flash rect calculation
-- @return Geometry (x, y, width, height)
function TriggerClient:geometry()
    if self.geom then
        return self.geom
    end
    
    return self.client:geometry()
end

--- Check if we are waiting for more damages
-- @return true if trigger is still waiting for more damages
function TriggerClient:iswaiting()
    return not self.undamaged:isempty()
end

--------------------------------------------------------

--- TriggerClientNextDraw class
-- Triggers flash when we get any XDamage event for a particilar client  
TriggerClientNextDraw = {}
TriggerClientNextDraw.__index = TriggerClientNextDraw

--- TriggerClient constructor
-- @param c Client
-- @param rect Rectangle (optional). If omitted use client geometry.
-- @return New TriggerClient object
function TriggerClientNextDraw.create(c, rect)
    logTimeStamp("client next draw trigger create %s", c.name)
    local obj = {}                            -- our new object
    setmetatable(obj, TriggerClientNextDraw)  -- lookup methods in TriggerClient
    obj.name = c.name
    obj.client = c
    obj.waiting = true
    
    local g = c:geometry()
    if rect then
        obj.region = getValidatedRegion(g.x, g.y, rect, obj.name)
        local x, y, x2, y2 = obj.region:extents()
        obj.geom = {x=x+g.x, y=y+g.y, width=x2-x, height=y2-y}
    end
    
    return obj
end

--- Compare two triggers
-- @param t1 Trigger
-- @param t2 Trigger
-- @return true if t1 == t2
function TriggerClientNextDraw.__eq(t1, t2)
    return t1.client == t2.client and t1.region == t2.region
end

--- Check to see if matching trigger and resize if needed
-- @param c Client
function TriggerClientNextDraw:resizeCheck(c)
    -- do nothing
end

--- Handle XDamage event. 
-- @param c Client
-- @param x X coordinate of damaged area
-- @param y Y coordinate of damaged area
-- @param w Width of damaged area
-- @param h Height of damaged area
-- @return true if we waiting for more damages
function TriggerClientNextDraw:damage(c, x, y, w, h)
    if self.client == c and x >= 0 and y >= 0 then
        self.waiting = false
    end
    return self.waiting
end        

--- Return trigger geometry, which is used for flash rect calculation
-- @return Geometry (x, y, width, height)
function TriggerClientNextDraw:geometry()
    if self.geom then
        return self.geom
    end
    
    return self.client:geometry()
end

--- Check if we are waiting for more damages
-- @return true if trigger is still waiting for more damages
function TriggerClientNextDraw:iswaiting()
    return self.waiting
end

--------------------------------------------------------

--- TriggerActiveApp class
-- Triggers flash when we get an XDamage for active app 
TriggerActiveApp = {}
TriggerActiveApp.__index = TriggerActiveApp

--- TriggerActiveApp constructor
-- @return New TriggerActiveApp object
function TriggerActiveApp.create(id)
    logTimeStamp("app trigger create appId=%s", id)
    local obj = {}                       -- our new object
    setmetatable(obj, TriggerActiveApp)  -- lookup methods in TriggerActiveApp
    obj.name = "Active App"
    obj.waiting = true
    obj.appID = id
    return obj
end


--- Compare two triggers
-- @param t1 Trigger 1
-- @param t2 Trigger 2
-- @return true if t1 == t2
function TriggerActiveApp.__eq(t1, t2)
    -- we only have one active app, so always return true
    return true
end

--- Handle XDamage event.
-- @param c Client
-- @param x X coordinate of damaged area
-- @param y Y coordinate of damaged area
-- @param w Width of damaged area
-- @param h Height of damaged area
-- @return true if we waiting for more damages
function TriggerActiveApp:damage(c, x, y, w, h)
    if self.waiting then
        local win = windowTableFindByClient(c)
        if win and win.params and win.params.ID == self.appID then
            log("active app trigger satisfied appID=%s", self.appID)
            self.waiting = false
        end
    end
    return self.waiting
end        

--- Check if we are waiting for more damages
-- @return true if trigger is still waiting for more damages
function TriggerActiveApp:iswaiting()
    return self.waiting
end

--- Check to see if matching trigger and resize if needed
-- @param c Client
function TriggerActiveApp:resizeCheck(c)
    -- do nothing, app triggers have no size
end

--- Return trigger geometry, which is used for flash rect calculation
-- @return Geometry (x, y, width, height)
function TriggerActiveApp:geometry()
    -- make sure active app matches expected ID as well
    if isActiveAppId(self.appID) then
        return getActiveApplicationWindow() and getActiveApplicationWindow().c:geometry()
    else
        return { x = 0, y = 0, width = 0, height = 0 }
    end
end

--------------------------------------------------------


--- TriggerClientSignal class
-- cleared when the client signals via client message that it is done 
TriggerClientSignal = {}
TriggerClientSignal.__index = TriggerClientSignal

--- TriggerActiveApp constructor
-- @return New TriggerActiveApp object
function TriggerClientSignal.create(c, rect)
    logTimeStamp("signal trigger create")
    local obj = {}                       -- our new object
    setmetatable(obj, TriggerClientSignal)  -- lookup methods in TriggerActiveApp
    obj.name = c.name
    obj.waiting = true
    obj.client = c
    
    if rect then
        local g = c:geometry()
        obj.region = getValidatedRegion(g.x, g.y, rect, obj.name)
        local x, y, x2, y2 = obj.region:extents()
        obj.geom = {x=x+g.x, y=y+g.y, width=x2-x, height=y2-y}
        log("client signal with rect %dx%d", obj.geom.width, obj.geom.height)
    end
    
    return obj
end


--- Compare two triggers
-- @param t1 Trigger 1
-- @param t2 Trigger 2
-- @return true if t1 == t2
function TriggerClientSignal.__eq(t1, t2)
    return t1.client == t2.client and t1.region == t2.region
end

--- Handle XDamage event.
-- @param c Client
-- @param x X coordinate of damaged area
-- @param y Y coordinate of damaged area
-- @param w Width of damaged area
-- @param h Height of damaged area
-- @return true if we waiting for more damages
function TriggerClientSignal:damage(c, x, y, w, h)
    -- cannot be cleared by damage
    return self.waiting
end     

-- Method unique to TriggerClientSignal, only way trigger is cleared
function TriggerClientSignal:signalIn(c)
    if c == self.client then
        logTimeStamp("signal trigger cleared")
        self.waiting = false
    end
    return self.waiting
end      

--- Check if we are waiting for more damages
-- @return true if trigger is still waiting for more damages
function TriggerClientSignal:iswaiting()
    return self.waiting
end

--- Check to see if matching trigger and resize if needed
-- @param c Client
function TriggerClientSignal:resizeCheck(c)
    -- do nothing
end

--- Return trigger geometry, which is used for flash rect calculation
-- @return Geometry (x, y, width, height)
function TriggerClientSignal:geometry()
    if self.geom then
        return self.geom
    end
    
    return self.client:geometry()
end

--------------------------------------------------------

--- TriggerRoot class
-- Triggers flash when we get all the XDamage events for a pariticular rect
TriggerRoot = {}
TriggerRoot.__index = TriggerRoot

--- TriggerRoot constructor
-- @param rect Rectangle in root coordinates
-- @param inset optional inset into rect
-- @return New TriggerClient object
function TriggerRoot.create(rect, inset)
    logTimeStamp("Root trigger create")
    local obj = {}                  -- our new object
    setmetatable(obj, TriggerRoot)  -- lookup methods in TriggerRoot
    obj.name = "Root " .. tostring(rect.x) .. " " .. tostring(rect.y) ..
        " " .. tostring(rect.width) .. "x" .. tostring(rect.height)

    obj.region = getValidatedRegion(0, 0, getInsetGeometry(rect, inset), obj.name)

    -- invalid region, return nil
    if not obj.region then
        return nil
    end

    obj.undamaged = obj.region
    return obj
end

--- Compare two triggers
-- @param t1 Trigger
-- @param t2 Trigger
-- @return true if t1 == t2
function TriggerRoot.__eq(t1, t2)
    -- TODO return true if compare root rigger is contained inside
    return t1.region == t2.region
end

--- Handle XDamage event. 
-- @param c Client
-- @param x X coordinate of damaged area
-- @param y Y coordinate of damaged area
-- @param w Width of damaged area
-- @param h Height of damaged area
-- @return true if we waiting for more damages
function TriggerRoot:damage(c, x, y, w, h)
    if not self.undamaged:isempty() then
        local g = c:geometry()
        local bw = c.border_width

        self.undamaged = self.undamaged - pixman.region.new(g.x + bw + x, g.y + bw + y, w, h)
    end
    
    --log("TriggerRoot:damage self.undamaged = " .. tostring(self.undamaged))
    
    return not self.undamaged:isempty()
end

--- Return trigger geometry, which is used for flash rect calculation
-- @return Geometry (x, y, width, height)
function TriggerRoot:geometry()
    return g_screenOne.geometry
end

--- Check if we are waiting for more damages
-- @return true if trigger is still waiting for more damages
function TriggerRoot:iswaiting()
    return not self.undamaged:isempty()
end

--- Check to see if matching trigger and resize if needed
-- @param c Client
function TriggerRoot:resizeCheck(c)
    -- 
end

--------------------------------------------------------

--- TriggerEWH class
-- Triggers flashes when we get xdamage for the EWC client transient for the EWH
TriggerEWH = {}
TriggerEWH.__index = TriggerEWH

--- TriggerClient constructor
-- @param c EWH Client
-- @param rect Rectangle (optional). If omitted use client geometry.
-- @return New TriggerClient object
function TriggerEWH.create(c)
    logTimeStamp("EWH trigger create %s", c.name)
    local obj = {}                            -- our new object
    setmetatable(obj, TriggerEWH)  -- lookup methods in TriggerClient
    obj.name = c.name
    obj.client = c
    obj.waiting = true
    return obj
end

--- Compare two triggers
-- @param t1 Trigger
-- @param t2 Trigger
-- @return true if t1 == t2
function TriggerEWH.__eq(t1, t2)
    return t1.client == t2.client
end

--- Check to see if matching trigger and resize if needed
-- @param c Client
function TriggerEWH:resizeCheck(c)
    -- trigger is not bound to a particular rect so nothing
    -- to do on resize
end

--- Handle XDamage event. 
-- @param c Client
-- @param x X coordinate of damaged area
-- @param y Y coordinate of damaged area
-- @param w Width of damaged area
-- @param h Height of damaged area
-- @return true if we waiting for more damages
function TriggerEWH:damage(c, x, y, w, h)
    -- check to see if c is transient for (in other words an EWC for)
    -- the EWH this trigger was set on
    self.waiting = not (c.transient_for == self.client)
    return self.waiting
end        

--- Return trigger geometry, which is used for flash rect calculation
-- @return Geometry (x, y, width, height)
function TriggerEWH:geometry()
    return self.client:geometry()
end

--- Check if we are waiting for more damages
-- @return true if trigger is still waiting for more damages
function TriggerEWH:iswaiting()
    return self.waiting
end

----------------------------------------------------------

--- TriggerEvent class
-- trigger is tied to an event described by a string passed in at construction time
-- NOTE this trigger is not assosiated with a window but rather a state determined in winmgr
TriggerEvent = {}
TriggerEvent.__index = TriggerEvent

--- TriggerActiveApp constructor
-- @return New TriggerActiveApp object
function TriggerEvent.create(eventName)
    logTimeStamp("signal trigger create %s", eventName)
    local obj = {}                       -- our new object
    setmetatable(obj, TriggerEvent)  -- lookup methods in TriggerActiveApp
    obj.name = eventName
    obj.waiting = true
    return obj
end


--- Compare two triggers
-- @param t1 Trigger 1
-- @param t2 Trigger 2
-- @return true if t1 == t2
function TriggerEvent.__eq(t1, t2)
    return t1.name == t2.name
end

--- Handle XDamage event.
-- @param c Client
-- @param x X coordinate of damaged area
-- @param y Y coordinate of damaged area
-- @param w Width of damaged area
-- @param h Height of damaged area
-- @return true if we waiting for more damages
function TriggerEvent:damage(c, x, y, w, h)
    -- cannot be cleared by damage
    return self.waiting
end     

-- Method unique to TriggerClientSignal, only way trigger is cleared
function TriggerEvent:eventIn(eventName)
    if eventName == self.name then
        logTimeStamp("event trigger cleared")
        self.waiting = false
    end
    
    return self.waiting
end      

--- Check if we are waiting for more damages
-- @return true if trigger is still waiting for more damages
function TriggerEvent:iswaiting()
    return self.waiting
end

--- Check to see if matching trigger and resize if needed
-- @param c Client
function TriggerEvent:resizeCheck(c)
    -- do nothing
end

--- Return trigger geometry, which is used for flash rect calculation
-- @return Geometry (x, y, width, height)
function TriggerEvent:geometry()
    -- return empty rect, there is no window assosiated with this event trigger
    return {x=0,y=0,width=0,height=0}
end


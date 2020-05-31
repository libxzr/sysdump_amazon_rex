-- Copyright (c) 2011 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

--- EWH/EWC Implementation.
-- Every EWC (client) window is stacked right above a correspondig EWH (host) window. 
-- EWH:<id> and EWC:<id> parameters are used for matching EWH and EWC. EWH-x, EWH-y, 
-- EWH-w and EWH-h parameters specify EWC location, which is relative to EWH. 
-- EWC is hidden until a corresponding EWH appears. 
-- If invalid EWH-x, EWH-y, EWH-w or EWH-h is specified then EWC is hidden.
-- EWC responds to EWH position and size changes by resizing appropriately.
-- EWC window is automatically destructed upon EWH window destruction.

require ("llog")

local ew_hosts = {}
local ew_clients = {}

--- Get host by id.
-- @param id Host id.
-- @return Host.
local function prv_get_host(id)
    return ew_hosts[id]
end

--- Get client by id.
-- @param id Client id.
-- @return Client.
local function prv_get_client(id)
    return ew_clients[id]
end

--- Store host in hosts table and return the old one if any.
-- @param id Host id.
-- @paran host Host to store in the table. Could be nil.
-- @return Old host.
local function prv_set_host(id, host)
    local old = ew_hosts[id]
    ew_hosts[id] = host
    return old
end

--- Store client in clients table and return the old one if any.
-- @param id Client id.
-- @paran host Client to store in the table. Could be nil.
-- @return Old client.
local function prv_set_client(id, client)
    local old = ew_clients[id]
    ew_clients[id] = client
    return old
end

--- Hide window.
-- Hide window by putting it below normal windows.
-- @param window Window to hide.
local function prv_hide_window(window)
    if window then
        setClientLayer(window, LAYERS.HIDDEN)
        window.c.transient_for = nil
    end
end

--- Destroy window.
-- @param window Window to destroy.
local function prv_destroy_window(window)
    if window then
        -- call destroy() because kill() closes X connection
        window.c:destroy()
    end    
end

--- Find intersection between two rectangles
-- @param r1 Rectanle 1
-- @param r2 Rectanle 2
-- @return Intersection of r1 and r2
local function prv_intersect(r1, r2)
    local x0 = math.max(r1.x, r2.x)
    local y0 = math.max(r1.y, r2.y)
    local x1 = math.min(r1.x + r1.width, r2.x + r2.width)
    local y1 = math.min(r1.y + r1.height, r2.y + r2.height)

    return { 
        x = x0, 
        y = y0, 
        width = (x1 > x0) and (x1 - x0) or 0,
        height = (y1 > y0) and (y1 - y0) or 0 
    }
end

--- Reparent two windows.
-- Set transient_for and change client's geometry
-- @param host Host. Should have valid EWH-XXX parameters. If not, client will be hidden.
-- @param client Client.
-- @param added True if the action is because of a new window, false if because an update. 
local function prv_reparent(host, client, action)
    if host and client then 
        log("prv_reparent host = " .. host.c.name .. " client = " .. client.c.name)

        local host_g = host.c:geometry()
        local border = host.c.border_width
        host_g.x = host_g.x + border
        host_g.y = host_g.y + border
        host_g.width = host_g.width - 2 * border
        host_g.height = host_g.height - 2 * border
        local client_g = { x = 0, y = 0, width = 0, height = 0}
        if tonumber(host.params["EWH-x"]) and tonumber(host.params["EWH-y"]) and
            tonumber(host.params["EWH-w"]) and tonumber(host.params["EWH-h"])
        then
            client_g = {
                x = host.params["EWH-x"] + host_g.x,
                y = host.params["EWH-y"] + host_g.y,
                width = tonumber(host.params["EWH-w"]),
                height = tonumber(host.params["EWH-h"])
            }
        end
        client_g = prv_intersect(host_g, client_g)

        log("client_g = " .. client_g.x .. " " .. client_g.y .. " " .. client_g.width .. " " .. client_g.height)

        if client_g.width <= 0 or client_g.height <= 0 then
            -- hide client because Awesome ignores zero size 
            prv_hide_window(client)
        else 
            changeWindowGeometry(client, client_g)

            -- dont set client layer on geometry changes
            if action ~= "updatedGeometry" then
                setClientLayer(client, LAYERS.DIALOG)
            end

            -- this is a little hacky, but aiming at short term ACX performance
            -- if the ACX child has the hide flag it remains hidden, so dont set
            -- transient for flag until it is not hidden. This allows us to delay the
            -- show of the ACX client until it is ready, but not require a redraw of
            -- the host when it does show
            if not client.params.HIDE then
                client.c.transient_for = host.c
            end

            -- modality is controlled by host
            client.c.modal = host.c.modal
        end

        -- Assume client initially has KB focus. This matches current use case. If we need to mix
        -- KB entry between EWH and EWC we made need a hint of some sort
        if action ~= "updatedGeometry" then
            setFocusedClient(client.c)
        end
    end
end

--- Called when host added or host title, size etc. changed.
-- Update hosts table. Perform client geometry change if there is a client
-- @param host Host
-- @param added True if the action is because of a new window, false if because an update. 
local function prv_host_updated(host, action)
    local id = host.params.EWH
    if (not id or id == "") then
        llog.error("lua", "ewhinv", "", "EWH id is invalid")
        return
    end

    local prev_host = prv_set_host(id, host)
    if prev_host and prev_host.c.window ~= host.c.window then
        -- new host with the same id
        llog.error("lua", "dupewh", "", "Duplicated EWH \'" .. id .. "\'")
    end

    prv_reparent(host, prv_get_client(id), action)
end

--- Called when client added or title changed.
-- Update clients table. If there is no host, hide the client.
-- Perform client geometry change if there is a host.
-- @param client Client
-- @param added True if the action is because of a new window, false if because an update. 
local function prv_client_updated(client, action)
    local id = client.params.EWC
    
    if client.params.RKB then
        client.params.M = true
    end
    
    if (not id or id == "") then
        llog.error("lua", "ewcinv", "", "EWC id is invalid")
        return
    end

    local prev_client = prv_set_client(id, client)
    if prev_client and prev_client.c.window ~= client.c.window then
        -- new client with the same id - hide the previous one
        llog.error("lua", "dupewc", "", "Duplicated EWC \'" .. id .. "\'. Hiding previous client")
        prv_hide_window(current_client)
    end

    if prv_get_host(id) then
        prv_reparent(prv_get_host(id), client, action)
    else 
        -- no host yet - hide client
        prv_hide_window(client)
    end
end

--- Called when host removed
-- Update hosts table. If there is a client still, destroy it.
-- @param host Host
local function prv_host_removed(host)
    local id = nil 

    if host.params.EWH then
        id = host.params.EWH
    elseif host.oldParams.EWH then
        id = host.oldParams.EWH
    end
	    
    if (not id or id == "") then
        llog.error("lua", "ewhinv", "", "EWH id is invalid")
        return
    end
    local current_host = prv_get_host(id)
    if not current_host or current_host.c.window ~= host.c.window then
        llog.error("lua", "noewh", "", "EWH \'" .. id .. "\' not found")
        return
    end

    -- hide and destroy client window if any
    local client = prv_get_client(id)
    prv_hide_window(client)
    prv_destroy_window(client)

    prv_set_host(id, nil)
end

--- Called when client removed
-- Update clients table.
-- @param client Client
local function prv_client_removed(client)
    local id = client.params.EWC
    if (not id or id == "") then
        llog.error("lua", "ewcinv", "", "EWC id is invalid")
        return
    end
    local current_client = prv_get_client(id)
    if not current_client or current_client.c.window ~= client.c.window then
        llog.error("lua", "noewc", "", "EWC \'" .. id .. "\' not found")
        return
    end

    prv_set_client(id, nil)
end

--- Create new layout function.
-- Old layout function will be chained.
-- @param layoutFunc Layout function
-- @return Callback function, which will be called if a window added, removed or changed.
function ew_layout(layoutFunc)
    return function(self, updatedWindow, action)

        if not updatedWindow.params.EWC or action == "removed" then
            layoutFunc(self, updatedWindow, action)
        end

        if updatedWindow.params.EWH then
            -- Host
            if action == "removed" then
                prv_host_removed(updatedWindow)
            else 
                prv_host_updated(updatedWindow, action)
            end
        elseif updatedWindow.params.EWC then 
            -- Client
            if action == "removed" then
                prv_client_removed(updatedWindow)
            else
                prv_client_updated(updatedWindow, action)
            end
        elseif updatedWindow.oldParams and updatedWindow.oldParams.EWH then
	    if action == "updatedParams" then
                prv_host_removed(updatedWindow)
            end
        end
        
        
    end
end

--[[
Looks up a EWH host matching the given EWC
]]
function ew_get_host(ewc)
    if not ewc or not ewc.params.EWC then
        return nil
    end
    
    return prv_get_host(ewc.params.EWC)
end

--[[
Looks up a EWC client matching the given EWH
]]
function ew_get_client(ewh)
    if not ewh or not ewh.params.EWH then
        return nil
    end
    
    return prv_get_client(ewh.params.EWH)
end


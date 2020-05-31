-- Copyright (c) 2011-2016 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.
require 'lab126_logging'


-- Z Stack Layers matching
-- internal layers in Awesome
-- 0 and 1 are used by awesome 
-- and we do not use them here
LAYERS = {}
LAYERS.HIDDEN = 2 -- hidden
LAYERS.BLANK = 3  -- below
LAYERS.APP = 4    -- normal
LAYERS.CHROME = 5 -- above
LAYERS.DIALOG = 6 -- dialog
LAYERS.KB = 7     -- KB
LAYERS.ALERT = 8  -- ALERT
LAYERS.FULL = 9   -- FULL, not used
LAYERS.SCREENSAVER = 10 -- ontop


--[[
initializes layering logic, sets up callbacks etc.
]]--
function initLayers()
    log("++++++setting up layers")
    
    local appLayer = findLayer("A")
    appLayer.layoutFunc = ligl_layout(ew_layout(applicationLayer_layout))

    local chromeLayer = findLayer("C")
    chromeLayer.layoutFunc = ligl_layout(chromeLayer_layout)

    local dialogLayer = findLayer("D")
    dialogLayer.layoutFunc = ligl_layout(ew_layout(dialogLayer_layout))
    
    local kbLayer = findLayer("KB")
    kbLayer.layoutFunc = ligl_layout(keyboardLayer_layout)
    
    local screenSaverLayer = findLayer("SS")
    screenSaverLayer.layoutFunc = ligl_layout(screenSaverLayer_layout)

end


--[[
sets client c's z stack layer in awesome
note that this differs from calling
c->hiddenLayer = true in that this is a sync
operation. The latter
]]--
function setClientLayer(win, newZStackLayer)

    -- check for HIDE flag override
    local layerTo
    if win.params and win.params.HIDE then
        layerTo = LAYERS.HIDDEN
    else
        layerTo = newZStackLayer
    end

    if win and win.c then

        if layerTo == LAYERS.HIDDEN and not win.c.hiddenLayer then
            notifyTapAwayParent(win, false)
            visibilityChanged(win, false)

            win.c:set_layer_without_restack(layerTo)
            removeFromFocusHistory(win.c)

            -- window is hidden now, reconfigure WT and GS
            configureFsrForWindowToHiddenLayer(win)
            configureGSForUnFocusedWindow(win.c)
        elseif layerTo ~= LAYERS.HIDDEN and win.c.hiddenLayer then
            notifyTapAwayParent(win, true)
            visibilityChanged(win, true)

            local zLayerTop = nil
            -- see if window layers below an existing window
            if win.params.ZLB then
                zLayerTop = windowTableFindByFunc(function(w)
                    return w.params.ZLT == win.params.ZLB
            end)
                -- if a zLayerTop is found matching this window, make it transient
                -- for this window to ensure the z order sticks between the two
                if zLayerTop then
                    log("ZLB/ZLT match, layering below %s", zLayerTop.c.name)
                    zLayerTop.c:set_transient_for_dont_clip_bounds(win.c)
                    zLayerTop.pairDismiss = win
                    win.pairDismiss = zLayerTop
                end
            end

            win.c:set_layer_without_restack(layerTo)
            
            -- window is visible now, reconfigure WT and GS
            configureFsrWindowToVisibleLayer(win)
            configureGSForFocusedWindow(win.c)
        end

    end
end

--[[
look up a client by layerName and name and set Z stack order
]]--
function findAndSetClientLayer(layerName, name, newZStackLayer)
    setClientLayer(findWindow(layerName, name), newZStackLayer)
end


--[[
filter out entries in a table based on checkFunc
@params tbl LUA table to filter
@params checkFunc function of form
        function(entry)
            -- do something to check entry
            -- retun true to remove entry
            -- return false to leave in table
        end
]]--
function filterTable(tbl, checkFunc)
    local numRemoved = 0
    local idx = nil
    local nextIdx = next(tbl, idx)
    while nextIdx do
        if checkFunc(tbl[nextIdx]) then
            numRemoved = numRemoved + 1
            table.remove(tbl,nextIdx)
        else
            idx = nextIdx
        end
        nextIdx = next(tbl, idx)
    end
    
    return numRemoved
end

--[[ 
check to see if a string s starts with value
]]--
function stringStartsWith(s,value)
    if s == nil or value == nil then
        return false
    end
    return string.sub(s,1,string.len(value)) == value
end

--[[
check to see if string ends with the value
]]--
function stringEndsWith(s, value)

    if s == nil or value == nil then
        return false
    end

    local valueLen = string.len(value)

    if valueLen > string.len(s) then 
        return false
    end
    
    return string.sub(s, -valueLen) == value
end

--[[
make an iterator that returns substrings of the input
that were separated by the separator
]]--
function stringSplit(str, sep)
    if not str or not sep then
        return nil
    end
    if not stringEndsWith(str, sep) then
        -- appending the separator simplifies parsing
        str = str .. sep
    end
    if str == sep then
        -- no substrings to return
        return nil
    end
    local from = 1
    local to = str:find(sep, from)
    return function()
        if not to then
            return nil
        end
        local sub = str:sub(from, to - 1)
        from = to + 1
        to = str:find(sep, from)
        return sub
    end
end

function defaultValueParser(value)
    if value == "true" then
        return true
    elseif value == "false" then
        return false
    else 
        return value
    end
end

function arrayValueParser(str)
    local arr = {}
    for elem in stringSplit(str, ',') do
        arr:insert(elem)
    end
    return arr
end

function setValueParser(str)
    local set = {}
    for elem in stringSplit(str, ',') do
        set[elem] = true
    end
    return set
end

local valueParsers = {
    S=defaultValueParser,
    A=arrayValueParser,
    E=setValueParser,
}

--[[
parses window name
str                 : title string to parse
returns
    table of key value pairs
]]--
function parseWindowName(str) 

    local str = str
    local charSeparator = '_'

    -- validate
    if str == nil or not stringStartsWith(str, "L:") then
        return nil
    end

    local entries = {}

    for splitStr in stringSplit(str, '_') do
        log("splitStr is " .. splitStr)

        local indexOfMarker = string.find(splitStr, '[:~]')
        if not indexOfMarker then
            return nil
        end

        local key = string.sub(splitStr, 1, indexOfMarker - 1)
        local vtype = 'S'

        local indexOfColon
        if string.sub(splitStr, indexOfMarker, indexOfMarker) == '~' then
            indexOfColon = string.find(splitStr, ':')
            if not indexOfColon then
                return nil
            end
            vtype = string.sub(splitStr, indexOfMarker + 1, indexOfColon - 1)
        else
            indexOfColon = indexOfMarker
        end

        local valueParser = valueParsers[vtype] or defaultValueParser
        entries[key] = valueParser(string.sub(splitStr, indexOfColon + 1))
    end

    return entries

end  

--[[
Get single param from a name string
@ str
    string of key/value param pairs
@ paramName
    key to look for in str
]]--
function getStringParam(str, paramName)

    if not str or not paramName then
        return nil
    end
    
    local str = str
    local startIndex
    local colonIndex
    local charSeparator = '_'
    
    -- look for param with : marker at end of it
    startIndex, colonIndex = string.find(str, paramName .. ":")
    if not startIndex then
        -- not found
        return nil
    end

    -- look from colonIndex for _ marker
    startIndex = string.find(str, charSeparator, colonIndex)
    
    if startIndex then
        -- param value ranges form colon to start of next param
        return string.sub(str, colonIndex + 1, startIndex - 1)
    else
        -- param value ranges from colonIndex to end of string
        return string.sub(str, colonIndex + 1)
    end
end

local s_windowTable = {}

--[[
call func for each window in window table
@ func
    func to call
]]--
function windowTableForEach(func, ...)
    for i,window in pairs(s_windowTable) do
        func(window, ...)
    end
end

--[[
find a window by applying search func to each and returning 
first match. 
@ func
    Search func should return true on match.
]]--
function windowTableFindByFunc(func)
    for i,window in pairs(s_windowTable) do
        if func(window) then
            return window
        end
    end
end

--[[
finds matching window by client
c                       : awesome client to match on
returns
    window object
]]--
function windowTableFindByClient(c)
    if c then 
        return s_windowTable[c.window]
    end
    return nil
end

--[[
func to get list of all available windows.
returns
      list of all available windows as a table
]]--
function getAllWindows()
    local winTable = {}
    
    -- loop through all the available windows list
    for k,v in pairs(s_windowTable) do
        winTable[k] = v
    end
    
    return winTable
end

--[[
returns 
    the list of visible windows as a table.
]]--
function getVisibleWindows()
    ssLayer          = {} 
    kbLayer          = {} 
    alertLayer       = {} 
    dialogLayer      = {} 
    chromeLayer      = {} 
    applicationLayer = {}
    focusedwindow    = {}
    
    for k, v in pairs(s_windowTable) do
        if not string.find(v.c.name, "ID:blankBackground") and 
            not v.c.hiddenLayer and 
	    ( not v.c:is_obscured() or client.focus == v.c ) then
	    
            if v.params.L == "SS" then 
               ssLayer[k] = v
            elseif v.params.L == "D" and v.params.N == "pillowAlert" then
               alertLayer[k] = v
            elseif v.params.L == "KB" then
               kbLayer[k] = v
            elseif v.params.L == "D" then
               dialogLayer[k] = v
            elseif v.params.L == "C" then
               chromeLayer[k] = v
            elseif v.params.L == "A" then
               applicationLayer[k] = v
            end

	    -- currently focused window
	    if client.focus == v.c then
                focusedwindow[k] = v
            end
         end
    end

    -- Group them based on the Z order
    winTable = {}
    
    if next(ssLayer) ~= nil then
	for k, v in pairs(ssLayer) do
            winTable[k] = v
        end
    elseif next(alertLayer) ~= nil then
	for k, v in pairs(alertLayer) do
            winTable[k] = v
        end
    elseif next(dialogLayer) ~= nil then
        local topDialog = nil
	for k, v in pairs(dialogLayer) do
            if topDialog == nil or v.c:is_above(topDialog.c) then
               topDialog = v
            end
        end

	if topDialog.params.M == "dismissible" or topDialog.params.M == true then
            winTable[topDialog.c.window] = topDialog
	    if topDialog.pairDismiss and topDialog.pairDismiss.params.L == "D" then
                winTable[topDialog.pairDismiss.c.window] = topDialog.pairDismiss
            end 
        else 
            for k, v in pairs(dialogLayer) do
                if v.params.M == nil or v.params.M == false then 
                    winTable[v.c.window] = v
	            if v.pairDismiss and v.pairDismiss.params.L == "D" then
                        winTable[v.pairDismiss.c.window] = v.pairDismiss
                    end
                end
            end
        end
       
        for k, v in pairs(kbLayer) do
            winTable[k] = v
        end
    elseif next(applicationLayer) ~= nil then
        for k, v in pairs(chromeLayer) do
            winTable[k] = v
        end
	for k, v in pairs(applicationLayer) do
            winTable[k] = v
        end
        for k, v in pairs(kbLayer) do
            winTable[k] = v
        end
    elseif next(chromeLayer) ~= nil then
	for k, v in pairs(chromeLayer) do
            winTable[k] = v
        end
        for k, v in pairs(kbLayer) do
            winTable[k] = v
        end
    end

    -- focused client should always there
    for k, v in pairs(focusedwindow) do
        if winTable[k] == nil then
            winTable[k] = v
        end
    end
    
    return winTable
end

-- Below Here is table management
-- NOTE hard coding kbDefaultHeight until proper integration
-- NOTE If this table changed, update layoutLayers() function below
local layers = { 
    A =         {layerName="A", 
                    topOffset = 0, bottomOffset = 0},                                                   -- Application Layer
    C =         {layerName="C", 
                    topOffset = 0, footerBarOffset = 0, mediaBarOffset = 0,
                    activeFooterBar = nil, 
                    activeBars = {T = {height=0,y=0}, S = {height=0,y=0}, A = {height=0,y=0}}
                },                                                             -- Chrome Layer
    D =         {layerName="D"},                                                      -- Dialog Layer
    KB =        {layerName="KB", 
                    kbHeight = 0, kbDefaultHeight = 275, kbVisible = false},                            -- Keyboard Layer
    SS =        {layerName="SS"}                                                      -- ScreenSaver Layer
}

--[[
logging util function
]]--
function logOutAllLayers() 
    print_table_contents("allLayers", layers, "")
end

--[[
searches through layers for layer of lName
]]--
function findLayer(lName)
    return layers[lName]
end

--[[
finds 1st matching window in a layer
layerName               : name of layer to look in
name                    : name/role of window
return
    window object    
]]--
function findWindow(layerName, name)
    
    log("looking for " .. name .. " in " .. layerName)
    for i,window in pairs(s_windowTable) do
        if window.params and 
            window.params.N == name and window.params.L == layerName then
            log("looking at " .. window.c.name)
            return window
        end
    end 
    
    return nil
end

--[[
Return true if the client conforms to winmgr naming convention
]]--
function isValidClient(c)

    if c then
        local params = parseWindowName(c.name)
        if params and params.L then
            return true
        end
    end
    return false
end

--[[
Adds client c with name n to appropriate layer
]]--
function addClient(c)
    --validate
    if not c or not c.name  or not c.window then
        log("!!!!!!!!!!!!!!!!Failed addClient param check")
        return
    end

    local layerName
    local params = parseWindowName(c.name)

    if params and params.L then
        print_table_contents("params",params,"")
        layerName = params.L
    else 
        -- handle case where the the window does not conform to 
        -- our naming convention
        llog.info("WindowManager", "bad-client-name", "winName=" .. tostring(c.name), "window does not conform to winmgr naming convention - leaving hidden")
        return
    end
    
    local layer = findLayer(layerName)
    if not layer then 
        log ("Invalid layer: ".. tostring(layerName))
        return
    end

    local window = {c=c, params=params, cachedname=c.name}
    
    -- look for window in window table
    if s_windowTable[c.window] then
        -- add client called for a window already in our table
        -- still treat it as a new window
        log("add client called for window already in windowTable")
    end
    
    s_windowTable[c.window] = window
    
    if layer.layoutFunc then
        -- we want full control on window size, so do not honor hints
        window.c.size_hints_honor = false

        -- Enable backing store for windows other than those we exclude.
        -- Only enable backing store for dialogs
        if window.params.L == "D"
            -- That have the backing store parameter set 
            and window.params.BS
            then
            window.c.backing_store = 1
        end

        logStrings({"calling relayout func, clientName = ", params.N})
        layer:layoutFunc(window, "added")
    else
        log("no relayout func on this layer")
    end
    
    -- store geometry to filter out redundant geom change requests
    window.geometry = c:geometry()
end

--[[
updates client c with name n from appropriate layer
]]--
function updateClientName(c)

    log("==============================updateClientName")
    
    --validate
    if not c or not c.name then
        return
    end
    
    -- check to see if the name has in fact changed
    local updatedWindow = windowTableFindByClient(c)
    if updatedWindow and updatedWindow.cachedname == c.name then
        log("name has not changed, just return")
        return;
    else
        logStrings({"cached name was = ", updatedWindow.cachedname})
    end

    local layerName
    local params = parseWindowName(c.name)

    if params and params.L then
        print_table_contents("params",params,"")
        layerName = params.L
    else
        -- handle the case where the window does not conform to 
        -- our naming convention
        return
    end

    local layer = findLayer(layerName)
    if not layer then
        log ("Invalid layer: ".. tostring(layerName))
        return
    end
    
    updatedWindow.cachedname=c.name
    
    if not updatedWindow then
        -- window was unmanaged, add it
        updatedWindow = {c=c, params=params}
        s_windowTable[c.window] = updatedWindow

        if layer.layoutFunc then
            -- we want full control on window size, so do not honor hints
            updatedWindow.c.size_hints_honor = false

            logStrings({"calling relayout func, clientName = ", updatedWindow.params.N})
            layer:layoutFunc(updatedWindow, "added")
        else
            log("no relayout func on this layer")
        end
    else
        --update the params
        updatedWindow.oldParams = updatedWindow.params
        updatedWindow.params = params
        
        if layer.layoutFunc then
            logStrings({"calling relayout func, clientName = ", updatedWindow.params.N})
            layer:layoutFunc(updatedWindow, "updatedParams")
        else
            log("no relayout func on this layer")
        end
        
        -- we don't need oldParams anymore
        updatedWindow.oldParams = nil
    end
end

function updateClientGeometry(c)

    log("==============================updateClientGeometry")
    
    --validate
    if not c or not c.name then
        return
    end
    
    local updatedWindow = s_windowTable[c.window]
    
    if not updatedWindow then
        llog.info("WindowManager", "unknown-client", "winName=" .. tostring(c.name), "updateClientGeometry :: cant find window in table")
        return
    end

    local layerName

    if updatedWindow.params and updatedWindow.params.L then
        print_table_contents("params",updatedWindow.params,"")

        layerName = updatedWindow.params.L
    else
        -- handle the case where the window does not conform to 
        -- our naming convention
        return
    end

    local layer = findLayer(layerName)
    if not layer then
        log ("Invalid layer: ".. tostring(layerName))
        return
    end

    if updatedWindow and layer.layoutFunc then
        local old_g = updatedWindow.geometry
        local new_g = c:geometry()

        if not old_g or old_g.x ~= new_g.x or old_g.y ~= new_g.y
            or old_g.width ~= new_g.width or old_g.height ~= new_g.height then
            log("old_g %d : %d and %d x %d", old_g.x, old_g.y, old_g.width, old_g.height)
            log("new_g %d : %d and %d x %d", new_g.x, new_g.y, new_g.width, new_g.height)

            logStrings({"calling relayout func, clientName = ", updatedWindow.params.N})
            layer:layoutFunc(updatedWindow, "updatedGeometry")
            updatedWindow.geometry = c:geometry()
        else
            log("geometry did not change, do nothing")
        end
    end
end


--[[
removes client c with name n from appropriate layer
]]--
function removeClient(c)
    --validate
    if not c then
        return
    end

    local updatedWindow = s_windowTable[c.window]
    
    -- remove from table as soon as possible
    s_windowTable[c.window] = nil
    
    if not updatedWindow then
        llog.info("WindowManager", "unknown-client", "winname=" .. tostring(c.name), "removeClient :: cant find window in table")
        return
    end
    
    local layerName
    if updatedWindow.params and updatedWindow.params.L then
    
        print_table_contents("params",updatedWindow.params,"") 

        layerName = updatedWindow.params.L
        clientName = updatedWindow.params.N 
    else
        -- handle the case where the window does not conform to 
        -- our naming convention
        return
    end

    local layer = findLayer(layerName)
    if not layer then
        log ("Invalid layer: %s ", tostring(layerName))
        return
    end

    if layer.layoutFunc then
        log("calling relayout func, clientName = %s", tostring(updatedWindow.params.N))
        layer:layoutFunc(updatedWindow, "removed")
    else
        log("no relayout func on this layer")
    end
end

--- Layout all layers starting from top to bottom
function layoutLayers(filterFunc)
    
    for i,window in pairs(s_windowTable) do
        if filterFunc(window) then
            logTimeStamp("calling relayout func, clientName = %s", window.c.name)
            local layer = layers[window.params.L]
            if layer then
                layer:layoutFunc(window, "updatedGeometry")
            end
        else
            logTimeStamp("not relayering, clientName = %s ", window.c.name)
        end
    end
end

--[[
handle when a client changes which layer it is on
]]--
function clientLayerChanged(c)
    -- if control client is being lowered switch 
    -- control client to focused client
    if c == s_controlClient and c.hiddenLayer then
        s_controlClient = client.focus
    end
    
    -- hand to ligl to look for flashinging needs
    liglHandleClientLayerChanged(c)
end

--[[                                                           
handle when s_windowTable is changed and update visible windows
returns 
    the list of visible windows as a table.
--]]
function getVisibleWindowsJson()
   logTimeStamp("getVisibleWindowsJson begin")
   winTab = {}
   i = 1
   for k, v in pairs(getVisibleWindows()) do
       winTab[i] = { name = v.c.name, layer = v.params.L, x = v.geometry.x, y = v.geometry.y, width = v.geometry.width, height=v.geometry.height, id = v.params.ID, windowId = v.c:getWindowId() }
       i=i+1
   end
   logTimeStamp("getVisibleWindowsJson end")
   return json.encode(winTab)
end

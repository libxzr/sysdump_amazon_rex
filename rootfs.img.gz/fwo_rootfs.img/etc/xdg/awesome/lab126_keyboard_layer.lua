-- Copyright (c) 2011 Amazon Technologies, Inc.  All rights reserved.
-- PROPRIETARY/CONFIDENTIAL
-- Use is subject to license terms.

--[[
position keyboard flush with bottom
keyboardLayer               : keyboard layer as defined in lab126LayerLogic
keyboardWindow              : keybord window
]]
local function prv_position_keyboard(keyboardLayer, keyboardWindow)
    local clientGeometry = getClientGeometry(keyboardWindow.c)

    -- fix up geometry if need be
    if clientGeometry.x ~= 0 or 
        clientGeometry.width ~= g_screenOne.geometry.width or 
        clientGeometry.y ~= g_screenOne.geometry.height - clientGeometry.height then

        -- anchor bottom
        clientGeometry.x = 0
        clientGeometry.y = g_screenOne.geometry.height - clientGeometry.height
        
        -- set to screen width
        clientGeometry.width = g_screenOne.geometry.width

        -- updated KB geometry
        print_table_contents("newKbGeometry", clientGeometry, "")

        --set back the geometry
        changeWindowGeometry(keyboardWindow, clientGeometry)
    end

    -- set kbHeight
    keyboardLayer.kbHeight = clientGeometry.height
    log("setting keyboardLayer.kbHeight to ", keyboardLayer.kbHeight)
end

local function prv_position_keyboard_ext(keyboardLayer, win)
    local clientGeometry = {} --getClientGeometry(win.c)
    clientGeometry.x=0
    clientGeometry.y=0
    clientGeometry.width = g_screenOne.geometry.width
    clientGeometry.height = g_screenOne.geometry.height - keyboardLayer.kbHeight 
    
    changeWindowGeometry(win, clientGeometry)
end

--[[ 
keyboard layer callback called whenever a screensaver window in managed
or unmanaged
self                : keyboard layer
updatedWindow       : window object as defined in lab126LayerLogic
action              : "removed", "updatedGeometry", "updatedParams" or "added"
]]--
function keyboardLayer_layout(self, updatedWindow, action)
    log ("kbLayer_layout " .. action)

    if action == "removed" then
    
        if updatedWindow.params.N == "keyboard" then
            -- raise chrome footer
            -- TODO need to validate the footer here
            -- use activeFooterBar
            if chrome_is_up() then
                chrome_raise_lower_footer_bar(true)
            end
            
            log("zeroed out kb layer kbHeight")
            self.kbHeight = 0
        end
        
        return
    end

    -- TODO put back some reasonable checks around multiple keyboards
    -- only KB should ever filter into here and there should olny ever be one
    --[[
    if table.maxn (self.windowTable) > 1 then
        log("KB already present.. bad")
        updatedWindow.c.hiddenLayer = true
        return
    elseif table.maxn (self.windowTable) == 0 then
        log("no kb found in kb layer")
        log("zeroed out kb layer kbHeight")
        self.kbHeight = 0
        return
    end
    ]]--
    
    if updatedWindow.params.N == "keyboardExt" then
        prv_position_keyboard_ext(self, updatedWindow)
        setClientLayer(updatedWindow, LAYERS.KB)
    elseif updatedWindow.params.N == "keyboard" then
        
        prv_position_keyboard(self, updatedWindow)
        
        -- look at KB state (H=Hide, T=Trans, S=Show )
        if not updatedWindow.params.KBS or updatedWindow.params.KBS == "S" then
        
            self.kbVisible = true
            
            -- When KB is shown check to see if there is a RKB dialog
            -- waiting on the KB to come up
            if getKeyboardDialogClient() and getKeyboardDialogClient().hiddenLayer then
                setClientLayer(windowTableFindByClient(keyboardDialogClient), LAYERS.DIALOG)
            end
            
            if not updatedWindow.c.kbLayer then
                setClientLayer(updatedWindow, LAYERS.KB)
                
                if chrome_is_up() then
                    chrome_raise_lower_footer_bar(false)
                end
                
            else
                log("kb already above")
            end
            
        elseif updatedWindow.params.KBS == "T" then

            -- TODO There appears to have been an optimization here that assumed
            -- if the KB was transitioing to T while chrome was up, it was about
            -- to go down. It pre-emptively lowered it. This is causing issues
            -- with other optimizations in place. This can be revisisted later.
            --[[if chrome_is_up() then
                log("chrome is visible, drop KB and reraise chrome")
                setClientLayer(updatedWindow, LAYERS.HIDDEN)
                
                self.kbVisible = false
            else
                log("KB to trans layer, move to kbLayer layer")
                setClientLayer(updatedWindow, LAYERS.KB)
            end]]--
            
        elseif updatedWindow.params.KBS == "H" then
            -- KB to below
            log("hide KB")
            
            -- lower footers in case their height peeks over the top of the KB
            -- TODO consider optimizing this out
            if chrome_is_up() then
                chrome_raise_lower_footer_bar(true)
            end

            setClientLayer(updatedWindow, LAYERS.HIDDEN)
            
            self.kbVisible = false

        else
            log ("!!!!!invalide KBS state set on keyboard")
        end
        
    end
    
    log("done with kb layout func")

end

--[[
returns KB visibility state
]]--
function keyboard_is_visible()
    local kbLayer = findLayer("KB")
    local isVisible = false
    if kbLayer then
        isVisble = kbLayer.kbVisible
    end
    
    return isVisble
end

function keyboard_window_is_keyboard(window)
    return window and window.params.L == "KB" and window.params.N == "keyboard" 
end

/*
 * quick_actions_items.js
 *
 * Copyright (c) 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */
var QuickActionsStyles = {
    QUICK_ACTIONS_ITEM_STYLE :  'quick-actions-item',
    ICON_SUFFIX : '-icon',
    TEXT_SUFFIX : '-text',
    DISABLED_SUFFIX : '-disabled'
}

/**
 * QuickActionsItem
 * |--DefaultQuickActionsItem 
 * |----SettingsItem   
 * |----SyncAndCheckItem
 * |----StatefulQuickActionsItem
 * |--------AirplaneModeItem
 */
var QuickActionsItem = function() {};

// Default implementation for quick actions item
var DefaultQuickActionsItem = function(itemId) {
    var parent = Pillow.extend(this, new QuickActionsItem());

    this.itemId = itemId;
    this.iconId = itemId + QuickActionsStyles.ICON_SUFFIX;
    this.textId = itemId + QuickActionsStyles.TEXT_SUFFIX;
    this.element;

    // Should be overridden by state items
    this.iconClass = function() {
        return this.iconId;
    }

    // Updates the Item (Text, Icon and asset) to enabled/disabled state
    this.isDisabled = false;
    this.disableDomElement = function(disabled) {
        Pillow.logInfo("QuickActionsItem updated;" + "Item:" + this.itemId + "disabled" + disabled);
        // QuickActionsItem
        var elt = document.getElementById(this.itemId);
        elt.disabled = disabled;

        // Text
        elt = document.getElementById(this.textId);
        elt.disabled = disabled;
        
        //Icon
        elt = document.getElementById(this.iconId);
        elt.disabled = disabled;
        
        // Update icon asset
        Pillow.removeClass(elt, this.iconClass() + (disabled ?  '' : QuickActionsStyles.DISABLED_SUFFIX));
        var newClass =  this.iconClass() + (disabled ?  QuickActionsStyles.DISABLED_SUFFIX : '');
        Pillow.addClass(elt, newClass);
        Pillow.logInfo("QuickActionsItem updated;" + "Item:" + this.itemId + "disabled" + disabled + "IconClass:" + newClass);
    }

    // Stateful clients should override this to update state before refreshing enabled state
    this.refreshItem = function() {
        Pillow.logInfo("Refreshing QuickActionsItem " + this.itemId);
        this.disableDomElement(this.isDisabled);
    }

    // sets is disabled, if there is a change refreshes the dom element
    this.setDisabled = function(newVal) {
        var isChanged = this.isDisabled != newVal;
        this.isDisabled = newVal;
        if(isChanged) {
            Pillow.logInfo('Disabled value changed to ' + this.isDisabled + ' for item : ' + this.itemId);
            this.refreshItem();
        }
    }

    // Creates new dom element
    this.createDomElement = function() {
        var tapHandler = this.tapHandler;

        // Icon
        var icon = document.createElement('button');
        icon.id = this.iconId;
        Pillow.addClass(icon, QuickActionsStyles.QUICK_ACTIONS_ITEM_STYLE + QuickActionsStyles.ICON_SUFFIX);

        // Text
        var text = document.createElement('button');
        text.id = this.textId;
        Pillow.addClass(text, QuickActionsStyles.QUICK_ACTIONS_ITEM_STYLE + QuickActionsStyles.TEXT_SUFFIX);
        text.textContent = QuickActionsStrings[this.itemId];

        // quick actions item
        var quickActionItem = document.createElement('button');
        quickActionItem.id =  this.itemId;
        Pillow.addClass(quickActionItem, QuickActionsStyles.QUICK_ACTIONS_ITEM_STYLE);

        new XorButton(quickActionItem, tapHandler, quickActionItem, quickActionItem.className, quickActionItem.className + (this.xor ?  '-xor' : ''), {onHold: tapHandler, delayAction: false, fast: true});
        quickActionItem.appendChild(icon);
        quickActionItem.appendChild(text);

        Pillow.logInfo("Creating dom element for quickactionitem, with icon:" + icon.id + " text:" + text.id + " item:" + quickActionItem.id + ' xor' + this.xor);
        return quickActionItem;
    }

    // Getter for domElement
    this.getDomElement = function() {
        return this.element;
    }

    Pillow.logInfo("new DefaultQuickActionsItem created with id:" + this.itemId);
}

/* Quick Actions Item type which has additional state.
 * Example Airplane Mode is an item that can be in two states: ON/OFF
 */
var StatefulQuickActionsItem = function(itemId) {
    var parent = Pillow.extend(this, new DefaultQuickActionsItem(itemId));

    // Refreshes state and enabled/disabled
    this.refreshItem = function() {
	    Pillow.logInfo("Refreshing StatefulQuickActionsItem " + parent(this).itemId);

        // Update state information
        this.updateState();

        // Update enabled/disabled state
        parent(this).disableDomElement(this.isDisabled);
    }

    // Refreshes state
    this.updateState = function() {
        var elt = document.getElementById(parent(this).iconId);
        Pillow.removeClass(elt, this.oldState());
        Pillow.addClass(elt, this.currentState());
    	Pillow.logInfo('Updated state: replaced class' + this.oldState() + 'with ' + this.currentState());
    }
}

// Settings QuickActionsItem
var SettingsItem = function(id) {
    var parent = Pillow.extend(this, new DefaultQuickActionsItem(id));

    // Constants
    const DPM_ID = 'com.lab126.dpmManager';
    const TOGGLE_SETTINGS_PROPERTY = 'isSettingsMenuDisabled';
    const APP_MANAGER_ID = 'com.lab126.appmgrd';
    const SETTINGS_APP_ID = 'app://com.lab126.booklet.settings';

    // Should Xor on tap?
    this.xor = true;

    // ENABLED/DISABLED
    this.getSettingsPolicy = function() {
        var policy = nativeBridge.getIntLipcProperty(DPM_ID, TOGGLE_SETTINGS_PROPERTY);
	    return (policy && policy > 0); 
    };

    this.isDisabled = this.getSettingsPolicy();

    this.onSettingsPolicyChanged = function() {
        this.setDisabled(this.getSettingsPolicy());
    };

    // Tap handler
    this.tapHandler = function() {
        nativeBridge.setLipcProperty(APP_MANAGER_ID, 'start', SETTINGS_APP_ID);
    };

    this.element = parent(this).createDomElement();

    Pillow.logInfo("new SettingsItem created with id:" + parent(this).itemId);
}

// SyncAndCheck QuickActionsItem
var SyncAndCheckItem = function(id) {
    var parent = Pillow.extend(this, new DefaultQuickActionsItem(id));

    // Constants
    const DEMO_MODE_FILE_FLAG = "/var/local/system/DEMO_MODE";
    const AMAZON_REGISTRATION_SERVICE = "com.lab126.amazonRegistrationService";
    const IS_REGISTERED_PROPERTY = 'isRegistered';
    const REGN_TYPE_REGISTERED = 1;
    const REGN_TYPE_DEREGISTERED = 2;
    const QUICK_ACTIONS_LIPC_ID = 'com.lab126.quickactions';
    const SYNC_AND_CHECK_LIPC_PROP_NAME = 'syncAndCheck';

    // Should Xor on tap?
    this.xor = true;

    // Demo Mode: Cannot be updated w/o reboot.
    this.isDemoMode = nativeBridge.checkFileFlag(DEMO_MODE_FILE_FLAG);

    // Registration state
    this.isRegistered = nativeBridge.getIntLipcProperty(AMAZON_REGISTRATION_SERVICE, IS_REGISTERED_PROPERTY);

    // Updates isRegistered state
    this.onRegistrationChanged = function(regnEventType) {
        this.isRegistered = (regnEventType  == REGN_TYPE_REGISTERED) ? true : (regnEventType == REGN_TYPE_DEREGISTERED ? false : this.isRegistered);
        this.setDisabled(this.getDisabled());
    }

    // Re-initializes isRegistered state during framework start.
    this.onFrameworkStarted = function() {
        this.isRegistered = nativeBridge.getIntLipcProperty(AMAZON_REGISTRATION_SERVICE, IS_REGISTERED_PROPERTY);
        this.setDisabled(this.getDisabled());
    }

    // Is Disabled state
    this.getDisabled = function() {
        return this.isDemoMode || !this.isRegistered;
    }
    this.isDisabled = this.getDisabled();

    // Tap handler
    this.tapHandler = function() {
        nativeBridge.setLipcProperty(QUICK_ACTIONS_LIPC_ID, SYNC_AND_CHECK_LIPC_PROP_NAME, '1');
    };

    this.element = parent(this).createDomElement();

    Pillow.logInfo('SyncAndCheckItem created with id' + parent(this).itemId);
}

// AirplaneMode QuickActionsItem
var AirplaneModeItem = function(id) {
    var parent = Pillow.extend(this, new StatefulQuickActionsItem(id));

    // Constants
    const AIRPLANE_MODE_ON_SUFFIX = '-on';
    const AIRPLANE_MODE_OFF_SUFFIX = '-off';
    const CMD_LIPC_INTERFACE = "com.lab126.cmd";
    const WIRELESS_ENABLE_PROPERTY = 'wirelessEnable';
    const DPM_ID = 'com.lab126.dpmManager';
    const TOGGLE_AIRPLANE_MODE_PROPERTY = 'isToggleWirelessDisabled';
    const QUICK_ACTIONS_LIPC_ID = 'com.lab126.quickactions';
    const AIRPLANE_MODE_LIPC_PROP_NAME = 'toggleAirplaneMode';

    // Should Xor on tap?
    this.xor = true;

    // ON OFF state
    this.getAirplaneModeState = function (wirelessEnableState) {
        return wirelessEnableState == 0 ? true : false;
    };
    this.isAirplaneModeOn = this.getAirplaneModeState(nativeBridge.getIntLipcProperty(CMD_LIPC_INTERFACE, WIRELESS_ENABLE_PROPERTY));
    this.onWirelessEnableStateChanged = function(wirelessEnableState) {
        var old = this.isAirplaneModeOn;
        this.isAirplaneModeOn = this.getAirplaneModeState(wirelessEnableState);
        if(old!=this.isAirplaneModeOn) {
            Pillow.logInfo('isAirplaneModeOn value changed old' + old + '; new' + this.isAirplaneModeOn);
            this.refreshItem();
        }
    }

    this.iconClass = function() {
        return this.currentState();
    }	

    this.currentState = function() {
        return  this.iconId + (this.isAirplaneModeOn ? AIRPLANE_MODE_ON_SUFFIX : AIRPLANE_MODE_OFF_SUFFIX);
    }

    this.oldState = function() {
        return this.iconId + (this.isAirplaneModeOn ? AIRPLANE_MODE_OFF_SUFFIX : AIRPLANE_MODE_ON_SUFFIX);
    }

    // Enable/Disable
    this.getAirplaneModePolicy = function() {
        return nativeBridge.getIntLipcProperty(DPM_ID, TOGGLE_AIRPLANE_MODE_PROPERTY) > 0;
    }

    this.isDisabled = this.getAirplaneModePolicy();

    this.onAirplaneModePolicyChanged = function() {
        this.setDisabled(this.getAirplaneModePolicy());
    }

    // Tap Handler
    this.tapHandler = function() {
        nativeBridge.setLipcProperty(QUICK_ACTIONS_LIPC_ID, AIRPLANE_MODE_LIPC_PROP_NAME, '1');
    };
    this.element = parent(this).createDomElement();

    Pillow.logInfo("new AirplaneModeItem created with id 3 :" + parent(this).itemId);
}

/*
 * system_menu.js
 *
 * Copyright 2012 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

Pillow.SystemMenu = function() {
    var parent = Pillow.extend(this, new Pillow.MenuCase(
                'SystemMenu',
                'systemMenuItemSelected',
                SystemMenuItemStrings));

    const APP_MANAGER_ID = 'com.lab126.appmgrd';
    const STORE_ID = 'app://com.lab126.store';
    const BROWSER_ID = 'app://com.lab126.browser';
    const SETTINGS_ID = 'app://com.lab126.booklet.settings';

    const SCREEN_MARGIN = Pillow.pointsToPixels(2);
    const NUM_ITEMS_LANDSCAPE = 6;
    const NUM_ITEMS_PORTRAIT = 9;

    var storeDisabled = false;

    //This is the appId of the application that requested for system menu creation
    var m_appId;

    var systemActions = {
        store: Pillow.bind(null, nativeBridge.setLipcProperty,
                       APP_MANAGER_ID, 'start', STORE_ID),
        browser: Pillow.bind(null, nativeBridge.setLipcProperty,
                       APP_MANAGER_ID, 'start', BROWSER_ID),
        settings: Pillow.bind(null, nativeBridge.setLipcProperty,
                       APP_MANAGER_ID, 'start', SETTINGS_ID)
    };

    this.getSystemAction = function(id) {
        return systemActions[id];
    };

    this.getDefaultProfile = function() {
        var profile = parent(this).getDefaultProfile();
        profile.items = 
            [
                {
                    id: 'store',
                    position: 0,
                    state: 'enabled',
                    handling: 'system'
                },
                {
                    id: 'settings',
                    position: -1,
                    state: 'hidden',
                    handling: 'system'
                }
            ];
        return profile;
    };

    this.compareAndDismiss = function(appId) {
        if (appId === this.m_appId) {
            Pillow.logInfo("Destroying System Menu pillow case");
            nativeBridge.dismissMe();
        } else {
            if (nativeBridge.getAppId() !== this.m_appId) {
                //This is extremely rare and an edge case where
                //both the app that is paused and the current app 
                //is not the app that requested for the system menu.
                //This probably means that the app that requested for this
                //pillow case died unexpectedly. Removing this pillow case.
                Pillow.logInfo("Destroying System Menu pillow case where both the current app and the paused app is not m_appId");
                nativeBridge.dismissMe();
            }
        }
    };

    this.overrideProfile = function(profile) {
        for (var i in profile.items) {
            if (profile.items[i].id === 'store') {
                var store = profile.items[i];
                if (storeDisabled && store.state === 'enabled') {
                    store.requestedState = 'enabled';
                    store.state = 'disabled';
                } else if (!storeDisabled && store.state === 'disabled' &&
                        store.requestedState === 'enabled') {
                    store.state = 'enabled';
                    delete store.requestedState;
                }
                break;
            }
        }
    };

    this.onLoad = function() {
        parent(this).onLoad();
        var that = this;
        this.m_appId = nativeBridge.getAppId();
        Pillow.logInfo("System Menu pillow case created for app " + this.m_appId);
        this.devicePolicyManager = new DevicePolicyManager();
        this.devicePolicyManager.onStoreDisabled = function(disabled) {
            storeDisabled = disabled;
            that.refresh();
        };
        this.devicePolicyManager.refresh();
        this.windowTitle.addParam(WINMGR.KEY.TAP_AWAY_CHILD, 'search_bar');
        this.windowTitle.addParam(WINMGR.KEY.TAP_AWAY_BUTTON, 'menu');
        nativeBridge.setAcceptFocus(true);
        nativeBridge.showMe();
    };

    this.getMaxVisibleItems = function(landscape) {
        return landscape ? NUM_ITEMS_LANDSCAPE : NUM_ITEMS_PORTRAIT;
    };

    this.getGrowthPreference = function() {
        return GROW_RIGHT_FIRST;
    };

    this.getScreenMargin = function() {
        return SCREEN_MARGIN;
    };
};

Pillow.SystemMenu.ClientParamsHandler = function(pillowCase) {
    var parent = Pillow.extend(this, new Pillow.MenuCase.ClientParamsHandler(pillowCase));

    this.checkAndDestroy = function(clientParams) {
        if (clientParams.checkAndDestroy && clientParams.appId) {
            pillowCase.compareAndDismiss(clientParams.appId);
        }
    };
};

Pillow.SystemMenu.LipcEventHandler = function(pillowCase) {
    var parent = Pillow.extend(this, new Pillow.MenuCase.LipcEventHandler(pillowCase));
    this.subscribedEvents.sources.push({
            name: 'com.lab126.dpmManager',
            events: [{name: 'devicePolicyValueChanged'}]
        });
    this.devicePolicyValueChanged = function(values) {
        pillowCase.devicePolicyManager.handleLipcEvent(values);
    };
};
window.systemMenu = new Pillow.SystemMenu();
systemMenu.register();


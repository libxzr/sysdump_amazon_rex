/*
 * quick_actions_lipc_event_handler.js
 *
 * Copyright (c) 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

//Delegates lipc event to appropriate handlers
Pillow.QuickActions.LipcEventHandler = function(pillowCase){
    var parent = Pillow.extend(this, new Pillow.LipcEventHandler());
    this.subscribedEvents = {
                sources: [
                    { name: "com.lab126.appmgrd", events: [ { name:"appStateChange" } ] },
                    { name: "com.lab126.powerd", events: [ { name:"flStateChanged" }, { name:"suspending" } ] },
                    { name: "com.lab126.kaf", events: [ { name:"FrameworkStarted" } ] },
                    { name: "com.lab126.amazonRegistrationService", events: [ { name:"registrationChanged" } ] },
                    { name: "com.lab126.cmd", events: [ { name:"wirelessEnableChanged" } ] },
                    { name: "com.lab126.dpmManager", events: [ { name:"isToggleWirelessDisabled" }, { name:"isSettingsMenuDisabled" }, { name : "devicePolicyValueChanged" } ] },
                ]
            };

	this.devicePolicyValueChanged = function(values) {
		Pillow.logInfo('devicePolicyValueChanged  event received' + values[0]);
		if(values[0] == 'isToggleWirelessDisabled') {
			Pillow.QuickActionsProvider.Items[AIRPLANE_MODE_ID].onAirplaneModePolicyChanged();
		} else if(values[0] == 'isSettingsMenuDisabled') {
			Pillow.QuickActionsProvider.Items[SETTINGS_ID].onSettingsPolicyChanged();
		}
	}

    this.FrameworkStarted = function(values) {
        Pillow.logInfo("frameworkStarted event received");
        Pillow.QuickActionsProvider.Items[SYNC_AND_CHECK_ID].onFrameworkStarted();
    }

    this.registrationChanged = function(values) {
	    Pillow.logInfo("registrationChanged event received");
	    Pillow.QuickActionsProvider.Items[SYNC_AND_CHECK_ID].onRegistrationChanged(values[0]);
    };

	this.wirelessEnableChanged = function(values) {
	    Pillow.logInfo ("wirelessEnableChanged event received");
	    Pillow.QuickActionsProvider.Items[AIRPLANE_MODE_ID].onWirelessEnableStateChanged(values);
	}

    this.appStateChange = function(values) {
	    Pillow.logInfo ("appStateChange event received");
        pillowCase.hide();
    };

    this.flStateChanged = function(values) {
	    Pillow.logInfo ("flStateChanged event received");
        Pillow.LightControls.updateAutoBrightnessMode();
    };
    
    this.suspending = function(values) {
	    Pillow.logInfo ("suspending event received");
        Pillow.LightControls.updateTurboBrightness();
    };

    Pillow.logWrapObject('Pillow.QuickActions.LipcEventHandler', this);
};

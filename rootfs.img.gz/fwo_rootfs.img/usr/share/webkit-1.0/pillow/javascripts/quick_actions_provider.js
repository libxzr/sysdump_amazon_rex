/*
 * quick_actions_provider.js
 *
 * Copyright (c) 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

Pillow.QuickActionsProvider = function() {}

// Default items; Note items are added in the same order as in the map
SETTINGS_ID = 'settings';
SYNC_AND_CHECK_ID = 'syncAndCheck';
AIRPLANE_MODE_ID = 'airplaneMode';
Pillow.QuickActionsProvider.Items = {
    airplaneMode : new AirplaneModeItem(AIRPLANE_MODE_ID),
    syncAndCheck : new SyncAndCheckItem(SYNC_AND_CHECK_ID),
    settings : new SettingsItem(SETTINGS_ID),
};

// Creates new QuickActionsItems holder dom element
Pillow.QuickActionsProvider.addQuickActionItems = function(holder, items) {
    for( itemKey in items) {
        var item = items[itemKey];
        holder.addItem(item.getDomElement());
        item.refreshItem();
    }
}

// Quick Actions Holder
var QuickActionsHolder = function(parentElement) {
    const QUICK_ACTIONS_HOLDER_STYLE = 'quick-actions';

    // Creates dom element
    var createDomElement = function(parentElement) {
        if(!parentElement) {
            Pillow.logInfo("QuickActionsHolder, parent element not provided!");
            return;
        }
        var quickActionsElement = document.getElementById(QUICK_ACTIONS_HOLDER_STYLE);

        if(quickActionsElement) {
            Pillow.logInfo("QuickActionsHolder already found in document, skipping create; Class: " + quickActionsElement.className);
        } else {
            quickActionsElement =  document.createElement('div');
            quickActionsElement.className = quickActionsElement.id = QUICK_ACTIONS_HOLDER_STYLE;
            parentElement.appendChild(quickActionsElement);
            Pillow.logInfo("QuickActionsHolder created with id:" + quickActionsElement.id + " parent: " + parentElement.id);
        }
    	return quickActionsElement;
    }
    this.domElement = createDomElement(parentElement);

    // Adds a quick action item to the holder
    this.addItem = function(element) {
        if(!element || !this.domElement) {
            Pillow.logInfo("QuickActionsHolder: Item or holder not found, skipping add item");
            return;
        }
        this.domElement.appendChild(element);
        Pillow.logInfo("QuickActionsHolder: New item with id " + element.id + " to holder id:" + this.domElement.id);
    }
}

// Creates new QuickActionsItems holder dom element
Pillow.QuickActionsProvider.createHolder = function(containerElement) {
    return new QuickActionsHolder(containerElement);
}

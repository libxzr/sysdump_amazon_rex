/*
 * app_menu.js
 *
 * Copyright 2012 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

Pillow.AppMenu = function() {
    var parent = Pillow.extend(this, new Pillow.MenuCase(
                'AppMenu',
                'appMenuItemTapped',
                AppMenuItemStrings));

    const SCREEN_MARGIN = Pillow.pointsToPixels(6.8);
    const NUM_ITEMS_PORTRAIT_PROP = 'numItemsPortrait';
    const NUM_ITEMS_LANDSCAPE_PROP = 'numItemsLandscape';

    this.getDefaultProfile = function() {
        var profile = parent(this).getDefaultProfile();
        profile[NUM_ITEMS_PORTRAIT_PROP] = 6;
        profile[NUM_ITEMS_LANDSCAPE_PROP] = 4;
        return profile;
    };

    this.onLoad = function() {
        parent(this).onLoad();
        nativeBridge.setAcceptFocus(true);
        nativeBridge.showMe();
    };

    this.getMaxVisibleItems = function(landscape) {
        var profile = this.getCurrentProfile();
        return landscape ? profile[NUM_ITEMS_LANDSCAPE_PROP] : profile[NUM_ITEMS_PORTRAIT_PROP];
    };

    this.resetApplicationState = function() {
        this.dismiss();
    };

    this.getGrowthPreference = function() {
        return GROW_LEFT_FIRST;
    };

    this.getScreenMargin = function() {
        return SCREEN_MARGIN;
    };
};

Pillow.AppMenu.ClientParamsHandler = function(pillowCase) {
    var parent = Pillow.extend(this, new Pillow.MenuCase.ClientParamsHandler(pillowCase));

    this.dismiss = function(clientParams) {
        if (clientParams.dismiss) {
            pillowCase.dismiss();
        }
    };
};
Pillow.AppMenu.LipcEventHandler = Pillow.MenuCase.LipcEventHandler;
window.appMenu = new Pillow.AppMenu();
appMenu.register();


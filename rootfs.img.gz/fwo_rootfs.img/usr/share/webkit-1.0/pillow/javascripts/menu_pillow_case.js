/*
 * menu_pillow_case.js
 *
 * Copyright 2012 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * @class MenuCase
 *
 * An abstract pillow case class for pillow cases which consist entirely of an
 * app-configurable drop-down menu.
 *
 * @param name                      (String) The name of the pillow case
 * @param menuItemSelectedProperty  (String) The name of the lipc callback property for taps on items
 * @param stringsTable              (Object) A string table for localization (default {})
 *
 * Methods every subclass should probably override:
 * getSystemAction
 * getDefaultProfile
 * getMaxVisibleItems
 *
 * Methods a subclass might want to override:
 * overrideProfile
 */
Pillow.MenuCase = function(name, menuItemSelectedProperty, stringsTable) {
    var parent = Pillow.extend(this, new Pillow.Case(name));

    if (typeof(stringsTable) !== 'object') {
        stringsTable = {};
    }

    const ORIENTATION_PROPERTY = 'orientation';
    const APP_MANAGER_ID = 'com.lab126.appmgrd';
    const WINDOW_MANAGER_ID = 'com.lab126.winmgr';

    var windowTitle = new WindowTitle(
            WINMGR.LAYER.DIALOG,
            name.charAt(0).toLowerCase() + name.substring(1));
    this.windowTitle = windowTitle;

    var appState = {};

    var appStateCache = null;

    var menuWidget = null;

    var closeOnUse = true;

    var isShown;

    var orientation = null;

    var maxVisibleItems;

    var updateMaxVisibleItems = function() {
        if (orientation && menuWidget) {
            var newMaxVisibleItems =
                this.getMaxVisibleItems(orientation === 'L' || orientation === 'R');
            if (newMaxVisibleItems != maxVisibleItems) {
                maxVisibleItems = newMaxVisibleItems;
                menuWidget.setMaxVisibleItems(maxVisibleItems);
            }
        }
    };

    var applyProfile = function(profile) {
        this.overrideProfile(profile);
        appState.profile = profile;

        if (profile.hasOwnProperty('closeOnUse')) {
            closeOnUse = profile.closeOnUse;
        }

        // Handle selection modes
        appState.selection = Selections.create(
                profile.items,
                profile.selectionMode,
                (profile.hasOwnProperty('selection') ?
                 profile.selection :
                 appState.selection));

        // Update the item checkmarks
        appState.selection.updateItemIcons(profile.items);
        menuWidget.setShowIcons(appState.selection.showIcons());

        // Make every item visible
        menuWidget.setScrollOffset(0);
        menuWidget.setMaxVisibleItems(profile.items.length);

        // Let the dialog size itself based on the items
        var dialog = document.getElementById('dialog');
        dialog.style.width = 'auto';

        // Update the items
        menuWidget.setItems(profile.items);

        // Lock in the width
        dialog.style.width = dialog.offsetWidth + 'px';

        // Set the page size back
        updateMaxVisibleItems.apply(this);
        menuWidget.setMaxVisibleItems(maxVisibleItems);

        // Resize the X11 window to the new size
        nativeBridge.setWindowSize(dialog.offsetWidth, dialog.offsetHeight);
    };

    var updatePosition = function() {
        if (updatePosition && appState.screenPos) {
            this.setPosition(appState.screenPos);
        }
    };

    var menuItemTapped = function(item) {
        // update the selection state
        var updatedItems = appState.selection.itemTapped(item);
        for (var i in updatedItems) {
            menuWidget.renderItem(updatedItems[i]);
        }
        // run the item handler
        if (item.handling === 'system') {
            var action = this.getSystemAction(item.id);
            if (action) {
                action();
            }
        } else {
            nativeBridge.setLipcProperty(
                    nativeBridge.getAppId(),
                    menuItemSelectedProperty,
                    item.id);
        }
        if (closeOnUse) {
            // delay so that XORing can take effect
            setTimeout(Pillow.bind(this, 'hide', true), 100);
        }
    };

    /**
     * @method getSystemAction  Get the built-in action for a menu item
     * @param id  (String) The menu item ID
     * @return  The callback for the action, or null
     */
    this.getSystemAction = function(id) {
        return null;
    }

    /**
     * @method getDefaultProfile  Get the default profile
     * @return  (Object) The default profile
     */
    this.getDefaultProfile = function() {
        return {
            items: [],
            selectionMode: 'none',
            initialSelection: null,
            selectionCallback: null,
            closeOnUse: true
        };
    };

    /**
     * @method overrideProfile  Alter the app's profile before it is applied
     * @param profile  (Object) The profile
     *
     * This method does nothing by default and can be overridden.
     */
    this.overrideProfile = function(profile) {
        // empty
    };

    this.onLoad = function() {
        Pillow.setOption(OPTION_SEND_DELETE_EVENTS, true);

        menuWidget = new MenuWidget('items', {
                handler: Pillow.bind(this, menuItemTapped),
                strings: stringsTable
            });
        this.swipeDown = Pillow.bind(menuWidget, 'scrollUp');
        this.swipeUp = Pillow.bind(menuWidget, 'scrollDown');
        this.profileManager = new Pillow.ProfileManager({
                applyProfileCallback: Pillow.bind(this, applyProfile),
                getAppIdCallback: nativeBridge.getAppId
            });
        this.profileManager.setDefaultProfile(this.getDefaultProfile());
        this.profileManager.applyDefaultProfile();

        this.setOrientation(nativeBridge.getStringLipcProperty(
                    WINDOW_MANAGER_ID, ORIENTATION_PROPERTY));

        windowTitle.addParam(WINMGR.KEY.BORDER_WIDTH, 0);
        windowTitle.addParam(WINMGR.KEY.WIN_IS_MODAL, WINMGR.MODALITY.DISMISSIBLE_MODAL);
        windowTitle.addParam(WINMGR.KEY.CHROME_DIALOG, true);
        this.hide();
        parent(this).onLoad();
    };

    this.isShown = function() {
        return isShown;
    };

    this.show = function() {
        isShown = true;
        windowTitle.removeParam(WINMGR.KEY.HIDE_DIALOG);
    };

    this.hide = function() {
        isShown = false;
        windowTitle.addParam(WINMGR.KEY.HIDE_DIALOG, WINMGR.DIALOG_HIDE.BACKGROUND);
    };

    this.dismiss = function() {
        nativeBridge.dismissMe();
    };

    this.setPosition = function(screenPos) {
        // record the screen position so we can update when resized
        appState.screenPos = screenPos;

        setDialogPosition(
                document.getElementById('dialog'),
                screenPos,
                this.getGrowthPreference(),
                this.getScreenMargin());
    };

    this.getMaxVisibleItems = function(landscape) {
        return 1;
    };

    this.setOrientation = function(newOrientation) {
        orientation = newOrientation;
        updateMaxVisibleItems.apply(this);
    };

    this.refresh = function() {
        if (appState.profile) {
            applyProfile.call(this, appState.profile);
        } else {
            this.profileManager.applyDefaultProfile();
        }
    };

    this.cacheCurrentAppState = function() {
        appStateCache = appState;
    };

    this.loadCachedAppState = function() {
        appState = appStateCache;
        appStateCache = null;
        this.refresh();
        updatePosition();
    };

    this.resetApplicationState = function() {
        this.hide();
        appState = {};
        this.profileManager.applyDefaultProfile();
        updatePosition();
    };

    this.getCurrentProfile = function() {
        return appState.profile;
    };
};

Pillow.MenuCase.ClientParamsHandler = function(pillowCase) {
    var parent = Pillow.extend(this, new Pillow.ClientParamsHandler());

    var maybeSetPosition = function(clientParams) {
        if (clientParams.hasOwnProperty('position')) {
            pillowCase.setPosition(clientParams.position);
        }
    };

    var setProfile = function(clientParams) {
        pillowCase.profileManager.applyProfile(clientParams.profile || {});
    };

    var maybeSetProfile = function(clientParams) {
        if (clientParams.hasOwnProperty('profile')) {
            setProfile(clientParams);
        }
    };

    var handleLayout = function(clientParams) {
        /**
         * Step 1. Figure out whether to hide the menu, show the menu, or both.
         * Hiding happens before any changes to the position or size of the
         * menu, while showing happens after.
         */
        var shouldHide = false;
        var shouldShow = false;
        if (clientParams.hasOwnProperty('profile')) {
            /**
             * It's better to be hidden while the contents of the menu are
             * changing. So, if the menu was visible, plan to hide it
             * temporarily.
             */
            shouldShow = shouldHide = pillowCase.isShown();
        }
        if (clientParams.hasOwnProperty('show')) {
            if (clientParams.show) {
                /**
                 * The client wants the menu to end up visible. We should still
                 * hide the menu first if its contents are changing, so leave
                 * the value of shouldHide unchanged from the previous step.
                 */
                shouldShow = true;
            } else {
                /**
                 * The client wants the menu to end up hidden.
                 */
                shouldShow = false;
                shouldHide = true;
            }
        }
        /**
         * Step 2. Carry out the plan.
         */
        if (shouldHide) {
            pillowCase.hide();
        }
        maybeSetProfile(clientParams);
        maybeSetPosition(clientParams);
        if (shouldShow) {
            pillowCase.show();
        }
    };

    this.profile = handleLayout;
    this.show = handleLayout;
    this.position = handleLayout;

    this.gesture = function(clientParams) {
        if (clientParams.gesture === 'swipeUp') {
            pillowCase.swipeUp();
        } else if (clientParams.gesture === 'swipeDown') {
            pillowCase.swipeDown();
        }
    };

    this.windowDeleteEvent = function(clientParams) {
        if (clientParams.windowDeleteEvent) {
            pillowCase.hide();
        }
    };
};

Pillow.MenuCase.LipcEventHandler = function(pillowCase) {
    var parent = Pillow.extend(this, new Pillow.LipcEventHandler());

    this.subscribedEvents = {
        sources: [
            {
                name: 'com.lab126.appmgrd',
                events: [
                    {
                        name: 'appStateChange'
                    },
                    {
                        name: 'appFailedInGo',
                    }
                ]
            },
            {
                name: "com.lab126.winmgr",
                events: [
                    {
                        name: "orientationChange"
                    }
                ]
            }
        ]
    };

    this.appStateChange = function(values) {
        var appId = values[0];
        var appEventType = values[1];
        var appEventStage = values[2];

        var currentAppId = nativeBridge.getAppId();

        if (appEventType === "go" && appEventStage === 0 && currentAppId !== appId) {
            pillowCase.cacheCurrentAppState();
            pillowCase.resetApplicationState();
        }
    };

    this.orientationChange = function(values) {
        pillowCase.setOrientation(values[0]);
    };

    this.appFailedInGo = function(values) {
        pillowCase.loadCachedAppState();
    };
};


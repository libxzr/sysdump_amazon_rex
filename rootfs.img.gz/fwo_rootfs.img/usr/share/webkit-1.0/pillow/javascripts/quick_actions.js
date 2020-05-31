/*
 * quick_actions.js
 *
 * Copyright (c) 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

Pillow.QuickActions = function() {
    var parent = Pillow.extend(this, new Pillow.Case('QuickActions'));

    var windowTitle;

    this.onLoad = function() {
        Pillow.setOption(OPTION_SEND_DELETE_EVENTS, true);
        windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, 'quickActions');
        windowTitle.withChanges(function() {
                this.addParam(WINMGR.KEY.WIN_IS_MODAL, WINMGR.MODALITY.DISMISSIBLE_MODAL);
                this.addParam(WINMGR.KEY.CHROME_DIALOG, true);
                this.addParam(WINMGR.KEY.HIDE_DIALOG, WINMGR.DIALOG_HIDE.BACKGROUND);
                this.addParam(WINMGR.KEY.TAP_AWAY_CHILD, 'search-bar');
                this.addParam(WINMGR.KEY.TAP_AWAY_BUTTON, 'quickActions');
        });
	
        this.initQuickActions();
	this.setWindowSize(document.body.offsetWidth, document.body.offsetHeight);
        nativeBridge.showMe();
        parent(this).onLoad();
    };

    this.initQuickActions = function() {
        //Light dialog
        Pillow.LightControls.initLightControls();

        //Quick Actions
        var parentElement = document.getElementById('quick-actions-dialog');
        var holder = Pillow.QuickActionsProvider.createHolder(parentElement);
        Pillow.QuickActionsProvider.addQuickActionItems(holder, Pillow.QuickActionsProvider.Items);
    }

    this.show = function() {
        Pillow.LightControls.onShow();
        windowTitle.removeParam(WINMGR.KEY.HIDE_DIALOG);
    };

    this.hide = function() {
        nativeBridge.dismissMe();
    };

    this.setPosition = function(position) {
        nativeBridge.setWindowPosition(position.x, position.y);
    };

    this.setWindowSize = function(width, height) {
        nativeBridge.setWindowSize(width, height);
    };

    Pillow.logWrapObject('Pillow.QuickActions', this);
};

Pillow.QuickActions.ClientParamsHandler = function(pillowCase) {
    var parent = Pillow.extend(this, new Pillow.ClientParamsHandler());
    var handler = function(clientParams) {
        if (clientParams.hasOwnProperty('show')) {
            if (clientParams.show) {
                if (clientParams.position) {
                    pillowCase.setPosition(clientParams.position);
                }
                pillowCase.setWindowSize(clientParams.width, document.body.offsetHeight);
                pillowCase.show();
            } else {
                pillowCase.hide();
                if (clientParams.position) {
                    pillowCase.setPosition(clientParams.position);
                }
            }
        } else if (clientParams.position) {
            pillowCase.setPosition(clientParams.position);
        }
    };
    this.show = handler;
    this.position = handler;
    this.windowDeleteEvent = function(clientParams) {
        pillowCase.hide();
    };
    Pillow.logWrapObject('Pillow.QuickActions.ClientParamsHandler', this);
};

var quickActions = new Pillow.QuickActions();
quickActions.register();

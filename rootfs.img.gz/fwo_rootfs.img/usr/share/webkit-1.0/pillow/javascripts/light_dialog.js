/*
 * light_dialog.js
 *
 * Copyright (c) 2012-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

Pillow.LightDialog = function() {
    var parent = Pillow.extend(this, new Pillow.Case('LightDialog'));

    const SCREEN_MARGIN = Pillow.pointsToPixels(11.6);

    var dialogElem;
    var windowTitle;

    this.onLoad = function() {
        Pillow.setOption(OPTION_SEND_DELETE_EVENTS, true);
        dialogElem = document.getElementById('dialog');
        windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, 'lightDialog');
        windowTitle.withChanges(function() {
                this.addParam(WINMGR.KEY.WIN_IS_MODAL, WINMGR.MODALITY.DISMISSIBLE_MODAL);
                this.addParam(WINMGR.KEY.CHROME_DIALOG, true);
                this.addParam(WINMGR.KEY.HIDE_DIALOG, WINMGR.DIALOG_HIDE.BACKGROUND);
                this.addParam(WINMGR.KEY.TAP_AWAY_CHILD, 'search-bar');
                this.addParam(WINMGR.KEY.TAP_AWAY_BUTTON, 'light');
        });
        Pillow.LightControls.initLightControls();
        nativeBridge.showMe();
        nativeBridge.setWindowSize(document.body.offsetWidth, document.body.offsetHeight);
        parent(this).onLoad();
    };

    this.show = function() {
        Pillow.LightControls.onShow();
        windowTitle.removeParam(WINMGR.KEY.HIDE_DIALOG);
    };

    this.hide = function() {
        Pillow.LightControls.onHide();
        windowTitle.addParam(WINMGR.KEY.HIDE_DIALOG, WINMGR.DIALOG_HIDE.BACKGROUND);
    };

    this.setPosition = function(position) {
        nativeBridge.setWindowPosition(0, position.y);
    };

    this.suspend = function() {
        Pillow.LightControls.updateTurboBrightness();
    };
    
    Pillow.logWrapObject('Pillow.LightDialog', this);
};

Pillow.LightDialog.ClientParamsHandler = function(pillowCase) {
    var parent = Pillow.extend(this, new Pillow.ClientParamsHandler());
    var handler = function(clientParams) {
        if (clientParams.hasOwnProperty('show')) {
            if (clientParams.show) {
                if (clientParams.position) {
                    pillowCase.setPosition(clientParams.position);
                }
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
    Pillow.logWrapObject('Pillow.LightDialog.ClientParamsHandler', this);
};

Pillow.LightDialog.LipcEventHandler = function(pillowCase){
    var parent = Pillow.extend(this, new Pillow.LipcEventHandler());
    this.subscribedEvents = {
                sources: [
                    {
                        name: "com.lab126.appmgrd",
                        events: [
                            {
                                name:"appStateChange"
                            }
                        ]
                    },

                    {
                        name: "com.lab126.powerd",
                        events: [
                            {
                                name:"flStateChanged"
                            },
                            {
                                name:"suspending"
                            }
                        ]
                    },
                    {
                        name: "com.lab126.kaf",
                        events: [
                            {
                                name:"updateLightLevel"
                            }
                        ]
                    }
                ]
            };
    this.appStateChange = function(values) {
        pillowCase.hide();
    };

    this.flStateChanged = function(values) {
        Pillow.LightControls.updateAutoBrightnessMode();
    };
    
    this.suspending = function(values) {
        pillowCase.suspend();
    };

    this.updateLightLevel = function(values) {
        updateLightLevel();
    }

    Pillow.logWrapObject('Pillow.LightDialog.LipcEventHandler', this);
};

var lightDialog = new Pillow.LightDialog();
lightDialog.register();

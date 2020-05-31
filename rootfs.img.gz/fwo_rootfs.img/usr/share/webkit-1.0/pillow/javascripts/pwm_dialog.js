/*
 * pwm_dialog.js
 *
 * Copyright 2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

// Constants used by lipc
const POWERD_APPID                     = "com.lab126.powerd";
const POWERD_PROP_LUX_VALUE            = "alsLux";
const POWERD_PROP_FL_RAW_INTENSITY     = "flRawIntensity";
const POWERD_PROP_AMBER1_RAW_INTENSITY = "amberOneRawIntensity";
const POWERD_PROP_AMBER2_RAW_INTENSITY = "amberTwoRawIntensity";

const PwmDialog = {};

const State = {
    width         : Pillow.pointsToPixels(202.6),
    height        : Pillow.pointsToPixels(150),
    alertIsShown  : false,
    windowTitle   : null,
    hasCAFL       : false,
    hasFL         : false,
    hasALS        : false,
    flCell        : null,
    amber1Cell    : null,
    amber2Cell    : null,
    luxCell       : null,
};

PwmDialog.showAlert = function (){
    State.alertIsShown = true;
    nativeBridge.showMe();
    State.timerId = setInterval(PwmDialog.timerCallback, 1000);
}

PwmDialog.timerCallback = function() {
    PwmDialog.updateUI();
}

PwmDialog.updateUI = function() {
    if (State.hasFL) {
        State.flCell.innerHTML = nativeBridge.getIntLipcProperty(POWERD_APPID, POWERD_PROP_FL_RAW_INTENSITY)
    }
    if (State.hasALS) {
        State.luxCell.innerHTML = nativeBridge.getIntLipcProperty(POWERD_APPID, POWERD_PROP_LUX_VALUE);
    }
    if (State.hasCAFL) {
        State.amber1Cell.innerHTML = nativeBridge.getIntLipcProperty(POWERD_APPID, POWERD_PROP_AMBER1_RAW_INTENSITY);
        State.amber2Cell.innerHTML = nativeBridge.getIntLipcProperty(POWERD_APPID, POWERD_PROP_AMBER2_RAW_INTENSITY);
    }
}

PwmDialog.dismissAlert = function () {
    if (!State.alertIsShown){
        nativeBridge.logDbg("dialog not shown no need to dismiss alert");
        return;
    }
    State.alertIsShown = false;
    nativeBridge.dismissMe();
    clearTimer(State.timerId);
};

// clientParamsCallback is a single callback used for just about all communications
// up to the JS layer from the C Layer.
PwmDialog.clientParamsCallback = function (clientParamsString){
    nativeBridge.logDbg("clientParams received by simple alert JS : ", clientParamsString);

    var clientParams = JSON.parse(clientParamsString);

    if (clientParams.dismiss){
        PwmDialog.dismissAlert();
    }

};

PwmDialog.closeBtnCallback = function() {
    PwmDialog.dismissAlert();
}

PwmDialog.init = function(){
    // register to be called back when clientParams are updated
    nativeBridge.registerClientParamsCallback(PwmDialog.clientParamsCallback);
    // set the window size
    nativeBridge.setWindowSize(State.width, State.height);
    // set the window type
    State.windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, WINMGR.ROLE.DIALOG);
    State.windowTitle.withChanges(function() {
        this.addParam(WINMGR.KEY.WIN_IS_MODAL, WINMGR.MODALITY.DISMISSIBLE_MODAL);
    });
    // initialize feature flags
    State.hasFL      = nativeBridge.devcapIsAvailable(DEVCAP_FRONTLIGHT);
    State.hasALS     = nativeBridge.devcapIsAvailable(DEVCAP_ALS);
    State.hasCAFL    = nativeBridge.devcapIsAvailable(DEVCAP_CAFL);
    // Cache the reference to the following DOM elements since they are accesssed
    // from within the timer callback.
    State.flCell     = document.getElementById('fl_val');
    State.amber1Cell = document.getElementById('amber1_val');
    State.amber2Cell = document.getElementById('amber2_val');
    State.luxCell    = document.getElementById('lux_val');
    // Add a new "Close" button for the dialog
    new ButtonBar('closeBtnContainer', [{text: 'Close', id: 'close'}], PwmDialog.closeBtnCallback);
    PwmDialog.updateUI();
    PwmDialog.showAlert();
};

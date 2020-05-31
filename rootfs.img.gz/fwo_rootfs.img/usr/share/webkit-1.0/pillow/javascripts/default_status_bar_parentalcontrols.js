/*
 * default_status_bar_parentalcontrols.js
 *
 * Copyright 2012 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

ParentalControlsState = {
    setStatusBarTextPendingFunc : null,
};

/*
 * Resolves the parental control label
 */
ParentalControlsState.resolveParentalControlsLabel = function(controlsState){
    // a value of 2 indicates parental controls is active
    document.getElementById('statusBarParentalControlsIconDiv').style.display = (controlsState === 2 || controlsState === 3 ) ? 'block' : 'none' ;
};

/*
 * Handles the deviceControlsStateChange event. updates the icon in the
 * status bar.
 */
ParentalControlsState.deviceControlsStateChangeCallback = function(){
    ParentalControlsState.resolveParentalControlsLabel(nativeBridge.getIntLipcProperty("com.lab126.dpmManager", "getControlStatus"));
    if (ParentalControlsState.setStatusBarTextPendingFunc) {
        ParentalControlsState.setStatusBarTextPendingFunc(true);
    }
};

/*
 * Handles the parentalControlsStateChanged event. updates the icon in the
 * status bar.
 */
ParentalControlsState.parentalControlsStateChangeCallback = function(values){
    if (Pillow.isInteger(values[0])) {
         // first value holds the current control status value
         ParentalControlsState.resolveParentalControlsLabel(values[0]);
    } else {
        Pillow.logDbgHigh("ParentalControlsState.controlsStateChangedCallback :: bad values");
    }
    if (ParentalControlsState.setStatusBarTextPendingFunc) {
        ParentalControlsState.setStatusBarTextPendingFunc(true);
    }
}

/*
 * Initializes ParentalControlsState
 */
ParentalControlsState.init = function(setStatusBarTextPendingFunc){
    ParentalControlsState.setStatusBarTextPendingFunc = setStatusBarTextPendingFunc;
    // update parental controls label
    ParentalControlsState.resolveParentalControlsLabel(nativeBridge.getIntLipcProperty("com.lab126.dpmManager", "getControlStatus"));
};

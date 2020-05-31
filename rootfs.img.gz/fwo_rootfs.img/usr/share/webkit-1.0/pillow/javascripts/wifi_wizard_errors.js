/*
 * wifi_wizard_errors.js
 *
 * Copyright 2011-2012 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * handler for errors and confirmation dialogs 
 */
var WifiWizardErrors = {
    currentDialog : null
};

//actions describe the action to be taken in response to an error dialog button
WifiErrorActions = {
    gotoList            : 1,
    gotoPassword        : 2,
    gotoManual          : 3,
    deleteProfile       : 4,
    tryAgain            : 5
};

//description of each error dialog
WifiErrorDialogs = {
    genericErrorDialog      : {
            title       : "defaultErrorTitle",
            error       : "defaultError",
            buttonLayout: "cancelSetUpTryAgainButtonLayout",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "setUp", action : WifiErrorActions.gotoManual},
                            {id : "tryAgain", action : WifiErrorActions.tryAgain} ] },
    passwordErrorDialog     : {
            title       : "passwordErrorTitle",
            error       : "passwordFailedError",
            buttonLayout: "cancelEnterAgainSetUpButtonLayout",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "enterAgain", action : WifiErrorActions.gotoPassword},
                            {id : "setUp", action : WifiErrorActions.gotoManual} ] },
    noProfilesErrorDialog   : {
            title       : "noProfileTitle",
            error       : "noProfileError",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "setUp", action : WifiErrorActions.gotoManual} ] },
    failedToConnectErrorDialog   : {
            title       : "defaultErrorTitle",
            error       : "failedToConnectError",
            enterpriseTitle : "defaultErrorTitle",
            enterpriseError : "failedToConnectEnterpriseError",
            buttonLayout: "cancelSetUpTryAgainButtonLayout",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "setUp", action : WifiErrorActions.gotoManual},
                            {id : "tryAgain", action : WifiErrorActions.tryAgain} ] },
    wifiNotReadyErrorDialog   : {
            title       : "defaultErrorTitle",
            error       : "wifiNotReady",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList} ] },
    localNetworkFailedErrorDialog   : {
            title       : "defaultErrorTitle",
            error       : "localNetworkFailedError",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "setUp", action : WifiErrorActions.gotoManual} ] },
    internetConnectFailedErrorDialog   : {
            title       : "internetConnectFailedTitle",
            error       : "internetConnectFailedError",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList} ] },
    profNetNameTooLongFailedErrorDialog   : {
            title       : "profNetNameTooLongFailedTitle",
            error       : "profNetNameTooLongFailedError",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "setUp", action : WifiErrorActions.gotoManual} ] },
    passwordTooLongErrorDialog     : {
            title       : "passwordTooLongTitle",
            error       : "passwordTooLongError",
            buttonLayout: "cancelEnterAgainSetUpButtonLayout",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "enterAgain", action : WifiErrorActions.gotoPassword},
                            {id : "setUp", action : WifiErrorActions.gotoManual} ] },
    passwordTooShortErrorDialog     : {
            title       : "passwordTooShortTitle",
            error       : "passwordTooShortError",
            buttonLayout: "cancelEnterAgainSetUpButtonLayout",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "enterAgain", action : WifiErrorActions.gotoPassword},
                            {id : "setUp", action : WifiErrorActions.gotoManual} ] },
    enterpriseAuthErrorDialog : {
            title       : "defaultErrorTitle",
            error       : "wpaEnterpriseAuthError",
            buttonLayout: "cancelEnterAgainSetUpButtonLayout",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "enterAgain", action : WifiErrorActions.gotoPassword},
                            {id : "setUp", action : WifiErrorActions.gotoManual} ] },
    wpaEnterpriseNotSupportedErrorDialog   : {
            title       : "wpaEnterpriseErrorTitle",
            error       : "wpaEnterpriseNotSupportedError",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "setUp", action : WifiErrorActions.gotoManual} ] },
    securityMismatchErrorDialog   : {
            title       : "securityMismatchTitle",
            error       : "securityMismatchError",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "setUp", action : WifiErrorActions.gotoManual} ] },
    adhocNotSupportedErrorDialog   : {
            title       : "adhocNotSupportedTitle",
            error       : "adhocNotSupportedError",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "setUp", action : WifiErrorActions.gotoManual} ] },
    profileCreateErrorDialog    : {
            title       : "defaultErrorTitle",
            error       : "profileFailedError",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "setUp", action : WifiErrorActions.gotoManual} ] },
    profileDeleteErrorDialog    : {
            title       : "profileDeleteTitle",
            error       : "profileDeleteError",
            buttons     : [ {id : "okay", action : WifiErrorActions.gotoList} ] },
    wpsConnectionErrorDialog      : {
            title       : "defaultErrorTitle",
            error       : "wpsConnectionError",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "setUp", action : WifiErrorActions.gotoManual} ] },
    wpsButtonNotPressedErrorDialog      : {
            title       : "defaultErrorTitle",
            error       : "wpsButtonNotPressedError",
            buttonLayout: "cancelEnterAgainSetUpButtonLayout",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "enterAgain", action : WifiErrorActions.gotoPassword},
                            {id : "setUp", action : WifiErrorActions.gotoManual} ] },
    apRejectedErrorDialog      : {
            title       : "defaultErrorTitle",
            error       : "apRejectedError",
            buttonLayout: "cancelSetUpTryAgainButtonLayout",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "setUp", action : WifiErrorActions.gotoManual},
                            {id : "tryAgain", action : WifiErrorActions.tryAgain} ] },
    apDeniedErrorDialog      : {
            title       : "defaultErrorTitle",
            error       : "apDeniedError",
            buttonLayout: "cancelSetUpTryAgainButtonLayout",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "setUp", action : WifiErrorActions.gotoManual},
                            {id : "tryAgain", action : WifiErrorActions.tryAgain} ] },
    forgetProfileConfirmationDialog      : {
            title       : "forgetProfileTitle",
            error       : "forgetProfileConfirmation",
            buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                            {id : "forget", action : WifiErrorActions.deleteProfile} ] },

    caCertificateNotFoundDialog      : {
      title       : "caCertificateNotFoundTitle",
      error       : "caCertificateNotFoundError",
      buttons     : [ {id : "cancel", action : WifiErrorActions.gotoList},
                      {id : "setUp", action : WifiErrorActions.gotoManual} ] },
    };


// Error strings returned from WIFID and/or CMD on connection
var WifiWizardErrorIds = {
    "Bad password"                              : WifiErrorDialogs.passwordErrorDialog,
    "No profiles configured"                    : WifiErrorDialogs.noProfilesErrorDialog,
    "Failed to connect to Wireless network"     : WifiErrorDialogs.failedToConnectErrorDialog,
    "Failed to connect to WiFi network"         : WifiErrorDialogs.failedToConnectErrorDialog,
    "WiFi Not available"                        : WifiErrorDialogs.wifiNotReadyErrorDialog,
    "WiFi not ready"                            : WifiErrorDialogs.wifiNotReadyErrorDialog,
    "Failed connecting to Local Network"        : WifiErrorDialogs.localNetworkFailedErrorDialog,
    "Failed connecting to Internet"             : WifiErrorDialogs.internetConnectFailedErrorDialog,
    "Network name too long"                     : WifiErrorDialogs.profNetNameTooLongFailedErrorDialog,
    "Wrong key length"                          : WifiErrorDialogs.passwordErrorDialog,
    "WPA Enterprise authentication failed"      : WifiErrorDialogs.enterpriseAuthErrorDialog,
    "WPA Enterprise security not supported"     : WifiErrorDialogs.wpaEnterpriseNotSupportedErrorDialog,
    "Key too long"                              : WifiErrorDialogs.passwordTooLongErrorDialog,
    "Key too short"                             : WifiErrorDialogs.passwordTooShortErrorDialog,
    "Profile security mismatch"                 : WifiErrorDialogs.securityMismatchErrorDialog,
    "Adhoc network not supported"               : WifiErrorDialogs.adhocNotSupportedErrorDialog,
    "Connection Timeout"                        : WifiErrorDialogs.failedToConnectErrorDialog,
    "ProfileCreateError"                        : WifiErrorDialogs.profileCreateErrorDialog,
    "ProfileDeleteError"                        : WifiErrorDialogs.profileDeleteErrorDialog,
    ""                                          : WifiErrorDialogs.failedToConnectErrorDialog,
    "WPS connection failed"                     : WifiErrorDialogs.wpsConnectionErrorDialog,
    "WPS button not pressed"                    : WifiErrorDialogs.wpsButtonNotPressedErrorDialog,
    "AP rejected"                               : WifiErrorDialogs.apRejectedErrorDialog,
    "AP denied"                                 : WifiErrorDialogs.apDeniedErrorDialog,
    "profileDeleteConfirmation"                 : WifiErrorDialogs.forgetProfileConfirmationDialog,
    "CA Certificate not found"                  : WifiErrorDialogs.caCertificateNotFoundDialog
};

/*
Determine which error dialog to use for a given error id
*/
WifiWizardErrors.whichErrorDialog = function (error){
    var dialog = WifiWizardErrorIds[error];
    if (!dialog){
        Pillow.logInfo('pillow-no-error-dialog-found', {error: error});
        dialog = WifiErrorDialogs.genericErrorDialog;
    }

    return dialog;
};

/*
sets the currentDialog based on incoming error id
*/
WifiWizardErrors.routeError = function (error){
    WifiWizardErrors.currentDialog = WifiWizardErrors.whichErrorDialog(error);

    if (WifiWizardErrors.applyDialogCallback){
        WifiWizardErrors.applyDialogCallback(WifiWizardErrors.currentDialog, error);
    }

};

/*
init WifiWizardErrors and setup up callbacks
@ applyDialogCallback : callback to call to apply a dialog to dialog popup div
*/
WifiWizardErrors.init = function(applyDialogCallback){
    WifiWizardErrors.applyDialogCallback = applyDialogCallback;
};

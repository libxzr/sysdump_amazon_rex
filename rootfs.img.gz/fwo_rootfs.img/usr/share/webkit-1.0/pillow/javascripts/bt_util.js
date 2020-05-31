/*
 * bt_util.js
 *
 * Copyright (c) 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

Pillow.BtUtil = function () {
    const BT_WIZARD_DIALOG = "bt_wizard_dialog";
    const BT_SUCCESS = 0;
    const BT_WIZARD_DIALOG_NAME = "BT Wizard";
    const BT_SWITCH_DIALOG_NAME = "BT Switch";

    this.stopAndRedirect = function (pillowCase) {
        pillowCase.stopTimer();
        if (pillowCase.showRedirectDialog) {
            pillowCase.showRedirectDialog();
        }
    };

    this.unbondResult = function (values, m_item, pillowCase, dialogName) {
        Pillow.logInfo(dialogName + " dialog unbond result");
        if (values[0] === BT_SUCCESS && values[2] === m_item.bdAddress && pillowCase.isForgetClicked()) {
            Pillow.logInfo(dialogName + " dialog unPairing device" + m_item.device + "bt_address ="
                + Pillow.obfuscateMac48Address(m_item.bdAddress, 4));
        } else {
            Pillow.logError(dialogName + " dialog UnPairing device -- Something has gone wrong " + m_item.device + "bt_address"
                + Pillow.obfuscateMac48Address(m_item.bdAddress, 4) + "unbond_result = " + values[0]);
        }
        if (dialogName !== "BT Forget")
            this.stopAndRedirect(pillowCase);
    };

    this.connectResult = function (values, m_item, pillowCase, dialogName) {
        if ((values[0] === BT_SUCCESS) && values[2] === m_item.bdAddress) {
            /* Connection success */
            Pillow.logDbgPrivate(dialogName + " dialog Connecting device " + m_item.device + " bt_address ="
                + Pillow.obfuscateMac48Address(m_item.bdAddress, 4));
            if (pillowCase.inASRMode || (pillowCase.isConnectClicked && !pillowCase.isConnectClicked())) {
                this.stopAndRedirect(pillowCase, values);
            } else {
                pillowCase.close && pillowCase.close({close:true});
            }
        } else{

            pillowCase.stopTimer();

            if(values[0]!==BT_SUCCESS && values[2] === m_item.bdAddress){
                /* Connect issued by user failed */
                var message = {
                    "show" : "true",
                    "processBtInfo" : {
                        "device" : values[1],
                        "bdAddress" : values[2],
                        "isConnected" : false,
                        "type" : "Connect",
                    }
                };
                nativeBridge.dismissMe();
                Pillow.logInfo("Launching connect failed dialog for " + values[1] + " " + Pillow.obfuscateMac48Address(values[2], 4) );
                nativeBridge.showDialog('bt_error_dialog', JSON.stringify(message));
                return false;
            }
            else{
                /* Do nothing. This flow is because connect that wasn't issued by user failed */
            }
        }
        return true;
    };

    this.appActivatingEvent = function (values, pillowCase) {
        if (values && (values[0] === BT_SUCCESS)) {
            Pillow.logDbgHigh("===== app switch");
            pillowCase.close();
        }
    };

    this.disconnectResult = function (values, item, pillowCase, dialogName) {
        if ((values[0] === BT_SUCCESS) && values[2] === item.bdAddress) {
            Pillow.logDbgPrivate(dialogName + " dialog Disconnecting device " + item.device + "bt_address ="
                + Pillow.obfuscateMac48Address(item.bdAddress, 4));
            // We shouldn't forget the device when a device get's disconnected without user initiation.
            if (dialogName !== BT_WIZARD_DIALOG_NAME && dialogName !== BT_SWITCH_DIALOG_NAME) {
                // Initiate Forget only if user asks for it. There will be more buttons like Disconnect
                if (pillowCase.isForgetClicked && pillowCase.isForgetClicked()) {
                    nativeBridge.setLipcProperty(LIPC_BTMD_SOURCE, PROP_BTMD_FORGET, item.bdAddress);
                }
                else {
                    this.stopAndRedirect(pillowCase);
                }
            }
            else if (dialogName === BT_WIZARD_DIALOG_NAME) {
                this.stopAndRedirect(pillowCase);
            }
            else{
                /* Do nothing. Let Connect_Result call take care */
            }
        } else {
            // TODO: check if any retry for js needs to be written. As of now
            // btd owns that.
            Pillow.logError(dialogName + " dialog Disconnecting device -Something has gone wrong = " + item.device + "bt_address ="
                + Pillow.obfuscateMac48Address(item.bdAddress, 4) + "disconnect_result = " + values[0]);
            this.stopAndRedirect(pillowCase);
        }
        Pillow.logInfo(dialogName + " dialog Disconnect result");
    };

    this.disableResult = function (values, pillowCase) {
        if (values[0] === BT_SUCCESS) {
            pillowCase.stopTimer();
            pillowCase.close();
        }
    };

    this.getSource = function (sourceName, eventsList) {
        var source = {};
        source.name = sourceName;
        source.events = [];
        eventsList.forEach(function (element) {
            source.events.push({name: element});
        });
        return source;
    };

    this.passkeyPairing = function (values, pillowCase) {
        pillowCase.hide();
        var message = {
            show: "true",
            processBtInfo: {
                "passKey": values[0],
                "device": values[1],
                "bdAddress": values[2]
            }
        };
        nativeBridge.showDialog("bt_passkey_comparison_dialog", JSON
            .stringify(message));
    };

    this.redirectToErrorDialog = function(mItem, type) {
        var message = {
            show: "true",
            processBtInfo: {
                 "device": mItem.device,
                 "bdAddress": mItem.bdAddress,
                 "type" : type
            }
        };
        nativeBridge.showDialog("bt_error_dialog", JSON.stringify(message));
    };

    this.redirectToBtWizard = function (DIALOG_NAME, args) {
        var finalArgs = { show : "true" };

        for (var prop in args) {
            if (args.hasOwnProperty(prop)) {
                finalArgs[prop] = args[prop];
            }
        }

        var message = JSON.stringify(finalArgs);
        nativeBridge.hideMe();
        Pillow.logInfo("Redirecting to Bt Wizard Dialog from " + DIALOG_NAME);
        nativeBridge.showDialog(BT_WIZARD_DIALOG, message);
        nativeBridge.dismissMe();
    };

    /**
     * wrapper class on activity indicator spinner interaction
     */
    this.ActivityIndicator = function () {
        // Dictionary to track all the existing spinner activities
        var that = this;
        var spinning = {};

        /**
         * start activity spinner with appropriate text
         */
        this.start = function(clientIdSuffix, text) {
            spinning[clientIdSuffix] = true;
            nativeBridge.setLipcProperty("com.lab126.chromebar", "activityIndicator",
                    '{"activityIndicator":{"action":"start","clientId":"com.lab126.pillow.' + clientIdSuffix + '","timeout":120000,"text":"' + text + '"}}');
        };
        /**
         * Stop the spinner. Stop fills in a action "completed" string
         */
        this.stop = function(clientIdSuffix) {
            if (!spinning[clientIdSuffix])
                return;
            spinning[clientIdSuffix] = false;
            nativeBridge.setLipcProperty("com.lab126.chromebar", "activityIndicator",
                '{"activityIndicator":{"action":"stop","clientId":"com.lab126.pillow.' + clientIdSuffix + '"}}');
        };

        this.stopAll = function() {
            for (var activity in spinning) {
                that.stop(activity);
            }
        };
    };

    this.ActivityIndicator.prototype = {};

    this.Timer = function(pillowCase) {
        var mTimer = null;
        var clientOnTimerExpired = null;
        var mNotifier = {};

        var that = {
            start : function (funcOnExpiry, timeout, notifier) {
                        if (mTimer)
                            that.stop();
                        clientOnTimerExpired = funcOnExpiry;
                        mTimer = setTimeout(that.expiry, timeout);
                        mNotifier = notifier || mNotifier;
                        pillowCase.onTimerStart && pillowCase.onTimerStart();
                    },

            stop : function () {
                        if (mTimer) {
                            clearTimeout(mTimer);
                            mTimer = null;
                            mNotifier = {};
                            pillowCase.onTimerStop && pillowCase.onTimerStop();
                        }
                    },
            expiry : function () {
                        mTimer = null;
                        mNotifier = {};
                        clientOnTimerExpired && clientOnTimerExpired();
                    },

            isRunning: function() {
                        return (mTimer != null);
                    },

            stopAndNotify : function(eventKey) {
                        if (mTimer && mNotifier && eventKey) {
                            var onNotify = mNotifier[eventKey];
                            that.stop();
                            onNotify && onNotify();
                        }
                    }
        };

        return that;
    };

    Pillow.logWrapObject('Pillow.BtUtil', this);
};
var btUtil = new Pillow.BtUtil();

/*
 * bt_error_dialog.js
 *
 * Copyright (c) 2017-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * @class This Pillow.Case displays and handles the BT Error Dialog.
 * @extends Pillow.Case
 */
Pillow.BtErrorDialog = function () {
    var that = this;
    var parent = Pillow.extend(this, new Pillow.Case('BtErrorDialog'));
    var mItem = null;
    var m_errorItem;
    var m_buttonBar = null;
    var m_title = null;
    var m_dialogText = null;
    var mWindowTitle = null;
    var mBtErrorCmdButtons = null;
    var mTimer = btUtil.Timer(this);

    this.mActivityIndicator = new btUtil.ActivityIndicator();

    /**
     * Sets up the dialog with Pillow and prepares the interface.
     */
    this.onLoad = function () {
        mWindowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, WINMGR.ROLE.ALERT);
        mWindowTitle.withChanges(function () {
            this.addParam(WINMGR.KEY.WIN_IS_MODAL, WINMGR.MODALITY.MODAL);
        });
        mBtErrorCmdButtons = [
            {
                text: BTWizardDialogStringTable.cancel,
                id: 'cancel'
            },
            {
                text: BTWizardDialogStringTable.tryAgain,
                id: 'tryAgain'
            }
        ];
        m_buttonBar = new ButtonBar('BtErrorCmdBar', mBtErrorCmdButtons, handler);
        this.show();
        parent(this).onLoad();
        //API to check for larger display mode and parsing the DOM to pick large property values
        modifyClassNameDOM();
    };

    this.initUI = function (item) {
        mItem = item;
        m_errorItem = false;
        m_title = document.getElementById("btErrorTitleText").innerHTML = BTWizardDialogStringTable.btWizardErrorDeviceTitle[mItem.type];
        var formattedDeviceName = "<pre class=\"device-name-inline\" dir=\"auto\">" + escapeHTML(mItem.device) + "</pre>";
        m_dialogText = document.getElementById("btErrorDialogText").innerHTML = BTWizardDialogStringTable.btWizardErrorTextMessageFormat[mItem.type]
                .format({
                    string : formattedDeviceName
                });
        var dialogElem = document.getElementById('dialog');
        nativeBridge.setWindowSize(dialogElem.offsetWidth, dialogElem.offsetHeight);
        Pillow.logInfo("Bt wizard item = " + mItem.device + "bt_address" + Pillow.obfuscateMac48Address(mItem.bdAddress, 4));
    };

    this.showRedirectDialog = function (clientParams) {
        mTimer.stop();
        var messageObject = {show : "true", numScans: 1 };
        for(var attribute in clientParams) {
            if (clientParams.hasOwnProperty(attribute)) {
                messageObject[attribute] = clientParams[attribute];
            }
        }
        var message = JSON.stringify(messageObject);
        nativeBridge.dismissMe();
        Pillow.logInfo("Redirecting to Bt Wizard Dialog from Bt Error Dialog");
        nativeBridge.showDialog("bt_wizard_dialog", message);
    };

    var handler = function (button) {
        if (button.id === "tryAgain") {
            Pillow.logInfo("TryAgain setting " + mItem.type + " property");
            nativeBridge.recordDeviceMetric(PILLOW_PROGRAM_NAME, BT_PROGRAM_SOURCE, mItem.type,
                                            1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
            nativeBridge.setLipcProperty(LIPC_BTMD_SOURCE, mItem.type, mItem.bdAddress);
            mTimer.start(that.onTimerExpired, TRANSACT_FAILED_TIMEOUT);
        }
        else if(button.id === "cancel") {
            that.showRedirectDialog();
        }
    };

    this.enableWidgets = function () {
        for (var i = 0; i< mBtErrorCmdButtons.length; i++)
            m_buttonBar.setButtonDisabled(i, false);
        mWindowTitle.disabled = false;
    };

    this.disableWidgets = function() {
        for (var i = 0; i< mBtErrorCmdButtons.length; i++)
            m_buttonBar.setButtonDisabled(i, true);
        mWindowTitle.disabled = true;
    }

    this.stopTimer = function() {
        mTimer.stop();
    };

    this.isTimerRunning = function() {
        return mTimer.isRunning();
    };

    this.onTimerStart = function() {
        that.disableWidgets();
        if(mItem.type === "Connect") {
            that.mActivityIndicator.start(BtActivity.CONNECTING, BTWizardDialogStringTable.connectingToBtDevice);
        } else {
            that.mActivityIndicator.start(BtActivity.PAIRING, BTWizardDialogStringTable.pairingToBtDevice);
        }
    };

    this.onTimerExpired = function() {
        that.hide();
        that.enableWidgets();
        that.mActivityIndicator.stop(BtActivity.CONNECTING);
        that.mActivityIndicator.stop(BtActivity.PAIRING);
        setTimeout(function() {
            that.show();
        }, 500);
    };

    this.onTimerStop = function() {
        that.enableWidgets();
        that.mActivityIndicator.stopAll();
    };

    this.getCurrentItem = function () {
        return mItem;
    };

    this.show = function () {
        nativeBridge.showMe();
    };

    this.refreshView = function(type) {
        that.stopTimer();
        mItem.type = type;
        that.hide();
        that.initUI(mItem);
        setTimeout(function() {
            that.show();
        },500);
    };

    this.hide = function () {
        nativeBridge.hideMe();
    };

    this.close = function (args) {
        that.showRedirectDialog(args);
    };

    Pillow.logWrapObject('Pillow.BtErrorDialog', this);
};

Pillow.BtErrorDialog.LipcEventHandler = function(pillowCase) {
    const BT_SUCCESS = 0;

    Pillow.extend(this, new Pillow.LipcEventHandler(pillowCase));

    this.Connect_Result = function(values) {
        var mItem = pillowCase.getCurrentItem();

        if(values[2] === mItem.bdAddress) {
            if (values[0] === BT_SUCCESS) {
                pillowCase.showRedirectDialog();
            } else if (pillowCase.isTimerRunning()){
                pillowCase.refreshView(PROP_BTMD_CONNECT);
            }
        }
    };

    this.Bond_Result = function(values) {
        var mItem = pillowCase.getCurrentItem();

        if(values[2] === mItem.bdAddress) {
            if (values[0] === BT_SUCCESS) {
                nativeBridge.recordDeviceMetric(PILLOW_PROGRAM_NAME, BT_PROGRAM_SOURCE, PROP_BTMD_CONNECT,
                                                1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
                nativeBridge.setLipcProperty(LIPC_BTMD_SOURCE, PROP_BTMD_CONNECT, mItem.bdAddress);
                pillowCase.mActivityIndicator.start(BtActivity.CONNECTING, BTWizardDialogStringTable.connectingToBtDevice);
                pillowCase.mActivityIndicator.stop(BtActivity.PAIRING);
            } else if (pillowCase.isTimerRunning()){
                pillowCase.refreshView(PROP_BTMD_PAIR);
            }
        }
    };

    this.btPairNumericPinToDisplay = function (values) {
        var mItem = pillowCase.getCurrentItem();

        if (values[2] != mItem.bdAddress)
            return;
        pillowCase.stopTimer();
        btUtil.passkeyPairing(values, pillowCase);
    };

    Pillow.logWrapObject('Pillow.BtErrorDialog.LipcEventHandler', this);
}

var btErrorDialog = new Pillow.BtErrorDialog();
btErrorDialog.register();

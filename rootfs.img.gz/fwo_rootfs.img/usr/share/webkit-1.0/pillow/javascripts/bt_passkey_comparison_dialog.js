/*
 * bt_passkey_comparison_dialog.js
 *
 * Copyright (c) 2017-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * @class This Pillow.displays and handles the BT Passkey Comparison Dialog.
 * @extends Pillow.Case
 */
Pillow.BtPasskeyComparisonDialog = function () {
    const BTMD_LIPC_SOURCE = "com.lab126.btmd";
    const BTMD_PROP_PAIR_USER_CONFIRMATION = "PairUserConfirmation";
    const CANCEL = 0;
    const CONFIRM = 1;
    var that = this;
    var parent = Pillow.extend(this, new Pillow.Case(
        'BtPasskeyComparisonDialog'));
    var windowTitle = null;
    var m_item = null;
    var m_buttonBar = null;
    var m_cancelButton = null;
    var m_title = null;
    var m_dialogText = null;
    const DIALOG_NAME = "BT Passkey Comparison";
    const PASSKEY_TIMEOUT = 30000;
    const DEFAULT_PASSKEY = "000000";
    const PASSKEY_SIZE    = 6;

    var mTimer = btUtil.Timer(this);
    var passkeyConfirmed = false;

    this.mActivityIndicator = new btUtil.ActivityIndicator();

    /**
     * Sets up the dialog with Pillow and prepares the interface.
     */
    this.onLoad = function () {
        Pillow.setOption(OPTION_SEND_DELETE_EVENTS, true);
        windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, WINMGR.ROLE.ALERT);
        windowTitle.withChanges(function () {
            this.addParam(WINMGR.KEY.WIN_IS_MODAL,
                WINMGR.MODALITY.MODAL);
        });
        var BtPasskeyComparisonButtons = [{
            text: BTWizardDialogStringTable.cancel,
            id: 'cancel'
        }, {
            text: BTWizardDialogStringTable.confirm,
            id: 'confirm'
        }];
        m_buttonBar = new ButtonBar('btPasskeyComparisonCmdBar',
            BtPasskeyComparisonButtons, handler);
        m_cancelButton = document
            .getElementById('btPasskeyComparisonCancelButton');
        new XorButton(m_cancelButton, Pillow.bind(this, 'cancelPasskeyConfirmationAndRedirect', null),
                      m_cancelButton, 'dialog-close', 'dialog-close xor');
        this.show();
        parent(this).onLoad();
        // API to check for larger display mode and parsing the DOM to pick
        // large property values
        modifyClassNameDOM();
        mTimer.start(that.onTimerExpired, PASSKEY_TIMEOUT);
    };

    this.disableWidgets = function (isDisable) {
        m_buttonBar.setButtonDisabled(0, isDisable);
        m_buttonBar.setButtonDisabled(1, isDisable);
        m_title.disabled = isDisable;
        m_dialogText.disabled = isDisable;
        m_cancelButton.disabled = isDisable;
    };

    this.stopTimer = function() {
        Pillow.logDbgMid("BtPasskeyComparison stopping timer");
        mTimer.stop();
    };

    this.onTimerStart = function () {
        if (passkeyConfirmed)
            that.disableWidgets(true);
        Pillow.logDbgMid("BtPasskeyComparison timer started");
    };

    this.onTimerExpired = function() {
        Pillow.logDbgMid("BtPasskeyComparison timer expired");
        that.cancelPasskeyConfirmationAndRedirect();
        that.mActivityIndicator.stop(BtActivity.CONNECTING);
    };

    this.onTimerStop = function() {
        Pillow.logDbgMid("BtPasskeyComparison timer stopped");
        if (passkeyConfirmed)
            that.disableWidgets(false);
        that.mActivityIndicator.stop(BtActivity.CONNECTING);
    };

    this.cancelPasskeyConfirmationAndRedirect = function (args) {
        mTimer.stop();
        nativeBridge.recordDeviceMetric(PILLOW_PROGRAM_NAME, BT_PROGRAM_SOURCE, "cancel_passkey", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        if (!passkeyConfirmed) {
            nativeBridge.setIntLipcProperty(BTMD_LIPC_SOURCE,
                    BTMD_PROP_PAIR_USER_CONFIRMATION, CANCEL);
        }
        that.showRedirectDialog(args);
    };

    this.initUI = function (item) {
        m_item = item;
        m_title = document.getElementById("btPasskeyComparisonTitleText").innerHTML = BTWizardDialogStringTable.passKeyComparisonTitle;
        var formattedDeviceName = "<pre class=\"device-name-inline\" dir=\"auto\">" + escapeHTML(m_item.device) + "</pre>";
        m_dialogText = document.getElementById("btPasskeyComparisonDialogText").innerHTML = BTWizardDialogStringTable.passKeyTextMessageFormat
            .format({
                string: formattedDeviceName
            });
        document.getElementById("btPasskey").innerHTML = getFormattedPasskey(item.passKey);
        this.disableWidgets(false);
        var dialogElem = document.getElementById('main');
        nativeBridge.setWindowSize(dialogElem.offsetWidth,
            dialogElem.offsetHeight);
        Pillow.logInfo("Bt wizard item = " + m_item.device + "bt_address"
            + Pillow.obfuscateMac48Address(m_item.bdAddress, 4));
    };

    this.showRedirectDialog = function (args) {
        btUtil.redirectToBtWizard(DIALOG_NAME, args || { numScans: 1 });
    };

    var handler = function (button) {
        if (button.id === "cancel") {
            that.cancelPasskeyConfirmationAndRedirect();
        } else if (button.id === "confirm") {
            mTimer.stop();
            passkeyConfirmed = true;
            mTimer.start(that.onTimerExpired, TRANSACT_FAILED_TIMEOUT);
            nativeBridge.recordDeviceMetric(PILLOW_PROGRAM_NAME, BT_PROGRAM_SOURCE, "confirm_passkey", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
            nativeBridge.setIntLipcProperty(BTMD_LIPC_SOURCE,
                BTMD_PROP_PAIR_USER_CONFIRMATION, CONFIRM);
        }
    };

    /**
     * Passkey in SSP mode will always be 6 digits
     * As passkey is passed from BTD in integer format, format it to show in right format
     */
    var getFormattedPasskey = function (passkey) {
        var formattedPasskey = '';
        if (passkey !== undefined) {
            /** Add given passkey to default key with all zeros and get the last 6 characters */
            formattedPasskey = (DEFAULT_PASSKEY + passkey).slice(-PASSKEY_SIZE);
        } else {
            Pillow.logError("Passkey is undefined");
        }
        return formattedPasskey;
    }

    this.getCurrentItem = function () {
        return m_item;
    };

    this.show = function () {
        nativeBridge.showMe();
    };

    this.hide = function () {
        nativeBridge.hideMe();
    };

    this.close = function (args) {
        this.cancelPasskeyConfirmationAndRedirect(args);
    };

    Pillow.logWrapObject('Pillow.BtPasskeyComparisonDialog', this);
};

Pillow.BtPasskeyComparisonDialog.LipcEventHandler = function (pillowCase) {
    const DIALOG_NAME = "BT Passkey Comparison";
    const BT_SUCCESS = 0;
    Pillow.extend(this, new Pillow.LipcEventHandler(pillowCase));

    this.Bond_Result = function (values) {
        var m_item = pillowCase.getCurrentItem();
        Pillow.logInfo("BT passkey dialog bond result" + values[0]);
        if (values[2] != m_item.bdAddress) {
            return;
        }

        if(values[0] != BT_SUCCESS){
            pillowCase.stopTimer();
            nativeBridge.dismissMe();
            Pillow.logInfo("Launch Pairing failed dialog for " + m_item.device + "  " + Pillow.obfuscateMac48Address(m_item.bdAddress, 4));
            btUtil.redirectToErrorDialog(m_item, PROP_BTMD_PAIR);
        } else {
            pillowCase.mActivityIndicator.start(BtActivity.CONNECTING, BTWizardDialogStringTable.connectingToBtDevice);
            nativeBridge.setLipcProperty(LIPC_BTMD_SOURCE, PROP_BTMD_CONNECT,
               m_item.bdAddress);
        }
    };

    this.Connect_Result = function (values) {
        var m_item = pillowCase.getCurrentItem();

        if (!m_item || btUtil.connectResult(values, m_item, pillowCase, DIALOG_NAME)) {
            Pillow.logInfo("Bt device is connected");
        }
    };

    Pillow.logWrapObject('Pillow.BtPasskeyComparisonDialog.LipcEventHandler', this);
};

var btPasskeyComparisonDialog = new Pillow.BtPasskeyComparisonDialog();
btPasskeyComparisonDialog.register();

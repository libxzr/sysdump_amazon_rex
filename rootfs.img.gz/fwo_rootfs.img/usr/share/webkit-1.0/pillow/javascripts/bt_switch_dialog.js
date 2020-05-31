/*
 * bt_switch_dialog.js
 *
 * Copyright (c) 2016-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * @class This Pillow.Case displays and handles the BT Switch Dialog.
 * @extends Pillow.Case
 */
Pillow.BtSwitchDialog = function () {
    var that = this;
    var parent = Pillow.extend(this, new Pillow.Case('BtSwitchDialog'));
    var windowTitle = null;
    var m_item = null;
    var mConnectAction;
    var mForgetAction;
    var m_title = null;
    var m_dialogText = null;
    var m_cancelButton = null;
    const TRANSACT_FAILED_TIMEOUT = 15000;
    var m_buttonBar = null;
    const DIALOG_NAME = "BT Switch";

    var mTimer = btUtil.Timer(this);
    // Activity Indicator owned by the dialog to show the connection activity
    this.mActivityIndicator = new btUtil.ActivityIndicator();

    /**
     * Sets up the dialog with Pillow and prepares the interface.
     */
    this.onLoad = function () {
        Pillow.setOption(OPTION_SEND_DELETE_EVENTS, true);
        windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, WINMGR.ROLE.ALERT);
        windowTitle.withChanges(function () {
            this.addParam(WINMGR.KEY.WIN_IS_MODAL, WINMGR.MODALITY.MODAL);
        });
        var BtSwitchCmdButtons = [
            {
                text: BTWizardDialogStringTable.cancel,
                id: 'cancel'
            },
            {
                text: BTWizardDialogStringTable.btWizardforgetDevice,
                id: 'forget'
            },
            {
                text: BTWizardDialogStringTable.connect,
                id: 'connect'
            }
        ];
        m_buttonBar = new ButtonBar('BtSwitchCmdBar', BtSwitchCmdButtons, handler, BTWizardDialogStringTable.switchDialogButtonLayout);
        m_cancelButton = document.getElementById('btSwitchCancelButton');
        new XorButton(m_cancelButton, Pillow.bind(this, 'showRedirectDialog', null),
                      m_cancelButton, 'dialog-close', 'dialog-close xor');
        this.show();
        parent(this).onLoad();
        //API to check for larger display mode and parsing the DOM to pick large property values
        modifyClassNameDOM();
    };

    this.disableWidgets = function (isDisable) {
        m_buttonBar.setButtonDisabled(0, isDisable);
        m_buttonBar.setButtonDisabled(1, isDisable);
        m_buttonBar.setButtonDisabled(2, isDisable);
        m_title.disabled = isDisable;
        m_dialogText.disabled = isDisable;
        m_cancelButton.disabled = isDisable;
    };

    this.stopTimer = function() {
        Pillow.logDbgMid("BtSwitch stopping timer");
        mTimer.stop();
    };

    this.onTimerStop = function () {
        Pillow.logDbgMid("BtSwitch timer stopped");
        that.disableWidgets(false);
    };

    this.onTimerStart = function () {
        Pillow.logDbgMid("BtSwitch timer started");
        that.disableWidgets(true);
    };

    this.onTimerExpired = function() {
        Pillow.logDbgMid("BtSwitch timer expired");
        that.showRedirectDialog();
    };

    this.showRedirectDialog = function (args) {
        that.mActivityIndicator.stop(BtActivity.CONNECTING);
        btUtil.redirectToBtWizard(DIALOG_NAME, args || { numScans: 1 });
    };

    var handler = function (button) {
        if (button.id === "cancel") {
            that.showRedirectDialog();
        } else if (button.id === "forget") {
            mForgetAction = true;
            nativeBridge.recordDeviceMetric(PILLOW_PROGRAM_NAME, BT_PROGRAM_SOURCE, "Forget", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
            nativeBridge.setLipcProperty(LIPC_BTMD_SOURCE, "Unbond", m_item.bdAddress);
            mTimer.start(that.onTimerExpired, TRANSACT_FAILED_TIMEOUT);
        } else if (button.id === "connect") {
            mConnectAction = true;
            Pillow.logDbgPrivate("Bt wizard connecting to device : " + m_item.device + " --- " +
                Pillow.obfuscateMac48Address(m_item.bdAddress, 4) +
                "previously connected to device : " + Pillow.obfuscateMac48Address(m_item.currConnectedDevice.bdAddress, 4) );
            /**
            No need to explicity issue a disconnect command for the current connected device,
            btd should be able to do the disconnect when it honors the connect command for
            the new bt device.
            */
            that.mActivityIndicator.start(BtActivity.CONNECTING, BTWizardDialogStringTable.connectingToBtDevice);
            nativeBridge.recordDeviceMetric(PILLOW_PROGRAM_NAME, BT_PROGRAM_SOURCE, "ConnectPairedDevice", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
            nativeBridge.setLipcProperty(LIPC_BTMD_SOURCE, "Connect", m_item.bdAddress);
            mTimer.start(that.onTimerExpired, TRANSACT_FAILED_TIMEOUT);
        }
    };

    this.initUI = function (item) {
        m_item = item;
        m_title = document.getElementById("btSwitchTitleText").textContent = BTWizardDialogStringTable.connectOrForgetDevice.format({string : m_item.device});
        mConnectAction = false;
        mForgetAction = false;
        var formattedDeviceName = "<pre class=\"device-name-inline\" dir=\"auto\">" + escapeHTML(m_item.device) + "</pre>";
        var switchText = BTWizardDialogStringTable.switchTextMessageFormat.format({string: formattedDeviceName});
        m_dialogText = document.getElementById("btSwitchDialogText").innerHTML = switchText;
        this.disableWidgets(false);
        var dialogElem = document.getElementById('dialog');
        nativeBridge.setWindowSize(dialogElem.offsetWidth, dialogElem.offsetHeight);
        Pillow.logInfo("Bt wizard item = " + m_item.device + "bt_address =" + Pillow.obfuscateMac48Address(m_item.bdAddress, 4));
    };

    this.getCurrentItem = function () {
        return m_item;
    };

    this.isForgetClicked = function () {
        return mForgetAction;
    };

    this.isConnectClicked = function () {
        return mConnectAction;
    };

    this.show = function () {
        nativeBridge.showMe();
    };

    this.hide = function () {
        that.mActivityIndicator.stop(BtActivity.CONNECTING);
        nativeBridge.hideMe();
    };

    this.close = function (args) {
        that.mActivityIndicator.stop(BtActivity.CONNECTING);
        that.showRedirectDialog(args);
    };

    Pillow.logWrapObject('Pillow.BtSwitchDialog', this);
};

Pillow.BtSwitchDialog.LipcEventHandler = function (pillowCase) {

    var m_item = pillowCase.getCurrentItem();
    const DIALOG_NAME = "BT Switch";
    Pillow.extend(this, new Pillow.LipcEventHandler(pillowCase));

    this.Bond_Result = function (values) {
        nativeBridge.setLipcProperty(LIPC_BTMD_SOURCE, "Connect", m_item.bdAddress);
    };

    this.Unbond_Result = function (values) {
        btUtil.unbondResult(values, m_item, pillowCase, DIALOG_NAME);
    };

    this.Connect_Result = function (values) {
        if(values[2] === m_item.bdAddress)
            pillowCase.mActivityIndicator.stop(BtActivity.CONNECTING);

        m_item = pillowCase.getCurrentItem();
        btUtil.connectResult(values, m_item, pillowCase, DIALOG_NAME);
    };

    this.Disconnect_Result = function (values) {
        var connectedItem = m_item ? m_item.currConnectedDevice : '';
        btUtil.disconnectResult(values, connectedItem, pillowCase, DIALOG_NAME);
    };

    this.Disable_Result = function (values) {
        btUtil.disableResult(values, pillowCase);
    };

    this.appActivating = function (values) {
        btUtil.appActivatingEvent(values, pillowCase);
    };

    this.btPairNumericPinToDisplay = function (values) {
        btUtil.passkeyPairing(values, pillowCase);
    };

    Pillow.logWrapObject('Pillow.BtSwitchDialog.LipcEventHandler', this);
};

var btSwitchDialog = new Pillow.BtSwitchDialog();
btSwitchDialog.register();

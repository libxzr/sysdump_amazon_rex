/*
 * bt_forget_dialog.js
 *
 * Copyright (c) 2016-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * @class This Pillow.Case displays and handles the BT Forget Dialog.
 * @extends Pillow.Case
 */
Pillow.BtForgetDialog = function () {
    const DIALOG_NAME = "BT Forget";
    const WINMGR_LIPC_SOURCE = "com.lab126.winmgr";
    var that = this;
    var parent = Pillow.extend(this, new Pillow.Case('BtForgetDialog'));
    var windowTitle = null;
    var m_item = null;
    var m_forgetItem = false;
    var m_buttonBar = null;
    var m_cancelButton = null;
    var m_title = null;
    var m_dialogText = null;
    const TRANSACT_FAILED_TIMEOUT = 15000;
    var isASRMode = false;

    var mTimer = btUtil.Timer(this);
    /**
     * Sets up the dialog with Pillow and prepares the interface.
     */
    this.onLoad = function () {
        Pillow.setOption(OPTION_SEND_DELETE_EVENTS, true);
        windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, WINMGR.ROLE.ALERT);
        windowTitle.withChanges(function () {
            this.addParam(WINMGR.KEY.WIN_IS_MODAL, WINMGR.MODALITY.MODAL);
        });
        isASRMode = nativeBridge.isASREnabled();
        var BtForgetCmdButtons = [
            {
                text: BTWizardDialogStringTable.cancel,
                id: 'cancel'
            },
            {
                text: (isASRMode ? BTWizardDialogStringTable.btPairedDeviceforgetDevice : BTWizardDialogStringTable.btWizardforgetDevice),
                id: 'forget'
            },
        ];

        if(!isASRMode) {
            BtForgetCmdButtons.push(
                {
                    text: BTWizardDialogStringTable.disconnect,
                    id: 'disconnect'
                }
            );
        }


        m_buttonBar = new ButtonBar('BtForgetCmdBar', BtForgetCmdButtons, handler);
        m_cancelButton = document.getElementById('btForgetCancelButton');
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

        if(!isASRMode){
            // Disconnect button not there in ASR
            m_buttonBar.setButtonDisabled(2, isDisable);
        }

        m_title.disabled = isDisable;
        m_dialogText.disabled = isDisable;
        m_cancelButton.disabled = isDisable;

    };

    this.stopTimer = function() {
        Pillow.logDbgMid("BtForget stopping timer");
        mTimer.stop();
    };

    this.onTimerStop = function () {
        Pillow.logDbgMid("BtForget timer stopped");
        that.disableWidgets(false);
    };

    this.onTimerStart = function () {
        Pillow.logDbgMid("BtForget timer started");
        that.disableWidgets(true);
    };

    this.onTimerExpired = function() {
        Pillow.logDbgMid("BtForget timer expired");
        that.showRedirectDialog();
    };

    this.initUI = function (item) {
        m_item = item;
        m_forgetItem = false;
        var formattedDeviceName = "<pre class=\"device-name-inline\" dir=\"auto\">" + escapeHTML(m_item.device) + "</pre>";
        if (isASRMode) {
            var forgetText = BTWizardDialogStringTable.btPairedWizardForgetTextMessageFormat.format({string: formattedDeviceName});
            m_title = document.getElementById("btForgetTitleText").innerHTML = BTWizardDialogStringTable.btPairedDeviceForgetDeviceTitle;
            m_dialogText = document.getElementById("btForgetDialogText").innerHTML = forgetText + "<br /> <br />" + BTWizardDialogStringTable.forgetConfirm;
        } else {
            m_title = document.getElementById("btForgetTitleText").textContent = BTWizardDialogStringTable.btWizardForgetDeviceTitle.format({device: m_item.device});
            m_dialogText = document.getElementById("btForgetDialogText").innerHTML = BTWizardDialogStringTable.btWizardForgetTextMessageFormat.format({string: formattedDeviceName});
        }
        this.disableWidgets(false);
        var dialogElem = document.getElementById('dialog');
        nativeBridge.setWindowSize(dialogElem.offsetWidth, dialogElem.offsetHeight);
        Pillow.logInfo("Bt wizard item = " + m_item.device + "bt_address" + Pillow.obfuscateMac48Address(m_item.bdAddress, 4));
    };

    this.showRedirectDialog = function (args) {
        var local = { numScans : 1 };
        btUtil.redirectToBtWizard(DIALOG_NAME, args || local);
    };

    var handler = function (button) {
        if (button.id === "cancel") {
            that.showRedirectDialog();
        } else if (button.id === "forget" || button.id === "disconnect") {
            /* Both Forget and Disconnect start with a Disconnect LIPC call. Difference is
               that Forget follows up with a Unbond LIPC call if Disconnect is successful */
            m_forgetItem = (button.id === "forget");
            if (m_forgetItem) {
                nativeBridge.recordDeviceMetric(PILLOW_PROGRAM_NAME, BT_PROGRAM_SOURCE, "Forget", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
            } else {
                nativeBridge.recordDeviceMetric(PILLOW_PROGRAM_NAME, BT_PROGRAM_SOURCE, "Disconnect", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
            }
            nativeBridge.setLipcProperty(LIPC_BTMD_SOURCE, "Disconnect", m_item.bdAddress);
            mTimer.start(that.onTimerExpired, TRANSACT_FAILED_TIMEOUT);
        }
    };

    this.getCurrentItem = function () {
        return m_item;
    };

    this.isASREnabled = function () {
        return isASRMode;
    };

    this.isForgetClicked = function () {
        return m_forgetItem;
    };

    this.show = function () {
        nativeBridge.showMe();
    };

    this.hide = function () {
        nativeBridge.hideMe();
    };

    this.close = function (args) {
        that.showRedirectDialog(args);
    };

    Pillow.logWrapObject('Pillow.BtForgetDialog', this);
};

Pillow.BtForgetDialog.LipcEventHandler = function (pillowCase) {
    const DIALOG_NAME = "BT Forget";
    var m_item = pillowCase.getCurrentItem();
    Pillow.extend(this, new Pillow.LipcEventHandler(pillowCase));

    this.Unbond_Result = function (values) {
        btUtil.unbondResult(values, m_item, pillowCase, DIALOG_NAME);
        if (pillowCase.isForgetClicked() && pillowCase.isASREnabled()) {
            // If it is ASRMode, by this time, we have warned user of the disconnection from ASRMode
            // and the process to re-enable ASR. Also there is no point to redirect to BT UI
            // but instead start the new ASR connection from the twoFinger gesture.
            // We must send back result to BTFD as well!
            pillowCase.hide();
            nativeBridge.setLipcProperty("com.lab126.voiceviewhelper", "stopVoiceView", "stopVoiceView");
            nativeBridge.setLipcProperty(LIPC_BTFD_SOURCE, PROP_BT_DIALOG_RESPONSE, DISMISSED_WITHOUT_CONNECTING);
            nativeBridge.dismissMe();
        } else {
            pillowCase.showRedirectDialog();
        }
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

    Pillow.logWrapObject('Pillow.BtForgetDialog.LipcEventHandler', this);
};

var btForgetDialog = new Pillow.BtForgetDialog();
btForgetDialog.register();

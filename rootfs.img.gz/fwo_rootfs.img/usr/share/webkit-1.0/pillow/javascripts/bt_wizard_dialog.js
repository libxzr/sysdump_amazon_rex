/*
 * bt_wizard_dialog.js
 *
 * Copyright (c) 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * @class This Pillow.Case displays and handles the BT Wizard Dialog
 * @extends Pillow.Case
 */

Pillow.BtWizardDialog = function () {

    var that = this;
    var parent = Pillow.extend(this, new Pillow.Case('BtWizardDialog'));
    var windowTitle = null;
    var listWidget = null;
    var selectedItem = null;
    var selectedItemType = null;
    var deviceList = null;
    var connectedDevice = null;
    var dismissTimer = null;
    var btTitle = null;
    var btHeaderText = null;
    var cancelButton = null;
    var mButtonBar = null;
    const SWITCH_DIALOG = "bt_switch_dialog";
    const SELECTED_ICON = "selectedDevice";
    const BT_ICON = "BtImage";
    const FORGET_DIALOG = "bt_forget_dialog";

    const PROP_LIST_DISCOVERED = "ListDiscovered";
    const PROP_LIST_PAIRED = "ListPaired";
    const PROP_LIST_CONNECTED = "ListConnected";

    const BT_SCAN_EVENT = "scanBtDevices";
    const TITLE_TEXT_ID = "btTitleText";
    const DIALOG_NAME = "BT Wizard";
    const NO_DEVICES_TEXT_ID = "noDevices";
    const BT_DIALOG_ID = "dialog";
    const HEADER_TEXT_ID = "btHeaderText";
    const CANCEL_ID = "cancel";
    const PAIR_NEW_DEVICE_ID = "scan";
    const OTHER_ID = "other";
    const RESCAN_ID = "rescan";
    const DISCOVER_START = 1;
    const DISCOVER_CANCEL = 0;

    /* This hashmap tracks the list of devices shown on scan list. We append to it
       on new discoveries and reset it to list of devices given by BTD on reordering
    */
    var listedMAC = {};

    var mTimer = btUtil.Timer(this);

    this.mActivityIndicator = new btUtil.ActivityIndicator();

    this.scanner = new function (mNumCycles) {
        var that = this;
        var mActivityIndicator = new btUtil.ActivityIndicator();
        var mScanCycle = 0;

        mNumCycles = mNumCycles || DEFAULT_NUM_SCAN_CYCLES;
        mNumCycles = (mNumCycles >= 1) ? mNumCycles : DEFAULT_NUM_SCAN_CYCLES;

        this.start = function() {
            // We initiate scan mNumCycles times allowing user a desirable window to put
            // a device in pairing mode.
            Pillow.logInfo("start scan");
            mActivityIndicator.start(BtActivity.SCANNING, BTWizardDialogStringTable.scanningForBTDevices);
            nativeBridge.setIntLipcProperty(LIPC_BTMD_SOURCE, PROP_BT_DISCOVER, DISCOVER_START);
            mScanCycle = 1;
        };

        this.stop = function() {
            mActivityIndicator.stop(BtActivity.SCANNING);
            if (mScanCycle !== 0) {
                Pillow.logInfo("stop scan");
                // scan needs to be interrupted only if there is a scan
                nativeBridge.setIntLipcProperty(LIPC_BTMD_SOURCE, PROP_BT_DISCOVER, DISCOVER_CANCEL);
                mScanCycle = 0;
            }
        };

        this.continue = function() {
            if (mScanCycle <= 0) {
                return;
            } else if (mScanCycle < mNumCycles) {
                Pillow.logInfo("Continue scan");
                mActivityIndicator.start(BtActivity.SCANNING, BTWizardDialogStringTable.scanningForBTDevices);
                nativeBridge.setIntLipcProperty(LIPC_BTMD_SOURCE, PROP_BT_DISCOVER, DISCOVER_START);
                mScanCycle++;
            } else {
                // special case indicate that no scan is prevalent
                mScanCycle = 0;
                this.stop();
            }
        };

        this.setNumCycles = function(numCycles) {
            if (!numCycles || numCycles < 0) {
                Pillow.logError("Invalid num cycles");
            } else if (mScanCycle !== 0) {
                Pillow.logError("Attempt to change numCycles during an ongoing scan");
            } else {
                mNumCycles = numCycles;
            }
        };

        this.restart = function() {
            mNumCycles = DEFAULT_NUM_SCAN_CYCLES;
            that.start();
        };

        this.cancel = function() {
            // cancel further scan commands
            mScanCycle = (mScanCycle !== 0) ? mNumCycles : 0;
        };

        this.isRunning = function() {
            return (mScanCycle != 0);
        };

    }();
    /**
     * Sets up the dialog with Pillow and prepares the interface.
     */
    this.onLoad = function () {
        Pillow.setOption(OPTION_SEND_DELETE_EVENTS, true);
        windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, WINMGR.ROLE.DIALOG);
        windowTitle.withChanges(function () {
            this.addParam(WINMGR.KEY.WIN_IS_MODAL,
                WINMGR.MODALITY.DISMISSIBLE_MODAL);
        });

        listWidget = new ListWidget('devices', {
            fields: ['btIcon', 'device', 'selectedIcon'],
            handler: listItemSelection,
            initialMaxVisibleItems: 4,
            xor: true,
            showScrollBar: true
        });

        this.swipeDown = Pillow.bind(listWidget, 'scrollUp');
        this.swipeUp = Pillow.bind(listWidget, 'scrollDown');
        cancelButton = document.getElementById('advancedCancelButton');
        new XorButton(cancelButton, Pillow.bind(this, 'close', null),
                      cancelButton, 'dialog-close',
            'dialog-close xor');

        var cmdButtonsASR = [{
            text: BTWizardDialogStringTable.cancel,
            id: CANCEL_ID
        }, {
            text: BTWizardDialogStringTable.pairNewDevice,
            id: PAIR_NEW_DEVICE_ID,
            description: BTWizardDialogStringTable.pairNewDeviceDescription
        }];
        var cmdButtons = [{
            text: BTWizardDialogStringTable.rescan,
            id: RESCAN_ID,
            description: BTWizardDialogStringTable.rescanDescription
        }];

        listCmdButtons = that.inASRMode ? cmdButtonsASR : cmdButtons;

        btTitle = document.getElementById(TITLE_TEXT_ID).textContent = BTWizardDialogStringTable.btWizardTitle;
        btHeaderText = document.getElementById(HEADER_TEXT_ID).textContent = BTWizardDialogStringTable.btWizardHeaderText;

        mButtonBar = new ButtonBar('BTDeviceCmdBar', listCmdButtons,
            handleListCommandBarSelect);

        var dialogElem = document.getElementById(BT_DIALOG_ID);

        nativeBridge.setWindowSize(dialogElem.offsetWidth,
            dialogElem.offsetHeight);
        this.show();
        parent(this).onLoad();
        // API to check for larger display mode and parsing the DOM to pick
        // large property values
        modifyClassNameDOM();
        Pillow.logInfo("Bt Wizard started");
    };


    this.initUI = function(item) {
        // Invoked when message passed to bt wizard has processBtInfo
        // field defined.
        if (item) {
            selectedItem = item.defaultItem ? item.defaultItem: item;
            selectedItemType = item.type ? item.type: PROP_BTMD_PAIR;
        }
    }


    this.disableWidgets = function (disable) {
        // Disable the buttons on the button bar
        for (var i = 0; i < listCmdButtons.length; i++) {
            mButtonBar.setButtonDisabled(i, disable);
        }

        btTitle.disabled = disable;
        btHeaderText.disabled = disable;
        cancelButton.disabled = disable;
        windowTitle.addParam(WINMGR.KEY.WIN_IS_MODAL, (!disable) ? WINMGR.MODALITY.DISMISSIBLE_MODAL : WINMGR.MODALITY.MODAL);
        listWidget.setDisabled(disable);
    };

    this.stopTimer = function() {
        Pillow.logDbgMid("Bt Wizard stopping timer");
        mTimer.stop();
    };

    this.onTimerStop = function () {
        Pillow.logDbgMid("Bt Wizard timer stopped");
        that.disableWidgets(false);
    };

    this.onTimerStart = function () {
        Pillow.logDbgMid("Bt Wizard timer started");
        that.disableWidgets(true);
    };

    this.onTimerExpired = function() {
        Pillow.logDbgMid("Bt Wizard timer expired");
        that.mActivityIndicator.stopAll();
        that.disableWidgets(false);
        that.refreshDevices();
    };

    var listItemSelection = function (item) {

        Pillow.logDbgHigh("BtWizardDialog.actionButtonSelect");
        selectedItem = item;

        var handleSelection = function(error) {
            if (error) {
                Pillow.logError("Error occured: " + error);
            }

            var message = {
                show: "true",
                processBtInfo: {
                    "device": item.device,
                    "bdAddress": item.bdAddress,
                    "isConnected": item.isConnected,
                    "currConnectedDevice": connectedDevice ? connectedDevice : '',
                }
            };
            var dialogName = null;

            if (item.isConnected === 1) {
                // Connected Devices opens the forget dialog
                dialogName = FORGET_DIALOG;
                nativeBridge.showDialog(dialogName, JSON.stringify(message));
                that.hide();
            } else {
                if (that.inASRMode) {
                    // If ASR is on, open the switch dialog
                    dialogName = SWITCH_DIALOG;
                    nativeBridge.showDialog(dialogName, JSON.stringify(message));
                    that.hide();
                } else {
                    if (item.isPaired === 1) {
                        // If device is already paired, open switch dialog
                        dialogName = SWITCH_DIALOG;
                        that.hide();
                        nativeBridge
                            .showDialog(dialogName, JSON.stringify(message));
                    } else {
                        // Pair with device and wait for timeout or Bond_Result
                        // event
                        that.mActivityIndicator.start(BtActivity.PAIRING, BTWizardDialogStringTable.pairingToBtDevice);
                        Pillow
                            .logInfo("Bt wizard connecting to selected device, no previously connected device = "
                                + selectedItem.device
                                + "  --- "
                                + Pillow.obfuscateMac48Address(selectedItem.bdAddress, 4) );
                        nativeBridge.recordDeviceMetric(PILLOW_PROGRAM_NAME, BT_PROGRAM_SOURCE, "ConnectNewDevice", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
                        nativeBridge.setLipcProperty(LIPC_BTMD_SOURCE, PROP_BTMD_PAIR,
                            selectedItem.bdAddress);
                        mTimer.start(that.onTimerExpired, TRANSACT_FAILED_TIMEOUT);
                    }
                }
            }
        };

        var onCancelDiscoveryFailure = function() {
            handleSelection("Cancel disovery Failed");
        };

        // Stop scan if a scan is currently going on
        if (that.scanner.isRunning()) {
            var notifierObj = {};
            notifierObj[EVENT_DISCOVER_COMPLETE] = handleSelection;
            mTimer.start(onCancelDiscoveryFailure, TRANSACT_FAILED_TIMEOUT, notifierObj);
            that.scanner.stop();
        } else {
            handleSelection();
        }

    };

    /**
     * handle button taps on the CMD bar at the bottom of the list view
     */
    var handleListCommandBarSelect = function (button) {
        switch (button.id) {
            case PAIR_NEW_DEVICE_ID:
                that.close();
                nativeBridge.sendLipcEvent(LIPC_PILLOW_SOURCE, BT_SCAN_EVENT, "");
                break;
            case OTHER_ID:
                // TODO Yet to be implemented
                break;
            case RESCAN_ID:
                Pillow.logInfo("BTWizard: User pressed rescan button");
                nativeBridge.recordDeviceMetric(PILLOW_PROGRAM_NAME, BT_PROGRAM_SOURCE, "rescan", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
                that.setDevices(false, {resetPos:true});
                that.scanner.restart();
                Pillow.logDbgHigh("Bt wizard Discovery mode on.");
                break;
            case CANCEL_ID:
                that.close();
                break;
        }
    };

    var isEmpty = function (obj) {
        for (var prop in obj) {
            if (obj.hasOwnProperty(prop))
                return false;
        }
        return true;
    };

    this.setBtDevicesCount = function (deviceList) {
        var numBtDevices = deviceList ? deviceList.length : 0;
        var elementId;
        var contentString;
        elementId = TITLE_TEXT_ID;
        contentString = BTWizardDialogStringTable.btWizardTitle;

        document.getElementById(elementId).textContent = contentString.format({
            numDevices: numBtDevices
        });
    };

    this.getSelectedItem = function () {
        return selectedItem;
    };

    this.notifyEvent = function (eventName) {
        if (mTimer.isRunning()) {
            mTimer.stopAndNotify(eventName);
        }
    };

    // This routine is a generic utility routine for merging two lists.
    // First list is kept intact and de-duped items from secondlist must be appended.
    function mergeLists(firstList, secondList) {
        if (isEmpty(firstList)) {
            return secondList;
        }
        if (isEmpty(secondList)) {
            return firstList;
        }
        // Keep track of bdAddresses
        var bdAddressHash = {};
        firstList.forEach(function (element) {
            bdAddressHash[element.bd_address] = true;
        });

        secondList.forEach(function (element) {
            if (!bdAddressHash[element.bd_address]) {
             firstList.push(element);
            }
        });

        return firstList;
    }

    this.getDeviceList = function (includeDiscoveredDevices) {
        var discoveredList = ((includeDiscoveredDevices) ? nativeBridge.accessHasharrayProperty(
            LIPC_BTMD_SOURCE, PROP_LIST_DISCOVERED) : []);
        var pairedList = nativeBridge.accessHasharrayProperty(LIPC_BTMD_SOURCE,
            PROP_LIST_PAIRED);
        var devicesList = mergeLists(pairedList, that.inASRMode ? [] : discoveredList);

        var connectedList = nativeBridge.accessHasharrayProperty(
            LIPC_BTMD_SOURCE, PROP_LIST_CONNECTED);
        if (!isEmpty(connectedList)) {
            connectedDevice = {
                device: connectedList[0].bd_name,
                bdAddress: connectedList[0].bd_address };
        } else {
            connectedDevice = null;
        }

        return populateDevices(devicesList);
    };

    var populateDevices = function (devicesList) {
        listedMAC = {};
        var displayList = [];

        for (var i = 0; i < devicesList.length; i++) {
            var currentItem = devicesList[i];
            if (devicesList[i].is_connected == 1) {
                displayList.unshift({
                    btIcon: BT_ICON,
                    device: currentItem.bd_name,
                    selectedIcon: SELECTED_ICON,
                    bdAddress: currentItem.bd_address,
                    isConnected: 1
                });
            } else {
                displayList.push({
                    btIcon: BT_ICON,
                    device: currentItem.bd_name,
                    selectedIcon: ' ',
                    bdAddress: currentItem.bd_address,
                    isConnected: 0,
                    isPaired: currentItem.is_paired
                });
            }
        }

        /* Populate BD Addresses of devices in hash map */
        for (var i=0; i<displayList.length; i++) {
            listedMAC[displayList[i].bdAddress] = true;
        }

        return displayList;
    };

    this.renderDevices = function(deviceList, widgetOptions) {
        var noBtText = document.getElementById(NO_DEVICES_TEXT_ID);
        if (!deviceList || deviceList.length === 0) {
            noBtText.style.display = "inline";
            noBtText.innerHTML = BTWizardDialogStringTable.noDeviceDiscovered;
        } else {
            noBtText.style.display = "none";
        }

        listWidget.setItems(deviceList, widgetOptions);
        this.setBtDevicesCount(deviceList);
    };

    /**
     * update the paired devices
     */
    this.setDevices = function (includeDiscoveredDevices, widgetOptions) {
        deviceList = this.getDeviceList(includeDiscoveredDevices);
        this.renderDevices(deviceList, widgetOptions);

    };

    this.addDeviceIfNewlyDiscovered = function (discoveredDevice) {
        if (! (discoveredDevice.bdAddress in listedMAC) ) {
            listedMAC[discoveredDevice.bdAddress] = true;
            deviceList = deviceList.concat({
                btIcon: BT_ICON,
                device: discoveredDevice.deviceName,
                selectedIcon: ' ',
                bdAddress: discoveredDevice.bdAddress,
                isConnected: 0,
                isPaired: 0
            });

            this.renderDevices(deviceList);
        }
    };

    /* Deletes devices not in range from scan list and preserves ordering */
    this.removeDevicesNotInRange = function () {
        var discoveredList = nativeBridge.accessHasharrayProperty(
            LIPC_BTMD_SOURCE, PROP_LIST_DISCOVERED);
        var pairedList = nativeBridge.accessHasharrayProperty(LIPC_BTMD_SOURCE,
            PROP_LIST_PAIRED);
        var devicesFromBTMD = mergeLists(pairedList, that.inASRMode ? [] : discoveredList);

        /* Populate BD Addresses of devices in hash map */
        listedMAC = {};
        for (var i=0; i<devicesFromBTMD.length; i++) {
            listedMAC[devicesFromBTMD[i].bd_address] = true;
        }

        for(var index=deviceList.length-1; index>=0; index--) {
            if( !(deviceList[index].bdAddress in listedMAC) ) {
                /* Device shouldn't be displayed in scan list now */
                deviceList.splice(index,1);
            }
        }

        this.renderDevices(deviceList);
    };

    this.show = function (numScans) {
        (numScans) ? this.setDevices(false, {resetPos:true}) : this.setDevices(true);
        if (!that.inASRMode && numScans) {
            Pillow.logInfo("BTWizard: starting scan");
            this.scanner.setNumCycles(numScans);
            this.scanner.start();
        }
        nativeBridge.showMe();
    };

    this.hide = function () {
        nativeBridge.dismissMe();
    };

    this.close = function () {
        that.mActivityIndicator.stopAll();
        mTimer.stop()
        that.scanner.stop();
        connectedList = nativeBridge.accessHasharrayProperty(
            LIPC_BTMD_SOURCE, PROP_LIST_CONNECTED);
        nativeBridge.setLipcProperty(LIPC_BTFD_SOURCE, PROP_BT_DIALOG_RESPONSE,
            (!isEmpty(connectedList)) ? DISMISSED_AFTER_CONNECTING
                : DISMISSED_WITHOUT_CONNECTING);
        nativeBridge.dismissMe();
    };

    Pillow.logWrapObject('Pillow.BtWizardDialog', this);
};

Pillow.BtWizardDialog.LipcEventHandler = function (pillowCase) {

    Pillow.extend(this, new Pillow.LipcEventHandler(pillowCase));
    var m_item = null;
    const btmdEvents = [EVENT_BOND_RESULT, EVENT_UNBOND_RESULT,
        EVENT_CONNECT_RESULT, EVENT_DISCONNECT_RESULT,
        EVENT_DISCOVER_RESULT, EVENT_CANCEL_DISCOVER_RESULT, EVENT_DISCOVER_COMPLETE,
        EVENT_DISABLE_RESULT, EVENT_PAIR_NUMERIC_PIN_TO_DISPLAY];
    const appMgrEvents = [EVENT_APP_ACTIVATING];
    const DIALOG_NAME = "BT Wizard";
    const BT_SUCCESS = 0;

    this.subscribedEvents.sources.push(btUtil.getSource(LIPC_BTMD_SOURCE,
        btmdEvents));
    this.subscribedEvents.sources.push(btUtil.getSource(LIPC_APP_MGR_SOURCE,
        appMgrEvents));

    this.Unbond_Result = function (values) {
        this.refreshDevices(values);
    };

    this.Bond_Result = function (values) {
        m_item = pillowCase.getSelectedItem();

        Pillow.logInfo("BT wizard dialog bond result" + values[0]);
        if (values[2] != m_item.bdAddress) {
            return;
        }

        if(values[0] != BT_SUCCESS){
            pillowCase.mActivityIndicator.stop(BtActivity.PAIRING);
            nativeBridge.dismissMe();
            Pillow.logInfo("Launch Pairing failed dialog for " + m_item.device + "  " + Pillow.obfuscateMac48Address(m_item.bdAddress, 4) + "  " + m_item.isConnected);
            btUtil.redirectToErrorDialog(m_item, PROP_BTMD_PAIR);
        }
        else{
            pillowCase.mActivityIndicator.stop(BtActivity.PAIRING);
            pillowCase.mActivityIndicator.start(BtActivity.CONNECTING, BTWizardDialogStringTable.connectingToBtDevice);
            nativeBridge.setLipcProperty(LIPC_BTMD_SOURCE, PROP_BTMD_CONNECT,
               m_item.bdAddress);
        }
    };

    this.Discover_Result = function (values) {
        Pillow.logInfo("BT wizard Discover Result");
        var deviceName = values[0];
        var bdAddress = values[1];
        pillowCase.addDeviceIfNewlyDiscovered({
            deviceName : deviceName,
            bdAddress : bdAddress
        });
    };

    this.Cancel_Discover_Result = function (value) {
        Pillow.logInfo("Bt wizard Cancel_Discover_Result");
    };

    this.Discover_Complete = function (values) {
        Pillow.logInfo("Bt wizard Discover_Complete");
        if (pillowCase.scanner.isRunning())
            pillowCase.removeDevicesNotInRange();
        pillowCase.scanner.continue();
        pillowCase.notifyEvent(EVENT_DISCOVER_COMPLETE);
    };

    this.Connect_Result = function (values) {
        m_item = pillowCase.getSelectedItem();

        if (m_item && values[2] === m_item.bdAddress) {
            pillowCase.mActivityIndicator.stop(BtActivity.CONNECTING);
        }

        if (!m_item || btUtil.connectResult(values, m_item, pillowCase, DIALOG_NAME)) {
            Pillow.logInfo("Bt device is connected");
        }

        if (values[0] === BT_SUCCESS){
            this.refreshDevices(values, {resetPos:true});
        }
    };

    this.Disconnect_Result = function (values) {
        m_item = pillowCase.getSelectedItem();
        if (m_item && m_item.currConnectedDevice) {
            btUtil.disconnectResult(values, m_item.currConnectedDevice, pillowCase, DIALOG_NAME);
        } else {
            Pillow.logInfo("Bt device is disconnected");
        }

        if (values[0] === BT_SUCCESS){
            this.refreshDevices(values);
        }
    };

    this.Disable_Result = function (values) {
        btUtil.disableResult(values, pillowCase);
    };

    this.appActivating = function (values) {
        btUtil.appActivatingEvent(values, pillowCase);
    };

    this.btPairNumericPinToDisplay = function (values) {
        pillowCase.mActivityIndicator.stop(BtActivity.PAIRING);
        btUtil.passkeyPairing(values, pillowCase);
    };

    this.refreshDevices = function (values, options) {
        pillowCase.setDevices(true, options);
        //TODO handle different values
    };

    Pillow.logWrapObject('Pillow.BtWizardDialog.LipcEventHandler', this);
};

var btWizardDialog = new Pillow.BtWizardDialog();
btWizardDialog.register();

/*
 * bt_wizard_dialog_strings.js
 *
 * Copyright (c) 2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

// string map for default mode
var BTWizardDialogStringTable = {
    switchDialogButtonLayout: BUTTON_LAYOUT_NORMAL,
    btWizardTitle: new MessageFormat("Bluetooth Devices ({numDevices,number,integer})"),
    subtitle: new MessageFormat("Devices ({numDevices,number,integer})"),
    btWizardHeaderText: "Please pair a Bluetooth audio device to listen to Audible content or to use the VoiceView screen reader.",
    rescan: "RESCAN",
    rescanDescription: "Scan for new devices",
    pairNewDevice: "BLUETOOTH WIZARD",
    pairNewDeviceDescription: "Disconnect and pair new audio device",
    disconnect: "DISCONNECT",
    other: "OTHER",
    connect: "CONNECT",
    cancel: "CANCEL",
    btWizardforgetDevice: "FORGET",
    btPairedDeviceforgetDevice: "FORGET DEVICE",
    tryAgain: "TRY AGAIN",
    btWizardForgetDeviceTitle: new MessageFormat("{device}"),
    btPairedDeviceForgetDeviceTitle: "Forget Device",
    btWizardErrorDeviceTitle: {
        Bond : "Bluetooth Pairing Failed",
        Connect : "Bluetooth Connection Failed"
    },
    noDeviceDiscovered: "No Devices Found",
    passcodeTitle: "Device Passcode Required",
    connectOrForgetDevice: new MessageFormat("{string}"),
    switchTextMessageFormat: new MessageFormat("Would you like to connect to or forget the device \"{string}\"?"),
    btPairedWizardForgetTextMessageFormat: new MessageFormat("You are currently connected to {string}."),
    btWizardForgetTextMessageFormat: new MessageFormat("Would you like to disconnect from or forget the device \"{string}\"?"),
    forgetConfirm: "Are you sure you want to forget this device?<br><br>This will disable the VoiceView screen reader. <br><br>To enable VoiceView again, press and hold the Power button for 9 seconds, then hold 2 fingers on your Kindle screen.",
    btWizardErrorTextMessageFormat: {
       Bond :  new MessageFormat("Unable to pair with the Bluetooth audio device  \"{string}\".<br/><br/>Please make sure the device is on and in pairing mode."),
       Connect :  new MessageFormat("Unable to connect to the Bluetooth audio device  \"{string}\".<br/><br/>Please make sure your device is on and within range."),
    },
    passKeyComparisonTitle: "Bluetooth Pairing Request",
    passKeyTextMessageFormat: new MessageFormat('"{string}" would like to pair with your Kindle. Please confirm that the number below is shown on "{string}"'),
    confirm: "CONFIRM",
    scanningForBTDevices: "Scanning for Bluetooth Devices",
    connectingToBtDevice: "Connecting device",
    pairingToBtDevice: "Pairing device"
};

// string map for large mode
var BTWizardDialogStringTableLarge = {
    rescan: "Rescan",
    pairNewDevice: "Bluetooth Wizard",
    disconnect: "Disconnect",
    other: "Other",
    tryAgain: "Try Again",
    cancel: "Cancel",
    connect: "Connect",
    btWizardforgetDevice: "Forget",
    btPairedDeviceforgetDevice: "Forget Device",
    confirm: "Confirm"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTWizardDialogStringTable = constructTableOnDisplayModeChange(BTWizardDialogStringTable, BTWizardDialogStringTableLarge);

var BTAccessibilityStringTable = {
    close: "Close"
};

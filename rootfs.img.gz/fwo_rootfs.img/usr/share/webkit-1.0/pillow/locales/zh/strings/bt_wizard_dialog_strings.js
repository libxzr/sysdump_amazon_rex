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
    btWizardTitle: new MessageFormat("\u84dd\u7259\u8bbe\u5907 ({numDevices,number,integer})"),
    subtitle: new MessageFormat("\u8bbe\u5907 ({numDevices,number,integer})"),
    btWizardHeaderText: "\u60a8\u5fc5\u987b\u5c06\u84dd\u7259\u97f3\u9891\u8bbe\u5907\u914d\u5bf9\u624d\u80fd\u6536\u542c Audible \u5185\u5bb9\u6216\u4f7f\u7528 VoiceView \u5c4f\u5e55\u6717\u8bfb\u5668\u3002",
    rescan: "\u91cd\u65b0\u626b\u63cf",
    rescanDescription: "\u626b\u63cf\u65b0\u8bbe\u5907",
    pairNewDevice: "\u84dd\u7259\u5411\u5bfc",
    pairNewDeviceDescription: "\u65ad\u5f00\u8fde\u63a5\u5e76\u914d\u5bf9\u65b0\u97f3\u9891\u8bbe\u5907",
    disconnect: "\u65ad\u5f00\u8fde\u63a5",
    other: "\u5176\u4ed6",
    connect: "\u8fde\u63a5",
    cancel: "\u53d6\u6d88",
    btWizardforgetDevice: "\u5ffd\u7565",
    btPairedDeviceforgetDevice: "\u5ffd\u7565\u8bbe\u5907",
    tryAgain: "\u91cd\u8bd5",
    btWizardForgetDeviceTitle: new MessageFormat("{device}"),
    btPairedDeviceForgetDeviceTitle: "\u5ffd\u7565\u8bbe\u5907",
    btWizardErrorDeviceTitle: {
        Bond : "\u84dd\u7259\u914d\u5bf9\u5931\u8d25",
        Connect : "\u84dd\u7259\u8fde\u63a5\u5931\u8d25"
    },
    noDeviceDiscovered: "\u672a\u627e\u5230\u8bbe\u5907",
    passcodeTitle: "\u8981\u6c42\u8f93\u5165\u8bbe\u5907\u5bc6\u7801",
    connectOrForgetDevice: new MessageFormat("{string}"),
    switchTextMessageFormat: new MessageFormat("\u60a8\u8981\u8fde\u63a5\u8fd8\u662f\u5ffd\u7565\u8bbe\u5907 \u201c{string}\u201d\uff1f"),
    btPairedWizardForgetTextMessageFormat: new MessageFormat("\u60a8\u5df2\u8fde\u63a5 {string}\u3002"),
    btWizardForgetTextMessageFormat: new MessageFormat("\u60a8\u8981\u65ad\u5f00\u8fd8\u662f\u5ffd\u7565\u8bbe\u5907 \u201c{string}\u201d\uff1f"),
    forgetConfirm: "\u60a8\u786e\u5b9a\u8981\u5ffd\u7565\u6b64\u8bbe\u5907\u5417\uff1f<br><br>\u8fd9\u5c06\u7981\u7528 VoiceView \u5c4f\u5e55\u6717\u8bfb\u5668\u3002<br><br>\u5982\u9700\u518d\u6b21\u542f\u7528 VoiceView\uff0c\u8bf7\u957f\u6309\u7535\u6e90\u5f00\u5173 9 \u79d2\uff0c\u7136\u540e\u7528\u4e24\u6307\u6309\u4f4f Kindle \u5c4f\u5e55\u3002",
    btWizardErrorTextMessageFormat: {
       Bond :  new MessageFormat("\u65e0\u6cd5\u4e0e\u4ee5\u4e0b\u84dd\u7259\u97f3\u9891\u8bbe\u5907\u914d\u5bf9\uff1a\u201c{string}\u201d\u3002<br/><br/>\u8bf7\u786e\u4fdd\u8bbe\u5907\u5df2\u5f00\u542f\u5e76\u5904\u4e8e\u914d\u5bf9\u6a21\u5f0f\u3002"),
       Connect :  new MessageFormat("\u65e0\u6cd5\u8fde\u63a5\u5230\u4ee5\u4e0b\u84dd\u7259\u97f3\u9891\u8bbe\u5907\uff1a\u201c{string}\u201d\u3002<br/><br/>\u8bf7\u786e\u4fdd\u8bbe\u5907\u5df2\u5f00\u542f\u5e76\u5728\u6709\u6548\u8303\u56f4\u5185\u3002"),
    },
    passKeyComparisonTitle: "\u84dd\u7259\u914d\u5bf9\u8bf7\u6c42",
    passKeyTextMessageFormat: new MessageFormat('"{string}" \u5e0c\u671b\u4e0e\u60a8\u7684 Kindle \u914d\u5bf9\u3002\u8bf7\u786e\u8ba4\u4e0b\u9762\u7684\u6570\u5b57\u5728 "{string}" \u4e0a\u663e\u793a'),
    confirm: "\u786e\u8ba4",
    scanningForBTDevices: "\u6b63\u5728\u626b\u63cf\u84dd\u7259\u8bbe\u5907",
    connectingToBtDevice: "\u6b63\u5728\u8fde\u63a5\u8bbe\u5907",
    pairingToBtDevice: "\u6b63\u5728\u8fdb\u884c\u8bbe\u5907\u914d\u5bf9"
};

// string map for large mode
var BTWizardDialogStringTableLarge = {
    rescan: "\u91cd\u65b0\u626b\u63cf",
    pairNewDevice: "\u84dd\u7259\u5411\u5bfc",
    disconnect: "\u65ad\u5f00\u8fde\u63a5",
    other: "\u5176\u4ed6",
    tryAgain: "\u91cd\u8bd5",
    cancel: "\u53d6\u6d88",
    connect: "\u8fde\u63a5",
    btWizardforgetDevice: "\u5ffd\u7565",
    btPairedDeviceforgetDevice: "\u5ffd\u7565\u8bbe\u5907",
    confirm: "\u786e\u8ba4"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTWizardDialogStringTable = constructTableOnDisplayModeChange(BTWizardDialogStringTable, BTWizardDialogStringTableLarge);

var BTAccessibilityStringTable = {
    close: "\u5173\u95ed"
};

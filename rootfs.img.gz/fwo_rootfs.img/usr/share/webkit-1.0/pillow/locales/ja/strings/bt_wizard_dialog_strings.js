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
    btWizardTitle: new MessageFormat("Bluetooth\u30c7\u30d0\u30a4\u30b9({numDevices,number,integer})"),
    subtitle: new MessageFormat("\u30c7\u30d0\u30a4\u30b9({numDevices,number,integer})"),
    btWizardHeaderText: "Audible\u30b3\u30f3\u30c6\u30f3\u30c4\u3092\u518d\u751f\u3057\u305f\u308a\u3001VoiceView\u30b9\u30af\u30ea\u30fc\u30f3\u30ea\u30fc\u30c0\u30fc\u3092\u4f7f\u7528\u3057\u305f\u308a\u3059\u308b\u306b\u306f\u3001Bluetooth\u30aa\u30fc\u30c7\u30a3\u30aa\u30c7\u30d0\u30a4\u30b9\u3092\u63a5\u7d9a\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    rescan: "\u518d\u30b9\u30ad\u30e3\u30f3",
    rescanDescription: "\u65b0\u3057\u3044\u30c7\u30d0\u30a4\u30b9\u3092\u691c\u51fa",
    pairNewDevice: "Bluetooth\u30a6\u30a3\u30b6\u30fc\u30c9",
    pairNewDeviceDescription: "\u63a5\u7d9a\u89e3\u9664\u3057\u3066\u5225\u306e\u30aa\u30fc\u30c7\u30a3\u30aa\u30c7\u30d0\u30a4\u30b9\u3068\u30da\u30a2\u30ea\u30f3\u30b0\u3057\u307e\u3059",
    disconnect: "\u5207\u65ad",
    other: "\u305d\u306e\u4ed6",
    connect: "\u63a5\u7d9a",
    cancel: "\u30ad\u30e3\u30f3\u30bb\u30eb",
    btWizardforgetDevice: "\u63a5\u7d9a\u89e3\u9664",
    btPairedDeviceforgetDevice: "\u7aef\u672b\u3092\u63a5\u7d9a\u89e3\u9664",
    tryAgain: "\u518d\u8a66\u884c",
    btWizardForgetDeviceTitle: new MessageFormat("{device}"),
    btPairedDeviceForgetDeviceTitle: "\u7aef\u672b\u3092\u63a5\u7d9a\u89e3\u9664",
    btWizardErrorDeviceTitle: {
        Bond : "Bluetooth\u30da\u30a2\u30ea\u30f3\u30b0\u5931\u6557",
        Connect : "Bluetooth\u63a5\u7d9a\u5931\u6557"
    },
    noDeviceDiscovered: "\u30c7\u30d0\u30a4\u30b9\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093",
    passcodeTitle: "\u30c7\u30d0\u30a4\u30b9\u306e\u30d1\u30b9\u30b3\u30fc\u30c9\u304c\u5fc5\u8981\u3067\u3059",
    connectOrForgetDevice: new MessageFormat("{string}"),
    switchTextMessageFormat: new MessageFormat("\"{string}\"\u306b\u63a5\u7d9a\u307e\u305f\u306f\u63a5\u7d9a\u89e3\u9664\u3057\u307e\u3059\u304b?"),
    btPairedWizardForgetTextMessageFormat: new MessageFormat("{string}\u306b\u63a5\u7d9a\u6e08\u307f\u3067\u3059\u3002"),
    btWizardForgetTextMessageFormat: new MessageFormat("\"{string}\"\u3068\u306e\u63a5\u7d9a\u3092\u89e3\u9664\u307e\u305f\u306f\u7121\u52b9\u306b\u3057\u307e\u3059\u304b?"),
    forgetConfirm: "\u3053\u306e\u7aef\u672b\u3068\u306e\u63a5\u7d9a\u3092\u89e3\u9664\u3057\u307e\u3059\u304b\uff1f <br><br>\u3053\u306e\u64cd\u4f5c\u3092\u5b9f\u884c\u3059\u308b\u3068VoiceView\u30b9\u30af\u30ea\u30fc\u30f3\u30ea\u30fc\u30c0\u30fc\u304c\u7121\u52b9\u306b\u306a\u308a\u307e\u3059\u3002<br><br>\u518d\u5ea6VoiceView\u3092\u6709\u52b9\u306b\u3059\u308b\u306b\u306f\u3001\u96fb\u6e90\u30dc\u30bf\u30f3\u30929\u79d2\u9593\u9577\u62bc\u3057\u3057\u3066\u304b\u3089\u3001Kindle\u306e\u753b\u9762\u4e0a\u306b\u63072\u672c\u3092\u7f6e\u3044\u3066\u304f\u3060\u3055\u3044\u3002",
    btWizardErrorTextMessageFormat: {
       Bond :  new MessageFormat("Bluetooth\u30aa\u30fc\u30c7\u30a3\u30aa\u30c7\u30d0\u30a4\u30b9\u300c{string}\u300d\u3068\u30da\u30a2\u30ea\u30f3\u30b0\u3067\u304d\u307e\u305b\u3093\u3067\u3057\u305f\u3002<br/><br/>\u30c7\u30d0\u30a4\u30b9\u304c\u30aa\u30f3\u3067\u3042\u308a\u3001\u30da\u30a2\u30ea\u30f3\u30b0\u30e2\u30fc\u30c9\u306b\u306a\u3063\u3066\u3044\u308b\u304b\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002"),
       Connect :  new MessageFormat("Bluetooth\u30aa\u30fc\u30c7\u30a3\u30aa\u30c7\u30d0\u30a4\u30b9\u300c{string}\u300d\u306b\u63a5\u7d9a\u3067\u304d\u307e\u305b\u3093\u3002<br/><br/>\u30c7\u30d0\u30a4\u30b9\u304c\u30aa\u30f3\u306b\u306a\u3063\u3066\u304a\u308a\u3001\u7bc4\u56f2\u5185\u306b\u3042\u308b\u3053\u3068\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002"),
    },
    passKeyComparisonTitle: "Bluetooth\u30da\u30a2\u30ea\u30f3\u30b0\u8981\u6c42",
    passKeyTextMessageFormat: new MessageFormat('\u300c{string}\u300d\u304cKindle\u3068\u30da\u30a2\u30ea\u30f3\u30b0\u3057\u3088\u3046\u3068\u3057\u3066\u3044\u307e\u3059\u3002\u4ee5\u4e0b\u306e\u756a\u53f7\u304c\u300c{string}\u300d\u306b\u8868\u793a\u3055\u308c\u3066\u3044\u308b\u3053\u3068\u3092\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002'),
    confirm: "\u78ba\u5b9a",
    scanningForBTDevices: "Bluetooth\u7aef\u672b\u3092\u30b9\u30ad\u30e3\u30f3\u4e2d",
    connectingToBtDevice: "\u7aef\u672b\u3092\u63a5\u7d9a\u4e2d",
    pairingToBtDevice: "\u7aef\u672b\u3092\u30da\u30a2\u30ea\u30f3\u30b0\u4e2d"
};

// string map for large mode
var BTWizardDialogStringTableLarge = {
    rescan: "\u518d\u30b9\u30ad\u30e3\u30f3",
    pairNewDevice: "Bluetooth\u30a6\u30a3\u30b6\u30fc\u30c9",
    disconnect: "\u63a5\u7d9a\u89e3\u9664",
    other: "\u305d\u306e\u4ed6",
    tryAgain: "\u518d\u8a66\u884c",
    cancel: "\u30ad\u30e3\u30f3\u30bb\u30eb",
    connect: "\u63a5\u7d9a",
    btWizardforgetDevice: "\u63a5\u7d9a\u89e3\u9664",
    btPairedDeviceforgetDevice: "\u7aef\u672b\u3092\u63a5\u7d9a\u89e3\u9664",
    confirm: "\u78ba\u5b9a"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTWizardDialogStringTable = constructTableOnDisplayModeChange(BTWizardDialogStringTable, BTWizardDialogStringTableLarge);

var BTAccessibilityStringTable = {
    close: "\u9589\u3058\u308b"
};

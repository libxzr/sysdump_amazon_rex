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
    btWizardTitle: new MessageFormat("Bluetooth-Ger\u00e4te ({numDevices,number,integer})"),
    subtitle: new MessageFormat("Ger\u00e4te ({numDevices,number,integer})"),
    btWizardHeaderText: "Verbinden Sie sich bitte mit einem Bluetooth-Audioger\u00e4t, um Audible-H\u00f6rb\u00fccher zu h\u00f6ren oder den VoiceView-Screenreader zu verwenden.",
    rescan: "ERNEUT SUCHEN",
    rescanDescription: "Nach neuen Ger\u00e4ten scannen",
    pairNewDevice: "BLUETOOTH-ASSISTENT",
    pairNewDeviceDescription: "Neues Audioger\u00e4t trennen und koppeln",
    disconnect: "TRENNEN",
    other: "ANDERE",
    connect: "VERBINDEN",
    cancel: "ABBRECHEN",
    btWizardforgetDevice: "VERWERFEN",
    btPairedDeviceforgetDevice: "GER\u00c4T VERWERFEN",
    tryAgain: "ERNEUT VERSUCHEN",
    btWizardForgetDeviceTitle: new MessageFormat("{device}"),
    btPairedDeviceForgetDeviceTitle: "Ger\u00e4t verwerfen",
    btWizardErrorDeviceTitle: {
        Bond : "Verbindung mit Bluetooth fehlgeschlagen",
        Connect : "Bluetooth-Verbindung verloren"
    },
    noDeviceDiscovered: "Keine Ger\u00e4te gefunden",
    passcodeTitle: "Ger\u00e4tepasswort erforderlich",
    connectOrForgetDevice: new MessageFormat("{string}"),
    switchTextMessageFormat: new MessageFormat("M\u00f6chten Sie das Ger\u00e4t \u201e{string}\u201c verbinden oder verwerfen?"),
    btPairedWizardForgetTextMessageFormat: new MessageFormat("Sie sind momentan mit {string} verbunden."),
    btWizardForgetTextMessageFormat: new MessageFormat("M\u00f6chten Sie die Verbindung zum Ger\u00e4t \u201e{string}\u201d trennen oder es verwerfen?"),
    forgetConfirm: "M\u00f6chten Sie dieses Ger\u00e4t wirklich verwerfen?<br><br>Dadurch wird der VoiceView-Screenreader deaktiviert. <br><br>Halten Sie die Ein-/Aus-Taste 9 Sekunden lang gedr\u00fcckt und ber\u00fchren Sie den Bildschirm dann mit zwei Fingern, um VoiceView erneut einzuschalten.",
    btWizardErrorTextMessageFormat: {
       Bond :  new MessageFormat("Verbindung mit dem Bluetooth-Audioger\u00e4t \u201e{string}\u201c nicht m\u00f6glich.<br/><br/>Stellen Sie bitte sicher, dass das Ger\u00e4t eingeschaltet und im Kopplungsmodus ist."),
       Connect :  new MessageFormat("Verbindung mit dem Bluetooth-Audioger\u00e4t \u201e{string}\u201c nicht m\u00f6glich.<br/><br/>Stellen Sie bitte sicher, dass das Ger\u00e4t eingeschaltet und in Reichweite ist."),
    },
    passKeyComparisonTitle: "Bluetooth-Kopplungsanfrage",
    passKeyTextMessageFormat: new MessageFormat('\u201e{string}\u201c m\u00f6chte sich mit Ihrem Kindle verbinden. Bitte best\u00e4tigen Sie, dass die unten stehende Nummer auf \u201e{string}\u201c angezeigt wird'),
    confirm: "BEST\u00c4TIGEN",
    scanningForBTDevices: "Bluetooth-Ger\u00e4te werden gesucht",
    connectingToBtDevice: "Ger\u00e4t wird verbunden",
    pairingToBtDevice: "Ger\u00e4t wird verbunden"
};

// string map for large mode
var BTWizardDialogStringTableLarge = {
    rescan: "Erneut suchen",
    pairNewDevice: "Bluetooth-Assistent",
    disconnect: "Trennen",
    other: "Andere",
    tryAgain: "Erneut versuchen",
    cancel: "Abbrechen",
    connect: "Verbinden",
    btWizardforgetDevice: "Verwerfen",
    btPairedDeviceforgetDevice: "Ger\u00e4t verwerfen",
    confirm: "Best\u00e4tigen"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTWizardDialogStringTable = constructTableOnDisplayModeChange(BTWizardDialogStringTable, BTWizardDialogStringTableLarge);

var BTAccessibilityStringTable = {
    close: "Schlie\u00dfen"
};

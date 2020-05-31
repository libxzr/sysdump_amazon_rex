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
    btWizardTitle: new MessageFormat("Bluetooth-apparaten ({numDevices,number,integer})"),
    subtitle: new MessageFormat("Apparaten ({numDevices,number,integer})"),
    btWizardHeaderText: "Koppel een Bluetooth-audioapparaat om te luisteren naar Audible-content of om de VoiceView-schermlezer te gebruiken.",
    rescan: "OPNIEUW SCANNEN",
    rescanDescription: "Scannen op nieuwe apparaten",
    pairNewDevice: "BLUETOOTHWIZARD",
    pairNewDeviceDescription: "Verbinding maken en verbreken met een nieuw audioapparaat",
    disconnect: "ONTKOPPELEN",
    other: "OVERIGE",
    connect: "VERBINDEN",
    cancel: "ANNULEREN",
    btWizardforgetDevice: "VERGETEN",
    btPairedDeviceforgetDevice: "APPARAAT VERGETEN",
    tryAgain: "OPNIEUW PROBEREN",
    btWizardForgetDeviceTitle: new MessageFormat("{device}"),
    btPairedDeviceForgetDeviceTitle: "Apparaat vergeten",
    btWizardErrorDeviceTitle: {
        Bond : "Koppelen Bluetooth mislukt",
        Connect : "Bluetooth-verbinding mislukt"
    },
    noDeviceDiscovered: "Geen apparaten gevonden",
    passcodeTitle: "Wachtvoord voor apparaat vereist",
    connectOrForgetDevice: new MessageFormat("{string}"),
    switchTextMessageFormat: new MessageFormat("Wil je verbinding maken met het apparaat \"{string}\" of het vergeten?"),
    btPairedWizardForgetTextMessageFormat: new MessageFormat("Je bent verbonden met {string}."),
    btWizardForgetTextMessageFormat: new MessageFormat("Wil je de verbinding met het apparaat \"{string}\" verbreken of het vergeten?"),
    forgetConfirm: "Weet je zeker dat je dit apparaat wilt vergeten?<br><br>De VoiceView-schermlezer wordt dan uitgeschakeld. <br><br>Houd de aan/uit-knop 9 seconden ingedrukt en houd vervolgens twee vingers op het Kindle-scherm om VoiceView weer in te schakelen.",
    btWizardErrorTextMessageFormat: {
       Bond :  new MessageFormat("Kan niet worden gekoppeld aan Bluetooth-audioapparaat \"{string}\".<br/><br/>Controleer of het apparaat is ingeschakeld en de koppelingsmodus is geactiveerd."),
       Connect :  new MessageFormat("Kan geen verbinding maken met het Bluetooth-audioapparaat \"{string}\".<br/><br/>Controleer of je apparaat is ingeschakeld en binnen bereik is."),
    },
    passKeyComparisonTitle: "Verzoek koppelen via Bluetooth",
    passKeyTextMessageFormat: new MessageFormat('"{string}" wil graag verbinding maken met je Kindle. Bevestig dat het nummer hieronder wordt weergegeven op "{string}"'),
    confirm: "BEVESTIGEN",
    scanningForBTDevices: "Scannen naar Bluetooth-apparaten",
    connectingToBtDevice: "Apparaat verbinden",
    pairingToBtDevice: "Apparaat koppelen"
};

// string map for large mode
var BTWizardDialogStringTableLarge = {
    rescan: "Opnieuw scannen",
    pairNewDevice: "Bluetooth-wizard",
    disconnect: "Ontkoppelen",
    other: "Anders",
    tryAgain: "Opnieuw proberen",
    cancel: "Annuleren",
    connect: "Verbinden",
    btWizardforgetDevice: "Vergeten",
    btPairedDeviceforgetDevice: "Apparaat vergeten",
    confirm: "Bevestigen"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTWizardDialogStringTable = constructTableOnDisplayModeChange(BTWizardDialogStringTable, BTWizardDialogStringTableLarge);

var BTAccessibilityStringTable = {
    close: "Sluiten"
};

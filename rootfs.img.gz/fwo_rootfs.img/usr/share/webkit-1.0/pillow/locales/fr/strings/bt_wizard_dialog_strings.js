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
    btWizardTitle: new MessageFormat("Appareils Bluetooth ({numDevices,number,integer})"),
    subtitle: new MessageFormat("Appareils ({numDevices,number,integer})"),
    btWizardHeaderText: "Veuillez jumeler un appareil audio Bluetooth pour \u00e9couter du contenu Audible ou utiliser le lecteur d\u02bc\u00e9cran VoiceView.",
    rescan: "R\u00c9ANALYSER",
    rescanDescription: "Recherche de nouveaux appareils",
    pairNewDevice: "ASSISTANT BLUETOOTH",
    pairNewDeviceDescription: "D\u00e9connecter et jumeler un nouvel appareil audio",
    disconnect: "SE D\u00c9CONNECTER",
    other: "AUTRES",
    connect: "SE CONNECTER",
    cancel: "ANNULER",
    btWizardforgetDevice: "OUBLIER",
    btPairedDeviceforgetDevice: "OUBLIER L\u02bcAPPAREIL",
    tryAgain: "R\u00c9ESSAYER",
    btWizardForgetDeviceTitle: new MessageFormat("{device}"),
    btPairedDeviceForgetDeviceTitle: "Oublier l\u02bcappareil",
    btWizardErrorDeviceTitle: {
        Bond : "\u00c9chec du jumelage Bluetooth",
        Connect : "\u00c9chec de la connexion Bluetooth"
    },
    noDeviceDiscovered: "Aucun appareil trouv\u00e9",
    passcodeTitle: "Code secret de l\u02bcappareil requis",
    connectOrForgetDevice: new MessageFormat("{string}"),
    switchTextMessageFormat: new MessageFormat("Voulez-vous vous connecter ou oublier l\u02bcappareil {string}\u00a0?"),
    btPairedWizardForgetTextMessageFormat: new MessageFormat("Vous \u00eates actuellement connect\u00e9 \u00e0 {string}."),
    btWizardForgetTextMessageFormat: new MessageFormat("Voulez-vous vous d\u00e9connecter ou oublier l\u02bcappareil {string}\u00a0?"),
    forgetConfirm: "\u00cates-vous s\u00fbr(e) de vouloir oublier cet appareil\u00a0?<br><br>Le lecteur d\u02bc\u00e9cran VoiceView sera d\u00e9sactiv\u00e9. <br><br>Pour activer \u00e0 nouveau VoiceView, appuyez sur le bouton marche/arr\u00eat pendant 9\u00a0secondes, puis maintenez deux doigts sur l\u02bc\u00e9cran de votre Kindle.",
    btWizardErrorTextMessageFormat: {
       Bond :  new MessageFormat("Jumelage avec l\u02bcappareil audio Bluetooth impossible  {string}.<br/><br/>Assurez-vous que l\u02bcappareil est activ\u00e9 et en mode jumelage."),
       Connect :  new MessageFormat("Connexion avec l\u02bcappareil audio Bluetooth {string} impossible.<br/><br/>Assurez-vous que votre appareil est sous tension et \u00e0 port\u00e9e du Kindle."),
    },
    passKeyComparisonTitle: "Demande de jumelage Bluetooth",
    passKeyTextMessageFormat: new MessageFormat('{string} veut \u00eatre jumel\u00e9 avec votre Kindle. Veuillez confirmer que le num\u00e9ro ci-dessus appara\u00eet sur {string}'),
    confirm: "CONFIRMER",
    scanningForBTDevices: "Recherche d\u02bcappareils Bluetooth",
    connectingToBtDevice: "Connexion \u00e0 l\u02bcappareil",
    pairingToBtDevice: "Jumelage de l\u02bcappareil"
};

// string map for large mode
var BTWizardDialogStringTableLarge = {
    rescan: "Rechercher \u00e0 nouveau",
    pairNewDevice: "Assistant Bluetooth",
    disconnect: "D\u00e9connecter",
    other: "Autre",
    tryAgain: "R\u00e9essayer",
    cancel: "Annuler",
    connect: "Se connecter",
    btWizardforgetDevice: "Oublier",
    btPairedDeviceforgetDevice: "Oublier l\u02bcappareil",
    confirm: "Confirmer"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTWizardDialogStringTable = constructTableOnDisplayModeChange(BTWizardDialogStringTable, BTWizardDialogStringTableLarge);

var BTAccessibilityStringTable = {
    close: "Fermer"
};

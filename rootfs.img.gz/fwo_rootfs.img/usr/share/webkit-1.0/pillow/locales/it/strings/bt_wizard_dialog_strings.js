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
    btWizardTitle: new MessageFormat("({numDevices,number,integer}) dispositivi Bluetooth"),
    subtitle: new MessageFormat("Dispositivi ({numDevices,number,integer})"),
    btWizardHeaderText: "Associa Kindle ad un dispositivo audio Bluetooth per ascoltare contenuti Audible o utilizzare il Lettore schermo VoiceView.",
    rescan: "RIAVVIA RICERCA RETI",
    rescanDescription: "Cerca nuovi dispositivi",
    pairNewDevice: "PROCEDURA GUIDATA BLUETOOTH",
    pairNewDeviceDescription: "Disconnetti e associa un nuovo dispositivo audio",
    disconnect: "DISCONNETTI",
    other: "ALTRO",
    connect: "CONNETTI",
    cancel: "ANNULLA",
    btWizardforgetDevice: "DIMENTICA",
    btPairedDeviceforgetDevice: "DIMENTICA DISPOSITIVO",
    tryAgain: "RIPROVA",
    btWizardForgetDeviceTitle: new MessageFormat("{device}"),
    btPairedDeviceForgetDeviceTitle: "Dimentica dispositivo",
    btWizardErrorDeviceTitle: {
        Bond : "Associazione Bluetooth non riuscita",
        Connect : "Connessione Bluetooth non riuscita"
    },
    noDeviceDiscovered: "Nessun dispositivo trovato",
    passcodeTitle: "Codice di blocco dispositivo richiesto",
    connectOrForgetDevice: new MessageFormat("{string}"),
    switchTextMessageFormat: new MessageFormat("Vuoi connetterti a o dimenticare il dispositivo \"{string}\"?"),
    btPairedWizardForgetTextMessageFormat: new MessageFormat("Al momento sei connesso a {string}."),
    btWizardForgetTextMessageFormat: new MessageFormat("Vuoi disconnetterti da o dimenticare il dispositivo \"{string}\"?"),
    forgetConfirm: "Dimenticare questo dispositivo?<br><br>Il lettore schermo VoiceView verr\u00e0 disabilitato. <br><br>Per abilitare nuovamente VoiceView, premi e tieni premuto il pulsante di accensione per 9 secondi, quindi mantieni due dita sullo schermo di Kindle.",
    btWizardErrorTextMessageFormat: {
       Bond :  new MessageFormat("Impossibile associare al dispositivo audio Bluetooth \"{string}\".<br/><br/>Assicurati che il dispositivo sia acceso e in modalit\u00e0 di associazione."),
       Connect :  new MessageFormat("Impossibile connettersi al dispositivo audio Bluetooth \"{string}\".<br/><br/>Assicurati che il dispositivo sia acceso ed entro la portata del segnale."),
    },
    passKeyComparisonTitle: "Richiesta di associazione Bluetooth",
    passKeyTextMessageFormat: new MessageFormat('"{string}" vorrebbe associarsi al tuo Kindle. Conferma che il numero indicato qui sotto viene visualizzato su "{string}"'),
    confirm: "CONFERMA",
    scanningForBTDevices: "Ricerca di dispositivi Bluetooth in corso",
    connectingToBtDevice: "Connessione dispositivo in corso",
    pairingToBtDevice: "Associazione dispositivo in corso"
};

// string map for large mode
var BTWizardDialogStringTableLarge = {
    rescan: "Riavvia ricerca",
    pairNewDevice: "Wizard Bluetooth",
    disconnect: "Disconnetti",
    other: "Altro",
    tryAgain: "Riprova",
    cancel: "Annulla",
    connect: "Connetti",
    btWizardforgetDevice: "Dimentica",
    btPairedDeviceforgetDevice: "Dimentica dispositivo",
    confirm: "Conferma"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTWizardDialogStringTable = constructTableOnDisplayModeChange(BTWizardDialogStringTable, BTWizardDialogStringTableLarge);

var BTAccessibilityStringTable = {
    close: "Chiudi"
};

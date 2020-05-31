
// string map for default mode
var BTPairedDeviceStringTable = {
    switchDialogButtonLayout: BUTTON_LAYOUT_NORMAL,
    title                   : "Bluetooth",
    subtitle                : new MessageFormat("Dispositivi ({numDevices,number,integer})"),
    headerText		    : "Assicurati che il dispositivo Bluetooth sia accesso. Tocca il nome del dispositivo per dimenticare o scollegare il dispositivo.",
    pairNewDevice           : "PROCEDURA GUIDATA BLUETOOTH",
    pairNewDeviceDescription: "Disconnetti e associa un nuovo dispositivo audio",
    disconnect              : "DISCONNETTI",
    okay                    : "OK",
    cancel                  : "ANNULLA",
    connect	            : "CONNETTI",
    forget                  : "DIMENTICA",
    forgetDevice            : "DIMENTICA DISPOSITIVO",
    forgetDeviceTitle       : "Dimentica dispositivo",
    connectOrForgetDevice   : "Connetti o dimentica il dispositivo",
    noPairedDevice	    : "Nessun dispositivo associabile trovato",
    switchTextMessageFormat : new MessageFormat("Vuoi connetterti a o dimenticare {string}?"),
    forgetTextMessageFormat : new MessageFormat("Al momento sei connesso a {string}."),
    forgetConfirm           : "Dimenticare questo dispositivo?<br><br>Il lettore schermo VoiceView verr\u00e0 disabilitato. <br><br>Per abilitare nuovamente VoiceView, premi e tieni premuto il pulsante di accensione per 9 secondi, quindi mantieni due dita sullo schermo di Kindle."
    
};

// string map for large mode
var BTPairedDeviceStringTableLarge = {
    pairNewDevice           : "Wizard Bluetooth",
    disconnect              : "Disconnetti",
    cancel                  : "Annulla",
    connect                 : "Connetti",
    forget                  : "Dimentica",
    forgetDevice            : "Dimentica dispositivo"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTPairedDeviceStringTable = constructTableOnDisplayModeChange(BTPairedDeviceStringTable,BTPairedDeviceStringTableLarge);

var BTAccessibilityStringTable = {
    close 		    : "Chiudi"
};

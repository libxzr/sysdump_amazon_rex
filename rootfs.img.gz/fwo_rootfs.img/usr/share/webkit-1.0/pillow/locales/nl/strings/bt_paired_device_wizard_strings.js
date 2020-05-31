
// string map for default mode
var BTPairedDeviceStringTable = {
    switchDialogButtonLayout: BUTTON_LAYOUT_NORMAL,
    title                   : "Bluetooth",
    subtitle                : new MessageFormat("Apparaten ({numDevices,number,integer})"),
    headerText		    : "Controleer of je Bluetooth-apparaat is ingeschakeld. Tik op de naam van het apparaat om deze te vergeten of om verbinding te maken met het apparaat.",
    pairNewDevice           : "BLUETOOTHWIZARD",
    pairNewDeviceDescription: "Verbinding maken en verbreken met een nieuw audioapparaat",
    disconnect              : "ONTKOPPELEN",
    okay                    : "OK",
    cancel                  : "ANNULEREN",
    connect	            : "VERBINDEN",
    forget                  : "VERGETEN",
    forgetDevice            : "APPARAAT VERGETEN",
    forgetDeviceTitle       : "Apparaat vergeten",
    connectOrForgetDevice   : "Verbinden of apparaat vergeten",
    noPairedDevice	    : "Geen gekoppelde apparaten gevonden",
    switchTextMessageFormat : new MessageFormat("Wil je {string} Verbinden of Vergeten?"),
    forgetTextMessageFormat : new MessageFormat("U bent verbonden met {string}."),
    forgetConfirm           : "Weet je zeker dat je dit apparaat wilt vergeten?<br><br>De VoiceView-schermlezer wordt dan uitgeschakeld. <br><br>Houd de aan/uit-knop 9 seconden ingedrukt en houd vervolgens twee vingers op het Kindle-scherm om VoiceView weer in te schakelen."
    
};

// string map for large mode
var BTPairedDeviceStringTableLarge = {
    pairNewDevice           : "Bluetooth-wizard",
    disconnect              : "Ontkoppelen",
    cancel                  : "Annuleren",
    connect                 : "Verbinden",
    forget                  : "Vergeten",
    forgetDevice            : "Apparaat vergeten"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTPairedDeviceStringTable = constructTableOnDisplayModeChange(BTPairedDeviceStringTable,BTPairedDeviceStringTableLarge);

var BTAccessibilityStringTable = {
    close 		    : "Sluiten"
};

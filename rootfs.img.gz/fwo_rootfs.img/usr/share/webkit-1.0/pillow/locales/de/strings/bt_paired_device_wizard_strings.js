
// string map for default mode
var BTPairedDeviceStringTable = {
    switchDialogButtonLayout: BUTTON_LAYOUT_NORMAL,
    title                   : "Bluetooth",
    subtitle                : new MessageFormat("Ger\u00e4te ({numDevices,number,integer})"),
    headerText		    : "Pr\u00fcfen Sie, ob Ihr Bluetooth-Ger\u00e4t eingeschaltet ist. Tippen Sie auf den Ger\u00e4tenamen, um das Ger\u00e4t zu verwerfen oder zu verbinden.",
    pairNewDevice           : "BLUETOOTH-ASSISTENT",
    pairNewDeviceDescription: "Neues Audioger\u00e4t trennen und koppeln",
    disconnect              : "TRENNEN",
    okay                    : "OK",
    cancel                  : "ABBRECHEN",
    connect	            : "VERBINDEN",
    forget                  : "VERWERFEN",
    forgetDevice            : "GER\u00c4T VERWERFEN",
    forgetDeviceTitle       : "Ger\u00e4t verwerfen",
    connectOrForgetDevice   : "Ger\u00e4t verbinden oder verwerfen",
    noPairedDevice	    : "Keine gekoppelten Ger\u00e4te gefunden",
    switchTextMessageFormat : new MessageFormat("M\u00f6chten Sie {string} verbinden oder verwerfen?"),
    forgetTextMessageFormat : new MessageFormat("Sie sind momentan mit {string} verbunden."),
    forgetConfirm           : "M\u00f6chten Sie dieses Ger\u00e4t wirklich verwerfen?<br><br>Dadurch wird der VoiceView-Screenreader deaktiviert. <br><br>Halten Sie die Ein-/Aus-Taste 9 Sekunden lang gedr\u00fcckt und ber\u00fchren Sie den Bildschirm dann mit zwei Fingern, um VoiceView erneut einzuschalten."
    
};

// string map for large mode
var BTPairedDeviceStringTableLarge = {
    pairNewDevice           : "Bluetooth-Assistent",
    disconnect              : "Trennen",
    cancel                  : "Abbrechen",
    connect                 : "Verbinden",
    forget                  : "Verwerfen",
    forgetDevice            : "Ger\u00e4t verwerfen"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTPairedDeviceStringTable = constructTableOnDisplayModeChange(BTPairedDeviceStringTable,BTPairedDeviceStringTableLarge);

var BTAccessibilityStringTable = {
    close 		    : "Schlie\u00dfen"
};

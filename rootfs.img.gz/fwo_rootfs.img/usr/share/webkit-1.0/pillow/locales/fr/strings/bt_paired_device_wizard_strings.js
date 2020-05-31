
// string map for default mode
var BTPairedDeviceStringTable = {
    switchDialogButtonLayout: BUTTON_LAYOUT_NORMAL,
    title                   : "Bluetooth",
    subtitle                : new MessageFormat("Appareils ({numDevices,number,integer})"),
    headerText		    : "Veuillez v\u00e9rifier que votre appareil Bluetooth est allum\u00e9. Touchez le nom de l\u02bcappareil pour oublier ou pour vous connecter \u00e0 celui-ci",
    pairNewDevice           : "ASSISTANT BLUETOOTH",
    pairNewDeviceDescription: "D\u00e9connecter et jumeler un nouvel appareil audio",
    disconnect              : "SE D\u00c9CONNECTER",
    okay                    : "OK",
    cancel                  : "ANNULER",
    connect	            : "SE CONNECTER",
    forget                  : "OUBLIER",
    forgetDevice            : "OUBLIER L\u02bcAPPAREIL",
    forgetDeviceTitle       : "Oublier l\u02bcappareil",
    connectOrForgetDevice   : "Se connecter \u00e0 ou oublier l\u02bcappareil",
    noPairedDevice	    : "Aucun appareil jumel\u00e9 trouv\u00e9",
    switchTextMessageFormat : new MessageFormat("Voulez-vous vous connecter \u00e0 ou oublier {string} ?"),
    forgetTextMessageFormat : new MessageFormat("Vous \u00eates actuellement connect\u00e9 \u00e0 {string}."),
    forgetConfirm           : "\u00cates-vous s\u00fbr(e) de vouloir oublier cet appareil\u00a0?<br><br>Le lecteur d\u02bc\u00e9cran VoiceView sera d\u00e9sactiv\u00e9. <br><br>Pour activer \u00e0 nouveau VoiceView, appuyez sur le bouton marche/arr\u00eat pendant 9\u00a0secondes, puis maintenez deux doigts sur l\u02bc\u00e9cran de votre Kindle."
    
};

// string map for large mode
var BTPairedDeviceStringTableLarge = {
    pairNewDevice           : "Assistant Bluetooth",
    disconnect              : "D\u00e9connecter",
    cancel                  : "Annuler",
    connect                 : "Se connecter",
    forget                  : "Oublier",
    forgetDevice            : "Oublier l\u02bcappareil"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTPairedDeviceStringTable = constructTableOnDisplayModeChange(BTPairedDeviceStringTable,BTPairedDeviceStringTableLarge);

var BTAccessibilityStringTable = {
    close 		    : "Fermer"
};


// string map for default mode
var BTPairedDeviceStringTable = {
    switchDialogButtonLayout: BUTTON_LAYOUT_NORMAL,
    title                   : "Bluetooth",
    subtitle                : new MessageFormat("Dispositivos ({numDevices,number,integer})"),
    headerText		    : "Aseg\u00farate de que el dispositivo est\u00e1 activado. Pulsa el nombre del dispositivo para olvidar o conectar al dispositivo",
    pairNewDevice           : "ASISTENTE PARA BLUETOOTH",
    pairNewDeviceDescription: "Desconectar y emparejar nuevo dispositivo de audio",
    disconnect              : "DESCONECTAR",
    okay                    : "OK",
    cancel                  : "CANCELAR",
    connect	            : "CONECTARSE",
    forget                  : "OLVIDAR",
    forgetDevice            : "OLVIDAR DISPOSITIVO",
    forgetDeviceTitle       : "Olvidar dispositivo",
    connectOrForgetDevice   : "Conectar u olvidar dispositivo",
    noPairedDevice	    : "No se han encontrado dispositivos emparejados",
    switchTextMessageFormat : new MessageFormat("\u00bfQuieres conectarte u olvidar {string}?"),
    forgetTextMessageFormat : new MessageFormat("Conexi\u00f3n establecida con {string}."),
    forgetConfirm           : "\u00bfEst\u00e1s seguro/a de que quieres olvidar este dispositivo?<br><br>Al hacerlo, desactivar\u00e1s el lector de pantalla VoiceView. <br><br>Para volver a activar VoiceView, mant\u00e9n pulsado el bot\u00f3n de encendido durante 9 segundos y a continuaci\u00f3n pon dos dedos sobre la pantalla del Kindle."
    
};

// string map for large mode
var BTPairedDeviceStringTableLarge = {
    pairNewDevice           : "Asistente para Bluetooth",
    disconnect              : "Desconectar",
    cancel                  : "Cancelar",
    connect                 : "Conectar",
    forget                  : "Olvidar",
    forgetDevice            : "Olvidar dispositivo"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTPairedDeviceStringTable = constructTableOnDisplayModeChange(BTPairedDeviceStringTable,BTPairedDeviceStringTableLarge);

var BTAccessibilityStringTable = {
    close 		    : "Cerrar"
};

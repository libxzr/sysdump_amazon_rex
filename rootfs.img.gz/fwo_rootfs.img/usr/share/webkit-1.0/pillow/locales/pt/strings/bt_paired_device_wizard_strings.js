
// string map for default mode
var BTPairedDeviceStringTable = {
    switchDialogButtonLayout: BUTTON_LAYOUT_NORMAL,
    title                   : "Bluetooth",
    subtitle                : new MessageFormat("Dispositivos ({numDevices,number,integer})"),
    headerText		    : "Certifique-se de que seu dispositivo com Bluetooth esteja ligado. Toque no nome do dispositivo para conect\u00e1-lo ou esquec\u00ea-lo.",
    pairNewDevice           : "ASSISTENTE BLUETOOTH",
    pairNewDeviceDescription: "Desconecte-se e emparelhe um novo dispositivo de \u00e1udio",
    disconnect              : "DESCONECTAR",
    okay                    : "OK",
    cancel                  : "CANCELAR",
    connect	            : "CONECTAR",
    forget                  : "ESQUECER",
    forgetDevice            : "ESQUECER O DISPOSITIVO",
    forgetDeviceTitle       : "Esquecer dispositivo",
    connectOrForgetDevice   : "Conectar-se ou esquecer o dispositivo",
    noPairedDevice	    : "Nenhum dispositivo emparelhado encontrado",
    switchTextMessageFormat : new MessageFormat("Gostaria de conectar-se ou esquecer {string}?"),
    forgetTextMessageFormat : new MessageFormat("No momento, h\u00e1 conex\u00e3o com {string}."),
    forgetConfirm           : "Deseja esquecer este dispositivo?<br><br>Isso desativar\u00e1 o leitor de tela VoiceView. <br><br>Para ativar o VoiceView novamente, mantenha o bot\u00e3o de ligar pressionado por 9 segundos, e em seguida, mantenha 2 dedos pressionados na tela do Kindle."
    
};

// string map for large mode
var BTPairedDeviceStringTableLarge = {
    pairNewDevice           : "Assistente de Bluetooth",
    disconnect              : "Desconectar",
    cancel                  : "Cancelar",
    connect                 : "Conectar-se",
    forget                  : "Esquecer",
    forgetDevice            : "Esquecer dispositivo"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTPairedDeviceStringTable = constructTableOnDisplayModeChange(BTPairedDeviceStringTable,BTPairedDeviceStringTableLarge);

var BTAccessibilityStringTable = {
    close 		    : "Fechar"
};

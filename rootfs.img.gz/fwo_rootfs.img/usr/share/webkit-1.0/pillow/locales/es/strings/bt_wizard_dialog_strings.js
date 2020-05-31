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
    btWizardTitle: new MessageFormat("Dispositivos Bluetooth ({numDevices,number,integer})"),
    subtitle: new MessageFormat("Dispositivos ({numDevices,number,integer})"),
    btWizardHeaderText: "Para escuchar contenido Audible o usar el lector de pantalla VoiceView, empareja el e-reader con un dispositivo de audio Bluetooth.",
    rescan: "VOLVER A DETECTAR",
    rescanDescription: "Detectar nuevos dispositivos",
    pairNewDevice: "ASISTENTE PARA BLUETOOTH",
    pairNewDeviceDescription: "Desconectar y emparejar nuevo dispositivo de audio",
    disconnect: "DESCONECTAR",
    other: "OTRO",
    connect: "CONECTARSE",
    cancel: "CANCELAR",
    btWizardforgetDevice: "OLVIDAR",
    btPairedDeviceforgetDevice: "OLVIDAR DISPOSITIVO",
    tryAgain: "VOLVER A INTENTAR",
    btWizardForgetDeviceTitle: new MessageFormat("{device}"),
    btPairedDeviceForgetDeviceTitle: "Olvidar dispositivo",
    btWizardErrorDeviceTitle: {
        Bond : "Error de emparejado de Bluetooth",
        Connect : "Error en la conexi\u00f3n Bluetooth"
    },
    noDeviceDiscovered: "No se han encontrado ning\u00fan dispositivo",
    passcodeTitle: "Contrase\u00f1a del dispositivo necesaria",
    connectOrForgetDevice: new MessageFormat("{string}"),
    switchTextMessageFormat: new MessageFormat("\u00bfQuieres conectarte al dispositivo {string} o quieres olvidarlo?"),
    btPairedWizardForgetTextMessageFormat: new MessageFormat("Conexi\u00f3n establecida con {string}."),
    btWizardForgetTextMessageFormat: new MessageFormat("\u00bfQuieres desconectarte del dispositivo {string} o quieres olvidarlo?"),
    forgetConfirm: "\u00bfEst\u00e1s seguro/a de que quieres olvidar este dispositivo?<br><br>Al hacerlo, desactivar\u00e1s el lector de pantalla VoiceView. <br><br>Para volver a activar VoiceView, mant\u00e9n pulsado el bot\u00f3n de encendido durante 9 segundos y a continuaci\u00f3n pon dos dedos sobre la pantalla del Kindle.",
    btWizardErrorTextMessageFormat: {
       Bond :  new MessageFormat("No es posible emparejar el dispositivo de audio Bluetooth {string}.<br/><br/>Aseg\u00farate de que el dispositivo est\u00e1 en modo de emparejamiento."),
       Connect :  new MessageFormat("No es posible conectarse al dispositivo de audio Bluetooth {string}.<br/><br/>Aseg\u00farate de que el dispositivo est\u00e1 encendido y dentro del rango de cobertura."),
    },
    passKeyComparisonTitle: "Solicitud de emparejado de Bluetooth",
    passKeyTextMessageFormat: new MessageFormat('{string} quiere emparejarse con el Kindle. Confirma que el siguiente n\u00famero aparece en {string}'),
    confirm: "CONFIRMAR",
    scanningForBTDevices: "Detectando dispositivos Bluetooth",
    connectingToBtDevice: "Conectando el dispositivo",
    pairingToBtDevice: "Emparejando el dispositivo"
};

// string map for large mode
var BTWizardDialogStringTableLarge = {
    rescan: "Volver a detectar",
    pairNewDevice: "Asistente para Bluetooth",
    disconnect: "Desconectar",
    other: "Otros",
    tryAgain: "Volver a intentarlo",
    cancel: "Cancelar",
    connect: "Conectar",
    btWizardforgetDevice: "Olvidar",
    btPairedDeviceforgetDevice: "Olvidar dispositivo",
    confirm: "Confirmar"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTWizardDialogStringTable = constructTableOnDisplayModeChange(BTWizardDialogStringTable, BTWizardDialogStringTableLarge);

var BTAccessibilityStringTable = {
    close: "Cerrar"
};

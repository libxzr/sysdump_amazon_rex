/*
 * bt_wizard_dialog_strings.js
 *
 * Copyright (c) 2017-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
    btWizardHeaderText: "Emparelhe um dispositivo de \u00e1udio com Bluetooth para escutar conte\u00fado do Audible ou usar o leitor de tela VoiceView.",
    btWizardHeaderTextForTTS: "Emparelhe um dispositivo de \u00e1udio com Bluetooth para usar a leitura do Conversor de texto para fala ou o leitor de tela VoiceView.",
    rescan: "PESQUISAR NOVAMENTE",
    rescanDescription: "Pesquisar novos dispositivos",
    pairNewDevice: "ASSISTENTE BLUETOOTH",
    pairNewDeviceDescription: "Desconecte-se e emparelhe um novo dispositivo de \u00e1udio",
    disconnect: "DESCONECTAR",
    other: "OUTROS",
    connect: "CONECTAR",
    cancel: "CANCELAR",
    btWizardforgetDevice: "ESQUECER",
    btPairedDeviceforgetDevice: "ESQUECER O DISPOSITIVO",
    tryAgain: "TENTAR NOVAMENTE",
    btWizardForgetDeviceTitle: new MessageFormat("{device}"),
    btPairedDeviceForgetDeviceTitle: "Esquecer dispositivo",
    btWizardErrorDeviceTitle: {
        Bond : "Falha no emparelhamento de Bluetooth",
        Connect : "Falha na conex\u00e3o ao Bluetooth"
    },
    noDeviceDiscovered: "Nenhum dispositivo encontrado",
    passcodeTitle: "Senha do dispositivo necess\u00e1ria",
    connectOrForgetDevice: new MessageFormat("{string}"),
    switchTextMessageFormat: new MessageFormat("Voc\u00ea gostaria de conectar ou esquecer o dispositivo \"{string}\"?"),
    btPairedWizardForgetTextMessageFormat: new MessageFormat("No momento, h\u00e1 conex\u00e3o com {string}."),
    btWizardForgetTextMessageFormat: new MessageFormat("Gostaria de desconectar o dispositivo {string} ou esquec\u00ea-lo?"),
    forgetConfirm: "Deseja esquecer este dispositivo?<br><br>Isso desativar\u00e1 o leitor de tela VoiceView. <br><br>Para ativar o VoiceView novamente, mantenha o bot\u00e3o de ligar pressionado por 9 segundos, e em seguida, mantenha 2 dedos pressionados na tela do Kindle.",
    btWizardErrorTextMessageFormat: {
       Bond :  new MessageFormat("N\u00e3o foi poss\u00edvel emparelhar com o dispositivo de \u00e1udio com Bluetooth  \"{string}\".<br/><br/>Certifique-se de que o dispositivo est\u00e1 ligado e no modo de emparelhamento."),
       Connect :  new MessageFormat("N\u00e3o foi poss\u00edvel conectar ao dispositivo de \u00e1udio com Bluetooth  \"{string}\".<br/><br/>Certifique-se de que o dispositivo est\u00e1 ligado e dentro do alcance."),
    },
    passKeyComparisonTitle: "Solicita\u00e7\u00e3o de emparelhamento de Bluetooth",
    passKeyTextMessageFormat: new MessageFormat('"{string}" gostaria de emparelhar com o Kindle. Confirme se o n\u00famero abaixo est\u00e1 aparecendo em "{string}"'),
    confirm: "CONFIRMAR",
    scanningForBTDevices: "Pesquisando dispositivos com Bluetooth",
    connectingToBtDevice: "Dispositivo de conex\u00e3o",
    pairingToBtDevice: "Emparelhando o dispositivo"
};

// string map for large mode
var BTWizardDialogStringTableLarge = {
    rescan: "Pesquisar novamente",
    pairNewDevice: "Assistente de Bluetooth",
    disconnect: "Desconectar",
    other: "Outro",
    tryAgain: "Tentar novamente",
    cancel: "Cancelar",
    connect: "Conectar-se",
    btWizardforgetDevice: "Esquecer",
    btPairedDeviceforgetDevice: "Esquecer dispositivo",
    confirm: "Confirmar"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTWizardDialogStringTable = constructTableOnDisplayModeChange(BTWizardDialogStringTable, BTWizardDialogStringTableLarge);

var BTAccessibilityStringTable = {
    close: "Fechar"
};

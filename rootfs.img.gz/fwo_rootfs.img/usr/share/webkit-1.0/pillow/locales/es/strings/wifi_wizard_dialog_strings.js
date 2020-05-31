
/**
 * The available three-button dialog layouts are:
 *
 * BUTTON_LAYOUT_NORMAL:
 *   Lay the buttons out horizontally, with each having equal width.
 *
 * BUTTON_LAYOUT_STACKED:
 *   Put the middle button up above the other two.
 *
 * BUTTON_LAYOUT_AUTO:
 *   Like BUTTON_LAYOUT_STACKED when the device is in portrait.
 *   In landscape, the buttons are laid out horizontally, but the middle button
 *   uses half of the available width.
 */

// string map for default mode
var WifiWizardDialogStringTable = {
    passwordDialogButtonLayout        : BUTTON_LAYOUT_NORMAL,
    cancelSetUpTryAgainButtonLayout   : BUTTON_LAYOUT_NORMAL,
    cancelEnterAgainSetUpButtonLayout : BUTTON_LAYOUT_LISTED,
    title                   : "Redes wifi ({numNetworks})",
    advancedOptionsTitle    : "Opciones avanzadas",
    manualEntryButton       : "Introduce otra red wifi",
    networkNameLabel        : "Nombre de la red",
    identityLabel           : "Nombre de usuario",
    passwordLabel           : "Contrase\u00f1a",
    connectionTypeLabel     : "Tipo de conexi\u00f3n",
    ipAddressLabel          : "Direcci\u00f3n IP",
    subnetMaskLabel         : "M\u00e1scara de subred",
    routerLabel             : "Router",
    dnsLabel                : "DNS",
    securityTypeLabel       : "Tipo de seguridad",
    wpaTypeLabel            : "Versi\u00f3n",
    eapMethodLabel          : "M\u00e9todo EAP",
    phase2AuthLabel         : "Autenticaci\u00f3n de fase 2",
    caCertLabel             : "Certificado CA",
    connectionTypeDhcp      : "DHCP",
    conenctionTypeStatic    : "Est\u00e1tica",
    wpaTypePersonal         : "Personal",
    wpaTypeEnterprise       : "Corporativa",
    eapMethodPeap           : "PEAP",
    eapMethodTtls           : "TTLS",
    phase2AuthPap           : "PAP",
    phase2AuthMschapv2      : "MSCHAPv2",
    securityTypeOpen        : "Ninguno",
    securityTypeWep         : "WEP",
    securityTypeWpawpa2     : "WPA/WPA2",
    securityTypeWpa2        : "WPA2",
    done                    : "LISTO",
    availNetworksLabel      : "Redes wifi disponibles",
    disconnect              : "DESCONECTAR",
    enterAgain              : "VOLVER A ENTRAR",
    setUp                   : "CONFIGURAR",
    okay                    : "OK",
    cancel                  : "CANCELAR",
    connect                 : "CONECTARSE",
    wpsConnect              : "WPS",
    advanced                : "AVANZADO",
    join                    : "OTRA...",
    rescan                  : "VOLVER A BUSCAR",
    tryAgain                : "VOLVER A INTENTAR",
    passwordHide            : "Ocultar contrase\u00f1a",
    storeCredentials        : "Guardar contrase\u00f1a en Amazon.",
    learnMoreLabel          : "M\u00e1s informaci\u00f3n",
    manualEntryTitle        : "Introducir red wifi",
    passwordEntryTitle      : "Contrase\u00f1a wifi necesaria",
    loginTitle              : "Inicio de sesi\u00f3n wifi",
    passwordErrorTitle      : "Contrase\u00f1a incorrecta",
    defaultErrorTitle       : "Error de wifi",
    defaultError            : 'El Kindle no puede conectarse a la red wifi "{essid}". --"{error}"--. Ve a Configuraci\u00f3n para introducir de nuevo la contrase\u00f1a o configura manualmente la red. Si tienes problemas para conectarte a la red wifi, puedes encontrar ayuda en www.amazon.com/devicesupport.',
    passwordFailedError     : 'El Kindle no puede conectarse a la red wifi "{essid}". La contrase\u00f1a introducida es incorrecta. Introduce de nuevo la contrase\u00f1a o configura manualmente la red. Si tienes problemas para conectarte a la red wifi, puedes encontrar ayuda en www.amazon.com/devicesupport.',
    noProfileTitle     : 'Wifi no configurado',
    noProfileError          : 'El Kindle no puede conectarse a la red wifi. Esta red no est\u00e1 configurada. Si tienes problemas para conectarte a la red wifi, puedes encontrar ayuda en www.amazon.com/devicesupport.',
    failedToConnectError    : 'El Kindle no puede conectarse a la red wifi "{essid}". Pulsa Configurar para introducir tu contrase\u00f1a de nuevo o configurar manualmente la red. Si tienes problemas para conectarte a la red wifi, puedes encontrar ayuda en www.amazon.com/devicesupport.',
    failedToConnectEnterpriseError : 'El Kindle no puede conectarse a la red wifi "{essid}". Verifica tus credenciales o ponte en contacto con el administrador del sistema.',
    wifiNotReady            : 'El Kindle no puede conectarse a la red wifi "{essid}". Pulsa el bot\u00f3n Inicio y, a continuaci\u00f3n, con\u00e9ctate a la red wifi de nuevo. Si tienes problemas para hacerlo, puedes encontrar ayuda en www.amazon.com/devicesupport.',
    localNetworkFailedError : 'El Kindle no puede conectarse a la red local "{essid}". Comprueba la red local. Si tienes problemas para conectarte a la red wifi puedes encontrar ayuda en www.amazon.com/devicesupport.',
    internetConnectFailedTitle : 'Fallo en la conexi\u00f3n',
    internetConnectFailedError : 'Ha surgido un error al intentar establecer la conexi\u00f3n a internet. Ponte en contacto con tu proveedor de servicios para obtener ayuda.',
    profNetNameTooLongFailedTitle : 'Nombre de red demasiado largo',
    profNetNameTooLongFailedError : 'El Kindle no puede conectarse a la red wifi "{essid}". El nombre de la red es demasiado largo. \u00bfQuieres configurar esta red manualmente?',
    passwordTooLongTitle    : 'Contrase\u00f1a demasiado larga',
    passwordTooLongError    : 'El Kindle no puede conectarse a la red wifi "{essid}". La contrase\u00f1a introducida es m\u00e1s larga de lo permitido por la red wifi. Intenta introducir la contrase\u00f1a de nuevo. Si tienes problemas para conectarte a la red wifi, puedes encontrar ayuda en www.amazon.com/devicesupport.',
    passwordTooShortTitle   : 'Contrase\u00f1a demasiado corta',
    passwordTooShortError   : 'El Kindle no puede conectarse a la red wifi "{essid}". Falta uno o m\u00e1s caracteres en la contrase\u00f1a. Introduce de nuevo la contrase\u00f1a. Si tienes problemas para conectarte a la red wifi, puedes encontrar ayuda en www.amazon.com/devicesupport.',
    wpaEnterpriseErrorTitle : 'Red no compatible',
    wpaEnterpriseNotSupportedError : 'El Kindle no puede conectarse a la red wifi "{essid}". Las redes wifi de empresa no son compatibles con el Kindle. Prueba a conectarte a otra red. Si tienes problemas para conectarte a la red wifi, puedes encontrar ayuda en www.amazon.com/devicesupport.',
    wpaEnterpriseAuthError  : 'El Kindle no puede conectarse a la red wifi "{essid}". Vuelve a introducir tu nombre de usuario y tu contrase\u00f1a. Si tienes problemas para conectarte a la red wifi, puedes encontrar ayuda en www.amazon.com/devicesupport.',
    securityMismatchTitle   : 'Error de seguridad',
    securityMismatchError   : 'El Kindle no puede conectarse a la red wifi "{essid}". El tipo de seguridad introducido no corresponde al tipo de seguridad de la red wifi. Configura de nuevo la red manualmente y selecciona el tipo de seguridad correcto. Si tienes problemas para conectarte a la red wifi, puedes encontrar ayuda en www.amazon.com/devicesupport.',
    adhocNotSupportedTitle  : 'Red no compatible',
    adhocNotSupportedError  : 'El Kindle no puede conectarse a la red wifi "{essid}". Las redes wifi punto a punto no son compatibles con Kindle. Prueba a conectarte a otra red. Si tienes problemas para conectarte a la red wifi, puedes encontrar ayuda en www.amazon.com/devicesupport.',
    profileFailedError      : 'No se ha podido configurar la red wifi "{essid}". La informaci\u00f3n de red introducida es insuficiente. Comprueba la configuraci\u00f3n de la red e intenta configurarla de nuevo. Si tienes problemas para conectar el Kindle a la red wifi, puedes encontrar ayuda en www.amazon.com/devicesupport.',
    profileDeleteTitle      : 'Error',
    profileDeleteError      : 'No se puede eliminar el perfil de la red wifi "{essid}".',
    scanning                : "Buscando",
    scanningForNetwork      : "Buscando redes",
    scanComplete            : "B\u00fasqueda completada",
    connecting              : "Conectando",
    connected               : "Conectado",
    connectionFailed        : "Fallo en la conexi\u00f3n",
    noWifiFound             : "No se han encontrado redes wifi",
    wpsConnectionError      : 'El Kindle no puede conectarse a la red wifi "{essid}" utilizando WPS. \u00bfQuieres configurar esta red manualmente?',
    wpsButtonNotPressedError : 'El Kindle no puede conectarse a la red wifi "{essid}" utilizando WPS. Comprueba que has pulsado el bot\u00f3n de WPS.',
    apRejectedError         : 'El Kindle no puede conectarse a la red wifi "{essid}". Comprueba que la configuraci\u00f3n de seguridad son correctos y vuelve a intentarlo.',
    apDeniedError           : 'El Kindle no puede conectarse a la red wifi "{essid}". El punto de acceso ha rechazado la solicitud de conexi\u00f3n. Comprueba la configuraci\u00f3n de filtros de la direcci\u00f3n MAC de tu router y vuelve a intentarlo.',
    forgetProfileTitle      : '\u00bfOlvidar red?',
    forgetProfileConfirmation : '\u00bfEst\u00e1s seguro/a de que quieres olvidar la red wifi "{essid}"?',
    forget                  : "OLVIDAR",
    advancedDialogDescription : "Puedes configurar la conexi\u00f3n de red wifi y las opciones de seguridad de la red indicada a continuaci\u00f3n.",
    caCertificateNotFoundTitle : "No se encuentra el certificado",
    caCertificateNotFoundError : 'No se encuentra el certificado de seguridad. Verifica que el nombre sea el correcto y vuelve a intentarlo.',
    userGuidePart1 : 'Para activar el Modo vuelo, pulsa Acciones r\u00e1pidas',
    userGuidePart2 : 'en la barra de herramientas y despu\u00e9s Modo vuelo.'
};

// string map for large mode
var WifiWizardDialogStringTableLarge = {
    disconnect              : "Desconectar",
    enterAgain              : "Volver a introducir",
    setUp                   : "Configuraci\u00f3n",
    cancel                  : "Cancelar",
    connect                 : "Conectar",
    advanced                : "Avanzados",
    join                    : "Otros...",
    rescan                  : "Volver a buscar",
    tryAgain                : "Volver a intentarlo",
    forget                  : "Olvidar"
};


//checks for large mode and constructs WifiWizardDialogStringTable based on the display mode

WifiWizardDialogStringTable = constructTableOnDisplayModeChange(WifiWizardDialogStringTable,WifiWizardDialogStringTableLarge);


var WifiWizardDialogAccessibilityStringTable = {
    closeButtonLabel     :    "Cerrar"
};

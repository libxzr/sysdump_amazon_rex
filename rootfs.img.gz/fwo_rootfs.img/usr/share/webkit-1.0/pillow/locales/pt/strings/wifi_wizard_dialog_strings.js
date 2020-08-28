
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
    advancedOptionsTitle    : "Op\u00e7\u00f5es avan\u00e7adas",
    manualEntryButton       : "Insira outra rede wifi",
    networkNameLabel        : "Nome da rede",
    identityLabel           : "Nome de usu\u00e1rio",
    passwordLabel           : "Senha",
    connectionTypeLabel     : "Tipo de conex\u00e3o",
    ipAddressLabel          : "Endere\u00e7o IP",
    subnetMaskLabel         : "M\u00e1scara de sub-rede",
    routerLabel             : "Roteador",
    dnsLabel                : "DNS",
    securityTypeLabel       : "Tipo de seguran\u00e7a",
    wpaTypeLabel            : "Vers\u00e3o",
    eapMethodLabel          : "M\u00e9todo EAP",
    phase2AuthLabel         : "Autentica\u00e7\u00e3o da fase 2",
    caCertLabel             : "Certificado CA",
    connectionTypeDhcp      : "DHCP",
    conenctionTypeStatic    : "Est\u00e1tico",
    wpaTypePersonal         : "Pessoal",
    wpaTypeEnterprise       : "Empresa",
    eapMethodPeap           : "PEAP",
    eapMethodTtls           : "TTLS",
    phase2AuthPap           : "PAP",
    phase2AuthMschapv2      : "MSCHAPv2",
    securityTypeOpen        : "Nenhum",
    securityTypeWep         : "WEP",
    securityTypeWpawpa2     : "WPA/WPA2",
    securityTypeWpa2        : "WPA2",
    done                    : "CONCLU\u00cdDO",
    availNetworksLabel      : "Redes wifi dispon\u00edveis",
    disconnect              : "DESCONECTAR",
    enterAgain              : "ACESSAR NOVAMENTE",
    setUp                   : "CONFIGURAR",
    okay                    : "OK",
    cancel                  : "CANCELAR",
    connect                 : "CONECTAR",
    wpsConnect              : "WPS",
    advanced                : "AVAN\u00c7ADO",
    join                    : "OUTROS...",
    rescan                  : "PESQUISAR NOVAMENTE",
    tryAgain                : "TENTAR NOVAMENTE",
    passwordHide            : "Ocultar senha",
    storeCredentials        : "Salvar a senha na Amazon.",
    learnMoreLabel          : "Saiba mais",
    manualEntryTitle        : "Inserir rede wifi",
    passwordEntryTitle      : "Senha wifi necess\u00e1ria",
    loginTitle              : "Acessar a rede wifi",
    passwordErrorTitle      : "Senha incorreta",
    defaultErrorTitle       : "Erro de wifi",
    defaultError            : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". --"{error}"--. Pressione Configura\u00e7\u00f5es para inserir sua senha novamente ou configure a rede manualmente. Se tiver problemas ao conectar o Kindle a uma rede wifi, procure ajuda em www.amazon.com/devicesupport.',
    passwordFailedError     : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". A senha inserida est\u00e1 incorreta. Tente inserir sua senha novamente ou configurar sua rede manualmente. Se tiver problemas ao conectar seu Kindle a uma rede wifi, voc\u00ea pode encontrar ajuda em www.amazon.com/devicesupport.',
    noProfileTitle     : 'Rede wifi n\u00e3o configurada',
    noProfileError          : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi. A rede n\u00e3o est\u00e1 configurada. Se tiver problemas ao conectar seu Kindle a uma rede wifi, voc\u00ea pode encontrar ajuda em www.amazon.com/devicesupport.',
    failedToConnectError    : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". Pressione Configura\u00e7\u00f5es para inserir sua senha novamente ou configure manualmente a sua rede. Se tiver problemas ao conectar seu Kindle a uma rede wifi, voc\u00ea pode encontrar ajuda em www.amazon.com/devicesupport.',
    failedToConnectEnterpriseError : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". Verifique suas credenciais ou entre em contato com seu administrador de sistema.',
    wifiNotReady            : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". Toque no bot\u00e3o Tela inicial e depois se conecte a uma rede wifi novamente. Se tiver problemas ao conectar seu Kindle a uma rede wifi, voc\u00ea pode encontrar ajuda em www.amazon.com/devicesupport.',
    localNetworkFailedError : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". Talvez voc\u00ea precise verificar sua rede local. Se tiver problemas ao conectar seu Kindle a uma rede wifi, voc\u00ea pode encontrar ajuda em www.amazon.com/devicesupport.',
    internetConnectFailedTitle : 'Falha de conex\u00e3o',
    internetConnectFailedError : 'Seu Kindle est\u00e1 conectado a uma rede wifi mas n\u00e3o foi capaz de acessar a Internet. Entre em contato com seu provedor de servi\u00e7os de Internet para mais assist\u00eancia.',
    profNetNameTooLongFailedTitle : 'O nome da rede \u00e9 muito longo',
    profNetNameTooLongFailedError : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". O nome da rede \u00e9 muito longo. Gostaria de configurar essa rede manualmente?',
    passwordTooLongTitle    : 'A senha \u00e9 muito longa',
    passwordTooLongError    : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". A senha que voc\u00ea inseriu \u00e9 maior do que o permitido pela rede wifi. Tente inserir sua senha novamente. Se tiver problemas ao conectar seu Kindle a uma rede wifi, voc\u00ea pode encontrar ajuda em www.amazon.com/devicesupport.',
    passwordTooShortTitle   : 'A senha \u00e9 muito curta',
    passwordTooShortError   : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". Falta um ou mais caracteres na senha que voc\u00ea inseriu. Tente inserir sua senha novamente. Se tiver problemas ao conectar seu Kindle a uma rede wifi, voc\u00ea pode encontrar ajuda em www.amazon.com/devicesupport.',
    wpaEnterpriseErrorTitle : 'Rede n\u00e3o suportada',
    wpaEnterpriseNotSupportedError : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". Redes wifi corporativas n\u00e3o s\u00e3o suportadas no Kindle. Tente se conectar a outra rede. Se tiver problemas ao conectar seu Kindle a uma rede wifi, procure ajuda em www.amazon.com/devicesupport.',
    wpaEnterpriseAuthError  : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". Tente digitar seu nome de usu\u00e1rio e senha novamente. Caso tenha problemas ao conectar seu Kindle a uma rede wifi, voc\u00ea pode encontrar ajuda em www.amazon.com/devicesupport.',
    securityMismatchTitle   : 'Erro de seguran\u00e7a',
    securityMismatchError   : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". O tipo de seguran\u00e7a que voc\u00ea inseriu n\u00e3o corresponde ao tipo de seguran\u00e7a da rede wifi. Configure a rede novamente de forma manual e selecione o tipo de seguran\u00e7a correto. Se tiver problemas ao conectar seu Kindle a uma rede wifi, voc\u00ea pode encontrar ajuda em www.amazon.com/devicesupport.',
    adhocNotSupportedTitle  : 'Rede n\u00e3o suportada',
    adhocNotSupportedError  : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". Redes wifi ponto a ponto s\u00e3o suportadas pelo Kindle. Tente se conectar a outra rede. Se tiver problemas ao conectar seu Kindle a uma rede wifi, procure ajuda em www.amazon.com/devicesupport.',
    profileFailedError      : 'Seu Kindle n\u00e3o p\u00f4de se conectar a uma rede wifi "{essid}". As informa\u00e7\u00f5es de rede que voc\u00ea inseriu est\u00e3o incompletas. Verifique a configura\u00e7\u00e3o de rede e tente configur\u00e1-la novamente. Se tiver problemas ao conectar seu Kindle a uma rede wifi, voc\u00ea pode encontrar ajuda em www.amazon.com/devicesupport.',
    profileDeleteTitle      : 'Erro',
    profileDeleteError      : 'N\u00e3o foi poss\u00edvel excluir um perfil para a rede wifi "{essid}".',
    scanning                : "Verificando",
    scanningForNetwork      : "Verificando redes",
    scanComplete            : "Verifica\u00e7\u00e3o conclu\u00edda",
    connecting              : "Conectando",
    connected               : "Conectado",
    connectionFailed        : "Falha de conex\u00e3o",
    noWifiFound             : "Nenhuma rede wifi encontrada",
    wpsConnectionError      : 'N\u00e3o \u00e9 poss\u00edvel conectar o Kindle \u00e0 rede wifi "{essid}" com WPS. Deseja configurar esta rede manualmente?',
    wpsButtonNotPressedError : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}" utilizando WPS. Verifique se tocou no bot\u00e3o WPS.',
    apRejectedError         : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". Verifique se suas configura\u00e7\u00f5es de seguran\u00e7a est\u00e3o corretas e tente novamente.',
    apDeniedError           : 'N\u00e3o \u00e9 poss\u00edvel conectar seu Kindle \u00e0 rede wifi "{essid}". O ponto de acesso rejeitou a solicita\u00e7\u00e3o de conex\u00e3o. Verifique as configura\u00e7\u00f5es de endere\u00e7o de MAC de seu roteador e tente novamente.',
    forgetProfileTitle      : 'Deseja esquecer a rede?',
    forgetProfileConfirmation : 'Tem certeza de que deseja esquecer a rede wifi "{essid}"?',
    forget                  : "ESQUECER",
    advancedDialogDescription : "Voc\u00ea pode configurar a conex\u00e3o de rede wifi e as op\u00e7\u00f5es de seguran\u00e7a para a rede indicada abaixo.",
    caCertificateNotFoundTitle : "N\u00e3o foi poss\u00edvel encontrar o certificado",
    caCertificateNotFoundError : 'O certificado de seguran\u00e7a n\u00e3o p\u00f4de ser localizado. Verifique se o nome est\u00e1 correto e tente novamente.',
    userGuidePart1 : 'Para usar o modo avi\u00e3o, toque em A\u00e7\u00f5es r\u00e1pidas',
    userGuidePart2 : 'na barra de ferramentas e, em seguida, em modo avi\u00e3o.'
};

// string map for large mode
var WifiWizardDialogStringTableLarge = {
    disconnect              : "Desconectar",
    enterAgain              : "Digitar novamente",
    setUp                   : "Configurar",
    cancel                  : "Cancelar",
    connect                 : "Conectar-se",
    advanced                : "Avan\u00e7ado",
    join                    : "Outro...",
    rescan                  : "Pesquisar novamente",
    tryAgain                : "Tentar novamente",
    forget                  : "Esquecer"
};


//checks for large mode and constructs WifiWizardDialogStringTable based on the display mode

WifiWizardDialogStringTable = constructTableOnDisplayModeChange(WifiWizardDialogStringTable,WifiWizardDialogStringTableLarge);


var WifiWizardDialogAccessibilityStringTable = {
    closeButtonLabel     :    "Fechar"
};

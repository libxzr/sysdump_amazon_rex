
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
    title                   : "Reti Wi-Fi ({numNetworks})",
    advancedOptionsTitle    : "Opzioni avanzate",
    manualEntryButton       : "Inserisci un\u02bcaltra rete Wi-Fi",
    networkNameLabel        : "Nome rete",
    identityLabel           : "Nome utente",
    passwordLabel           : "Password",
    connectionTypeLabel     : "Tipo di connessione",
    ipAddressLabel          : "Indirizzo IP",
    subnetMaskLabel         : "Maschera di sottorete",
    routerLabel             : "Router",
    dnsLabel                : "DNS",
    securityTypeLabel       : "Tipo di sicurezza",
    wpaTypeLabel            : "Versione",
    eapMethodLabel          : "Metodo EAP",
    phase2AuthLabel         : "Autenticazione di Fase 2",
    caCertLabel             : "Certificato CA",
    connectionTypeDhcp      : "DHCP",
    conenctionTypeStatic    : "Statico",
    wpaTypePersonal         : "Personale",
    wpaTypeEnterprise       : "Azienda",
    eapMethodPeap           : "PEAP",
    eapMethodTtls           : "TTLS",
    phase2AuthPap           : "PAP",
    phase2AuthMschapv2      : "MSCHAPv2",
    securityTypeOpen        : "Nessuno",
    securityTypeWep         : "WEP",
    securityTypeWpawpa2     : "WPA/WPA2",
    securityTypeWpa2        : "WPA2",
    done                    : "FINE",
    availNetworksLabel      : "Reti Wi-Fi disponibili",
    disconnect              : "DISCONNETTI",
    enterAgain              : "ENTRA NUOVAMENTE",
    setUp                   : "CONFIGURA",
    okay                    : "OK",
    cancel                  : "ANNULLA",
    connect                 : "CONNETTI",
    wpsConnect              : "WPS",
    advanced                : "AVANZATE",
    join                    : "ALTRO...",
    rescan                  : "RIAVVIA RICERCA RETI",
    tryAgain                : "RIPROVA",
    passwordHide            : "Nascondi password",
    storeCredentials        : "Salva la password su Amazon.",
    learnMoreLabel          : "Maggiori informazioni",
    manualEntryTitle        : "Inserisci rete Wi-Fi",
    passwordEntryTitle      : "Password Wi-Fi richiesta",
    loginTitle              : "Accesso alla rete Wi-Fi",
    passwordErrorTitle      : "Password errata",
    defaultErrorTitle       : "Errore Wi-Fi",
    defaultError            : 'Impossibile connettere Kindle alla rete Wi-Fi "{essid}". --"{error}"--. Premi Configura per inserire nuovamente la password o configurare la rete manualmente. In caso di problemi di connessione di Kindle alla rete Wi-Fi, visita il sito www.amazon.com/devicesupport per ricevere assistenza.',
    passwordFailedError     : 'Impossibile connettere Kindle alla rete Wi-Fi "{essid}". La password inserita non \u00e8 corretta. Inserisci nuovamente la password o configura la rete manualmente. In caso di problemi di connessione di Kindle alla rete Wi-Fi, visita il sito www.amazon.com/devicesupport per ricevere assistenza.',
    noProfileTitle     : 'Rete Wi-Fi non configurata',
    noProfileError          : 'Impossibile connettere Kindle alla rete Wi-Fi. Questa rete non \u00e8 configurata. In caso di problemi di connessione di Kindle alla rete Wi-Fi, visita il sito www.amazon.com/devicesupport per ricevere assistenza.',
    failedToConnectError    : 'Impossibile connettere Kindle alla rete Wi-Fi "{essid}". Premi Configura per inserire nuovamente la password o configurare la rete manualmente. In caso di problemi di connessione di Kindle alla rete Wi-Fi, visita il sito www.amazon.com/devicesupport per ricevere assistenza.',
    failedToConnectEnterpriseError : 'Il tuo Kindle non \u00e8 in grado di connettersi alla rete Wi-Fi "{essid}". Controlla le credenziali o contatta l\u02bcamministratore di sistema.',
    wifiNotReady            : 'Impossibile connettere Kindle alla rete Wi-Fi "{essid}". Tocca il pulsante Home, quindi prova nuovamente a connetterti alla rete Wi-Fi. In caso di problemi di connessione di Kindle alla rete Wi-Fi, visita il sito www.amazon.com/devicesupport per ricevere assistenza.',
    localNetworkFailedError : 'Impossibile connettere Kindle alla rete locale "{essid}". Potrebbe essere necessario controllare la rete locale. In caso di problemi di connessione di Kindle alla rete Wi-Fi, visita il sito www.amazon.com/devicesupport per ricevere assistenza.',
    internetConnectFailedTitle : 'Connessione non riuscita',
    internetConnectFailedError : 'Connessione a Internet non riuscita. Contatta il tuo provider internet per ulteriore assistenza.',
    profNetNameTooLongFailedTitle : 'Nome di rete troppo lungo',
    profNetNameTooLongFailedError : 'Impossibile stabilire la connessione alla rete Wi-Fi "{essid}". Il nome della rete Wi-Fi \u00e8 troppo lungo. Vuoi configurare manualmente la rete?',
    passwordTooLongTitle    : 'Password troppo lunga',
    passwordTooLongError    : 'Impossibile connettere Kindle alla rete Wi-Fi "{essid}". La password inserita \u00e8 pi\u00f9 lunga di quanto consentito dalla rete Wi-Fi. Inserisci una nuova password. In caso di problemi di connessione di Kindle alla rete Wi-Fi, visita il sito www.amazon.com/devicesupport per ricevere assistenza.',
    passwordTooShortTitle   : 'Password troppo corta',
    passwordTooShortError   : 'Impossibile connettere Kindle alla rete Wi-Fi "{essid}". La password inserita non contiene uno o pi\u00f9 caratteri. Prova a inserire nuovamente la password. In caso di problemi di connessione di Kindle alla rete Wi-Fi, visita il sito www.amazon.com/devicesupport per ricevere assistenza.',
    wpaEnterpriseErrorTitle : 'Rete non supportata',
    wpaEnterpriseNotSupportedError : 'Il tuo Kindle non \u00e8 in grado di connettersi alla rete Wi-Fi "{essid}". Kindle non supporta le reti Wi-Fi aziendali. Prova a connetterti ad un\u02bcaltra rete. In caso di problemi nella connessione di Kindle alla rete Wi-Fi, visita il sito www.amazon.com/devicesupport per ricevere assistenza.',
    wpaEnterpriseAuthError  : 'Kindle non \u00e8 in grado di connettersi alla rete Wi-Fi "{essid}". Prova a inserire nuovamente il nome utente e la password. In caso di problemi di connessione di Kindle alla rete Wi-Fi, visita il sito www.amazon.com/devicesupport per ricevere assistenza.',
    securityMismatchTitle   : 'Errore di sicurezza',
    securityMismatchError   : 'Impossibile connettere Kindle alla rete Wi-Fi "{essid}". Il tipo di sicurezza inserito non corrisponde al tipo di sicurezza della rete Wi-Fi. Configura la rete manualmente e seleziona il tipo di sicurezza appropriato. In caso di problemi di connessione di Kindle alla rete Wi-Fi, visita il sito www.amazon.com/devicesupport per ricevere assistenza.',
    adhocNotSupportedTitle  : 'Rete non supportata',
    adhocNotSupportedError  : 'Il tuo Kindle non \u00e8 in grado di connettersi alla rete Wi-Fi "{essid}". Kindle non supporta le reti Wi-Fi peer-to-peer. Prova a connetterti ad un\u02bcaltra rete. In caso di problemi nella connessione di Kindle alla rete Wi-Fi, visita il sito www.amazon.com/devicesupport per ricevere assistenza.',
    profileFailedError      : 'Impossibile configurare la rete Wi-Fi "{essid}". Le informazioni di rete inserite sono incomplete. Controlla la configurazione di rete e reimpostala. In caso di problemi di connessione di Kindle alla rete Wi-Fi, visita il sito www.amazon.com/devicesupport per ricevere assistenza.',
    profileDeleteTitle      : 'Errore',
    profileDeleteError      : 'Impossibile eliminare il profilo della rete Wi-Fi "{essid}".',
    scanning                : "Scansione",
    scanningForNetwork      : "Ricerca reti\u2026",
    scanComplete            : "Ricerca reti completata",
    connecting              : "Connessione in corso",
    connected               : "Connesso",
    connectionFailed        : "Connessione non riuscita",
    noWifiFound             : "Nessuna rete Wi-Fi disponibile",
    wpsConnectionError      : 'Impossibile connettere Kindle alla rete Wi-Fi "{essid}" tramite WPS. Vuoi configurare la rete manualmente?',
    wpsButtonNotPressedError : 'Impossibile connettere Kindle alla rete Wi-Fi "{essid}" tramite WPS. Controlla di aver premuto il pulsante WPS.',
    apRejectedError         : 'Impossibile connettere Kindle alla rete Wi-Fi "{essid}". Verifica la correttezza delle impostazioni di sicurezza e riprova.',
    apDeniedError           : 'Impossibile connettere Kindle alla rete Wi-Fi "{essid}". Il punto d\u02bcaccesso ha rifiutato la richiesta di connessione. Controlla le impostazioni del filtro dell\u02bcindirizzo MAC del router e riprova.',
    forgetProfileTitle      : 'Eliminare la rete?',
    forgetProfileConfirmation : 'Vuoi davvero eliminare la rete Wi-Fi "{essid}"?',
    forget                  : "DIMENTICA",
    advancedDialogDescription : "Puoi configurare la connessione di rete Wi-Fi e le opzioni di sicurezza per la rete indicata di seguito.",
    caCertificateNotFoundTitle : "Impossibile trovare il certificato",
    caCertificateNotFoundError : 'Impossibile trovare il certificato di sicurezza. Verifica che il nome sia corretto e riprova.',
    userGuidePart1 : 'Per usare la Modalit\u00e0 Aeroplano, tocca Azioni rapide',
    userGuidePart2 : 'sulla barra degli strumenti, quindi seleziona Modalit\u00e0 Aeroplano.'
};

// string map for large mode
var WifiWizardDialogStringTableLarge = {
    disconnect              : "Disconnetti",
    enterAgain              : "Inserisci di nuovo",
    setUp                   : "Configura",
    cancel                  : "Annulla",
    connect                 : "Connetti",
    advanced                : "Avanzate",
    join                    : "Altro...",
    rescan                  : "Riavvia ricerca",
    tryAgain                : "Riprova",
    forget                  : "Dimentica"
};


//checks for large mode and constructs WifiWizardDialogStringTable based on the display mode

WifiWizardDialogStringTable = constructTableOnDisplayModeChange(WifiWizardDialogStringTable,WifiWizardDialogStringTableLarge);


var WifiWizardDialogAccessibilityStringTable = {
    closeButtonLabel     :    "Chiudi"
};

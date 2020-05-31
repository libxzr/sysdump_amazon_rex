
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
    title                   : "WLAN-Netzwerke ({numNetworks})",
    advancedOptionsTitle    : "Erweiterte Optionen",
    manualEntryButton       : "Weiteres WLAN-Netzwerk eingeben",
    networkNameLabel        : "Netzwerkname",
    identityLabel           : "Benutzername",
    passwordLabel           : "Passwort",
    connectionTypeLabel     : "Verbindungstyp",
    ipAddressLabel          : "IP-Adresse",
    subnetMaskLabel         : "Subnetzmaske",
    routerLabel             : "Router",
    dnsLabel                : "DNS",
    securityTypeLabel       : "Sicherheitstyp",
    wpaTypeLabel            : "Version",
    eapMethodLabel          : "EAP-Methode",
    phase2AuthLabel         : "Phase 2 Authentifizierung",
    caCertLabel             : "CA-Zertifikat",
    connectionTypeDhcp      : "DHCP",
    conenctionTypeStatic    : "Statisch",
    wpaTypePersonal         : "Pers\u00f6nlich",
    wpaTypeEnterprise       : "Unternehmen",
    eapMethodPeap           : "PEAP",
    eapMethodTtls           : "TTLS",
    phase2AuthPap           : "PAP",
    phase2AuthMschapv2      : "MSCHAPv2",
    securityTypeOpen        : "Keiner",
    securityTypeWep         : "WEP",
    securityTypeWpawpa2     : "WPA/WPA2",
    securityTypeWpa2        : "WPA2",
    done                    : "FERTIG",
    availNetworksLabel      : "Verf\u00fcgbare Netzwerke",
    disconnect              : "TRENNEN",
    enterAgain              : "ERNEUT EINGEBEN",
    setUp                   : "EINRICHTEN",
    okay                    : "OK",
    cancel                  : "ABBRECHEN",
    connect                 : "VERBINDEN",
    wpsConnect              : "WPS",
    advanced                : "ERWEITERT",
    join                    : "ANDERE...",
    rescan                  : "ERNEUT SUCHEN",
    tryAgain                : "ERNEUT VERSUCHEN",
    passwordHide            : "Passwort ausblenden",
    storeCredentials        : "Passwort auf Amazon speichern.",
    learnMoreLabel          : "Mehr dazu",
    manualEntryTitle        : "WLAN-Netzwerk eingeben",
    passwordEntryTitle      : "WLAN-Passwort erforderlich",
    loginTitle              : "WLAN-Anmeldung",
    passwordErrorTitle      : "Falsches Passwort",
    defaultErrorTitle       : "WLAN-Fehler",
    defaultError            : 'Ihr Kindle konnte keine Verbindung mit dem WLAN-Netzwerk \u201e{essid}\u201c herstellen.  --\u201e{error}\u201c-- Bitte tippen Sie auf \u201eEinrichten\u201c, um Ihr Passwort erneut einzugeben oder richten Sie Ihr Netzwerk manuell ein. Falls Sie bei der Verbindung Ihres Kindle mit dem WLAN-Netzwerk Probleme haben, k\u00f6nnen Sie sich an www.amazon.com/devicesupport wenden.',
    passwordFailedError     : 'Ihr Kindle konnte keine Verbindung mit dem WLAN-Netzwerk \u201e{essid}\u201c herstellen. Das eingegebene Passwort ist nicht korrekt. Bitte versuchen Sie, Ihr Passwort erneut einzugeben oder Ihr Netzwerk manuell einzurichten. Falls Sie bei der Verbindung Ihres Kindle mit dem WLAN-Netzwerk Probleme haben, k\u00f6nnen Sie sich an www.amazon.com/devicesupport wenden.',
    noProfileTitle     : 'WLAN nicht konfiguriert',
    noProfileError          : 'Ihr Kindle konnte keine Verbindung mit dem WLAN-Netzwerk herstellen. Dieses Netzwerk ist nicht konfiguriert. Falls Sie Probleme haben, Ihren Kindle mit WLAN zu verbinden, k\u00f6nnen Sie sich an www.amazon.com/devicesupport wenden.',
    failedToConnectError    : 'Ihr Kindle konnte keine Verbindung mit dem WLAN-Netzwerk \u201e{essid}\u201c herstellen. Bitte tippen Sie auf \u201eEinrichten\u201c, um Ihr Passwort erneut einzugeben oder richten Sie Ihr Netzwerk manuell ein. Falls Sie Probleme haben, Ihren Kindle mit WLAN zu verbinden, k\u00f6nnen Sie sich an www.amazon.com/devicesupport wenden.',
    failedToConnectEnterpriseError : 'Ihr Kindle kann sich nicht mit dem WLAN-Netzwerk \u201e{essid}\u201c verbinden. Bitte \u00fcberpr\u00fcfen Sie Ihre Berechtigungen oder wenden Sie sich an Ihren Systemadministrator.',
    wifiNotReady            : 'Ihr Kindle konnte keine Verbindung mit dem WLAN-Netzwerk \u201e{essid}\u201c herstellen. Tippen Sie auf die Startseite-Schaltfl\u00e4che und stellen Sie dann erneut eine WLAN-Verbindung her. Falls Sie Probleme haben, Ihren Kindle mit WLAN zu verbinden, k\u00f6nnen Sie sich an www.amazon.com/devicesupport wenden.',
    localNetworkFailedError : 'Ihr Kindle konnte keine Verbindung mit dem lokalen WLAN-Netzwerk \u201e{essid}\u201c herstellen. Eventuell sollten Sie Ihr lokales Netzwerk \u00fcberpr\u00fcfen. Falls Sie Probleme haben, Ihren Kindle mit WLAN zu verbinden, k\u00f6nnen Sie sich an www.amazon.com/devicesupport wenden.',
    internetConnectFailedTitle : 'Verbindung fehlgeschlagen',
    internetConnectFailedError : 'Ihr Kindle ist mit WLAN verbunden, konnte aber nicht auf das Internet zugreifen. Kontaktieren Sie Ihren Internetprovider, um weitere Unterst\u00fctzung zu erhalten.',
    profNetNameTooLongFailedTitle : 'Netzwerkname ist zu lang',
    profNetNameTooLongFailedError : 'Es konnte keine Verbindung zum WLAN-Netzwerk \u201e{essid}\u201c hergestellt werden. Der Netzwerkname ist zu lang. M\u00f6chten Sie dieses Netzwerk manuell einrichten?',
    passwordTooLongTitle    : 'Passwort ist zu lang',
    passwordTooLongError    : 'Ihr Kindle konnte keine Verbindung mit dem WLAN-Netzwerk \u201e{essid}\u201c herstellen. Das eingegebene Passwort ist l\u00e4nger als vom WLAN-Netzwerk zugelassen. Bitte versuchen Sie, Ihr Passwort erneut einzugeben. Falls Sie Probleme haben, Ihren Kindle mit WLAN zu verbinden, k\u00f6nnen Sie sich an www.amazon.com/devicesupport wenden.',
    passwordTooShortTitle   : 'Passwort ist zu kurz',
    passwordTooShortError   : 'Ihr Kindle konnte keine Verbindung mit dem WLAN-Netzwerk \u201e{essid}\u201c herstellen. Bei dem eingegebenen Passwort fehlen ein oder mehr Zeichen. Bitte versuchen Sie, Ihr Passwort erneut einzugeben. Falls Sie Probleme haben, Ihren Kindle mit WLAN zu verbinden, k\u00f6nnen Sie sich an www.amazon.com/devicesupport wenden.',
    wpaEnterpriseErrorTitle : 'Nicht unterst\u00fctztes Netzwerk',
    wpaEnterpriseNotSupportedError : 'Ihr Kindle konnte keine Verbindung mit dem WLAN-Netzwerk \u201e{essid}\u201c herstellen. WLAN-Netzwerke in Unternehmen werden von Kindle nicht unterst\u00fctzt. Versuchen Sie, eine Verbindung mit einem anderen Netzwerk herzustellen. Falls Sie Probleme haben, Ihren Kindle mit WLAN zu verbinden, k\u00f6nnen Sie sich an www.amazon.com/devicesupport wenden.',    
    wpaEnterpriseAuthError  : 'Ihr Kindle kann sich nicht mit dem WLAN-Netzwerk \u201e{essid}\u201c verbinden. Geben Sie Ihren Benutzernamen und Ihr Passwort erneut ein. Falls Sie Probleme haben, Ihren Kindle mit WLAN zu verbinden, k\u00f6nnen Sie sich an www.amazon.com/devicesupport wenden.',
    securityMismatchTitle   : 'Sicherheitsfehler',
    securityMismatchError   : 'Ihr Kindle konnte keine Verbindung mit dem WLAN-Netzwerk \u201e{essid}\u201c herstellen. Der eingegebene Sicherheitstyp entspricht nicht dem Sicherheitstyp des WLAN-Netzwerks. Bitte richten Sie das Netzwerk manuell neu ein und korrigieren Sie den Sicherheitstyp. Falls Sie Probleme haben, Ihren Kindle mit WLAN zu verbinden, k\u00f6nnen Sie sich an www.amazon.com/devicesupport wenden.',
    adhocNotSupportedTitle  : 'Nicht unterst\u00fctztes Netzwerk',
    adhocNotSupportedError  : 'Ihr Kindle konnte keine Verbindung mit dem WLAN-Netzwerk \u201e{essid}\u201c herstellen. Peer-to-Peer-WLAN-Netzwerke werden von Kindle nicht unterst\u00fctzt. Versuchen Sie, eine Verbindung mit einem anderen Netzwerk herzustellen. Falls Sie Probleme haben, Ihren Kindle mit WLAN zu verbinden, k\u00f6nnen Sie sich an www.amazon.com/devicesupport wenden.',
    profileFailedError      : 'Das WLAN-Netzwerk \u201e{essid}\u201c konnte nicht eingerichtet werden. Die von Ihnen eingegebenen Netzwerkinformationen sind unvollst\u00e4ndig. Bitte \u00fcberpr\u00fcfen Sie die Netzwerkkonfiguration und versuchen Sie, das Netzwerk erneut einzurichten. Falls Sie Probleme haben, Ihren Kindle mit WLAN zu verbinden, k\u00f6nnen Sie sich an www.amazon.com/devicesupport wenden.',
    profileDeleteTitle      : 'Fehler',
    profileDeleteError      : 'Das Profil f\u00fcr das WLAN-Netzwerk \u201e{essid}\u201c konnte nicht gel\u00f6scht werden.',
    scanning                : "Suche l\u00e4uft",
    scanningForNetwork      : "Suche nach Netzwerken l\u00e4uft",
    scanComplete            : "Suche abgeschlossen",
    connecting              : "Verbindung wird hergestellt",
    connected               : "Verbunden",
    connectionFailed        : "Verbindung fehlgeschlagen",
    noWifiFound             : "Keine WLAN-Netzwerke gefunden",
    wpsConnectionError      : 'Es konnte \u00fcber WPS keine Verbindung zum WLAN-Netzwerk \u201e{essid}\u201c hergestellt werden. M\u00f6chten Sie dieses Netzwerk manuell einrichten?',
    wpsButtonNotPressedError : 'Es konnte \u00fcber WPS keine Verbindung zum WLAN-Netzwerk \u201e{essid}\u201c hergestellt werden. Bitte \u00fcberpr\u00fcfen Sie, ob auf die WPS-Schaltfl\u00e4che getippt wurde.',
    apRejectedError         : 'Ihr Kindle konnte keine Verbindung zum WLAN-Netzwerk \u201e{essid}\u201c herstellen. \u00dcberpr\u00fcfen Sie, ob die Sicherheitseinstellungen korrekt sind und versuchen Sie es dann erneut.',
    apDeniedError           : 'Ihr Kindle konnte keine Verbindung zum WLAN-Netzwerk \u201e{essid}\u201c herstellen. Der Zugangspunkt hat keine Verbindung zugelassen. \u00dcberpr\u00fcfen Sie die MAC-Adressfiltereinstellungen Ihres Routers und versuchen Sie es erneut.',
    forgetProfileTitle      : 'Netzwerk verwerfen?',
    forgetProfileConfirmation : 'Sind Sie sicher, dass Sie das WLAN-Netzwerk \u201e{essid}\u201c verwerfen m\u00f6chten?',
    forget                  : "VERWERFEN",
    advancedDialogDescription : "Sie k\u00f6nnen die WLAN-Netzwerkverbindung und die Sicherheitsoptionen f\u00fcr das unten genannte Netzwerk einrichten.",
    caCertificateNotFoundTitle : "Zertifikat nicht gefunden",
    caCertificateNotFoundError : 'Sicherheitszertifikat nicht gefunden. \u00dcberpr\u00fcfen Sie den Namen und versuchen Sie es erneut.',
    userGuidePart1 : 'Um den Flugmodus zu aktivieren, tippen Sie auf Schnellaktionen',
    userGuidePart2 : 'in der Funktionsleiste und dann auf \u201eFlugmodus\u201c.'
};

// string map for large mode
var WifiWizardDialogStringTableLarge = {
    disconnect              : "Trennen",
    enterAgain              : "Erneut eingeben",
    setUp                   : "Einrichtung",
    cancel                  : "Abbrechen",
    connect                 : "Verbinden",
    advanced                : "Erweitert",
    join                    : "Sonstiges...",
    rescan                  : "Erneut suchen",
    tryAgain                : "Erneut versuchen",
    forget                  : "Verwerfen"
};


//checks for large mode and constructs WifiWizardDialogStringTable based on the display mode

WifiWizardDialogStringTable = constructTableOnDisplayModeChange(WifiWizardDialogStringTable,WifiWizardDialogStringTableLarge);


var WifiWizardDialogAccessibilityStringTable = {
    closeButtonLabel     :    "Schlie\u00dfen"
};

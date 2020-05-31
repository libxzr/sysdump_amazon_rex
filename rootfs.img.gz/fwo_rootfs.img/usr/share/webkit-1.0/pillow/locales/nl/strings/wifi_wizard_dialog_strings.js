
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
    title                   : "Wifi-netwerken ({numNetworks})",
    advancedOptionsTitle    : "Geavanceerde opties",
    manualEntryButton       : "Ander wifi-netwerk invoeren",
    networkNameLabel        : "Netwerknaam",
    identityLabel           : "Gebruikersnaam",
    passwordLabel           : "Wachtwoord",
    connectionTypeLabel     : "Verbindingstype",
    ipAddressLabel          : "IP-adres",
    subnetMaskLabel         : "Subnetmasker",
    routerLabel             : "Router",
    dnsLabel                : "DNS",
    securityTypeLabel       : "Beveiligingstype",
    wpaTypeLabel            : "Versie",
    eapMethodLabel          : "EAP-methode",
    phase2AuthLabel         : "Phase 2-verificatie",
    caCertLabel             : "CA-certificaat",
    connectionTypeDhcp      : "DHCP",
    conenctionTypeStatic    : "Statisch",
    wpaTypePersonal         : "Persoonlijk",
    wpaTypeEnterprise       : "Enterprise",
    eapMethodPeap           : "PEAP",
    eapMethodTtls           : "TTLS",
    phase2AuthPap           : "PAP",
    phase2AuthMschapv2      : "MSCHAPv2",
    securityTypeOpen        : "Geen",
    securityTypeWep         : "WEP",
    securityTypeWpawpa2     : "WPA/WPA2",
    securityTypeWpa2        : "WPA2",
    done                    : "GEREED",
    availNetworksLabel      : "Beschikbare netwerken",
    disconnect              : "ONTKOPPELEN",
    enterAgain              : "OPNIEUW INVOEREN",
    setUp                   : "INSTELLEN",
    okay                    : "OK",
    cancel                  : "ANNULEREN",
    connect                 : "VERBINDEN",
    wpsConnect              : "WPS",
    advanced                : "GEAVANCEERD",
    join                    : "ANDERS...",
    rescan                  : "OPNIEUW SCANNEN",
    tryAgain                : "OPNIEUW PROBEREN",
    passwordHide            : "Wachtwoord verbergen",
    storeCredentials        : "Wachtwoord opslaan op Amazon.",
    learnMoreLabel          : "Meer informatie",
    manualEntryTitle        : "Wifi-netwerk invoeren",
    passwordEntryTitle      : "Wifi-wachtwoord vereist",
    loginTitle              : "Wifi-aanmelding",
    passwordErrorTitle      : "Onjuist wachtwoord",
    defaultErrorTitle       : "Wifi-fout",
    defaultError            : 'Je Kindle kan geen verbinding maken met het wifi-netwerk {essid}. --{error}--. Druk op Instellen om je wachtwoord nogmaals in te voeren of handmatig je netwerk in te stellen. Als je problemen hebt met het verbinden van je Kindle met wifi, kun je hulp vinden op www.amazon.com/devicesupport.',
    passwordFailedError     : 'Je Kindle kan geen verbinding maken met wifi-netwerk {essid}. Het ingevoerde wachtwoord is onjuist. Probeer je wachtwoord nogmaals in te voeren of stel je netwerk handmatig in. Als je problemen hebt bij het verbinden van je Kindle met wifi, kun je hulp vinden op www.amazon.com/devicesupport.',
    noProfileTitle     : 'Wifi niet geconfigureerd',
    noProfileError          : 'Je Kindle kan geen verbinding maken met het wifi-netwerk. Dit netwerk is niet geconfigureerd. Als je problemen hebt bij het verbinden van je Kindle met wifi, kun je hulp vinden op www.amazon.com/devicesupport.',
    failedToConnectError    : 'Je Kindle kan geen verbinding maken met het wifi-netwerk {essid}. Druk op Instellen om je wachtwoord nogmaals in te voeren of handmatig je netwerk in te stellen. Als je problemen hebt met het verbinden van je Kindle met wifi, kun je hulp vinden op www.amazon.com/devicesupport.',
    failedToConnectEnterpriseError : 'Je Kindle kan geen verbinding maken met het wifi-netwerk {essid}. Controleer je aanmeldgegevens of neem contact op met je systeembeheerder.',
    wifiNotReady            : 'Je Kindle kan geen verbinding maken met het wifi-netwerk {essid}. Tik op de Home-knop en maak nogmaals verbinding met wifi. Als je problemen hebt bij het verbinden van je Kindle met wifi, kun je hulp vinden op www.amazon.com/devicesupport.',
    localNetworkFailedError : 'Je Kindle kan geen verbinding maken met het wifi-netwerk {essid}. Mogelijk moet je je lokale netwerk controleren. Als je problemen hebt met het verbinden van je Kindle met wifi, kun je hulp vinden op www.amazon.com/devicesupport.',
    internetConnectFailedTitle : 'Verbinding maken mislukt',
    internetConnectFailedError : 'Je Kindle heeft verbinding gemaakt met het wifi-netwerk, maar kan het internet niet bereiken. Neem contact op met je internetprovider voor verdere ondersteuning.',
    profNetNameTooLongFailedTitle : 'Netwerknaam te lang',
    profNetNameTooLongFailedError : 'Je Kindle kan geen verbinding maken met het wifi-netwerk {essid}. De netwerknaam is te lang. Wil je dit netwerk handmatig instellen?',
    passwordTooLongTitle    : 'Wachtwoord te lang',
    passwordTooLongError    : 'Je Kindle kan geen verbinding maken met wifi-netwerk {essid}. Het ingevoerde wachtwoord is langer dan het wifi-netwerk toestaat. Probeer je wachtwoord nogmaals in te voeren. Als je problemen hebt bij het verbinden van je Kindle met wifi, kun je hulp vinden op www.amazon.com/devicesupport.',
    passwordTooShortTitle   : 'Wachtwoord te kort',
    passwordTooShortError   : 'Je Kindle kan geen verbinding maken met wifi-netwerk {essid}. Er ontbreken een of meer tekens in het ingevoerde wachtwoord. Probeer je wachtwoord nogmaals in te voeren. Als je problemen hebt bij het verbinden van je Kindle met wifi, kun je hulp vinden op www.amazon.com/devicesupport.',
    wpaEnterpriseErrorTitle : 'Niet-ondersteund netwerk',
    wpaEnterpriseNotSupportedError : 'Je Kindle kan geen verbinding maken met het wifi-netwerk {essid}. Enterprise-wifi-netwerken worden niet ondersteund op Kindle. Probeer verbinding te maken met een ander netwerk. Als je problemen hebt bij het verbinden van je Kindle met wifi, kun je hulp vinden op www.amazon.com/devicesupport.',    
    wpaEnterpriseAuthError  : 'Je Kindle kan geen verbinding maken met het wifi-netwerk {essid}. Probeer je gebruikersnaam en wachtwoord nogmaals in te voeren. Als je problemen hebt met het verbinden van je Kindle met wifi, kun je hulp vinden op www.amazon.com/devicesupport.',
    securityMismatchTitle   : 'Beveiligingsfout',
    securityMismatchError   : 'Je Kindle kan geen verbinding maken met wifi-netwerk {essid}. Het ingevoerde soort beveiliging komt niet overeen met het soort beveiliging van het wifi-netwerk. Stel het netwerk nogmaals handmatig in en selecteer het juiste soort beveiliging. Als je problemen hebt bij het verbinden van je Kindle met wifi, kun je hulp vinden op www.amazon.com/devicesupport.',
    adhocNotSupportedTitle  : 'Niet-ondersteund netwerk',
    adhocNotSupportedError  : 'Je Kindle kan geen verbinding maken met het wifi-netwerk {essid}.Peer-to-peer wifi-netwerken worden niet ondersteund op Kindle. Probeer verbinding te maken met een ander netwerk. Als je problemen hebt bij het verbinden van je Kindle met wifi, kun je hulp vinden op www.amazon.com/devicesupport.',
    profileFailedError      : 'Het wifi-netwerk {essid} kan niet worden ingesteld. De ingevoerde netwerkgegevens zijn onvolledig. Controleer de netwerkconfiguratie en probeer het netwerk nogmaals in te stellen. Als je problemen hebt bij het verbinden van je Kindle met wifi, kun je hulp vinden op www.amazon.com/devicesupport.',
    profileDeleteTitle      : 'Fout',
    profileDeleteError      : 'Kan het profiel voor het wifi-netwerk {essid} niet verwijderen.',
    scanning                : "Scannen",
    scanningForNetwork      : "Scannen naar netwerken",
    scanComplete            : "Scan voltooid",
    connecting              : "Verbinding maken",
    connected               : "Verbonden",
    connectionFailed        : "Verbinding maken mislukt",
    noWifiFound             : "Geen wifi-netwerken gevonden",
    wpsConnectionError      : 'Je Kindle kan geen verbinding maken met het wifi-netwerk {essid} door middel van WPS. Wil je dit netwerk handmatig instellen?',
    wpsButtonNotPressedError : 'Je Kindle kan geen verbinding maken met het wifi-netwerk {essid} door middel van WPS. Controleer of op de WPS-knop is getikt.',
    apRejectedError         : 'Je Kindle kan geen verbinding maken met het wifi-netwerk {essid}. Controleer of je beveiligingsinstellingen juist zijn en probeer het nogmaals.',
    apDeniedError           : 'Je Kindle kan geen verbinding maken met het wifi-netwerk {essid}. Het toegangspunt heeft het verbindingsverzoek geweigerd. Controleer de MAC-adresfilterinstellingen van je router en probeer het nogmaals.',
    forgetProfileTitle      : 'Netwerk vergeten?',
    forgetProfileConfirmation : 'Weet je zeker dat je het wifi-netwerk {essid} wilt vergeten?',
    forget                  : "VERGETEN",
    advancedDialogDescription : "Je kunt de wifi-netwerkverbinding en beveiligingsopties voor het hieronder genoemde netwerk instellen.",
    caCertificateNotFoundTitle : "Kan certificaat niet vinden",
    caCertificateNotFoundError : 'Het beveiligingscertificaat kan niet worden gevonden. Controleer of de naam juist is en probeer het opnieuw.',
    userGuidePart1 : 'Als je de vliegtuigmodus wilt gebruiken, tik je op Snelle acties',
    userGuidePart2 : 'in de werkbalk en vervolgens op Vliegtuigmodus.'
};

// string map for large mode
var WifiWizardDialogStringTableLarge = {
    disconnect              : "Ontkoppelen",
    enterAgain              : "Nogmaals invoeren",
    setUp                   : "Instellen",
    cancel                  : "Annuleren",
    connect                 : "Verbinden",
    advanced                : "Geavanceerd",
    join                    : "Anders...",
    rescan                  : "Opnieuw scannen",
    tryAgain                : "Opnieuw proberen",
    forget                  : "Vergeten"
};


//checks for large mode and constructs WifiWizardDialogStringTable based on the display mode

WifiWizardDialogStringTable = constructTableOnDisplayModeChange(WifiWizardDialogStringTable,WifiWizardDialogStringTableLarge);


var WifiWizardDialogAccessibilityStringTable = {
    closeButtonLabel     :    "Sluiten"
};

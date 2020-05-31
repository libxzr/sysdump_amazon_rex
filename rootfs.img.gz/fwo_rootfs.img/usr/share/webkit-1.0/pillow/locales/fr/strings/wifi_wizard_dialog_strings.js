
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
    title                   : "R\u00e9seaux Wi-Fi ({numNetworks})",
    advancedOptionsTitle    : "Options avanc\u00e9es",
    manualEntryButton       : "Saisir un autre r\u00e9seau Wi-Fi",
    networkNameLabel        : "Nom du r\u00e9seau",
    identityLabel           : "Nom d\u02bcutilisateur",
    passwordLabel           : "Mot de passe",
    connectionTypeLabel     : "Type de connexion",
    ipAddressLabel          : "Adresse IP",
    subnetMaskLabel         : "Masque de sous-r\u00e9seau",
    routerLabel             : "Routeur",
    dnsLabel                : "DNS",
    securityTypeLabel       : "Type de s\u00e9curit\u00e9",
    wpaTypeLabel            : "Version",
    eapMethodLabel          : "M\u00e9thode EAP",
    phase2AuthLabel         : "Authentification Phase 2",
    caCertLabel             : "Certificat de l\u02bcAC",
    connectionTypeDhcp      : "DHCP",
    conenctionTypeStatic    : "Statique",
    wpaTypePersonal         : "Personnel",
    wpaTypeEnterprise       : "Entreprise",
    eapMethodPeap           : "PEAP",
    eapMethodTtls           : "TTLS",
    phase2AuthPap           : "PAP",
    phase2AuthMschapv2      : "MSCHAPv2",
    securityTypeOpen        : "Aucune",
    securityTypeWep         : "WEP",
    securityTypeWpawpa2     : "WPA/WPA2",
    securityTypeWpa2        : "WPA2",
    done                    : "TERMIN\u00c9",
    availNetworksLabel      : "R\u00e9seaux disponibles",
    disconnect              : "SE D\u00c9CONNECTER",
    enterAgain              : "RESSAISIR",
    setUp                   : "CONFIGURER",
    okay                    : "OK",
    cancel                  : "ANNULER",
    connect                 : "SE CONNECTER",
    wpsConnect              : "WPS",
    advanced                : "AVANC\u00c9",
    join                    : "AUTRES...",
    rescan                  : "R\u00c9ANALYSER",
    tryAgain                : "R\u00c9ESSAYER",
    passwordHide            : "Masquer le mot de passe",
    storeCredentials        : "Enregistrer le mot de passe sur Amazon.",
    learnMoreLabel          : "En savoir plus",
    manualEntryTitle        : "Saisir un r\u00e9seau Wi-Fi",
    passwordEntryTitle      : "Un mot de passe Wi-Fi est requis",
    loginTitle              : "Identifiant Wi-Fi",
    passwordErrorTitle      : "Mot de passe incorrect",
    defaultErrorTitle       : "Erreur Wi-Fi",
    defaultError            : 'Votre Kindle n\u02bcest pas en mesure de se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. -- \u00ab\u00a0{error}\u00a0\u00bb --. Appuyez sur Configurer pour saisir \u00e0 nouveau votre mot de passe ou pour configurer votre r\u00e9seau manuellement. Si vous avez des difficult\u00e9s \u00e0 connecter votre Kindle au Wi-Fi, vous trouverez de l\u02bcaide \u00e0 l\u02bcadresse www.amazon.com/devicesupport.',
    passwordFailedError     : 'Votre Kindle n\u02bcest pas en mesure de se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. Le mot de passe que vous avez saisi est incorrect. Essayez de saisir \u00e0 nouveau votre mot de passe, ou de configurer votre r\u00e9seau manuellement. Si vous avez des difficult\u00e9s \u00e0 connecter votre Kindle au Wi-Fi, vous trouverez de l\u02bcaide \u00e0 l\u02bcadresse www.amazon.com/devicesupport.',
    noProfileTitle     : 'Wi-Fi non configur\u00e9',
    noProfileError          : 'Votre Kindle n\u02bcest pas en mesure de se connecter au r\u00e9seau Wi-Fi. Ce r\u00e9seau n\u02bcest pas configur\u00e9. Si vous avez des difficult\u00e9s \u00e0 connecter votre Kindle au Wi-Fi, vous trouverez de l\u02bcaide \u00e0 l\u02bcadresse www.amazon.com/devicesupport.',
    failedToConnectError    : 'Votre Kindle n\u02bcest pas en mesure de se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. Appuyez sur Configurer pour saisir \u00e0 nouveau votre mot de passe ou pour configurer votre r\u00e9seau manuellement. Si vous avez des difficult\u00e9s \u00e0 connecter votre Kindle au Wi-Fi, vous trouverez de l\u02bcaide \u00e0 l\u02bcadresse www.amazon.com/devicesupport.',
    failedToConnectEnterpriseError : 'Votre Kindle n\u02bcest pas en mesure de se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. Veuillez v\u00e9rifier vos identifiants ou contacter votre administrateur syst\u00e8me.',
    wifiNotReady            : 'Votre Kindle n\u02bcest pas en mesure de se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. Touchez le bouton Accueil, puis reconnectez-vous au Wi-Fi. Si vous avez des difficult\u00e9s \u00e0 connecter votre Kindle au Wi-Fi, vous trouverez de l\u02bcaide \u00e0 l\u02bcadresse www.amazon.com/devicesupport.',
    localNetworkFailedError : 'Votre Kindle n\u02bcest pas en mesure de se connecter au r\u00e9seau local \u00ab\u00a0{essid}\u00a0\u00bb. Vous devez peut-\u00eatre v\u00e9rifier votre r\u00e9seau local. Si vous avez des difficult\u00e9s \u00e0 connecter votre Kindle au Wi-Fi, vous trouverez de l\u02bcaide \u00e0 l\u02bcadresse www.amazon.com/devicesupport.',
    internetConnectFailedTitle : '\u00c9chec de la connexion',
    internetConnectFailedError : 'Votre Kindle s\u02bcest connect\u00e9 au r\u00e9seau Wi-Fi mais n\u02bca pas pu acc\u00e9der \u00e0 Internet. Si vous avez besoin d\u02bcune aide suppl\u00e9mentaire, veuillez contacter votre fournisseur d\u02bcacc\u00e8s Internet.',
    profNetNameTooLongFailedTitle : 'Le nom du r\u00e9seau est trop long',
    profNetNameTooLongFailedError : 'Votre Kindle n\u02bcest pas en mesure de se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. Le nom du r\u00e9seau est trop long. Voulez-vous configurer ce r\u00e9seau manuellement\u00a0?',
    passwordTooLongTitle    : 'Le mot de passe est trop long',
    passwordTooLongError    : 'Votre Kindle n\u02bcest pas en mesure de se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. Le mot de passe que vous avez saisi est plus long que ce qui est autoris\u00e9 par le r\u00e9seau. Essayez de saisir de nouveau votre mot de passe. Si vous avez des difficult\u00e9s \u00e0 connecter votre Kindle au Wi-Fi, vous trouverez de l\u02bcaide \u00e0 l\u02bcadresse www.amazon.com/devicesupport.',
    passwordTooShortTitle   : 'Le mot de passe est trop court',
    passwordTooShortError   : 'Votre Kindle n\u02bcest pas en mesure de se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. Le mot de passe que vous avez saisi est trop court d\u02bcau moins un caract\u00e8re. Essayez de saisir de nouveau votre mot de passe. Si vous avez des difficult\u00e9s \u00e0 connecter votre Kindle au Wi-Fi, vous trouverez de l\u02bcaide \u00e0 l\u02bcadresse www.amazon.com/devicesupport.',
    wpaEnterpriseErrorTitle : 'R\u00e9seau non pris en charge',
    wpaEnterpriseNotSupportedError : 'Votre Kindle n\u02bcest pas en mesure de se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. Les r\u00e9seaux Wi-Fi d\u02bcentreprise ne sont pas pris en charge par Kindle. Essayez de vous connecter \u00e0 un autre r\u00e9seau. Si vous avez des difficult\u00e9s \u00e0 connecter votre Kindle au Wi-Fi, vous trouverez de l\u02bcaide \u00e0 l\u02bcadresse www.amazon.com/devicesupport.',    
    wpaEnterpriseAuthError  : 'Votre Kindle n\u02bcest pas en mesure de se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. Veuillez saisir \u00e0 nouveau vos nom d\u02bcutilisateur et mot de passe. Si vous avez des difficult\u00e9s \u00e0 connecter votre Kindle au Wi-Fi, vous trouverez de l\u02bcaide \u00e0 l\u02bcadresse www.amazon.com/devicesupport.',
    securityMismatchTitle   : 'Erreur de s\u00e9curit\u00e9',
    securityMismatchError   : 'Votre Kindle n\u02bcest pas en mesure de se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. Le type de s\u00e9curit\u00e9 que vous avez saisi ne correspond pas au type de s\u00e9curit\u00e9 de ce r\u00e9seau Wi-Fi. Veuillez reprendre la configuration du r\u00e9seau manuellement et choisir le type de s\u00e9curit\u00e9 correct. Si vous avez des difficult\u00e9s \u00e0 connecter votre Kindle au Wi-Fi, vous trouverez de l\u02bcaide \u00e0 l\u02bcadresse www.amazon.com/devicesupport.',
    adhocNotSupportedTitle  : 'R\u00e9seau non pris en charge',
    adhocNotSupportedError  : 'Votre Kindle n\u02bcest pas en mesure de se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. Les r\u00e9seaux Wi-Fi peer-to-peer ne sont pas pris en charge par Kindle. Essayez de vous connecter \u00e0 un autre r\u00e9seau. Si vous avez des difficult\u00e9s \u00e0 connecter votre Kindle au Wi-Fi, vous trouverez de l\u02bcaide \u00e0 l\u02bcadresse www.amazon.com/devicesupport.',
    profileFailedError      : 'Impossible de configurer le r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. Les informations de r\u00e9seau que vous avez saisies sont incompl\u00e8tes. Veuillez v\u00e9rifier la configuration du r\u00e9seau et r\u00e9essayer de le configurer. Si vous avez des difficult\u00e9s \u00e0 connecter votre Kindle au Wi-Fi, vous pouvez obtenir de l\u02bcaide \u00e0 l\u02bcadresse www.amazon.com/devicesupport.',
    profileDeleteTitle      : 'Erreur',
    profileDeleteError      : 'Impossible de supprimer le profil du r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb.',
    scanning                : "Recherche",
    scanningForNetwork      : "Recherche des r\u00e9seaux en cours",
    scanComplete            : "Recherche termin\u00e9e",
    connecting              : "Connexion en cours",
    connected               : "Connexion r\u00e9ussie",
    connectionFailed        : "\u00c9chec de la connexion",
    noWifiFound             : "Aucun r\u00e9seau Wi-Fi n\u02bca \u00e9t\u00e9 trouv\u00e9",
    wpsConnectionError      : 'Votre Kindle ne parvient pas \u00e0 se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb en utilisant WPS. Voulez-vous configurer ce r\u00e9seau manuellement\u00a0?',
    wpsButtonNotPressedError : 'Votre Kindle ne parvient pas \u00e0 se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb en utilisant WPS. Veuillez v\u00e9rifier que vous avez appuy\u00e9 sur le bouton WPS.',
    apRejectedError         : 'Votre Kindle ne parvient pas \u00e0 se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. Veuillez v\u00e9rifier que vos param\u00e8tres de s\u00e9curit\u00e9 sont corrects et r\u00e9essayez.',
    apDeniedError           : 'Votre Kindle ne parvient pas \u00e0 se connecter au r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb. Le point d\u02bcacc\u00e8s a rejet\u00e9 la requ\u00eate de connexion. Veuillez v\u00e9rifier la configuration de filtrage d\u02bcadresse MAC de votre routeur puis r\u00e9essayez.',
    forgetProfileTitle      : 'Oublier le r\u00e9seau\u00a0?',
    forgetProfileConfirmation : '\u00cates-vous s\u00fbr(e) de vouloir oublier le r\u00e9seau Wi-Fi \u00ab\u00a0{essid}\u00a0\u00bb\u00a0?',
    forget                  : "OUBLIER",
    advancedDialogDescription : "Vous pouvez configurer la connexion au r\u00e9seau Wi-Fi et les options de s\u00e9curit\u00e9 pour le r\u00e9seau indiqu\u00e9 ci-dessous.",
    caCertificateNotFoundTitle : "Impossible de trouver le certificat",
    caCertificateNotFoundError : 'Le certificat de s\u00e9curit\u00e9 est introuvable. Veuillez en v\u00e9rifier le nom, puis r\u00e9essayez.',
    userGuidePart1 : 'Pour utiliser le mode avion, touchez l\u02bcic\u00f4ne\nActions rapides',
    userGuidePart2 : 'sur la barre d\u02bcoutils, puis Mode avion.'
};

// string map for large mode
var WifiWizardDialogStringTableLarge = {
    disconnect              : "D\u00e9connecter",
    enterAgain              : "Saisir \u00e0 nouveau",
    setUp                   : "Configurer",
    cancel                  : "Annuler",
    connect                 : "Se connecter",
    advanced                : "Avanc\u00e9",
    join                    : "Autre...",
    rescan                  : "Rechercher \u00e0 nouveau",
    tryAgain                : "R\u00e9essayer",
    forget                  : "Oublier"
};


//checks for large mode and constructs WifiWizardDialogStringTable based on the display mode

WifiWizardDialogStringTable = constructTableOnDisplayModeChange(WifiWizardDialogStringTable,WifiWizardDialogStringTableLarge);


var WifiWizardDialogAccessibilityStringTable = {
    closeButtonLabel     :    "Fermer"
};

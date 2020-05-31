
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
    title                   : "Wi-Fi Networks ({numNetworks})",
    advancedOptionsTitle    : "Advanced Options",
    manualEntryButton       : "Enter Other Wi-Fi Network",
    networkNameLabel        : "Network Name",
    identityLabel           : "Username",
    passwordLabel           : "Password",
    connectionTypeLabel     : "Connection Type",
    ipAddressLabel          : "IP Address",
    subnetMaskLabel         : "Subnet Mask",
    routerLabel             : "Router",
    dnsLabel                : "DNS",
    securityTypeLabel       : "Security Type",
    wpaTypeLabel            : "Version",
    eapMethodLabel          : "EAP Method",
    phase2AuthLabel         : "Phase 2 Authentication",
    caCertLabel             : "CA Certificate",
    connectionTypeDhcp      : "DHCP",
    conenctionTypeStatic    : "Static",
    wpaTypePersonal         : "Personal",
    wpaTypeEnterprise       : "Enterprise",
    eapMethodPeap           : "PEAP",
    eapMethodTtls           : "TTLS",
    phase2AuthPap           : "PAP",
    phase2AuthMschapv2      : "MSCHAPv2",
    securityTypeOpen        : "None",
    securityTypeWep         : "WEP",
    securityTypeWpawpa2     : "WPA/WPA2",
    securityTypeWpa2        : "WPA2",
    done                    : "DONE",
    availNetworksLabel      : "Available Networks",
    disconnect              : "DISCONNECT",
    enterAgain              : "ENTER AGAIN",
    setUp                   : "SET UP",
    okay                    : "OK",
    cancel                  : "CANCEL",
    connect                 : "CONNECT",
    wpsConnect              : "WPS",
    advanced                : "ADVANCED",
    join                    : "OTHER...",
    rescan                  : "RESCAN",
    tryAgain                : "TRY AGAIN",
    passwordHide            : "Hide Password",
    storeCredentials        : "Save password to Amazon.",
    learnMoreLabel          : "Learn More",
    manualEntryTitle        : "Enter Wi-Fi Network",
    passwordEntryTitle      : "Wi-Fi Password Required",
    loginTitle              : "Wi-Fi Login",
    passwordErrorTitle      : "Incorrect Password",
    defaultErrorTitle       : "Wi-Fi Error",
    defaultError            : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}". --"{error}"--. Press Set Up to enter your password again or set up your network manually. If you have issues connecting your Kindle to Wi-Fi, you can find help at www.amazon.com/devicesupport.',
    passwordFailedError     : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}". The password you entered is incorrect. Try entering your password again or setting up your network manually. If you have issues connecting your Kindle to Wi-Fi, you can find help at www.amazon.com/devicesupport.',
    noProfileTitle     : 'Wi-Fi Not Configured',
    noProfileError          : 'Your Kindle is unable to connect to the Wi-Fi network. This network is not configured. If you have issues connecting your Kindle to Wi-Fi, you can find help at www.amazon.com/devicesupport.',
    failedToConnectError    : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}". Press Set Up to enter your password again or set up your network manually. If you have issues connecting your Kindle to Wi-Fi, you can find help at www.amazon.com/devicesupport.',
    failedToConnectEnterpriseError : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}". Please check your credentials or contact your system administrator.',
    wifiNotReady            : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}". Tap the Home button, then connect to Wi-Fi again. If you have issues connecting your Kindle to Wi-Fi, you can find help at www.amazon.com/devicesupport.',
    localNetworkFailedError : 'Your Kindle is unable to connect to your local network "{essid}". You may need to check your local network. If you have issues connecting your Kindle to Wi-Fi, you can find help at www.amazon.com/devicesupport.',
    internetConnectFailedTitle : 'Connection Failed',
    internetConnectFailedError : 'Your Kindle connected to the Wi-Fi network but could not reach the Internet. Contact your Internet Service Provider for further assistance.',
    profNetNameTooLongFailedTitle : 'Network Name Too Long',
    profNetNameTooLongFailedError : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}". The network name is too long. Would you like to set up this network manually?',
    passwordTooLongTitle    : 'Password Too Long',
    passwordTooLongError    : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}". The password you entered is longer than allowed by the Wi-Fi network. Try entering your password again. If you have issues connecting your Kindle to Wi-Fi, you can find help at www.amazon.com/devicesupport.',
    passwordTooShortTitle   : 'Password Too Short',
    passwordTooShortError   : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}". The password you entered is missing one or more characters. Try entering your password again. If you have issues connecting your Kindle to Wi-Fi, you can find help at www.amazon.com/devicesupport.',
    wpaEnterpriseErrorTitle : 'Unsupported Network',
    wpaEnterpriseNotSupportedError : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}". Enterprise Wi-Fi networks are not supported on Kindle. Try connecting to another network. If you have issues connecting your Kindle to Wi-Fi, you can find help at www.amazon.com/devicesupport.',    
    wpaEnterpriseAuthError  : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}". Try entering your username and password again. If you have issues connecting your Kindle to Wi-Fi, you can find help at www.amazon.com/devicesupport.',
    securityMismatchTitle   : 'Security Error',
    securityMismatchError   : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}". The security type you entered does not match the security type of the Wi-Fi network. Please set up the network manually again and select the correct security type. If you have issues connecting your Kindle to Wi-Fi, you can find help at www.amazon.com/devicesupport.',
    adhocNotSupportedTitle  : 'Unsupported Network',
    adhocNotSupportedError  : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}". Peer-to-peer Wi-Fi networks are not supported on Kindle. Try connecting to another network. If you have issues connecting your Kindle to Wi-Fi, you can find help at www.amazon.com/devicesupport.',
    profileFailedError      : 'Unable to set up the Wi-Fi network "{essid}". The network information you entered is incomplete. Please check network configuration and try setting up the network again. If you have issues connecting your Kindle to Wi-Fi, you can find help at www.amazon.com/devicesupport.',
    profileDeleteTitle      : 'Error',
    profileDeleteError      : 'Unable to delete profile for Wi-Fi network "{essid}".',
    scanning                : "Scanning",
    scanningForNetwork      : "Scanning for Networks",
    scanComplete            : "Scan Complete",
    connecting              : "Connecting",
    connected               : "Connected",
    connectionFailed        : "Connection Failed",
    noWifiFound             : "No Wi-Fi networks were found",
    wpsConnectionError      : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}" using WPS. Would you like to set up this network manually?',
    wpsButtonNotPressedError : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}" using WPS. Please check that the WPS button was tapped.',
    apRejectedError         : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}". Check that your security settings are correct and try again.',
    apDeniedError           : 'Your Kindle is unable to connect to the Wi-Fi network "{essid}". The access point rejected the connection request. Check your router\u02bcs MAC address filtering settings and try again.',
    forgetProfileTitle      : 'Forget Network?',
    forgetProfileConfirmation : 'Are you sure you want to forget the Wi-Fi network "{essid}"?',
    forget                  : "FORGET",
    advancedDialogDescription : "You can set up the Wi-Fi network connection and security options for the network named below.",
    caCertificateNotFoundTitle : "Unable to Find Certificate",
    caCertificateNotFoundError : 'The security certificate cannot be located. Please verify that the name is correct and try again.',
    userGuidePart1 : 'To use Aeroplane Mode, tap Quick Actions',
    userGuidePart2 : 'on the toolbar, and then tap Aeroplane Mode.'
};

// string map for large mode
var WifiWizardDialogStringTableLarge = {
    disconnect              : "Disconnect",
    enterAgain              : "Enter Again",
    setUp                   : "Set up",
    cancel                  : "Cancel",
    connect                 : "Connect",
    advanced                : "Advanced",
    join                    : "Other...",
    rescan                  : "Rescan",
    tryAgain                : "Try Again",
    forget                  : "Forget"
};


//checks for large mode and constructs WifiWizardDialogStringTable based on the display mode

WifiWizardDialogStringTable = constructTableOnDisplayModeChange(WifiWizardDialogStringTable,WifiWizardDialogStringTableLarge);


var WifiWizardDialogAccessibilityStringTable = {
    closeButtonLabel     :    "Close"
};

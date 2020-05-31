
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
    title                   : "WiFi \u7f51\u7edc\uff08{numNetworks}\uff09",
    advancedOptionsTitle    : "\u9ad8\u7ea7\u9009\u9879",
    manualEntryButton       : "\u8fde\u63a5\u5176\u4ed6 WiFi \u7f51\u7edc",
    networkNameLabel        : "\u7f51\u7edc\u540d\u79f0",
    identityLabel           : "\u7528\u6237\u540d",
    passwordLabel           : "\u5bc6\u7801",
    connectionTypeLabel     : "\u8fde\u63a5\u7c7b\u578b",
    ipAddressLabel          : "IP \u5730\u5740",
    subnetMaskLabel         : "\u5b50\u7f51\u63a9\u7801",
    routerLabel             : "\u8def\u7531\u5668",
    dnsLabel                : "DNS",
    securityTypeLabel       : "\u5b89\u5168\u7c7b\u578b",
    wpaTypeLabel            : "\u7248\u672c",
    eapMethodLabel          : "EAP \u65b9\u6cd5",
    phase2AuthLabel         : "\u53cc\u91cd\u9a8c\u8bc1",
    caCertLabel             : "CA \u8bc1\u4e66",
    connectionTypeDhcp      : "DHCP",
    conenctionTypeStatic    : "\u9759\u6001",
    wpaTypePersonal         : "\u4e2a\u4eba",
    wpaTypeEnterprise       : "\u4f01\u4e1a",
    eapMethodPeap           : "PEAP",
    eapMethodTtls           : "TTLS",
    phase2AuthPap           : "PAP",
    phase2AuthMschapv2      : "MSCHAPv2",
    securityTypeOpen        : "\u65e0",
    securityTypeWep         : "WEP",
    securityTypeWpawpa2     : "WPA/WPA2",
    securityTypeWpa2        : "WPA2",
    done                    : "\u5b8c\u6210",
    availNetworksLabel      : "\u53ef\u7528\u7f51\u7edc",
    disconnect              : "\u65ad\u5f00\u8fde\u63a5",
    enterAgain              : "\u518d\u6b21\u8f93\u5165",
    setUp                   : "\u8bbe\u7f6e",
    okay                    : "\u786e\u5b9a",
    cancel                  : "\u53d6\u6d88",
    connect                 : "\u8fde\u63a5",
    wpsConnect              : "WPS",
    advanced                : "\u9ad8\u7ea7",
    join                    : "\u5176\u4ed6...",
    rescan                  : "\u91cd\u65b0\u626b\u63cf",
    tryAgain                : "\u91cd\u8bd5",
    passwordHide            : "\u9690\u85cf\u5bc6\u7801",
    storeCredentials        : "\u5c06\u5bc6\u7801\u4fdd\u5b58\u5230\u4e9a\u9a6c\u900a\u3002",
    learnMoreLabel          : "\u4e86\u89e3\u8be6\u60c5",
    manualEntryTitle        : "\u8fde\u63a5 WiFi \u7f51\u7edc",
    passwordEntryTitle      : "\u8981\u6c42 WiFi \u5bc6\u7801",
    loginTitle              : "WiFi \u767b\u5f55",
    passwordErrorTitle      : "\u5bc6\u7801\u6709\u8bef",
    defaultErrorTitle       : "WiFi \u9519\u8bef",
    defaultError            : '\u65e0\u6cd5\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\u3002 --\u201c{error}\u201d--\u3002\u70b9\u51fb\u3010\u8bbe\u7f6e\u3011\u9009\u9879\u518d\u6b21\u8f93\u5165\u5bc6\u7801\uff0c\u6216\u8005\u624b\u52a8\u8bbe\u7f6e\u60a8\u7684\u7f51\u7edc\u3002\u5982\u679c\u60a8\u5728\u8fde\u63a5 Kindle \u81f3 WiFi \u7f51\u7edc\u65f6\u9047\u5230\u95ee\u9898\uff0c\u60a8\u53ef\u4ee5\u5728\u6b64\u83b7\u53d6\u5e2e\u52a9: www.amazon.com/devicesupport\u3002',
    passwordFailedError     : '\u65e0\u6cd5\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\u3002\u60a8\u8f93\u5165\u7684\u5bc6\u7801\u6709\u8bef\u3002\u8bf7\u91cd\u65b0\u8f93\u5165\u6216\u8005\u624b\u52a8\u8bbe\u7f6e\u60a8\u7684\u7f51\u7edc\u3002\u5982\u679c\u60a8\u5728\u8fde\u63a5 Kindle \u81f3 WiFi \u7f51\u7edc\u65f6\u9047\u5230\u95ee\u9898\uff0c\u60a8\u53ef\u4ee5\u5728\u6b64\u83b7\u53d6\u5e2e\u52a9: www.amazon.com/devicesupport\u3002',
    noProfileTitle     : '\u5c1a\u672a\u914d\u7f6e WiFi',
    noProfileError          : '\u65e0\u6cd5\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\uff0c\u8be5\u7f51\u7edc\u5c1a\u672a\u914d\u7f6e\u3002\u5982\u679c\u60a8\u5728\u8fde\u63a5 Kindle \u81f3 WiFi \u7f51\u7edc\u65f6\u9047\u5230\u95ee\u9898\uff0c\u60a8\u53ef\u4ee5\u5728\u6b64\u83b7\u53d6\u5e2e\u52a9: www.amazon.com/devicesupport\u3002',
    failedToConnectError    : '\u65e0\u6cd5\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\u3002\u70b9\u51fb\u3010\u8bbe\u7f6e\u3011\u518d\u6b21\u8f93\u5165\u5bc6\u7801\uff0c\u6216\u8005\u624b\u52a8\u8bbe\u7f6e\u60a8\u7684\u7f51\u7edc\u3002\u5982\u679c\u60a8\u5728\u8fde\u63a5 Kindle \u81f3 WiFi \u7f51\u7edc\u65f6\u9047\u5230\u95ee\u9898\uff0c\u60a8\u53ef\u4ee5\u5728\u6b64\u83b7\u53d6\u5e2e\u52a9: www.amazon.com/devicesupport\u3002',
    failedToConnectEnterpriseError : '\u60a8\u7684 Kindle \u65e0\u6cd5\u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\u3002\u8bf7\u68c0\u67e5\u60a8\u7684\u8bc1\u4e66\u6216\u8054\u7edc\u60a8\u7684\u7cfb\u7edf\u7ba1\u7406\u5458\u3002',
    wifiNotReady            : '\u65e0\u6cd5\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\u3002\u8bf7\u70b9\u51fb\u3010\u4e3b\u9875\u3011\u952e\uff0c\u91cd\u65b0\u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u3002\u5982\u679c\u60a8\u5728\u8fde\u63a5 Kindle \u81f3 WiFi \u7f51\u7edc\u65f6\u9047\u5230\u95ee\u9898\uff0c\u60a8\u53ef\u4ee5\u5728\u6b64\u83b7\u53d6\u5e2e\u52a9: www.amazon.com/devicesupport\u3002',
    localNetworkFailedError : '\u65e0\u6cd5\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230\u672c\u5730\u7f51\u7edc\u201c{essid}\u201d\uff0c\u60a8\u53ef\u80fd\u9700\u8981\u68c0\u67e5\u60a8\u7684\u672c\u5730\u7f51\u7edc\u3002\u5982\u679c\u60a8\u5728\u8fde\u63a5 Kindle \u81f3 WiFi \u7f51\u7edc\u65f6\u9047\u5230\u95ee\u9898\uff0c\u60a8\u53ef\u4ee5\u5728\u6b64\u83b7\u53d6\u5e2e\u52a9: www.amazon.com/devicesupport\u3002',
    internetConnectFailedTitle : '\u8fde\u63a5\u5931\u8d25',
    internetConnectFailedError : '\u60a8\u7684 Kindle \u5df2\u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u4f46\u65e0\u6cd5\u8fde\u63a5\u5230\u4e92\u8054\u7f51\u3002\u8bf7\u8054\u7cfb\u60a8\u7684\u4e92\u8054\u7f51\u670d\u52a1\u63d0\u4f9b\u5546\u4ee5\u83b7\u53d6\u8fdb\u4e00\u6b65\u5e2e\u52a9\u3002',
    profNetNameTooLongFailedTitle : '\u7f51\u7edc\u540d\u79f0\u8fc7\u957f',
    profNetNameTooLongFailedError : '\u65e0\u6cd5\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\u3002\u7f51\u7edc\u540d\u79f0\u8fc7\u957f\uff0c\u662f\u5426\u5e0c\u671b\u624b\u52a8\u8bbe\u7f6e\u8be5\u7f51\u7edc\uff1f',
    passwordTooLongTitle    : '\u5bc6\u7801\u8fc7\u957f',
    passwordTooLongError    : '\u65e0\u6cd5\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\uff0c\u60a8\u8f93\u5165\u7684\u5bc6\u7801\u4f4d\u6570\u8d85\u8fc7\u4e86 WiFi \u7f51\u7edc\u5141\u8bb8\u7684\u957f\u5ea6\u3002\u8bf7\u91cd\u65b0\u8f93\u5165\u5bc6\u7801\u3002\u5982\u679c\u60a8\u5728\u8fde\u63a5 Kindle \u81f3 WiFi \u7f51\u7edc\u65f6\u9047\u5230\u95ee\u9898\uff0c\u60a8\u53ef\u4ee5\u5728\u6b64\u83b7\u53d6\u5e2e\u52a9: www.amazon.com/devicesupport\u3002',
    passwordTooShortTitle   : '\u5bc6\u7801\u8fc7\u77ed',
    passwordTooShortError   : '\u65e0\u6cd5\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\uff0c\u60a8\u8f93\u5165\u7684\u5bc6\u7801\u5c11\u4e00\u4e2a\u6216\u591a\u4e2a\u5b57\u7b26\u3002\u8bf7\u91cd\u65b0\u8f93\u5165\u5bc6\u7801\u3002\u5982\u679c\u60a8\u5728\u8fde\u63a5 Kindle \u81f3 WiFi \u7f51\u7edc\u65f6\u9047\u5230\u95ee\u9898\uff0c\u60a8\u53ef\u4ee5\u5728\u6b64\u83b7\u53d6\u5e2e\u52a9: www.amazon.com/devicesupport\u3002',
    wpaEnterpriseErrorTitle : '\u7f51\u7edc\u4e0d\u652f\u6301',
    wpaEnterpriseNotSupportedError : '\u65e0\u6cd5\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\u3002Kindle \u4e0d\u652f\u6301\u4f01\u4e1a\u7ea7 WiFi \u7f51\u7edc\uff0c\u8bf7\u5c1d\u8bd5\u8fde\u63a5\u5230\u5176\u4ed6\u7f51\u7edc\u3002\u5982\u679c\u60a8\u5728\u8fde\u63a5 Kindle \u81f3 WiFi \u7f51\u7edc\u65f6\u9047\u5230\u95ee\u9898\uff0c\u60a8\u53ef\u4ee5\u5728\u6b64\u83b7\u53d6\u5e2e\u52a9: www.amazon.com/devicesupport\u3002',    
    wpaEnterpriseAuthError  : '\u65e0\u6cd5\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\u3002\u8bf7\u91cd\u65b0\u8f93\u5165\u60a8\u7684\u7528\u6237\u540d\u548c\u5bc6\u7801\u3002\u5982\u679c\u60a8\u5728\u8fde\u63a5 Kindle \u81f3 WiFi \u65f6\u9047\u5230\u95ee\u9898\uff0c\u8bf7\u8bbf\u95ee www.amazon.com/devicesupport \u4ee5\u83b7\u53d6\u5e2e\u52a9\u3002',
    securityMismatchTitle   : '\u5b89\u5168\u9519\u8bef',
    securityMismatchError   : '\u65e0\u6cd5\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\uff0c\u60a8\u8f93\u5165\u7684\u5b89\u5168\u7c7b\u578b\u4e0e WiFi \u7f51\u7edc\u7684\u5b89\u5168\u7c7b\u578b\u4e0d\u5339\u914d\u3002\u8bf7\u91cd\u65b0\u624b\u52a8\u8bbe\u7f6e\u7f51\u7edc\uff0c\u5e76\u9009\u62e9\u6b63\u786e\u7684\u5b89\u5168\u7c7b\u578b\u3002\u5982\u679c\u60a8\u5728\u8fde\u63a5 Kindle \u81f3 WiFi \u65f6\u9047\u5230\u95ee\u9898\u5e76\u9700\u8981\u5e2e\u52a9\uff0c\u8bf7\u8bbf\u95ee: www.amazon.com/devicesupport\u3002',
    adhocNotSupportedTitle  : '\u7f51\u7edc\u4e0d\u652f\u6301',
    adhocNotSupportedError  : '\u65e0\u6cd5\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\u3002Kindle \u4e0d\u652f\u6301\u7aef\u5230\u7aef WiFi \u7f51\u7edc\uff0c\u8bf7\u5c1d\u8bd5\u8fde\u63a5\u5230\u5176\u4ed6\u7f51\u7edc\u3002\u5982\u679c\u60a8\u5728\u8fde\u63a5 Kindle \u81f3 WiFi \u65f6\u9047\u5230\u95ee\u9898\u5e76\u9700\u8981\u5e2e\u52a9\uff0c\u8bf7\u8bbf\u95ee: www.amazon.com/devicesupport\u3002',
    profileFailedError      : '\u65e0\u6cd5\u8bbe\u7f6e WiFi \u7f51\u7edc\u201c{essid}\u201d\uff0c\u60a8\u8f93\u5165\u7684\u7f51\u7edc\u4fe1\u606f\u4e0d\u5b8c\u6574\u3002\u8bf7\u68c0\u67e5\u7f51\u7edc\u914d\u7f6e\uff0c\u5c1d\u8bd5\u91cd\u65b0\u8bbe\u7f6e\u7f51\u7edc\u3002\u5982\u679c\u60a8\u5728\u8fde\u63a5 Kindle \u81f3 WiFi \u7f51\u7edc\u65f6\u9047\u5230\u95ee\u9898\uff0c\u60a8\u53ef\u4ee5\u5728\u6b64\u83b7\u53d6\u5e2e\u52a9: www.amazon.com/devicesupport\u3002',
    profileDeleteTitle      : '\u9519\u8bef',
    profileDeleteError      : '\u65e0\u6cd5\u5220\u9664 WiFi \u7f51\u7edc\u201c{essid}\u201d\u7684\u914d\u7f6e\u6587\u4ef6\u3002',
    scanning                : "\u6b63\u5728\u626b\u63cf",
    scanningForNetwork      : "\u6b63\u5728\u626b\u63cf\u7f51\u7edc",
    scanComplete            : "\u626b\u63cf\u5b8c\u6bd5",
    connecting              : "\u6b63\u5728\u8fde\u63a5",
    connected               : "\u5df2\u8fde\u63a5",
    connectionFailed        : "\u8fde\u63a5\u5931\u8d25",
    noWifiFound             : "\u6ca1\u6709\u53d1\u73b0 WiFi \u7f51\u7edc",
    wpsConnectionError      : '\u65e0\u6cd5\u4f7f\u7528 WPS \u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\uff0c\u662f\u5426\u624b\u52a8\u8bbe\u7f6e\u8be5\u7f51\u7edc\uff1f',
    wpsButtonNotPressedError : '\u65e0\u6cd5\u4f7f\u7528 WPS \u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\uff0c\u8bf7\u786e\u8ba4\u5df2\u70b9\u51fb\u3010WPS\u3011\u3002',
    apRejectedError         : '\u65e0\u6cd5\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\u3002\u8bf7\u786e\u4fdd\u60a8\u7684\u5b89\u5168\u8bbe\u7f6e\u6b63\u786e\u65e0\u8bef\uff0c\u7136\u540e\u91cd\u8bd5\u3002',
    apDeniedError           : '\u60a8\u7684 Kindle \u65e0\u6cd5\u8fde\u63a5\u5230 WiFi \u7f51\u7edc\u201c{essid}\u201d\uff0c\u63a5\u5165\u70b9\u62d2\u7edd\u4e86\u60a8\u7684\u8fde\u63a5\u8bf7\u6c42\u3002\u8bf7\u68c0\u67e5\u8def\u7531\u5668\u7684 MAC \u5730\u5740\u8fc7\u6ee4\u89c4\u5219\uff0c\u7136\u540e\u91cd\u8bd5\u3002',
    forgetProfileTitle      : '\u5ffd\u7565\u7f51\u7edc\uff1f',
    forgetProfileConfirmation : '\u662f\u5426\u786e\u5b9a\u5ffd\u7565 WiFi \u7f51\u7edc\u201c{essid}\u201d\uff1f',
    forget                  : "\u5ffd\u7565",
    advancedDialogDescription : "\u60a8\u53ef\u4ee5\u4e3a\u4ee5\u4e0b\u7f51\u7edc\u8bbe\u7f6e WiFi \u7f51\u7edc\u8fde\u63a5\u548c\u5b89\u5168\u9009\u9879\u3002",
    caCertificateNotFoundTitle : "\u65e0\u6cd5\u627e\u5230\u8bc1\u4e66",
    caCertificateNotFoundError : '\u65e0\u6cd5\u627e\u5230\u5b89\u5168\u8bc1\u4e66\uff0c\u8bf7\u786e\u8ba4\u8bc1\u4e66\u540d\u79f0\u6b63\u786e\uff0c\u7136\u540e\u91cd\u8bd5\u3002',
    userGuidePart1 : '\u5982\u9700\u4f7f\u7528\u98de\u884c\u6a21\u5f0f\uff0c\u8bf7\u5728\u5de5\u5177\u680f\u4e0a\u70b9\u51fb\u3010\u5feb\u6377\u64cd\u4f5c\u3011',
    userGuidePart2 : '\uff0c\u7136\u540e\u70b9\u51fb\u3010\u98de\u884c\u6a21\u5f0f\u3011\u3002'
};

// string map for large mode
var WifiWizardDialogStringTableLarge = {
    disconnect              : "\u65ad\u5f00\u8fde\u63a5",
    enterAgain              : "\u91cd\u65b0\u8f93\u5165",
    setUp                   : "\u8bbe\u7f6e",
    cancel                  : "\u53d6\u6d88",
    connect                 : "\u8fde\u63a5",
    advanced                : "\u9ad8\u7ea7",
    join                    : "\u5176\u4ed6\u2026",
    rescan                  : "\u91cd\u65b0\u626b\u63cf",
    tryAgain                : "\u91cd\u8bd5",
    forget                  : "\u5ffd\u7565"
};


//checks for large mode and constructs WifiWizardDialogStringTable based on the display mode

WifiWizardDialogStringTable = constructTableOnDisplayModeChange(WifiWizardDialogStringTable,WifiWizardDialogStringTableLarge);


var WifiWizardDialogAccessibilityStringTable = {
    closeButtonLabel     :    "\u5173\u95ed"
};


// string map for default mode
var SimpleAlertStringTable = {
    okay                                : "\u786e\u5b9a",
    yes                                 : "\u597d\u7684",
    cancel                              : "\u53d6\u6d88",
    no                                  : "\u5426",
    close                               : "\u5173\u95ed",
    cancelPairing                       : "\u53d6\u6d88\u914d\u5bf9",
    continueText			            : "\u7ee7\u7eed",
    demoWifiAlertTitle			        : "\u529f\u80fd\u4e0d\u53ef\u7528",
    demoWifiAlertText			        : "\u672c\u529f\u80fd\u5728\u6f14\u793a\u6a21\u5f0f\u4e0b\u4e0d\u53ef\u7528\u3002",	
    lowFlashMemoryAlertTitle            : "\u5185\u5b58\u4e0d\u8db3",
    lowFlashMemoryAlertText             : "Kindle \u5185\u5b58\u4e0d\u8db3\uff0c\u65e0\u6cd5\u6dfb\u52a0\u6216\u7f16\u8f91\u672c\u6587\u6863\u7684\u7b14\u8bb0\u6216\u6807\u6ce8\u3002\u8bf7\u5220\u9664\u3010\u4e3b\u9875\u3011\u4e0a\u90e8\u5206\u5185\u5bb9\u4ee5\u91ca\u653e\u66f4\u591a Kindle \u53ef\u7528\u5185\u5b58\u3002",
    battPercentLowAlertTitle                        : "\u7535\u6c60\u7535\u91cf\u8fc7\u4f4e",
    primaryBattPercentLowAlertAirplaneMainText      : "\u7535\u6c60\u7535\u91cf\u8fc7\u4f4e\uff0c\u8bf7\u4e3a\u60a8\u7684 Kindle \u5145\u7535\u3002",
    primaryBattPercentLowAlertAirplaneMainText2     : "\u7535\u6c60\u7535\u91cf\u4e0d\u8db3\u3002\u8bf7\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230\u7535\u6e90\u6216\u5145\u7535\u4fdd\u62a4\u5957\u3002",
    primaryBattPercentLowAlertWirelessMainText      : "\u7535\u6c60\u7535\u91cf\u8fc7\u4f4e\uff0c\u8bf7\u4e3a\u60a8\u7684 Kindle \u5145\u7535\u3002\u5982\u679c\u65e0\u7ebf\u8fde\u63a5\u5df2\u5f00\u542f\uff0c\u60a8\u53ef\u4ee5\u5c1d\u8bd5\u5c06\u5176\u5173\u95ed\u4ee5\u5ef6\u957f\u9605\u8bfb\u65f6\u95f4\u3002",
    primaryBattPercentLowAlertWirelessMainText2     : "\u7535\u6c60\u7535\u91cf\u4e0d\u8db3\uff0c\u8bf7\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230\u7535\u6e90\u6216\u5145\u7535\u4fdd\u62a4\u5957\u3002\u5982\u679c\u65e0\u7ebf\u8fde\u63a5\u5df2\u5f00\u542f\uff0c\u60a8\u53ef\u4ee5\u5c1d\u8bd5\u5c06\u5176\u5173\u95ed\u4ee5\u5ef6\u957f\u9605\u8bfb\u65f6\u95f4\u3002",
    battPercentVeryLowAlertTitle                    : "\u7535\u6c60\u7535\u91cf\u4e25\u91cd\u4e0d\u8db3",
    primaryBattPercentVeryLowAlertMainText          : "\u7535\u6c60\u7535\u91cf\u5373\u5c06\u8017\u5c3d\uff0cKindle \u5373\u5c06\u5173\u95ed\u3002\u5982\u679c\u60a8\u5e0c\u671b\u7ee7\u7eed\u4f7f\u7528 Kindle\uff0c\u8bf7\u8fde\u63a5\u7535\u6e90\u3002",
    primaryBattPercentVeryLowAlertMainText2         : "\u7535\u6c60\u7535\u91cf\u5373\u5c06\u8017\u5c3d\uff0cKindle \u5373\u5c06\u5173\u95ed\u3002\u8bf7\u7acb\u5373\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230\u7535\u6e90\u6216\u5145\u7535\u4fdd\u62a4\u5957\u3002",
    secondaryBattPercentLowAlertAirplaneMainText    : "\u60a8\u7684\u5145\u7535\u4fdd\u62a4\u5957\u7535\u6c60\u7535\u91cf\u4e0d\u8db3\u3002\u8bf7\u8fde\u63a5\u60a8\u7684 Kindle \u548c\u5145\u7535\u4fdd\u62a4\u5957\uff0c\u7136\u540e\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230\u7535\u6e90\u3002",
    secondaryBattPercentLowAlertWirelessMainText    : "\u60a8\u7684\u5145\u7535\u4fdd\u62a4\u5957\u7535\u6c60\u7535\u91cf\u4e0d\u8db3\uff0c\u8bf7\u8fde\u63a5\u60a8\u7684 Kindle \u548c\u5145\u7535\u4fdd\u62a4\u5957\uff0c\u7136\u540e\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230\u7535\u6e90\u3002\u5982\u679c\u65e0\u7ebf\u8fde\u63a5\u5df2\u5f00\u542f\uff0c\u60a8\u53ef\u4ee5\u5c1d\u8bd5\u5c06\u5176\u5173\u95ed\u4ee5\u5ef6\u957f\u9605\u8bfb\u65f6\u95f4\u3002",
    secondaryBattPercentVeryLowAlertMainText        : "\u60a8\u7684\u5145\u7535\u4fdd\u62a4\u5957\u7535\u6c60\u7535\u91cf\u5373\u5c06\u8017\u5c3d\u3002\u8bf7\u8fde\u63a5\u60a8\u7684 Kindle \u548c\u5145\u7535\u4fdd\u62a4\u5957\uff0c\u7136\u540e\u5c06\u60a8\u7684 Kindle \u8fde\u63a5\u5230\u7535\u6e90\u3002",
    allBattPercentLowAlertAirplaneMainText          : "\u7535\u6c60\u7535\u91cf\u4e0d\u8db3\u3002\u8bf7\u5c06\u60a8\u7684 Kindle \u548c\u5145\u7535\u4fdd\u62a4\u5957\u8fde\u63a5\u5230\u7535\u6e90\u3002",
    allBattPercentLowAlertWirelessMainText          : "\u7535\u6c60\u7535\u91cf\u4e0d\u8db3\uff0c\u8bf7\u5c06\u60a8\u7684 Kindle \u548c\u5145\u7535\u4fdd\u62a4\u5957\u8fde\u63a5\u5230\u7535\u6e90\u3002\u5982\u679c\u65e0\u7ebf\u8fde\u63a5\u5df2\u5f00\u542f\uff0c\u60a8\u53ef\u4ee5\u5c1d\u8bd5\u5c06\u5176\u5173\u95ed\u4ee5\u5ef6\u957f\u9605\u8bfb\u65f6\u95f4\u3002",
    allBattPercentVeryLowAlertTitle                 : "\u7535\u6c60\u7535\u91cf\u4e25\u91cd\u4e0d\u8db3",
    allBattPercentVeryLowAlertMainText              : "\u7535\u6c60\u7535\u91cf\u5373\u5c06\u8017\u5c3d\uff0cKindle \u5373\u5c06\u5173\u95ed\u3002\u8bf7\u5c06\u60a8\u7684 Kindle \u548c\u5145\u7535\u4fdd\u62a4\u5957\u8fde\u63a5\u5230\u7535\u6e90\u3002",
    sodaErrorAlertTitle                             : "\u5145\u7535\u4fdd\u62a4\u5957\u51fa\u9519",
    sodaConnectionAlertTitle                        : "\u5145\u7535\u4fdd\u62a4\u5957\u8fde\u63a5",
    sodaConnectionAlertMainText                     : "\u5145\u7535\u4fdd\u62a4\u5957\u53ef\u80fd\u672a\u6b63\u786e\u8fde\u63a5 Kindle\uff0c\u8bf7\u91cd\u8bd5\u8fde\u63a5\u3002\u5982\u679c\u7535\u91cf\u4e0d\u8db3\uff0c\u8bf7\u5c06 Kindle \u548c\u5145\u7535\u4fdd\u62a4\u5957\u8fde\u63a5\u5230 USB \u5145\u7535\u5668\u3002",
    sodaInterfaceErrorDockingAlertMainText          : "\u60a8\u7684\u4fdd\u62a4\u5957\u672a\u80fd\u59a5\u5584\u8fde\u63a5\u3002\u8bf7\u68c0\u67e5\u63a5\u53e3\u3002\u5982\u679c\u4ecd\u672a\u5145\u7535\uff0c\u8bf7\u8054\u7cfb Kindle \u5ba2\u670d: www.amazon.com/devicesupport\u3002",
    sodaInterfaceErrorThermistorCutAlertMainText    : "\u60a8\u7684\u4fdd\u62a4\u5957\u65e0\u6cd5\u5145\u7535\u3002\u8bf7\u68c0\u67e5\u8bbe\u5907\u63a5\u53e3\u3002\u5982\u9700\u5e2e\u52a9\uff0c\u8bf7\u8054\u7cfb Kindle \u5ba2\u670d\uff1awww.amazon.com/devicesupport\u3002",
    sodaInvalidBatteryAlertMainText                 : "\u4e0d\u652f\u6301\u60a8\u8fde\u63a5\u5230 Kindle \u7684\u4fdd\u62a4\u5957\u3002\u8bf7\u8fde\u63a5\u53d7\u652f\u6301\u7684\u4fdd\u62a4\u5957\u3002",
    batteryOperatingTempAlertTitle      : "\u5de5\u4f5c\u6e29\u5ea6\u8b66\u544a",
    batteryTemperatureTooHotText        : "\u60a8\u7684 Kindle \u76ee\u524d\u5904\u4e8e\u63a8\u8350\u6e29\u5ea6\u8303\u56f4\u4ee5\u5916\uff0c\u5373\u5c06\u505c\u6b62\u5de5\u4f5c\u3002\u8bf7\u5c06 Kindle \u4e8e\u9634\u51c9\u5904\u9759\u7f6e\u51e0\u5206\u949f\u540e\u518d\u5f85\u673a\u3002",
    batteryTemperatureTooColdText       : "\u60a8\u7684 Kindle \u76ee\u524d\u5904\u4e8e\u63a8\u8350\u6e29\u5ea6\u8303\u56f4\u4ee5\u5916\uff0c\u5373\u5c06\u505c\u6b62\u5de5\u4f5c\u3002\u8bf7\u5c06 Kindle \u4e8e\u6e29\u6696\u5904\u9759\u7f6e\u51e0\u5206\u949f\u540e\u518d\u5f85\u673a\u3002",
    turnWirelessOnAlertTitle            : "\u6253\u5f00\u65e0\u7ebf\u8fde\u63a5\uff1f",
    turnWirelessOnAlertMainText         : "\u65e0\u7ebf\u8fde\u63a5\u5df2\u5173\u95ed\u3002<br><br>\u662f\u5426\u5e0c\u671b\u6253\u5f00\u65e0\u7ebf\u8fde\u63a5\uff1f",
    turnAirplaneModeAlertTitle          : "\u98de\u884c\u6a21\u5f0f",
    turnAirplaneModeAlertMainText       : "\u60a8\u7684 Kindle \u4f3c\u4e4e\u5904\u4e8e\u3010\u98de\u884c\u6a21\u5f0f\u3011\uff0c\u65e0\u6cd5\u8fde\u63a5\u5230 Wi-Fi\u3002<br><br>\u60a8\u786e\u5b9a\u8981\u5173\u95ed\u3010\u98de\u884c\u6a21\u5f0f\u3011\u5417\uff1f",
    emptyPlaylistAlertTitle             : "\u6ca1\u6709\u53d1\u73b0 MP3 \u6587\u4ef6",
    emptyPlaylistAlertText              : '\u8981\u64ad\u653e MP3 \u6587\u4ef6\uff0c\u8bf7\u5148\u5c06\u6587\u4ef6\u4ece\u7535\u8111\u590d\u5236\u5230 Kindle \u7684\u201cmusic\u201d\u6587\u4ef6\u5939\u4e2d\u3002',
    failedToStartActiveContentTitle     : "\u542f\u52a8\u5185\u5bb9\u65f6\u51fa\u9519",
    failedToStartActiveContentText      : "\u65e0\u6cd5\u6253\u5f00\u5185\u5bb9\u3002",
    launchCaptivePortalAlertTitle       : "\u8981\u6c42 WiFi \u767b\u5f55",
    launchCaptivePortalAlertMainText    : "\u60a8\u6b63\u5728\u8fde\u63a5\u7684 WiFi \u7f51\u7edc\u8981\u6c42\u60a8\u5728\u8bbf\u95ee\u4e92\u8054\u7f51\u4e4b\u524d\u5148\u767b\u5f55\u3002<br><br>\u662f\u5426\u524d\u5f80\u4f53\u9a8c\u7248\u7f51\u9875\u6d4f\u89c8\u5668\u5e76\u767b\u5f55 {essid}\uff1f",
    launchCaptivePortalAlertNoSSIDText  : "\u60a8\u6b63\u5728\u8fde\u63a5\u7684 WiFi \u7f51\u7edc\u8981\u6c42\u60a8\u5728\u8bbf\u95ee\u4e92\u8054\u7f51\u4e4b\u524d\u5148\u767b\u5f55\u3002<br><br>\u662f\u5426\u524d\u5f80\u4f53\u9a8c\u7248\u7f51\u9875\u6d4f\u89c8\u5668\u5e76\u767b\u5f55\uff1f",
    appmgrFatalAppAlertTitle            : "\u5e94\u7528\u7a0b\u5e8f\u51fa\u9519",
    appmgrFatalAppAlertText             : "\u65e0\u6cd5\u542f\u52a8\u9009\u5b9a\u7684\u5e94\u7528\u7a0b\u5e8f\uff0c\u8bf7\u91cd\u8bd5\u3002",
    appmgrNonFatalAppAlertTitle         : "\u65e0\u6cd5\u6253\u5f00\u5185\u5bb9",
    appmgrNonFatalAppAlertText          : "\u65e0\u6cd5\u6253\u5f00\u9009\u5b9a\u7684\u5185\u5bb9\uff0c\u8bf7\u91cd\u8bd5\u3002",
    restart                             : "\u91cd\u542f",
    frameworkRestartRequestTitle        : "\u6b63\u5728\u91cd\u542f\u60a8\u7684 Kindle",
    frameworkRestartRequestText         : "\u8be5\u5185\u5bb9\u65e0\u6cd5\u6b63\u5e38\u5173\u95ed\u3002\u9664\u975e\u60a8\u5173\u95ed\u672c\u5bf9\u8bdd\u6846\uff0c\u5426\u5219\u60a8\u7684 Kindle \u5c06\u4e8e {restartTime,plural,=0 {# \u79d2} one {# \u79d2} other {# \u79d2}}\u540e\u91cd\u65b0\u542f\u52a8\u3002",
    shippingModeFailedTitle             : "\u6062\u590d\u51fa\u5382\u6a21\u5f0f\u5931\u8d25",
    shippingModeWhitelistFailedText     : "\u5b57\u5178\u6216\u5b57\u4f53\u6587\u4ef6\u7f3a\u5931\uff0c\u65e0\u6cd5\u6062\u590d\u51fa\u5382\u8bbe\u7f6e\u3002",
    shippingModeBatteryRangeFailedText  : "\u7535\u6c60\u7535\u91cf\u4f4e\u4e8e\u8bb8\u53ef\u8303\u56f4\uff0c\u65e0\u6cd5\u6062\u590d\u51fa\u5382\u8bbe\u7f6e\u3002",
    shippingModeErrorTitle              : "\u51fa\u5382\u6a21\u5f0f\u9519\u8bef",
    shippingModeBatteryLowFailedText    : "\u7535\u6c60\u7535\u91cf\u8fc7\u4f4e\uff0c\u8bbe\u5907\u65e0\u6cd5\u8fdb\u5165\u51fa\u5382\u6a21\u5f0f\u3002\u8bf7\u8fde\u63a5\u5145\u7535\u5668\u3002\u5f53\u7535\u6c60\u7535\u91cf\u5145\u8db3\u65f6\uff0c\u60a8\u7684\u8bbe\u5907\u4f1a\u81ea\u52a8\u8fdb\u5165\u51fa\u5382\u6a21\u5f0f\u3002",
    shippingModeBatteryHighFailedText   : "\u7535\u6c60\u7535\u91cf\u8fc7\u9ad8\uff0c\u8bbe\u5907\u65e0\u6cd5\u8fdb\u5165\u51fa\u5382\u6a21\u5f0f\u3002\u8bf7\u65ad\u5f00\u5145\u7535\u5668\u3002\u5f53\u7535\u6c60\u5145\u5206\u653e\u7535\u540e\uff0c\u60a8\u7684\u8bbe\u5907\u4f1a\u81ea\u52a8\u8fdb\u5165\u51fa\u5382\u6a21\u5f0f\u3002",
    shippingModeUSBOnlinePromptText     : "\u60a8\u7684 Kindle \u8fde\u63a5\u4e86 USB \u8fde\u63a5\u7ebf\uff0c\u65e0\u6cd5\u8fdb\u5165\u51fa\u5382\u6a21\u5f0f\u3002\u8bf7\u65ad\u5f00\u8fde\u63a5\u7ebf\u3002",
    heapLowAlertTitle                   : "Java \u5185\u5b58\u5806\u533a\u4e0d\u8db3",
    heapLowAlertText                    : "Java \u5185\u5b58\u5806\u533a\u957f\u65f6\u95f4\u4e0d\u8db3\u3002",
    appmgrFrameworkFailedAlertTitle     : "\u6846\u67b6\u9519\u8bef",
    appmgrFrameworkFailedAlertText      : "\u5e94\u7528\u7a0b\u5e8f\u6ca1\u6709\u54cd\u5e94\u3002Kindle \u6b63\u5728\u91cd\u542f\uff0c\u8bf7\u7a0d\u5019\u3002",
    dpmKindleStoreDisabledTitle         : "\u5546\u5e97\u5df2\u9501\u5b9a",
    dpmKindleStoreDisabledText          : "\u672c\u673a\u4e3a\u53d7\u63a7\u8bbe\u5907\uff0c\u5546\u5e97\u5df2\u9501\u5b9a\u3002\u8be6\u60c5\u8bf7\u8054\u7cfb\uff1a{contactInfo}\u3002",
    dpmBrowserDisabledTitle             : "\u7f51\u9875\u6d4f\u89c8\u5668\u5df2\u9501\u5b9a",
    dpmBrowserDisabledText              : "\u672c\u673a\u4e3a\u53d7\u63a7\u8bbe\u5907\u3002\u4f53\u9a8c\u7248\u7f51\u9875\u6d4f\u89c8\u5668\u5df2\u9501\u5b9a\u3002\u8be6\u60c5\u8bf7\u8054\u7cfb\uff1a{contactInfo}\u3002",
    dpmArchivedDisabledTitle            : "\u4e91\u7aef\u5df2\u9501\u5b9a",
    dpmArchivedDisabledText             : "\u672c\u673a\u4e3a\u53d7\u63a7\u8bbe\u5907\uff0c\u4e91\u7aef\u8bbf\u95ee\u5df2\u9501\u5b9a\u3002\u8be6\u60c5\u8bf7\u8054\u7cfb\uff1a{contactInfo}\u3002",
    dpmDiscoveryDisabledTitle           : "\u3016Goodreads on Kindle\u3017\u5df2\u9501\u5b9a",
    dpmDiscoveryDisabledText            : "\u672c\u673a\u4e3a\u53d7\u63a7\u8bbe\u5907\uff0c\u3016Goodreads on Kindle\u3017\u5df2\u9501\u5b9a\u3002\u8be6\u60c5\u8bf7\u8054\u7cfb\uff1a{contactInfo}\u3002",
    dpmSocialNetworksDisabledTitle      : "\u793e\u4ea4\u7f51\u7edc\u5df2\u9501\u5b9a",
    dpmSocialNetworksDisabledText       : "\u672c\u673a\u4e3a\u53d7\u63a7\u8bbe\u5907\uff0c\u793e\u4ea4\u7f51\u7edc\u8bbf\u95ee\u5df2\u9501\u5b9a\u3002\u8be6\u60c5\u8bf7\u8054\u7cfb\uff1a{contactInfo}\u3002",
    dpmMp3PlayerDisabledTitle           : "MP3 \u64ad\u653e\u5668\u5df2\u9501\u5b9a",
    dpmMp3PlayerDisabledText            : "\u672c\u673a\u4e3a\u53d7\u63a7\u8bbe\u5907\uff0cMP3 \u64ad\u653e\u5668\u5df2\u9501\u5b9a\u3002\u8be6\u60c5\u8bf7\u8054\u7cfb\uff1a{contactInfo}\u3002",
    dpmActiveContentDisabledTitle       : "\u3016Active Content\u3017\u5df2\u9501\u5b9a",
    dpmActiveContentDisabledText        : "\u672c\u673a\u4e3a\u53d7\u63a7\u8bbe\u5907\uff0c\u3016Active Content\u3017\u5df2\u9501\u5b9a\u3002\u8be6\u60c5\u8bf7\u8054\u7cfb\uff1a{contactInfo}\u3002",
    dpmSettingsMenuDisabledTitle        : "\u8bbe\u7f6e\u83dc\u5355\u5df2\u9501\u5b9a",
    dpmSettingsMenuDisabledText         : "\u672c\u673a\u4e3a\u53d7\u63a7\u8bbe\u5907\uff0c\u3010\u8bbe\u7f6e\u3011\u83dc\u5355\u5df2\u9501\u5b9a\u3002\u8be6\u60c5\u8bf7\u8054\u7cfb\uff1a{contactInfo}\u3002",
    dpmToggleWirelessDisabledTitle      : "\u65e0\u7ebf\u8fde\u63a5\u5207\u6362\u5df2\u9501\u5b9a",
    dpmToggleWirelessDisabledText       : "\u672c\u673a\u4e3a\u53d7\u63a7\u8bbe\u5907\uff0c\u3010\u65e0\u7ebf\u8fde\u63a5\u5207\u6362\u3011\u5df2\u9501\u5b9a\u3002\u8be6\u60c5\u8bf7\u8054\u7cfb\uff1a{contactInfo}\u3002",
    dpmToggleFeatureDisabledTitle       : "\u7279\u6027\u5df2\u9501\u5b9a",
    dpmToggleFeatureDisabledText        : "\u672c\u673a\u4e3a\u53d7\u63a7\u8bbe\u5907\uff0c\u3010\u98de\u884c\u6a21\u5f0f\u3011\u548c\u3010\u84dd\u7259\u3011\u5df2\u9501\u5b9a\u3002\u8be6\u60c5\u8bf7\u8054\u7cfb\uff1a{contactInfo}\u3002",
    dpmManageWifiSettingsDisabledTitle  : "WiFi \u8bbe\u7f6e\u5df2\u9501\u5b9a",
    dpmManageWifiSettingsDisabledText   : "\u672c\u673a\u4e3a\u53d7\u63a7\u8bbe\u5907\uff0c\u3010WiFi \u8bbe\u7f6e\u3011\u5df2\u9501\u5b9a\u3002\u8be6\u60c5\u8bf7\u8054\u7cfb\uff1a{contactInfo}\u3002",
    pcKindleStoreDisabledTitle          : "\u5546\u5e97\u5df2\u9501\u5b9a",
    pcKindleStoreDisabledText           : "\u60a8\u7684 Kindle \u5df2\u542f\u7528\u5bb6\u957f\u76d1\u62a4\uff0c\u5546\u5e97\u5df2\u9501\u5b9a\u3002",
    pcBrowserDisabledTitle              : "\u7f51\u9875\u6d4f\u89c8\u5668\u5df2\u9501\u5b9a",
    pcBrowserDisabledText               : "\u60a8\u7684 Kindle \u5df2\u542f\u7528\u5bb6\u957f\u76d1\u62a4\u3002\u4f53\u9a8c\u7248\u7f51\u9875\u6d4f\u89c8\u5668\u5df2\u9501\u5b9a\u3002",
    pcArchivedItemsDisabledTitle        : "\u4e91\u7aef\u5df2\u9501\u5b9a",
    pcArchivedItemsDisabledText         : "\u60a8\u7684 Kindle \u5df2\u542f\u7528\u5bb6\u957f\u76d1\u62a4\uff0c\u4e91\u7aef\u8bbf\u95ee\u5df2\u9501\u5b9a\u3002",
    pcDiscoveryDisabledTitle            : "\u3016Goodreads on Kindle\u3017\u5df2\u9501\u5b9a",
    pcDiscoveryDisabledText             : "\u60a8\u7684 Kindle \u5df2\u542f\u7528\u5bb6\u957f\u76d1\u62a4\uff0c\u3016Goodreads on Kindle\u3017\u5df2\u9501\u5b9a\u3002",
    pcPurchasesDisabledTitle            : "\u8d2d\u4e70\u529f\u80fd\u5df2\u9501\u5b9a",
    pcPurchasesDisabledText             : "\u60a8\u7684 Kindle \u5df2\u542f\u7528\u5bb6\u957f\u76d1\u62a4\uff0c\u8d2d\u4e70\u529f\u80fd\u5df2\u9501\u5b9a\u3002",
    webBrowserUnavailableTitle          : "\u7f51\u9875\u6d4f\u89c8\u5668\u4e0d\u53ef\u7528",
    webBrowserUnavailableText           : "\u542f\u7528 VoiceView \u540e\uff0c\u4f53\u9a8c\u7248\u7f51\u9875\u6d4f\u89c8\u5668\u4e0d\u53ef\u7528\u3002",
    remoteRebootMessageTitle            : "\u7b49\u5f85\u8bbe\u5907\u91cd\u542f",
    remoteRebootMessageText             : "Kindle \u5df2\u63a5\u5230\u91cd\u542f\u6307\u4ee4\u3002\u8be5\u64cd\u4f5c\u5c06\u5f88\u5feb\u5f00\u59cb\u3002\u8bf7\u7b49\u5f85\u8bbe\u5907\u5b8c\u6210\u91cd\u542f\u3002",
    remoteFactoryResetMessageTitle      : "\u7b49\u5f85\u8bbe\u5907\u91cd\u7f6e",
    remoteFactoryResetMessageText       : "\u672c\u673a\u4e3a\u53d7\u63a7\u8bbe\u5907\u3002\u5df2\u6536\u5230\u6062\u590d\u51fa\u5382\u8bbe\u7f6e\u6307\u4ee4\uff0c\u6062\u590d\u8fc7\u7a0b\u4e2d\u5c06\u5220\u9664\u5168\u90e8\u5df2\u4e0b\u8f7d\u548c\u5df2\u4f20\u8f93\u7684\u5185\u5bb9\u3002\u6062\u590d\u8fc7\u7a0b\u5373\u523b\u5f00\u59cb\u3002\u8bf7\u7a0d\u5019\uff0c\u76f4\u81f3\u6062\u590d\u8fc7\u7a0b\u7ed3\u675f\u3002\u8be6\u60c5\u8bf7\u8054\u7cfb\uff1a{contactInfo}\u3002",
    purchaseGeneralServerErrorTitle     : "\u9519\u8bef",
    purchaseGeneralServerErrorText      : "\u51fa\u73b0\u6280\u672f\u95ee\u9898\uff0c\u8d2d\u4e70\u65e0\u6cd5\u5b8c\u6210\u3002\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002",
    purchaseGeneralDeviceErrorTitle     : "\u9519\u8bef",
    purchaseGeneralDeviceErrorText      : "\u65e0\u6cd5\u5904\u7406\u60a8\u7684\u8bf7\u6c42\uff0c\u8bf7\u7a0d\u540e\u91cd\u8bd5\u3002",
    purchaseLimitTitle                  : "\u5df2\u8fbe\u5230\u8d2d\u4e70\u4e0a\u9650",
    purchaseLimitText                   : "\u8d2d\u4e70\u65e0\u6cd5\u5b8c\u6210\uff0c\u60a8\u5df2\u8fbe\u5230\u6700\u5927\u8d2d\u4e70\u6570\u91cf\u3002",
    purchaseExpiredOfferTitle           : "\u7279\u60e0\u5df2\u8fc7\u671f",
    purchaseExpiredOfferText            : "\u8d2d\u4e70\u65e0\u6cd5\u5b8c\u6210\uff0c\u8be5\u7279\u60e0\u5df2\u8fc7\u671f\u3002",
    adDetailsErrorTitle                 : "Kindle \u5e7f\u544a",
    adDetailsErrorText                  : "\u8be5\u5e7f\u544a\u8be6\u60c5\u5df2\u4e0d\u53ef\u7528\uff0c\u8bf7\u6253\u5f00\u65e0\u7ebf\u8fde\u63a5\u4ee5\u63a5\u6536\u6700\u65b0\u5185\u5bb9\u3002",
    adDetailsDisableText                : "\u5bb6\u957f\u76d1\u62a4\u542f\u7528\u540e\uff0c\u8be5\u5e7f\u544a\u8be6\u60c5\u4e0d\u53ef\u7528\u3002",
    adDetailsConnectedErrorText         : "\u8be5\u5e7f\u544a\u8be6\u60c5\u5df2\u4e0d\u518d\u53ef\u7528\u3002",
    deviceUnregisteredTitle             : "\u8bbe\u5907\u5c1a\u672a\u6ce8\u518c",
    deviceUnregisteredText              : "\u60a8\u5fc5\u987b\u6ce8\u518c\u60a8\u7684 Kindle \u624d\u80fd\u5b8c\u6210\u8d2d\u4e70\u3002",
    pendingPurchaseInfoTitle            : "\u5f85\u5904\u7406\u8ba2\u5355",   
    pendingPurchaseInfoText             : "\u5bf9\u4e8e\u672c\u7279\u60e0\u5546\u54c1\uff0c\u60a8\u76ee\u524d{count,plural,=0 {\u6ca1\u6709\u5f85\u5904\u7406\u8ba2\u5355} one {\u6709 1 \u4e2a\u5f85\u5904\u7406\u8ba2\u5355} other {\u6709 # \u4e2a\u5f85\u5904\u7406\u8ba2\u5355}}\u3002",
    debugScriptsEnabledTitle            : "\u8c03\u8bd5\u811a\u672c",
    debugScriptsEnabledText             : "\u6269\u5c55\u8c03\u8bd5\u811a\u672c\u76ee\u524d\u5df2\u542f\u7528",
    cpRestartMessageTitle               : "\u9700\u8981\u91cd\u542f",
    cpRestartMessageText                : "\u4ee5\u4e0b\u8bed\u8a00\u7684\u5b57\u4f53\u6709\u66f4\u65b0\uff1a{language}.<br><br>\u60a8\u786e\u5b9a\u8981\u73b0\u5728\u91cd\u542f\u4ee5\u5b8c\u6210\u66f4\u65b0\u5417\uff1f",
    shutdownAlertTitle                  : "\u7535\u6e90",
    shutdownAlertText                   : "\u8bf7\u4ece\u4ee5\u4e0b\u9009\u9879\u4e2d\u9009\u62e9\uff1a",
    shutdownAlertButtonLayout           : BUTTON_LAYOUT_NORMAL, 
    asrNotSupportedAlertTitle           : "VoiceView",
    asrNotSupportedAlertText            : "\u4e0d\u652f\u6301 VoiceView\u3002\u5982\u9700\u6253\u5f00 VoiceView\uff0c\u8bf7\u5173\u95ed\u5bb6\u957f\u76d1\u62a4\u548c\u8bbe\u5907\u5bc6\u7801 (\u5982\u6709) \u5e76\u5c06\u8bbe\u5907\u8bed\u8a00\u8bbe\u4e3a\u82f1\u8bed\u3002",
    parentalEnabledASRNotSupportedAlertTitle      : "VoiceView",
    parentalEnabledASRNotSupportedAlertText       : "\u5f00\u542f VoiceView \u524d\uff0c\u8bf7\u5173\u95ed\u5bb6\u957f\u76d1\u62a4\u3002",
    passcodeEnabledASRNotSupportedAlertTitle      : "VoiceView",
    passcodeEnabledASRNotSupportedAlertText       : "\u8bf7\u5173\u95ed Kindle \u5bc6\u7801\u6765\u542f\u7528 VoiceView\u3002",
    localeNotSupportedASRAlertTitle     : "VoiceView",
    localeNotSupportedASRAlertText      : "\u5f00\u542f VoiceView \u524d\uff0c\u8bf7\u5c06\u8bbe\u5907\u8bed\u8a00\u8bbe\u7f6e\u4e3a\u82f1\u8bed (\u7f8e\u56fd) \u6216\u82f1\u8bed (\u82f1\u56fd)\u3002",
    usbAudioUnpluggedAlertTitle         : "\u63d0\u9192",
    usbAudioUnpluggedAlertText          : "\u7cfb\u7edf\u68c0\u6d4b\u5230\u60a8\u5df2\u62d4\u51fa USB \u9002\u914d\u5668\u3002VoiceView \u5373\u5c06\u5173\u95ed\u3002",
    screenReaderStartedLangPickerAlertTitle       : "VoiceView",
    screenReaderStartedLangPickerAlertText        : "VoiceView \u5c4f\u5e55\u6717\u8bfb\u5668\u5df2\u5728\u60a8\u7684 Kindle \u4e0a\u542f\u7528\u3002&nbsp<br><br>\u60a8\u4e0e Kindle \u5c4f\u5e55\u4e92\u52a8\u65f6\uff0cVoiceView \u5c06\u63d0\u4f9b\u8bed\u97f3\u53cd\u9988\u3002",
    ScreenOff                           : "\u5173\u95ed\u5c4f\u5e55",
    cpUpdatingFontsTitle                : "\u6b63\u5728\u66f4\u65b0\u5b57\u4f53",
    cpUpdatingFontsText                 : "\u60a8\u7684 Kindle \u6b63\u5728\u66f4\u65b0\u5b57\u4f53\u3002\u8fd9\u53ef\u80fd\u9700\u8981\u4e00\u6bb5\u65f6\u95f4\u2026",
    cpDeferRestart                      : "\u4ee5\u540e\u518d\u8bf4",
    cpRestart                           : "\u7acb\u5373",
    runningFSCKMessageTitle             : "\u672c\u673a\u9519\u8bef",
    runningFSCKMessageText              : "\u53d1\u751f\u672a\u77e5\u9519\u8bef\uff0c\u53ef\u80fd\u7531\u4e8e\u60a8\u4e0a\u6b21\u65ad\u5f00 Kindle \u4e0e\u7535\u8111\u7684\u8fde\u63a5\u65f6\u5e76\u672a\u4f7f\u7528\u5b89\u5168\u5f39\u51fa\u3002Kindle \u6b63\u5728\u8bd5\u56fe\u4fee\u590d\uff0c\u8bf7\u7a0d\u5019\u3002",
    invalidUpdateAlertMessageTitle      : "\u66f4\u65b0\u9519\u8bef",
    invalidUpdateAlertMessageText       : "\u60a8\u7684\u8bbe\u5907\u52a0\u8f7d\u4e86\u65e0\u6548\u66f4\u65b0\u6587\u4ef6\u3002\u8bf7\u524d\u5f80 www.amazon.com/devicesupport\uff0c\u8bbf\u95ee Kindle \u8f6f\u4ef6\u66f4\u65b0\u9875\u9762\u6216\u8054\u7cfb Kindle \u5ba2\u670d\u4ee5\u5bfb\u6c42\u5e2e\u52a9\u3002",
    resellBatteryRangeFailedTitle       : "\u7535\u91cf\u8fc7\u4f4e",
    resellBatteryRangeFailedText        : "Kindle \u5fc5\u987b\u5145\u7535\uff0c\u65b9\u53ef\u8f6c\u552e\u3002\u8bf7\u8fde\u63a5\u5145\u7535\u5668\uff0c\u81f3\u5c11\u5145\u7535 1 \u5c0f\u65f6\uff0c\u7136\u540e\u91cd\u8bd5\u3002",
    demoFeatureUnavailableAlertTitle    : "\u529f\u80fd\u4e0d\u53ef\u7528",
    demoFeatureUnavailableAlertText     : "\u672c\u529f\u80fd\u5728 Kindle \u6f14\u793a\u6a21\u5f0f\u4e0b\u4e0d\u53ef\u7528\u3002",
    demoFeatureUnavailableAlertButton   : "\u7ee7\u7eed",
    dtcpGenericDeregisteredTitle        : "\u8bbe\u5907\u5c1a\u672a\u6ce8\u518c",
    dtcpGenericDeregisteredText         : "\u60a8\u5fc5\u987b\u6ce8\u518c Kindle \u65b9\u53ef\u67e5\u770b\u6b64\u7279\u60e0\u5185\u5bb9\u3002",
    rnpExceptionMessage			: "\u5f55\u5236\u65f6\u51fa\u73b0\u5f02\u5e38\u3002\u65e5\u5fd7\u5df2\u6536\u96c6\u5230 {log_name}\u3002",
    rnpCompletionMessage                : "\u6d4b\u8bd5\u7528\u4f8b {test_name} \u6210\u529f\u5f55\u5236\u5b8c\u6210\u3002\u5f55\u5236\u65e5\u5fd7\u4f4d\u4e8e {record_log_name}\u3002\u6d4b\u8bd5\u8f93\u51fa\u65e5\u5fd7\u5df2\u6536\u96c6\u5230 {log_name}\u3002\u8bf7\u968f\u65f6\u56de\u6536\u6b64\u6587\u4ef6\u5939\u4ee5\u91cd\u65b0\u83b7\u53d6\u7a7a\u95f4\u3002",
    recreateUserstoreAlertTitle         : "\u8bbe\u5907\u9519\u8bef",
    recreateUserstoreAlertText          : "\u53d1\u751f\u4e0d\u53ef\u6062\u590d\u7684\u8bbe\u5907\u6545\u969c\u3002\u8bf7\u5907\u4efd\u60a8\u7684\u6240\u6709\u975e\u4e9a\u9a6c\u900a\u5185\u5bb9\u4ee5\u907f\u514d\u6570\u636e\u4e22\u5931\u3002\u5907\u4efd\u5b8c\u6bd5\u8bf7\u70b9\u51fb\u3010\u7ee7\u7eed\u3011\u3002",
    recreateUserstoreAlertButton        : "\u7ee7\u7eed",
    voiceFileNotDetectedAlertTitle      : "\u672a\u68c0\u6d4b\u5230\u8bed\u97f3\u6587\u4ef6",
    voiceFileNotDetectedAlertText       : "\u672a\u80fd\u5728\u60a8\u7684\u8bbe\u5907\u4e0a\u68c0\u6d4b\u5230\u4efb\u4f55\u8bed\u97f3\u6587\u4ef6\u3002\u5982\u9700\u83b7\u5f97\u8bed\u97f3\u6587\u4ef6\u4e0b\u8f7d\u6307\u5357\uff0c\u8bf7\u4e0e\u5ba2\u670d\u8054\u7cfb: http://www.amazon.com/help/kindlevoicefiles\u3002",
    chargeCoverDisconnectedAlertTitle   : "\u63d0\u9192",
    chargeCoverDisconnectedAlertText    : "\u5145\u7535\u4fdd\u62a4\u5957\u8fde\u63a5\u5df2\u65ad\u5f00\u3002VoiceView \u5373\u5c06\u5173\u95ed\u3002",
    chargeBatteryCriticalAlertTitle     : "\u63d0\u9192",
    chargeBatteryCriticalAlertText      : "\u60a8\u7684 Kindle \u7535\u91cf\u504f\u4f4e\u3002\u542f\u7528 VoiceView \u5c06\u66f4\u5feb\u8017\u5c3d\u7535\u91cf\u3002",
    voiceViewAlertTitle                 : "VoiceView",
    btReconnectFailedTitle              : "\u627e\u4e0d\u5230\u84dd\u7259\u8bbe\u5907",
    voiceViewAlertText                  : "\u6b63\u5728\u641c\u7d22\u4e0e Kindle VoiceView \u5c4f\u5e55\u6717\u8bfb\u5668\u914d\u5bf9\u7684\u84dd\u7259\u97f3\u9891\u8bbe\u5907\u3002<br><br>\u8bf7\u7a0d\u5019...",
    noConnectedDeviceInRangeText        : "\u627e\u4e0d\u5230\u84dd\u7259\u97f3\u9891\u8bbe\u5907\u3002<br><br>\u8bf7\u786e\u4fdd\u8bbe\u5907\u5df2\u5f00\u542f\u5e76\u5728\u6709\u6548\u8303\u56f4\u5185\u3002",
    btConfirmationText                  : "\u68c0\u6d4b\u5230\u53ef\u914d\u5bf9\u7684\u84dd\u7259\u97f3\u9891\u8bbe\u5907\uff1a{device_name}\u3002<br><br>\u8bf7\u7528\u4e24\u6307\u6309\u4f4f Kindle \u5c4f\u5e55\uff0c\u5c06\u6b64\u8bbe\u5907\u4e0e Kindle VoiceView \u5c4f\u5e55\u6717\u8bfb\u5668\u914d\u5bf9\u3002\u5982\u679c\u4e0d\u5e0c\u671b\u4f7f\u7528 VoiceView\uff0c\u8bf7\u70b9\u51fb\u201c\u53d6\u6d88\u914d\u5bf9\u201d\u3002<br><br>VoiceView \u662f\u5728\u60a8\u4e0e Kindle \u5c4f\u5e55\u4e92\u52a8\u65f6\u63d0\u4f9b\u8bed\u97f3\u53cd\u9988\u7684\u8f85\u52a9\u529f\u80fd\u3002<br><br>\u7b49\u5f85 5 \u79d2\u540e\u5373\u53ef\u5ffd\u7565\u84dd\u7259\u97f3\u9891\u8bbe\u5907\u3002",
    btRemoteReauthenticationText        : "\u662f\u5426\u8981\u91cd\u65b0\u8fde\u63a5\u6b64\u8bbe\u5907\uff1f<br><br> \u7b49\u5f85 5 \u79d2\u540e\u53ef\u5ffd\u7565\u8fd9\u4e2a\u84dd\u7259\u97f3\u9891\u8bbe\u5907\u3002",
    btReconnectFailedText               : "\u6211\u4eec\u65e0\u6cd5\u8fde\u63a5\u60a8\u7684\u84dd\u7259\u97f3\u9891\u8bbe\u5907\u3002<br><br>\u8bf7\u786e\u4fdd\u8bbe\u5907\u5df2\u5f00\u542f\u5e76\u5904\u4e8e\u914d\u5bf9\u6a21\u5f0f\uff0c\u957f\u6309 Kindle \u7535\u6e90\u952e 9 \u79d2\uff0c\u7136\u540e\u7528\u4e24\u6307\u6309\u4f4f\u5c4f\u5e55\u3002",
    fileSystemCapacityExceededAlertTitle : "\u6587\u4ef6\u5939\u51e0\u4e4e\u5df2\u6ee1",
    fileSystemCapacityExceededAlertText : "\u3010\u4e2a\u4eba\u6587\u6863\u3011\u6587\u4ef6\u5939\u4e0b\u7684\u67d0\u4e2a\u5b50\u6587\u4ef6\u5939\u4e2d\u7684\u5185\u5bb9\u5df2\u8d85\u8fc7 2000 \u9879\u3002\u5982\u8981\u7ee7\u7eed\u5c06\u66f4\u591a\u5185\u5bb9\u6dfb\u52a0\u5230\u8bbe\u5907\uff0c\u5efa\u8bae\u60a8\u5728\u3010\u4e0b\u8f7d\u3011\u6587\u4ef6\u5939\u4e0b\u521b\u5efa\u4e00\u4e2a\u65b0\u7684\u5b50\u6587\u4ef6\u5939\u3002",
};

// string map for large mode
var SimpleAlertStringTableLarge = {
    cancel                              : "\u53d6\u6d88",
    no                                  : "\u5426",
    close                               : "\u5173\u95ed",
    cancelPairing                       : "\u53d6\u6d88\u914d\u5bf9",
    continueText			: "\u7ee7\u7eed",
    yes	               		        : "\u662f",
    cpDeferRestart                      : "\u7a0d\u540e",
    cpRestart                           : "\u7acb\u5373",
    restart                             : "\u91cd\u542f",
    ScreenOff                           : "\u5173\u95ed\u5c4f\u5e55",
    demoFeatureUnavailableAlertButton   : "\u7ee7\u7eed",
    recreateUserstoreAlertButton        : "\u7ee7\u7eed",
    btConfirmationText                  : "\u68c0\u6d4b\u5230\u53ef\u914d\u5bf9\u7684\u84dd\u7259\u97f3\u9891\u8bbe\u5907\uff1a{device_name}\u3002<br><br>\u8bf7\u7528\u4e24\u6307\u6309\u4f4f Kindle \u5c4f\u5e55\uff0c\u5c06\u6b64\u8bbe\u5907\u4e0e Kindle VoiceView \u5c4f\u5e55\u6717\u8bfb\u5668\u914d\u5bf9\u3002\u5982\u679c\u4e0d\u5e0c\u671b\u4f7f\u7528 VoiceView\uff0c\u8bf7\u70b9\u51fb\u201c\u53d6\u6d88\u914d\u5bf9\u201d\u3002<br><br>VoiceView \u662f\u5728\u60a8\u4e0e Kindle \u5c4f\u5e55\u4e92\u52a8\u65f6\u63d0\u4f9b\u8bed\u97f3\u53cd\u9988\u7684\u8f85\u52a9\u529f\u80fd\u3002<br><br>\u7b49\u5f85 5 \u79d2\u540e\u5373\u53ef\u5ffd\u7565\u84dd\u7259\u97f3\u9891\u8bbe\u5907\u3002"
};

//checks for large mode and constructs SimpleAlertStringTable based on the display mode

SimpleAlertStringTable = constructTableOnDisplayModeChange(SimpleAlertStringTable,SimpleAlertStringTableLarge);

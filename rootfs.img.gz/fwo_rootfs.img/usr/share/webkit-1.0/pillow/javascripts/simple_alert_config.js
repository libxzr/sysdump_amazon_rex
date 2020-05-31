/*
 * simple_alert_config.js
 *
 * Copyright (c) 2016-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

var primaryBattPercentLowAlertText;
var primaryBattPercentVeryLowAlertText;
var secondaryBattPercentLowAlertText;
var allBattPercentLowAlertText;

if(Pillow.hasDualBattery) {
    if(Pillow.hasWirelessMenu) {
        primaryBattPercentLowAlertText = SimpleAlertStringTable.primaryBattPercentLowAlertWirelessMainText2;
        secondaryBattPercentLowAlertText = SimpleAlertStringTable.secondaryBattPercentLowAlertWirelessMainText;
        allBattPercentLowAlertText = SimpleAlertStringTable.allBattPercentLowAlertWirelessMainText;    
    } else {
        primaryBattPercentLowAlertText = SimpleAlertStringTable.primaryBattPercentLowAlertAirplaneMainText2;
        secondaryBattPercentLowAlertText = SimpleAlertStringTable.secondaryBattPercentLowAlertAirplaneMainText;
        allBattPercentLowAlertText = SimpleAlertStringTable.allBattPercentLowAlertAirplaneMainText;    
    }
    primaryBattPercentVeryLowAlertText = SimpleAlertStringTable.primaryBattPercentVeryLowAlertMainText2;
} else {
    primaryBattPercentLowAlertText = Pillow.hasWirelessMenu
    ? SimpleAlertStringTable.primaryBattPercentLowAlertWirelessMainText
    : SimpleAlertStringTable.primaryBattPercentLowAlertAirplaneMainText;
    primaryBattPercentVeryLowAlertText = SimpleAlertStringTable.primaryBattPercentVeryLowAlertMainText;
}

var turnWirelessOnAlert = 
    Pillow.hasWirelessMenu
    ? { title: SimpleAlertStringTable.turnWirelessOnAlertTitle,
        text: SimpleAlertStringTable.turnWirelessOnAlertMainText }
    : { title: SimpleAlertStringTable.turnAirplaneModeAlertTitle,
        text: SimpleAlertStringTable.turnAirplaneModeAlertMainText };

var dpmToggleWirelessDisabled = 
    Pillow.hasWirelessMenu
    ? { title: SimpleAlertStringTable.dpmToggleWirelessDisabledTitle,
        text: SimpleAlertStringTable.dpmToggleWirelessDisabledText }
    : { title: SimpleAlertStringTable.dpmToggleFeatureDisabledTitle,
        text: SimpleAlertStringTable.dpmToggleFeatureDisabledText };

var DefaultConfiguration = {
                sources: [
                ],
                alerts : {
                    primaryBattPercentLowAlert : {
                        title: SimpleAlertStringTable.battPercentLowAlertTitle,
                        text:  primaryBattPercentLowAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ]
                    },
                    secondaryBattPercentLowAlert : {
                        title: SimpleAlertStringTable.battPercentLowAlertTitle,
                        text:  secondaryBattPercentLowAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ]
                    },
                    allBattPercentLowAlert : {
                        title: SimpleAlertStringTable.battPercentLowAlertTitle,
                        text:  allBattPercentLowAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ]
                    },
                    primaryBattPercentVeryLowAlert : {
                        title: SimpleAlertStringTable.battPercentVeryLowAlertTitle,
                        text:  primaryBattPercentVeryLowAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ]
                    },
                    secondaryBattPercentVeryLowAlert : {
                        title: SimpleAlertStringTable.battPercentVeryLowAlertTitle,
                        text:  SimpleAlertStringTable.secondaryBattPercentVeryLowAlertMainText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ]
                    },
                    allBattPercentVeryLowAlert : {
                        title: SimpleAlertStringTable.allBattPercentVeryLowAlertTitle,
                        text:  SimpleAlertStringTable.allBattPercentVeryLowAlertMainText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ]
                    },
                    sodaInterfaceErrorDockingAlert : {
                        title:  SimpleAlertStringTable.sodaErrorAlertTitle,
                        text:   SimpleAlertStringTable.sodaInterfaceErrorDockingAlertMainText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id : "okay"
                            }
                        ]
                    },
                    sodaInterfaceErrorThermistorCutAlert : {
                        title:  SimpleAlertStringTable.sodaErrorAlertTitle,
                        text:   SimpleAlertStringTable.sodaInterfaceErrorThermistorCutAlertMainText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id : "okay"
                            }
                        ]
                    },
                    sodaInvalidBatteryAlert : {
                        title:  SimpleAlertStringTable.sodaErrorAlertTitle,
                        text:   SimpleAlertStringTable.sodaInvalidBatteryAlertMainText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id : "okay"
                            }
                        ]
                    },
                    sodaConnectionAlert : {
                        title:  SimpleAlertStringTable.sodaConnectionAlertTitle,
                        text:   SimpleAlertStringTable.sodaConnectionAlertMainText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id : "okay"
                            }
                        ]
                    },
                    batteryTemperatureTooHotAlert : {
                        title: SimpleAlertStringTable.batteryOperatingTempAlertTitle,
                        text: SimpleAlertStringTable.batteryTemperatureTooHotText,
                        buttons : [
                            {
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ]
                    },
                    batteryTemperatureTooColdAlert : {
                        title: SimpleAlertStringTable.batteryOperatingTempAlertTitle,
                        text: SimpleAlertStringTable.batteryTemperatureTooColdText,
                        buttons : [
                            {
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ]
                    },
                    lowFlashMemoryAlert : {
                        title: SimpleAlertStringTable.lowFlashMemoryAlertTitle,
                        text: SimpleAlertStringTable.lowFlashMemoryAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ]
                    },
                    turnWirelessOnAlert : {
                        title: turnWirelessOnAlert.title,
                        text: turnWirelessOnAlert.text,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.no,
                                id: "cancel"
                            },
                            {
                                text: SimpleAlertStringTable.yes,
                                id: "okay"
                            }
                        ],
                        callbackProp: "wirelessOn"
                    },
                    launchCaptivePortalAlert : {
                        title: SimpleAlertStringTable.launchCaptivePortalAlertTitle,
                        text: SimpleAlertStringTable.launchCaptivePortalAlertMainText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.cancel,
                                id: "cancel"
                            },
                            {
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ],
                        callbackProp: "captivePortalResponse"
                    },
                    launchCaptivePortalAlertNoSSID : {
                        title: SimpleAlertStringTable.launchCaptivePortalAlertTitle,
                        text: SimpleAlertStringTable.launchCaptivePortalAlertNoSSIDText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.cancel,
                                id: "cancel"
                            },
                            {
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ],
                        callbackProp: "captivePortalResponse"
                    },                    
                    emptyPlaylist : {
                        title: SimpleAlertStringTable.emptyPlaylistAlertTitle,
                        text: SimpleAlertStringTable.emptyPlaylistAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.close,
                                id: "close"
                            }
                        ]
                    },
                    failedToStartActiveContent : {
                        title: SimpleAlertStringTable.failedToStartActiveContentTitle,
                        text: SimpleAlertStringTable.failedToStartActiveContentText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.close,
                                id: "close"
                            }
                        ]
                    },
                    appmgrAppFailedFatal : {
                        title: SimpleAlertStringTable.appmgrFatalAppAlertTitle,
                          text:  SimpleAlertStringTable.appmgrFatalAppAlertText,
                            buttons: [
                                {
                                    text: SimpleAlertStringTable.close,
                                    id: "close"
                                }
                            ]
                    },
                    appmgrAppFailedNonfatal : {
                        title: SimpleAlertStringTable.appmgrNonFatalAppAlertTitle,
                          text:  SimpleAlertStringTable.appmgrNonFatalAppAlertText,
                            buttons: [
                                {
                                    text: SimpleAlertStringTable.close,
                                    id: "close"
                                }
                            ]
                    },
                    frameworkRestartRequest : {
                        title: SimpleAlertStringTable.frameworkRestartRequestTitle,
                        text:  SimpleAlertStringTable.frameworkRestartRequestText,
                            buttons: [
                                {
                                    text: SimpleAlertStringTable.restart,
                                    id: "restart"
                                },
                                {
                                    text: SimpleAlertStringTable.cancel,
                                    id: "cancel"
                                }
                            ],
                            callbackProp: "frameworkRestartResponse"
                    },
                    shippingModeWhitelistFailed : {
                        title: SimpleAlertStringTable.shippingModeFailedTitle,
                        text:  SimpleAlertStringTable.shippingModeWhitelistFailedText,
                            buttons: [
                                {
                                    text: SimpleAlertStringTable.close,
                                    id: "close"
                                }
                            ]
                    },
                    shippingModeBatteryRangeFailed : {
                        title: SimpleAlertStringTable.shippingModeFailedTitle,
                        text:  SimpleAlertStringTable.shippingModeBatteryRangeFailedText,
                            buttons: [
                                {
                                    text: SimpleAlertStringTable.close,
                                    id: "close"
                                }
                            ]
                    },
                    shippingModeBatteryLowFailed : {
                        title: SimpleAlertStringTable.shippingModeErrorTitle,
                        text:  SimpleAlertStringTable.shippingModeBatteryLowFailedText,
                            buttons: [
                                {
                                    text: SimpleAlertStringTable.close,
                                    id: "close"
                                }
                            ]
                    },
                    shippingModeBatteryHighFailed : {
                        title: SimpleAlertStringTable.shippingModeErrorTitle,
                        text:  SimpleAlertStringTable.shippingModeBatteryHighFailedText,
                            buttons: [
                                {
                                    text: SimpleAlertStringTable.close,
                                    id: "close"
                                }
                            ]
                    },
                    shippingModeUSBOnlinePrompt: {
                        title: SimpleAlertStringTable.shippingModeErrorTitle,
                        text:  SimpleAlertStringTable.shippingModeUSBOnlinePromptText,
                            buttons: [
                                {
                                    text: SimpleAlertStringTable.close,
                                    id: "close"
                                }
                            ]
                    },
                    appAlert1 : {
                        title: "{alertTitle}",
                        text: "{alertText}",
                            buttons: [
                                {
                                    text: SimpleAlertStringTable.close,
                                    id: "close"
                                }
                            ]
                    },
                      
                    recordAndPlayAlert : {
                    	title : "Save or Ignore State",
                    	text : "Yes = save the state, No = Don't save, SS = Save state with Screenshot, Exit = Exit recording",
                    	    buttons: [
                    	        { 
                    	            text: "Yes",
                    	            id: "Yes",
                    	        },
                    	        
                    	        {   
                    	            text: "No",
                    	            id: "No",
                    	        },

                                {   
                                    text: "SS",
                                    id: "SS",
                                },

                                {   
                                    text: "Exit",
                                    id: "Exit",
                                }
                    	    ],
                    	    callbackProp: "recordandplayCallback"
                    },
                     
		    recordAndPlayExceptionAlert : {
			title : "RnP Exception occurred",
			text : SimpleAlertStringTable.rnpExceptionMessage,
			    buttons : [
				{
				    text: "Close",
				    id: "close"
				}
			    ]
		    },
	
                    recordAndPlayCompletionAlert : {
                        title : "RnP Recording Complete",
                        text : SimpleAlertStringTable.rnpCompletionMessage,
                            buttons : [
                                {
                                    text: "Close",
                                    id: "close"
                                }
                            ]
                    },
                    
	            demoWifiNotAvailableAlert : {
        	        title : SimpleAlertStringTable.demoWifiAlertTitle,
	                text : SimpleAlertStringTable.demoWifiAlertText,
            		    buttons : [
		                {
                		    text : SimpleAlertStringTable.continueText,
		                    id : "continue"
                		}
	                    ],
		    	    callbackProp: "demoWifiNotAvailableAlertResponse"
	            }, 

                    heapLowAlert : {
                        title: SimpleAlertStringTable.heapLowAlertTitle,
                        text: SimpleAlertStringTable.heapLowAlertText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    appmgrFrameworkFailedAlert : {
                        title: SimpleAlertStringTable.appmgrFrameworkFailedAlertTitle,
                        text: SimpleAlertStringTable.appmgrFrameworkFailedAlertText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    dpmKindleStoreDisabled : {
                        title: SimpleAlertStringTable.dpmKindleStoreDisabledTitle,
                        text: SimpleAlertStringTable.dpmKindleStoreDisabledText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    dpmBrowserDisabled : {
                        title: SimpleAlertStringTable.dpmBrowserDisabledTitle,
                        text: SimpleAlertStringTable.dpmBrowserDisabledText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    dpmArchivedDisabled : {
                        title: SimpleAlertStringTable.dpmArchivedDisabledTitle,
                        text: SimpleAlertStringTable.dpmArchivedDisabledText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    dpmDiscoveryDisabled : {
                        title: SimpleAlertStringTable.dpmDiscoveryDisabledTitle,
                        text: SimpleAlertStringTable.dpmDiscoveryDisabledText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    dpmSocialNetworksDisabled : {
                        title: SimpleAlertStringTable.dpmSocialNetworksDisabledTitle,
                        text: SimpleAlertStringTable.dpmSocialNetworksDisabledText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    dpmMp3PlayerDisabled : {
                        title: SimpleAlertStringTable.dpmMp3PlayerDisabledTitle,
                        text: SimpleAlertStringTable.dpmMp3PlayerDisabledText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    dpmActiveContentDisabled : {
                        title: SimpleAlertStringTable.dpmActiveContentDisabledTitle,
                        text: SimpleAlertStringTable.dpmActiveContentDisabledText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    dpmSettingsMenuDisabled : {
                        title: SimpleAlertStringTable.dpmSettingsMenuDisabledTitle,
                        text: SimpleAlertStringTable.dpmSettingsMenuDisabledText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },                    
                    dpmToggleWirelessDisabled : {
                        title: dpmToggleWirelessDisabled.title,
                        text: dpmToggleWirelessDisabled.text,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    dpmManageWifiSettingsDisabled : {
                        title: SimpleAlertStringTable.dpmManageWifiSettingsDisabledTitle,
                        text: SimpleAlertStringTable.dpmManageWifiSettingsDisabledText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    pcKindleStoreDisabled : {
                        title: SimpleAlertStringTable.pcKindleStoreDisabledTitle,
                        text: SimpleAlertStringTable.pcKindleStoreDisabledText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    pcBrowserDisabled : {
                        title: SimpleAlertStringTable.pcBrowserDisabledTitle,
                        text: SimpleAlertStringTable.pcBrowserDisabledText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    pcArchivedItemsDisabled : {
                        title: SimpleAlertStringTable.pcArchivedItemsDisabledTitle,
                        text: SimpleAlertStringTable.pcArchivedItemsDisabledText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    pcDiscoveryDisabled : {
                        title: SimpleAlertStringTable.pcDiscoveryDisabledTitle,
                        text: SimpleAlertStringTable.pcDiscoveryDisabledText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    pcPurchasesDisabled : {
                         title: SimpleAlertStringTable.pcPurchasesDisabledTitle,
                         text: SimpleAlertStringTable.pcPurchasesDisabledText,
                             buttons: [
                                {
                                    text:SimpleAlertStringTable.close,
                                    id: "close"
                                }
                             ]
                    },
                    webBrowserUnavailable : {
                         title: SimpleAlertStringTable.webBrowserUnavailableTitle,
                         text: SimpleAlertStringTable.webBrowserUnavailableText,
                             buttons: [
                                {
                                    text:SimpleAlertStringTable.close,
                                    id: "close"
                                }
                             ]
                    },
                    remoteRebootMessage : {
                        title: SimpleAlertStringTable.remoteRebootMessageTitle,
                        text: SimpleAlertStringTable.remoteRebootMessageText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    remoteFactoryResetMessage : {
                        title: SimpleAlertStringTable.remoteFactoryResetMessageTitle,
                        text: SimpleAlertStringTable.remoteFactoryResetMessageText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    purchaseGeneralServerError : {
                        title: SimpleAlertStringTable.purchaseGeneralServerErrorTitle,
                        text: SimpleAlertStringTable.purchaseGeneralServerErrorText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    purchaseGeneralDeviceError : {
                        title: SimpleAlertStringTable.purchaseGeneralDeviceErrorTitle,
                        text: SimpleAlertStringTable.purchaseGeneralDeviceErrorText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    purchaseLimitReachedMessage : {
                        title: SimpleAlertStringTable.purchaseLimitTitle,
                        text: SimpleAlertStringTable.purchaseLimitText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    purchaseExpiredOfferMessage : {
                        title: SimpleAlertStringTable.purchaseExpiredOfferTitle,
                        text: SimpleAlertStringTable.purchaseExpiredOfferText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },                    
                    adDetailsErrorMessage : {
                        title: SimpleAlertStringTable.adDetailsErrorTitle,
                        text: SimpleAlertStringTable.adDetailsErrorText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    adDetailsDisableMessage : {
                        title: SimpleAlertStringTable.adDetailsErrorTitle,
                        text: SimpleAlertStringTable.adDetailsDisableText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },                          
                    adDetailsConnectedErrorMessage : {
                        title: SimpleAlertStringTable.adDetailsErrorTitle,
                        text: SimpleAlertStringTable.adDetailsConnectedErrorText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },                    
                    deviceUnregisteredMessage : {
                        title: SimpleAlertStringTable.deviceUnregisteredTitle,
                        text: SimpleAlertStringTable.deviceUnregisteredText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    dtcpGenericDeregisteredMessage : {
                        title: SimpleAlertStringTable.dtcpGenericDeregisteredTitle,
                        text: SimpleAlertStringTable.dtcpGenericDeregisteredText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    pendingPurchaseInfoMessage : {
                        title: SimpleAlertStringTable.pendingPurchaseInfoTitle,
                        text: SimpleAlertStringTable.pendingPurchaseInfoText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    debugScriptsEnabledAlert : {
                        title: SimpleAlertStringTable.debugScriptsEnabledTitle,
                        text: SimpleAlertStringTable.debugScriptsEnabledText,
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               }
                            ]
                    },
                    showTemperature : {
                        title: "Device temperature in Fahrenheit",
                        text : "Temp : {1}",    
                            buttons: [
                                {
                                    text: SimpleAlertStringTable.close,
                                    id: "close"
                                }
                            ]
                    },
                    runningFSCK : {
                        title: SimpleAlertStringTable.runningFSCKMessageTitle,
                        text: SimpleAlertStringTable.runningFSCKMessageText,
                        buttons: []
                    },
                    invalidUpdateAlert : {
                        title: SimpleAlertStringTable.invalidUpdateAlertMessageTitle,
                        text: SimpleAlertStringTable.invalidUpdateAlertMessageText,
                            buttons: [
                                {
                                    text: SimpleAlertStringTable.close,
                                    id: "close"
                                }
                            ]
                    },
                    resellBatteryRangeFailed : {
                        title: SimpleAlertStringTable.resellBatteryRangeFailedTitle,
                        text: SimpleAlertStringTable.resellBatteryRangeFailedText,
                            buttons: [
                                {
                                    text: SimpleAlertStringTable.close,
                                    id: "close"
                                }
                            ]
                    },
                    // These strings are for Debugging only. Does not require translation.
                    collectingDebugInfoAlert : {
                        title: "Collecting Debug Info",
                        text: "Generating Core Dump file for process {1}. This might take a little more than a minute. See https://wiki.corp.lab126.com/mediawiki-1.10/index.php/How_To_Use_Core_Dump_Files for instructions on filing a JIRA.",
                            buttons: [
                               {
                                   text: SimpleAlertStringTable.close,
                                   id: "close"
                               },
                               {
                                   text: "RAISE A BUG",
                                   id: "dump"
                               }
                            ],
                        callbackProp: "openFeedbackApp"
                    },
                    contentPackageUpdatingFontMessage : {
                        title: SimpleAlertStringTable.cpRestartMessageTitle,
                        text : SimpleAlertStringTable.cpRestartMessageText,
                            buttons: [
                                {
                                    text: SimpleAlertStringTable.cpDeferRestart,
                                    id: "updateDefer",
                                },
                                {
                                    text: SimpleAlertStringTable.cpRestart,
                                    id: "updateRestart",
                                }
                            ],
                        callbackProp: "fontUpdateCallback"
                    },
                    contentPackageRebootDeviceMessage : {
                        title: SimpleAlertStringTable.cpRestartMessageTitle,
                        text : SimpleAlertStringTable.cpRestartMessageText,
                            buttons: [
                                {
                                    text: SimpleAlertStringTable.restart,
                                    id: "restart",
                                }
                            ],
                        callbackProp: "rebootDevice"
                    },
                    shutdownAlert : {
                        title: SimpleAlertStringTable.shutdownAlertTitle,
                        text: SimpleAlertStringTable.shutdownAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.cancel,
                                id: "cancel"
                            },
                            {
                                text: SimpleAlertStringTable.restart,
                                id: "restart"
                            },
                            {
                                text: SimpleAlertStringTable.ScreenOff,
                                id: "ScreenOff"
                            }
                      ],
                      buttonLayout: SimpleAlertStringTable.shutdownAlertButtonLayout,
                      callbackProp: "shutdownAlertResponse"
                    },
                    asrNotSupportedAlert : {
                        title: SimpleAlertStringTable.asrNotSupportedAlertTitle,
                        text: SimpleAlertStringTable.asrNotSupportedAlertText,
                        buttons: [
                            {   
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ],
                      callbackProp: "asrUnsupportedResponse"
                    },
                    passcodeEnabledASRNotSupportedAlert : {
                        title: SimpleAlertStringTable.passcodeEnabledASRNotSupportedAlertTitle,
                        text: SimpleAlertStringTable.passcodeEnabledASRNotSupportedAlertText,
                        buttons: [
                            {   
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ],
                    },
                    localeNotSupportedASRAlert : {
                        title: SimpleAlertStringTable.localeNotSupportedASRAlertTitle,
                        text: SimpleAlertStringTable.localeNotSupportedASRAlertText,
                        buttons: [
                            {   
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ]
                    },
                    parentalEnabledASRNotSupportedAlert : {
                        title: SimpleAlertStringTable.parentalEnabledASRNotSupportedAlertTitle,
                        text: SimpleAlertStringTable.parentalEnabledASRNotSupportedAlertText,
                        buttons: [
                            {   
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ],
                      callbackProp: "asrUnsupportedResponse"
                    },
                    usbAudioUnpluggedAlert : {
                        title: SimpleAlertStringTable.usbAudioUnpluggedAlertTitle,
                        text: SimpleAlertStringTable.usbAudioUnpluggedAlertText,
                        buttons: [
                            {   
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ], 
                        callbackProp: "disableASR"
                    },
                    screenReaderStartedLangPickerAlert : {
                        title: SimpleAlertStringTable.screenReaderStartedLangPickerAlertTitle,
                        text: SimpleAlertStringTable.screenReaderStartedLangPickerAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ],
                        callbackProp: "screenReaderStartedLangPickerAlertResponse"
                    },
                    voiceViewAlert : {
                        title: SimpleAlertStringTable.voiceViewAlertTitle,
                        text: SimpleAlertStringTable.voiceViewAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.cancel,
                                id: "cancel"
                            }
                        ],
                        callbackProp: "stopVoiceView"
                    },
                    btConfirmationAlert : {
                        title: SimpleAlertStringTable.voiceViewAlertTitle,
                        text:SimpleAlertStringTable.btConfirmationText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.cancelPairing,
                                id: "cancel"
                            }
                        ],
                        callbackProp: "stopVoiceView"
                    },
                    btRemoteReauthenticationAlert : {
                        title: SimpleAlertStringTable.voiceViewAlertTitle,
                        text:SimpleAlertStringTable.btRemoteReauthenticationText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id: "okay"
                            }
                        ],
                        callbackProp: "btDeviceReconfirmed"
                    },
                    noConnectedDeviceInRangeAlert : {
                        title: SimpleAlertStringTable.voiceViewAlertTitle,
                        text: SimpleAlertStringTable.noConnectedDeviceInRangeText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.close,
                                id: "cancel"
                            }
                        ],
                    }, 
                    btReconnectFailedAlert : {
                        title: SimpleAlertStringTable.btReconnectFailedTitle,
                        text: SimpleAlertStringTable.btReconnectFailedText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.close,
                                id: "ok"
                            }
                        ],
                    }, 
                    contentPackageUpdatingFontsMessage : {
                        title: SimpleAlertStringTable.cpUpdatingFontsTitle,
                        text : SimpleAlertStringTable.cpUpdatingFontsText,
                    },
                    demoModeFeatureUnavailableAlert : {
                        title: SimpleAlertStringTable.demoFeatureUnavailableAlertTitle,
                        text : SimpleAlertStringTable.demoFeatureUnavailableAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.demoFeatureUnavailableAlertButton,
                                id: "continue",
                            }
                        ],
                        callbackProp: "demoModeFeatureUnavailableResponse"
                    },
                    recreateUserstoreAlert : {
                        title: SimpleAlertStringTable.recreateUserstoreAlertTitle,
                        text :SimpleAlertStringTable.recreateUserstoreAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.recreateUserstoreAlertButton,
                                id  : "Continue",
                            }
                        ],
                        callbackProp: "recreateUserstoreResponse"
                    },
                    voiceFileNotDetectedAlert : {
                        title: SimpleAlertStringTable.voiceFileNotDetectedAlertTitle,
                        text :SimpleAlertStringTable.voiceFileNotDetectedAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id  : "okay",
                            }
                        ]
                    },
                    chargeBatteryCriticalAlert : {
                        title: SimpleAlertStringTable.chargeBatteryCriticalAlertTitle,
                        text :SimpleAlertStringTable.chargeBatteryCriticalAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id  : "okay",
                            }
                        ]
                    },
                    chargeCoverDisconnectedAlert : {
                        title: SimpleAlertStringTable.chargeCoverDisconnectedAlertTitle,
                        text :SimpleAlertStringTable.chargeCoverDisconnectedAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.okay,
                                id  : "okay",
                            }
                        ]
                    },
                    fileSystemCapacityExceededAlert : {
                        title: SimpleAlertStringTable.fileSystemCapacityExceededAlertTitle,
                        text :SimpleAlertStringTable.fileSystemCapacityExceededAlertText,
                        buttons: [
                            {
                                text: SimpleAlertStringTable.close,
                                id  : "close",
                            }
                        ]
                    }
                }
};

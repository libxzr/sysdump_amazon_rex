/**
 * Constructs a lipc event handler for the SearchBar.
 * @class Handles all the incoming clientParams information.  Each method
 *        handles a different incoming parameter.
 * @extends Pillow.LipcEventHandler
 * @param {Pillow.Case} pillowCase Pass in the Pillow.Case we should dispatch to
 */
Pillow.SearchBar.LipcEventHandler = function(pillowCase){
    var parent = Pillow.extend(this, new Pillow.LipcEventHandler());

    //LIPC events subscribed to and corresponding callbacks
    this.subscribedEvents = {
                sources: [
                    {
                        name: "com.lab126.appmgrd",
                        events: [
                            {
                                name:"appStateChange"
                            },
                            {
                                name:"appFailedInGo"
                            }
                        ]
                    },
                    {
                        name: "com.lab126.dpmManager",
                        events: [
                            {
                                name:"devicePolicyValueChanged"
                            },
                            {
                                name:"deviceControlsStateChange"
                            }
                        ]
                    },
                    {
                        name: "com.lab126.dynconfig",
                        events: [
                            {
                                name:"dynamicConfigUpdated"
                            }
                        ]
                   },
                   {
                       name: "com.lab126.discoveryservice",
                       events: [
                           {
                               name:"newActivitiesAvailableEvent"
                           }
                       ]
                  },
                  {
                      name: "com.lab126.grokservice",
                      events: [
                          {
                              name:"grokStateChanged"
                          }
                      ]
                  },
                  {
                      name: "com.lab126.demoservice",
                      events: [
                          {
                              name:"grokStateChangedInDemoMode"
                          }
                      ]
                  },
                  {
                       name: "com.lab126.badgeservice",
                       events: [
                           {
                               name:"newBadgeAvailableEvent"
                           }
                       ]
                  },
                  {
                      name: "com.lab126.amazonRegistrationService",
                      events: [
                          {
                              name:"registrationChanged"
                          }
                      ]
                 },
                 {
                      name: "com.lab126.household",
                      events: [
                          {
                              name:"profileSwitchCompleted"
                          },
                          {
                              name:"currentActiveProfile"
                          }
                      ]
                 },
                 {
                      name: "com.lab126.pmond",
                      events: [
                          {
                              name:"systemMemoryNormal"
                          },
                          {
                              name:"systemMemoryLow"
                          },
                          {
                              name:"systemMemoryVeryLow"
                          },
                          {
                              name:"systemMemoryCritical"
                          }
                      ]
                 },
                ]
            };

    /**
     * handles lipc appmgr appStateChange event
     */
    this.appStateChange = function(values){

        var appId = values[0];
        var appEventType = values[1];
        var appEventStage = values[2];

        var currentAppId = nativeBridge.getAppId();
        Pillow.logDbgMid("currentAppId ", currentAppId);
        // on beginning of go event cache the app state
        // so we can go back to it on fail and set appId
        if ((appEventType === "go") && (appEventStage === 0) &&
                (currentAppId !== appId)){
            
            Pillow.logDbgHigh("search bar got appStateChange go 0", appId);
            pillowCase.forEachXorButton(function (xb) { xb.appSwitchStarted(); });
            pillowCase.cacheCurrentAppState();
            pillowCase.resetApplicationState();
            // after appStateChange go 0 event we are expecting a new configurechrome
            // to come in
        }
    };
    
    /**
     * handle lipc appmgr appFailedInGo event
     */
    this.appFailedInGo = function(values){
        Pillow.logDbgHigh("search bar appfailedingo ");
        // return to cached value
        pillowCase.loadCachedAppState();
        pillowCase.forEachXorButton(function (xb) { xb.appSwitchFailed(); });
    };

    this.devicePolicyValueChanged = function(values) {
        pillowCase.devicePolicyManager.handleLipcEvent(values);
    };

    this.deviceControlsStateChange = function(values) {
        pillowCase.onDeviceControlStateChange();
    };

    this.dynamicConfigUpdated = function(values) {
        //skip the first param since it is just a count of the remaining params
        for (var i = 1; i < values.length; i++) {
            if ((values[i] === DYNCONFIG_OBFUSCATED_MARKETPLACE_KEY) || 
            (values[i] === DYNCONFIG_URL_BAIDU_SEARCH) ){
                pillowCase.updateDefaultSearchDomains(false);
                return;
            }
        }
    };

    /**
     * LIPC callback for discovery activity available event.
     */
    this.newActivitiesAvailableEvent = function(values) {
		Pillow.logInfo("Received newActivitiesAvailableEvent...");
		pillowCase.onDiscoveryActivityChange(values);
    };

    /**
     * LIPC callback for GROK Status Changed event.
     */
    this.grokStateChanged = function(values) {
        Pillow.logInfo("Received grokStateChanged Event...");
        pillowCase.updateDisplayGrokButton(values);
    };

    /**
     * LIPC callback for GROK Status Changed event in Demo Mode.
     */
    this.grokStateChangedInDemoMode = function(values) {
        Pillow.logInfo("Received grokStateChangedInDemoMode Event...");
        pillowCase.updateDisplayGrokButtonInDemoMode(values);
    };

    /*
     * LIPC callback for badge activity available event.
     */
    this.newBadgeAvailableEvent = function(values) {
        Pillow.logInfo("Received newBadgeAvailableEvent...");
        pillowCase.onBadgeActivityChange(values);
    };

    /*
     * LIPC callback for Profile Switch Completed event.
     * values[0] contains role and value[1] contains profile id 
     */
    this.profileSwitchCompleted = function(values) {
        Pillow.logInfo("Received profileSwitchCompleted Event...");
        pillowCase.setHistoryProfile(values[1]);
    };

    /*
     * LIPC callback for Profile Switch Completed event.
     * values[0] contains role and value[1] contains profile id 
     */
    this.currentActiveProfile = function(values) {
        Pillow.logInfo("Received currentActiveProfile Event...");
        pillowCase.setHistoryProfile(values[1]);
    };

    /*
     * LIPC callback for Registration Changed event.
     * Query Household service to get the current active profile
     */
    this.registrationChanged = function(values) {
        Pillow.logInfo("Received registrationChanged Event...");
        //pillowCase.setHistoryProfile(values[1]);
        var activeProfile = nativeBridge.getStringLipcProperty("com.lab126.household", "activeProfile");
        activeProfile = activeProfile? activeProfile : "default";
        pillowCase.setHistoryProfile(activeProfile);
    };

    /*
     * LIPC callback for system memory related events from pmond
     * This will be used to drop certain pillow cases that are
     * cached for performance. 
     */

     this.systemMemoryCritical = function(values) {
         pillowCase.handleLowMemory();
     }

     this.systemMemoryLow = function(values) {
         pillowCase.handleLowMemory();
     }
     
     this.systemMemoryVeryLow = function(values) {
         pillowCase.handleLowMemory();
     }
     
     this.systemMemoryNormal = function(values) {
         pillowCase.handleNormalMemory();
     }

};


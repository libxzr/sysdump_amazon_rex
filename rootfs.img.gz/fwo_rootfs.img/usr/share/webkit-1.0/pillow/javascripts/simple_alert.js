/*
 * simple_alert.js
 *
 * Copyright 2011-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * SimpleAlert manages a set of system alerts configured 
 */

// Alert Types to handle the scenario for JFOUR-4005
// where a single source needs to show 2 different alerts
const ALERT_TYPE1 = 0
const ALERT_TYPE2 = 1

function SimpleAlert(){

    // dont allow alerts taller than landscape height
    const ALERT_MAX_HEIGHT = Pillow.pointsToPixels(SIMPLE_ALERT_MAX_HEIGHT);

    // passed into alert config to maintain state
    var m_alertState = {};

    // use to mock out configuration file
    var m_configuration = DefaultConfiguration;

    // button bar object
    var m_buttonBar = null;

    // window title object
    var m_windowTitle = null;
    
    // time sice we last hid the window. This covers the problem
    // where you hide/show a window with win params quickly and it does not
    // ever hide
    var m_lastHideTime = 0;
    
    // timeout to wait until we show again.
    var m_showTimeout = null;
    
    // 
    const MINIMUM_HIDE_SHOW_DELAY = 150;

    var that = this;

    // LIFO stack of alerts. Highest index
    // on top
    var m_alertStack = new Array();
    
    /**
    * Check to see if alert is registered for this id
    */
    var alertHasAppId = function(alert, appId){
        for (i=0; i<alert.appIds.length; i++){
            if (alert.appIds[i] === appId){
                return true;
            }
        }
        
        return false;
    }
    
    /**
    * register this alert to respond to this app
    */
    var alertAddId = function(alert, appId){
        // add if not inlist already, 
        // expectation is this is used rarely and list is short
        if (!alertHasAppId(alert, appId)){    
            alert.appIds[alert.appIds.length] = appId;
        }
    }
    
    /**
    * hide window
    */
    var hideWindow = function (reshow){

        if (!reshow){
            nativeBridge.dismissMe();
        } else {
            m_windowTitle.withChanges(function() {
                // showing another window, tell window manager before going down
                nativeBridge.createFlashTrigger(FLASH_TRIGGER_TYPE_WAIT_FOR_RESHOW, 
                    FLASH_TRIGGER_FIDELITY_FAST_FULL, 2000, 30);
                //this.addParam(WINMGR.KEY.FLASH_ON_HIDE, "S"); //WINMGR.FLASH_ON_HIDE.SUPRESS
                this.addParam(WINMGR.KEY.HIDE_DIALOG, WINMGR.DIALOG_HIDE.BACKGROUND);
            });
        } 
        
        m_buttonBar.notVisible();
        m_lastHideTime = Date.now();
    };
    
     /**
     * shows the window
     * @param force
     *     call show even if already visible
     */
    var showWindow = function(){
        if (!m_showTimeout){
            
            var timeSinceHide = Date.now() - m_lastHideTime;
            
            if (timeSinceHide < MINIMUM_HIDE_SHOW_DELAY) {
                var delay = MINIMUM_HIDE_SHOW_DELAY - timeSinceHide;
                m_showTimeout = setTimeout(function() {
                        m_showTimeout = null;
                        m_windowTitle.removeParam(WINMGR.KEY.HIDE_DIALOG);
                        nativeBridge.showMe();
                        }, delay);
            } else {
                m_windowTitle.removeParam(WINMGR.KEY.HIDE_DIALOG);
                nativeBridge.showMe();
            }
        }
    };
    
    /**
     * compare a custom string entry against another
     * @param one 
     * @param two
     * @returns true if match, false otherwise
     */
    var compareCustomStrings = function(one, two){
        return ((one.matchStr === two.matchStr) && (one.replaceStr === two.replaceStr));
    };
    
    /**
     * compares alert to alert described by alertId and customStrings
     * @param alertId
     * @param customStrings
     * @returns true is alert is same alert as an with alertId/customStrings
     */
    var isSameAlert = function(alert, alertId, customStrings){

        if (alert.alertId !== alertId){
            return false;
        } else if (alert.customStrings && customStrings){
            Pillow.logDbgLow("alert id the same test custom strings");
            for (customStringIdx in customStrings){
                if (!compareCustomStrings(customStrings[customStringIdx], alert.customStrings[customStringIdx])){
                    Pillow.logDbgLow("custom string non match found ");
                    return false;
                }
            }
        }

        return true;
    };
    
    /**
     * removes matching alert from alert stack
     * @param {String} appId
     *      ID of app or reply source to match against
     *      null is not a match
     * @param {String} alertId
     *      alert ID to match against. Because appAlert1
     *      is a generic alert it is not considered a match
     */
    var removeAlertFromStack = function(appId, alertId, alertType, customStrings){
        
        // loop through and splice out matching alerts
        var i;
        var removed;
        for (i=m_alertStack.length-1;i>=0;i--){
            Pillow.logDbgMid("looking at alert at " + i);
            // Alert dismissal logic
            // 1.Alerts of same types from same application can be dismissed, or  
            // 2.Alerts with the same ID and content
            // Note there should be only one alert of an appId with a given type            
            if (isSameAlert(m_alertStack[i], alertId, customStrings)) {
                Pillow.logDbgLow("removing alert matching alert", alertId);
                
                // if removing a specific alert return it so it can be put back in if need be
                removed = m_alertStack[i]
                
                m_alertStack.splice(i, 1);
            } else  if ( (alertType === null || alertType === m_alertStack[i].alertType) && alertHasAppId(m_alertStack[i], appId) ){
                Pillow.logDbgLow("removing alert with same caller type and src", alertId);
                m_alertStack.splice(i, 1);
            }
            
        }
        
        return removed;
    };

    /**
     * gets the top most visible alert
     */
    var getTopAlert = function(){
        // last alert is top most
        return m_alertStack.length?m_alertStack[m_alertStack.length-1]:{};
    };

    
    /**
     * pushes alert on top
     * @param {Object} alertDef
     *      alert definition object
     * @param {Array} customStrings
     *      array of replacement strings to apply to alert
     * @param {String} appId
     *      ID of app or reply source for alert
     * @param {String} alertId 
     *      ID of alert
     */
    var pushTopAlert = function(alertDef, customStrings, appId, alertId, alertType){
        Pillow.logDbgHigh("+++++SimpleAlert.pushTopAlert");
        
        var newTopAlert = {};
        
        // remove any matching alert first, catch removedAlertAppIds to reuse and
        // maintain list of subscribers to this alert
        var removed = removeAlertFromStack(appId, alertId, alertType, customStrings);
        
        if (removed){
            // removed an existing matching alert, just reuse that same alert
            Pillow.logDbgHigh("reuse existing alert, just reinsert at the top of stack");
            newTopAlert = removed;
        } else {
          
            // set appID and alertId
            newTopAlert.alertId = alertId;
            newTopAlert.alertType = alertType;
            newTopAlert.buttonLayout = alertDef.buttonLayout;
            newTopAlert.customStrings = customStrings;
            newTopAlert.appIds = new Array();
            
            // set title
            newTopAlert.title = alertDef.title || '';

            // set alert text
            newTopAlert.text = alertDef.text || '';
            
            // fill in custom strings
            if (customStrings){
            	
                // loop through and replace 
                for (idx in customStrings){
                    var mfText = new MessageFormat(newTopAlert.text);
                    var mfTitle = new MessageFormat(newTopAlert.title);
                    var str = customStrings[idx].matchStr;
                    var obj = new Object();
                    obj[str] = customStrings[idx].replaceStr;
                    newTopAlert.text = mfText.format(obj);
                    newTopAlert.title = mfTitle.format(obj);                
                }
            }

            // set buttons
            if (alertDef.buttons !== undefined){
                Pillow.logDbgLow("setting buttons");
                newTopAlert.buttons = alertDef.buttons;
            }

            // set callback
            if (alertDef.callbackProp !== undefined){
                newTopAlert.callbackProp = alertDef.callbackProp;
            }
        }
        
        // make sure alertId is added. This is not always the same as the existing alert
        alertAddId(newTopAlert, appId);

        // push to end (top) of alert stack
        m_alertStack.push(newTopAlert);
    };
    
    /**
     * show the top most alert
     * @returns true if alert was shown, false if there
     *      are no more alerts to show
     */
    var showTopAlert = function(){

        // look for the next alert 
        // and show it if there is one 
        var topAlert = getTopAlert();

        if (!topAlert.alertId){
            // no top alert to show
            hideWindow(false);
            return false;
        }

        // hide
        hideWindow(true);

        // set title and text in alert
        document.getElementById('title').textContent = topAlert.title;
        
        
        // Split the alert text into lines...
        textField = document.getElementById('text');
        inputLines = topAlert.text.split('\n');
        
        // ...display the first line...
        textField.innerHTML = inputLines[0];

        // ...and append a new div to display each line after the first.
        // the multiple new line character '\n' will be ignored and <br> will supported as multiple new line chracter
        // in case on nextLine.innerHTML replacesd with .text <br> will be printed 
        for (var i = 1; i < inputLines.length; i++){
            var nextLine = document.createElement('div');
            nextLine.innerHTML = inputLines[i];
            textField.appendChild(nextLine);
        }

        Pillow.logDbgLow("setting up alert buttons");

        m_buttonBar.resetButtons(topAlert.buttons, topAlert.buttonLayout);

        // get height from main div. Can not use 
        // document.body.offsetWidth because it will
        // not shrink with content
        var height = document.getElementById('main').offsetHeight;
        
        // set the real alert win size
        nativeBridge.setWindowSize(document.body.offsetWidth, 
                (height > ALERT_MAX_HEIGHT)? ALERT_MAX_HEIGHT: height);
        
        Pillow.logDbgHigh("showing alert window");
        
        showWindow();
        nativeBridge.createFlashTrigger(FLASH_TRIGGER_TYPE_CLIENT, FLASH_TRIGGER_FIDELITY_FAST_FULL, 
                    2000, 600);

        return true;
    };

    /**
     * show alert
     * @param {Object} alertDef
     *      alert definition object
     * @param {Array} customStrings
     *      array of replacement strings to apply to alert
     * @param {String} appId
     *      ID of app or reply source for alert
     * @param {String} alertId 
     *      ID of alert
     */
    var showAlert = function(alertDef, customStrings, appId, alertId, alertType){
        var topAlert = getTopAlert();
        
        if (!isSameAlert(topAlert, alertId, customStrings)){
            pushTopAlert(alertDef, customStrings, appId, alertId, alertType);
            showTopAlert();
        } else {
            // add another id to existing top alert
            Pillow.logDbgLow("add id to existing alert");
            alertAddId(topAlert, appId);
        }
    };

    /**
    * subscribe to all events in the configuration
    */
    var subscribeToEvents = function(){
        Pillow.logDbgLow("+++++SimpleAlert.subscribeToEvents");

        // we only allow a single alert so until we decide if we support
        // some sort of alert list view only the last initAlert will show
        // on init
        var initAlert = null;
        var initAlertSrcName = null;

        //subscribe to events
        for (var i = 0; i < m_configuration.sources.length; i++){
            var src = m_configuration.sources[i];

            // check init function to see if alert is already set to fire
            if (src.initFunc){
                initAlert = src.initFunc(m_alertState);
                if (initAlert && initAlert.show){
                    initAlertSrcName = src.name;
                }
            }

            if (!src.events){
                continue;
            }

            for (var j = 0; j < src.events.length; j++){
                var event = src.events[j];
                nativeBridge.subscribeToEvent(src.name, event.name);
                Pillow.logDbgLow("subscribe done");
            }
        }

        if (initAlert && initAlert.show){
            if(initAlert.alertType == null){
            	initAlert.alertType = ALERT_TYPE1; 
            }
            handleShowAlertRequest (initAlert.alertId, null, initAlert.alertType, initAlertSrcName, null, null);
        }
        Pillow.logDbgLow("-----SimpleAlert.subscribeToEvents");
    };

    /**
    * for testing load mock alert configuration
    * public because it gets called directly from C by unit tests
    */
    this.loadMockEvents = function(){
        //ideally I can figure a way to dynamically load the mock events
        //but it does not seem to be working
        Pillow.logDbgHigh("+++++SimpleAlert.loadMockEvents");

        // swap in the MockConfiguration and redo our subscrptions
        if (typeof MockConfiguration !== undefined){
            Pillow.logDbgHigh("replacing DefaultConfiguration with MockConfiguration for testing");
            m_configuration = MockConfiguration;

            subscribeToEvents();
        } else {
            Pillow.logDbgHigh("failed to replace DefaultConfiguration for testing");
        }

    };

    /**
    * dismiss the alert
    * public because it gets called directly from C layer
    * by unit tests
    */
    this.dismissAlert = function () {
        hideWindow(false);
    };

    /**
     * handle show request of a given alert
     * @param {String} alertId
     *      ID of alert to show
     * @param {String} alertAltId
     *      ID of alternate alert to show if alertId is not found
     * @param {String} replySrc
     *      replySrc for lipc reply to user action on alert
     * @param {Array} customStrings
     *      Array of custom strings to apply to title and alert text
     * @param {String} alertLogInfo
     *      optional logging parameter to add to the system logs to help identify this alert. While
     *      not required, it is useful when the use of customStrings makes the alertId alone not enough 
     *      to identify the exact alert being shown to the user.
     */
    var handleShowAlertRequest = function(alertId, alertAltId, alertType, replySrc, customStrings, alertLogInfo){ 

        if (!alertId && !alertAltId){
            Pillow.logWarn("show-alert-invalid", {id: alertId, altId: alertAltId});
            return;
        }
        
        Pillow.logInfo("show-system-alert", {id: alertId, altId: alertAltId, alertLogInfo:alertLogInfo});

        // create an alert state to go with this alert
        // if there is not already one
        if (!m_alertState[alertId]){
            m_alertState[alertId] = {};
        }

        // if there is a pending auto hide and we are showing again
        // cancel the pending auto hide
        if (m_alertState[alertId].autoHideTimout){
            Pillow.logDbgHigh("autohide timout cleared ", alertId);
            clearTimeout(m_alertState[alertId].autoHideTimout);
            m_alertState[alertId].autoHideTimout = null;
        } 

        Pillow.logDbgHigh("show alertId ", alertId);

        //check for a matching alert def
        var alertDef = m_configuration.alerts[alertId];

        // if the alertdef is not there, try the alt
        if (!alertDef && alertAltId && alertAltId.length){
            Pillow.logDbgHigh("looking for alt alertId ", alertAltId);
            alertDef = m_configuration.alerts[alertAltId];
        } 

        // show the alert
        if (alertDef){
            Pillow.logDbgLow("found alertDef");
            showAlert(alertDef, customStrings, replySrc, alertId, alertType);
        } else {
            Pillow.logDbgHigh("can't show undefined alertId");
        }
    };
    
    /**
     * handle hide request of a given alert ID
     * @param alertId
     *      id of alert to hide
     */
    var handleHideAlertRequest = function(alertId, customStrings){
        
        if (!alertId){
            Pillow.logWarn("hide-alert-invalid", {id: alertId});
            return;
        }
        
        // if there is a pending auto hide and we are hiding
        // cancel the pending auto hide
        if (m_alertState[alertId] && m_alertState[alertId].autoHideTimout){
            clearTimeout(m_alertState[alertId].autoHideTimout);
            m_alertState[alertId].autoHideTimout = null;
        }

        Pillow.logDbgHigh("hide request ", alertId);

        var topAlert = getTopAlert();
        var removed;
        if (isSameAlert(topAlert, alertId, customStrings)){
            Pillow.logDbgLow("hiding top most alert");
            removed = removeAlertFromStack(null, alertId, null, customStrings);
            showTopAlert();
        } else {
            Pillow.logDbgLow("hiding alert below top");
            removed = removeAlertFromStack(null, alertId, null, customStrings);
        }
        if(!removed && m_alertStack.length == 0) {
            Pillow.logInfo("No valid alert removed and alert stack length is 0");
            hideWindow(false);
        }

        return;
    };
    
    /**
    * clientParamsCallback is a single callback used for just about all communications
    * up to the JS layer from the C Layer.
    * @param clientParamsString
    *           JSON formatted string of passed in clientParams
    */
    this.clientParamsCallback = function (clientParamsString){
        Pillow.logDbgHigh("clientParams received by simple alert JS");
        Pillow.logDbgMid(clientParamsString);

        // parse clientParams
        var clientParams = JSON.parse(clientParamsString);

        //check for State check call
        if (clientParams.getState){
            Pillow.logDbgHigh("getState call on simple alert");
            var i;
            for (i=m_alertStack.length-1;i>=0;i--){
                Pillow.logDbgHigh("**** Alert " + i);
                Pillow.logDbgHigh("id: ", JSON.stringify(m_alertStack[i].alertId));
                Pillow.logDbgHigh("title: ", JSON.stringify(m_alertStack[i].title));
                Pillow.logDbgHigh("text: ", JSON.stringify(m_alertStack[i].text));
            }
            return;
        }

        //Hide all simple alerts
        if (clientParams.clearAll){
            Pillow.logDbgHigh("clearAll call on simple alert");
            while (m_alertStack.length > 0) {
                m_alertStack.pop();
            }
            hideWindow(false);
            return;
        }

        // check to see if this is just a setup
        if (clientParams.setup){
            return;
        }

        if (clientParams.loadMockEvents){
            loadMockEvents();
            return;
        }

        if (clientParams.show){
            if(clientParams.alertType == null){
                clientParams.alertType = ALERT_TYPE1; 
            }
            handleShowAlertRequest(clientParams.alertId, clientParams.alertAltId, clientParams.alertType, clientParams.replySrc, 
                    clientParams.customStrings, clientParams.alertLogInfo);
        } 

        if (clientParams.hide){
            handleHideAlertRequest(clientParams.alertId, clientParams.customStrings);
        }

        if (clientParams.autoHide){
            // if auto hide timeout is set, set up timer to hide
            m_alertState[clientParams.alertId].autoHideTimout = 
                setTimeout(function(){ handleHideAlertRequest(clientParams.alertId, clientParams.customStrings);}, clientParams.autoHide);
        }
    };


    /**
    * check for a button action on the button and 
    * call it if it is set. 
    * @param action
    *       action object describes LIPC action to take in response
    *       to this button
    */
    var invokeButtonAction = function (action){
        //validate the action
        if (action && action.type && action.pub && action.prop && (action.value !== undefined)){
            if (action.type === "string"){
                nativeBridge.setLipcProperty(action.pub, action.prop, action.value);
            } else if (action.type === "int") {
                nativeBridge.setIntLipcProperty(action.pub, action.prop, action.value);
            }
            
            // return true to indicated it was handled
            return true;
        } else {
            // return false to allow the callback to go the caller
            return false;
        }
    };
    

    /**
    * handle the button the user tapped
    * 
    * @param button
    *       button object describes the button selected
    */
    this.handleButton = function (button){
        Pillow.logDbgHigh("+++++SimpleAlert.handleButton ", button.text);

        var topAlert = getTopAlert();
        
        // check to see if there is a button action set
        if (!invokeButtonAction(button.action)){
            Pillow.logDbgLow("no button action set, callback to caller");
            
            //send lipc set prop and dismiss dialog
            if ((topAlert.alertId) && (topAlert.callbackProp)){

                // reply to all appsIds
                for (i=0; i<topAlert.appIds.length; i++){
                    nativeBridge.setLipcProperty(topAlert.appIds[i], topAlert.callbackProp, button.id);
                }
            }
        }
        
        // time stamp the dismissal
        if (m_alertState[topAlert.alertId]){
            Pillow.logDbgLow("time stamp user dismiss of alert");
            var curTime = new Date();
            m_alertState[topAlert.alertId].dismissTimeStamp = curTime.getTime();
        }

        // pop alert off stack
        m_alertStack.pop();

        // show the next alert or dismiss
        showTopAlert();
    };
    
    /**    
    * Events callback, look for event handler and show correct alert
    * 
    * @param jsonString
    *     JSON formatted string describing event
    */
    this.eventsCallback = function(jsonString){

        Pillow.logDbgHigh("+++++ simpleAlert SimpleAlert.eventsCallback ", jsonString);

        if (!jsonString){
            return;
        }

        var eventIn = JSON.parse(jsonString);

        if (!eventIn){
            return;
        }

        for (var i = 0; i < m_configuration.sources.length; i++){
            var src = m_configuration.sources[i];
            if (src.name === eventIn.eventSrc)
            {
                Pillow.logDbgLow("looking at ", src.name, " events");
                if (!src.events){
                    continue;
                }

                for (var j = 0; j < src.events.length; j++){
                    var event = src.events[j];
                    if (event.name === eventIn.eventName){

                        Pillow.logDbgMid("looking at ", event.name, " event name");

                        if (event.eventValidator){
                            //call the validator to look for the right alert
                            var eventAction = event.eventValidator(eventIn.eventValues, m_alertState);

                            if ( (eventAction) && (eventAction.alertId) ){

                                //TODO potentially could have an update of an existing alert
                                //but for now just show and hide
                                if (eventAction.show){
                                    Pillow.logDbgLow("show alertId ", eventAction.alertId);

                                    var topAlert = getTopAlert();
                                    if ( (alertHasAppId(topAlert, src.name)) &&
                                            (eventAction.alertId === topAlert.alertId) ){
                                        Pillow.logDbgLow("alert already shown");
                                    } else {
                                        Pillow.logDbgLow("++++++++about to get prop ", eventAction.alertId);
                                        if(eventAction.alertType == null){
                                        	eventAction.alertType = ALERT_TYPE1; 
                                        }
                                        handleShowAlertRequest(eventAction.alertId, null, eventAction.alertType, src.name, null, null);
                                    }

                                } else if (eventAction.hide) {
                                    handleHideAlertRequest(eventAction.alertId, null);
                                }
                            }
                        }

                        break;
                    }
                }
            }
        }
    };

    /**
     * used by unit tests to get state object
     */
    this.getState = function(){
        return m_alertStack;
    }

    /**
     * initialize object onload
     */
    this.init = function(){
        Pillow.logDbgHigh("+++++simpleAlert init function called");

        m_buttonBar = new ButtonBar('buttonBar', null, this.handleButton);
        
        m_windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, WINMGR.ROLE.ALERT);
        m_windowTitle.withChanges(function() {
                this.addParam(WINMGR.KEY.WIN_IS_MODAL, true);
                this.addParam(WINMGR.KEY.HIDE_DIALOG, WINMGR.DIALOG_HIDE.BACKGROUND);
                this.addParam(WINMGR.KEY.SHOWEVENT, "simpleAlertShow");
            });

        // register to be called back when clientParams are updated
        // on init there may be client params already waiting so 
        // the alert may show right here
        nativeBridge.registerClientParamsCallback(this.clientParamsCallback);

        // register events callback
        nativeBridge.registerEventsWatchCallback(this.eventsCallback);

        // subscribe to any events needed
        subscribeToEvents();

	//API to check for larger display mode and parsing the DOM to pick large property values
        modifyClassNameDOM();

        Pillow.logDbgHigh("-----simpleAlert init function called");
    };
};

// Store in window 
window.simpleAlert = new SimpleAlert();

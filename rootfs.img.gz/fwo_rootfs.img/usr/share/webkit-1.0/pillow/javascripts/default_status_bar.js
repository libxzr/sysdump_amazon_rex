var StatusBar = {};

const WATCH_WAN_UNINITIALIZED = 0;
const WATCH_WAN_DISABLED = 1; 
const WATCH_WAN_ENABLED = 2;

const TITLE_BAR_TAPPED_PROPERTY = "titleBarButtonSelected";

// state assosiated with current app
//
// Note: if you add any sub-objects to the app state,
// update the cloneAppState function.
var AppState = function (){
    return {
        primary                 : "",
        defaultPrimary          : "",
        useDefaultPrimary       : false,
        secondary               : "",
        signalStrength          : false,
        tapHandler              : nativeBridge.raiseChrome
    };
};

// Clone an app state.
// This is a shallow copy because everything we store in
// an app state is an immutable, primitive value.
var cloneAppState = function(a){
    var clone = {};
    for (var k in a) {
        clone[k] = a[k];
    }
    return clone;
};

// state for status bar
var State = {
    watchingWanSignalStrength       : WATCH_WAN_UNINITIALIZED,
    visObscure              : null,
    statusBarTextPending    : false,
    appState                : new AppState(""),
    cachedAppState          : null,
    windowTitle             : null
};

/**
 * unit test query state through this call
 */
StatusBar.getState = function(){
    return State.appState;
};


// date time formatter object to use
var DateTimeFormatter = null;

/**
* resolve primary text as application set text of default
*/
StatusBar.getPrimaryDisplayText = function(){

    var returnVal;
    if (State.appState.useDefaultPrimary) {
        returnVal = State.appState.defaultPrimary;
    } else {
        returnVal = State.appState.primary;
    }

    return returnVal;
};

/*
controls beach ball spinner
*/
BeachBallAnimation = {
    endIconState   : 7,
    currentIconState : 0,
    cycleTime   : 750,
    running     : false,
    timer       : null,
    textTimeout : null,
    textShowTime    : 8000,
    doneTextShowTime    : 4000
};

/**
* set icons to next rotation state
*/
BeachBallAnimation.setIcon = function(newState){
    // NOTE I tried to use css rotation on the images and the result is not usable
    document.getElementById('spinner').setAttribute("class", "spinnerIcon" + newState);
};

/**
* hide the spinner
*/
BeachBallAnimation.hideSpinner = function(){
    document.getElementById('spinner').removeAttribute("class");
};


/**
* switch text activity off
*/
BeachBallAnimation.switchToNoTextMode = function(){
    //clear the timeout
    if (BeachBallAnimation.textTimeout){
        clearTimeout(BeachBallAnimation.textTimeout);
        BeachBallAnimation.textTimeout = null;
    }

    //hide the the div and clear the text
    document.getElementById('textualActivity').style.display = 'none';
    document.getElementById('textualActivityText').textContent = '';    

    //show the status bar normal state
    document.getElementById('titleText').style.display = '';

    // validate text
    StatusBar.resolveText();

};

/**
* switch text activity on
* @param {String} text
*       text to show
* @param {Boolean} showSpinner
*       true to show spinner
*/
BeachBallAnimation.switchToTextMode = function(text, showSpinner, timeout){

    // show the text div and set the text
    document.getElementById('textualActivity').style.display = '';
    document.getElementById('textualActivityText').textContent = text;

    // hide the status bar spinner and display text
    document.getElementById('titleText').style.display = 'none';

    // if there is already a text activity 
    // clear the current timeout
    if (BeachBallAnimation.textTimeout){
        clearTimeout(BeachBallAnimation.textTimeout);
    }

    // set a timeout to clear the text activity
    BeachBallAnimation.textTimeout = setTimeout(BeachBallAnimation.switchToNoTextMode, 
                        timeout);
};

/**
* rotate beachball to next visual state
*/
BeachBallAnimation.rotateIcon = function(){

    // move to next state
    if (BeachBallAnimation.currentIconState === BeachBallAnimation.endIconState){
        BeachBallAnimation.currentIconState = 0;
    } else {
        BeachBallAnimation.currentIconState++;
    }
    
    // set the icon
    BeachBallAnimation.setIcon(BeachBallAnimation.currentIconState);
    
};

/**
* start beach ball spinner
* @param {String} text
*       text to show
*/
BeachBallAnimation.startActivityIndicator = function(text){
    Pillow.logDbgMid("+++++BeachBallAnimation.startActivityIndicator ::", text);
    
    // if there is text with this activity switch to text mode
    if (text){
        BeachBallAnimation.switchToTextMode(text, true, BeachBallAnimation.textShowTime);
    }

    // if there is no timer set there is no activity
    // spinning already start the spinner
    if (!BeachBallAnimation.timer){
        Pillow.logDbgLow("setting new timer");
        
        //set to initial state
        BeachBallAnimation.currentIconState = 0;
        
        //set the initial icon
        BeachBallAnimation.setIcon(BeachBallAnimation.currentIconState);
        
        //start the rotation timer
        BeachBallAnimation.timer = setInterval(BeachBallAnimation.rotateIcon, 
                            BeachBallAnimation.cycleTime);
                            
    }
    
};

/**
* stop beach ball spinner
* @param {String} text
*       text to show
*/
BeachBallAnimation.stopActivityIndicator = function(text){
    Pillow.logDbgMid("+++++BeachBallAnimation.stopActivityIndicator :: ", text);
    
    // clear the rotation timer
    clearInterval(BeachBallAnimation.timer);
    BeachBallAnimation.timer = null;
    
    // hide the spinner
    BeachBallAnimation.hideSpinner();

    // set the icon state back
    BeachBallAnimation.currentIconState = 0;
    
    if (text){
        // if there is text, switch to text mode. Even as 
        // we stop the underlying spinning we show the 
        // stop text
        BeachBallAnimation.switchToTextMode(text, false, BeachBallAnimation.doneTextShowTime);
    } else {
        BeachBallAnimation.switchToNoTextMode();
    }
};

/**
* Switch to text mode. This does not effect spinner 
* on the main status bar
* @param {String} text
*       text to show
*/
BeachBallAnimation.setSpinnerlessText = function(text){
    Pillow.logDbgMid("+++++BeachBallAnimation.setSpinnerlessText");
    
    if (text){
        BeachBallAnimation.switchToTextMode(text, false, BeachBallAnimation.textShowTime);
    } 
};

var unsetPriorityTimeout = null;

BeachBallAnimation.setPriority = function(p){
    if (unsetPriorityTimeout) {
        clearTimeout(unsetPriorityTimeout);
        unsetPriorityTimeout = null;
    }
    if (p) {
        Pillow.logDbgMid("forcing titlebar visible");
        State.windowTitle.addParam(WINMGR.KEY.CUSTOM.FORCE_VISIBLE, true);
    } else {
        Pillow.logDbgMid("no longer forcing titlebar visible (after one second timeout)");
        unsetPriorityTimeout = setTimeout(function() {
                State.windowTitle.removeParam(WINMGR.KEY.CUSTOM.FORCE_VISIBLE);
            }, 1000);
    }
};

/**
* determines pixel width required for a given string on the title bar
* @param {String} text
*       text to measure
*/
StatusBar.getRequiredPixelLength = function(text){
    document.getElementById('hiddenTextTester').style.display = '';
    var hiddenText = document.getElementById('hiddenText');
    hiddenText.textContent = text;
    var returnVal = hiddenText.offsetWidth;
    document.getElementById('hiddenTextTester').style.display = 'none';
    return returnVal;
};

/**
 * Setter that modifies the statusBarTextPending field.
 * @param pending True if their is a text update to be processed, false otherwise.
 */
StatusBar.setStatusBarTextPending = function(pending){
    State.statusBarTextPending = pending;
}

/**
* if we are showing signal strength and wan is the active interface
* then call wan to allow wan signal strength events to flow
*/
StatusBar.checkWanEventDisableEnable = function(){

    Pillow.logDbgMid("+++++StatusBar.checkWanEventDisableEnable ", State.watchingWanSignalStrength);
    
    // when watching signal strength for wan disable if we switch off
    // of wan or if the status bar becomes fully obscured
    if ((State.watchingWanSignalStrength !== WATCH_WAN_DISABLED) && 
            ((State.visObscure === "full") || (ConnectionState.connection !== "wan")) ){
        Pillow.logDbgHigh("DISABLING WAN EVENTS NOW");
        nativeBridge.setLipcProperty("com.lab126.wan", "serviceEventDisable", "com.lab126.pillow:status_bar");
        State.watchingWanSignalStrength = WATCH_WAN_DISABLED;
    } else if ((State.watchingWanSignalStrength !== WATCH_WAN_ENABLED) &&
            (State.visObscure !== "full") && (ConnectionState.connection === "wan")){
        Pillow.logDbgHigh("ENABLING WAN EVENTS NOW");
        nativeBridge.setLipcProperty("com.lab126.wan", "serviceEventEnable", "com.lab126.pillow:status_bar");
        State.watchingWanSignalStrength = WATCH_WAN_ENABLED;
    }
    
};

/**
* callback from connection class to set the signal strength icon
* @param {String} iconClass
*       css class name
*/
StatusBar.setSignalStrengthIcon = function(iconClass){
    //set signal strength icon to passed in value
    document.getElementById('connectionSignalStrengthIconDiv').setAttribute("class", iconClass);
};

/**
* callback from connection class to set the active interface
* @param {String} iconClass
*       css class name
*/
StatusBar.setConnectionIcon = function(iconClass){
    
    //set connection type icon to passed in value
    document.getElementById('connectionStatusIconDiv').setAttribute("class", iconClass);

    //every time the connection icon changes 
    //re-eval if we need to tell wan we are actively querying 
    //wan signal strength state
    StatusBar.checkWanEventDisableEnable();
};
    
/**
* resolves and lays out primary and secondary text labels. The UI rules are that
* primary text comes first then secondary. However, if the addition of the two
* is longer than can fit we truncate the primary text rather than the secondary text
*/
StatusBar.resolveText = function(){
    
    
    // only update text if it has changed
    if (!State.statusBarTextPending){
        Pillow.logDbgMid("text is already correct");
        return;
    }

    // if the text area is hidden delay this action. resolveText will get called again after 
    // the text area is visible again.
    if ( (document.getElementById('titleText').style.display == 'none') ||
            (State.visObscure !== "none") ){
        Pillow.logDbgMid("text is obscured, handle later");
        return;
    }

    var totalTextWidth = document.getElementById('titleText').offsetWidth;

    var primaryToShow = StatusBar.getPrimaryDisplayText();

    var secondaryToShow;

    if (primaryToShow && State.appState.secondary ){
        secondaryToShow = StatusBarStringTable.titleTextSeparator + State.appState.secondary;
    } else {
        secondaryToShow = State.appState.secondary;
    }

    //get width needed for secondary
    var widthForSecondary = StatusBar.getRequiredPixelLength(secondaryToShow);

    //get what we need for primary
    var widthForPrimary = StatusBar.getRequiredPixelLength(primaryToShow);

    //compare what we need to max and set appropriately
    var maxWidthForPrimary = totalTextWidth - widthForSecondary;

    //set div widths based on length of primary and secondary text
    if (maxWidthForPrimary < StatusBarStringTable.minWidthForPrimary) {
	// primary width is insignificant
	Pillow.logDbgMid("Setting width to zero");
	document.getElementById('leftTextDiv').style.width = 0 + "px";
	secondaryToShow = State.appState.secondary;
	document.getElementById('middleTextDiv').style.width = totalTextWidth + "px";
    } else if (widthForPrimary > maxWidthForPrimary){
        Pillow.logDbgMid("Setting to max width");
        document.getElementById('leftTextDiv').style.width = maxWidthForPrimary + "px";
	document.getElementById('middleTextDiv').style.width = widthForSecondary + "px";
    } else {
        Pillow.logDbgMid("Setting to required width");
        document.getElementById('leftTextDiv').style.width = widthForPrimary + "px";
	document.getElementById('middleTextDiv').style.width = widthForSecondary + "px";
    }

    //set text
    document.getElementById('middleTextSpan').textContent = secondaryToShow;
    document.getElementById('leftTextSpan').textContent = primaryToShow;

    // text has been correctly set
    State.statusBarTextPending = false;
};

/**
* format time string for the device
* @param {Date Object} curtime
*       current time Date Object
*/
StatusBar.formatTime = function(curtime){

    var time = "";
    if (DateTimeFormatter){
        time = DateTimeFormatter.format(curtime);
    } else {
        //on desktop test builds I dont have lab126
        //date time formatter, so use custom code
        //calculate out time string and set
        var curhour = curtime.getHours();
        var curmin = curtime.getMinutes();
        var cursec = curtime.getSeconds();

        if (curhour == 0)
            curhour = 12;
        time = (curhour > 12 ? curhour - 12 : curhour) + ":" +
                (curmin < 10 ? "0" : "") +
                curmin +
                " " +
                (curhour > 12 ? "PM" : "AM");
    }

    return time;
};

/**
* Use DateTimeFormatter to compute the longest possible time string in 
* the current locale. 
* @return An integer representing the length of the longest possible time in pixels.
*/
StatusBar.getTimeLength = function(){
    if (!DateTimeFormatter) {
        Pillow.logWarn('pillow-sb-no-date-time-fmt');
        return;
    }
    var dateObj = new Date();
    dateObj.setMinutes(0);

    var maxLength = 0;
    var maxValue = 0;

    for (var hour = 0; hour < 24; hour++) {
        dateObj.setHours(hour);
        var timeStr = DateTimeFormatter.format(dateObj);
        var timeLength = StatusBar.getRequiredPixelLength(timeStr);
        if (timeLength > maxLength) {
            maxLength = timeLength;
            maxValue = hour;
        }
    }

    dateObj.setHours(maxValue);
    maxValue = 0;
    maxLength = 0;

    for (var minute = 0; minute < 60; minute++) {
        dateObj.setMinutes(minute);
        var timeStr = DateTimeFormatter.format(dateObj);
        var timeLength = StatusBar.getRequiredPixelLength(timeStr);
        if (timeLength > maxLength) {
            maxLength = timeLength;
        }
    }

    return maxLength;
}

/**
 * clock timer object, maintains the clock 
 * on the status bar
 */
StatusBar.clock = function(){
    var clockTimer = null;
    var setTime = function(){
        Pillow.logDbgLow("setTime called");

        var dateObj = new Date();

        var time = StatusBar.formatTime(dateObj);

        document.getElementById('timeSpan').textContent = time;

        clockTimer = setTimeout(setTime, 60000 - (1000*dateObj.getSeconds()));
    };

    return {
        /**
         * updates time and armsclock timer
         */
        arm : function(){
            if (!clockTimer){
                Pillow.logDbgLow("initiating clock timer");
                setTime();
            }
        },
        /**
         * disarms the clock timer
         */
        disarm : function(){
            if (clockTimer){
                Pillow.logDbgLow("clearing clock timer");
                clearTimeout(clockTimer);
                clockTimer = null;
            }
        },
        /**
         * fixes time and disarm/rearms the clock timer.
         * Used when timezone/time changes on us
         */
        update : function(){
            if (clockTimer){
                Pillow.logDbgLow("resetting clock timer");
                clearTimeout(clockTimer);
                clockTimer = null;
                setTime();
            }
        }
    };
}();

/**
* callback when client params get updated
*/
StatusBar.clientParamsCallback = function(clientParamsString){
    Pillow.logDbgHigh("clientParams received by JS");
    Pillow.logDbgMid(clientParamsString);

    var clientParams = JSON.parse(clientParamsString);

    if(clientParams.primary) {
        clientParams.primary = clientParams.primary.trim();
    }
    
    if(clientParams.secondary) {
        clientParams.secondary = clientParams.secondary.trim();
    }

    var titleTextDiv = document.getElementById('titleText');
    if(clientParams.titleLang) {
	titleTextDiv.setAttribute("lang", clientParams.titleLang);
    } else {
    	titleTextDiv.removeAttribute("lang");
    }
    
    var textLabelsChanged = false;

    //check for State check call
    if (clientParams.getState){
        var stateString = JSON.stringify(State);
        Pillow.logInfo("status-cp", {state: stateString});
        if (clientParams.replyLipcSrc && clientParams.replyProp){
            nativeBridge.setLipcProperty(clientParams.replyLipcSrc, clientParams.replyProp, stateString);
        }
        return;
    }

    if (clientParams.dumpDom){
        Pillow.logInfo("status-dom-dump", {left: document.getElementById('leftTextSpan').textContent, middle: document.getElementById('middleTextSpan').textContent});
    }
    
    if ((clientParams.visObscure) && (State.visObscure !== clientParams.visObscure)){
        Pillow.logDbgMid("vis changed received on status bar client params :: ", clientParamsString.visObscure);
        
        //change state
        State.visObscure = clientParams.visObscure;
        
        // "full" means fully obscured
        if (State.visObscure !== "full"){
            // show main div
            document.getElementById('mainDiv').style.display = '';

            // make sure the text gets set correctly
            StatusBar.resolveText();

            // when we become visible check to see if we are activiating signal strength
            // for WAN and re-arm the clock timer
            StatusBar.checkWanEventDisableEnable();

            StatusBar.clock.arm();
        } else {
            //on app switch we lose visibility for a second and then get it
            //back, so check again after a timeout to give that a chance to settle
            if (!StatusBar.visObscureTimeout){
                StatusBar.visObscureTimeout = setTimeout(
                                    function(){
                                        // if still obscured take action
                                        if (State.visObscure === "full"){
                                            document.getElementById('mainDiv').style.display = 'none';
                                            StatusBar.checkWanEventDisableEnable();
                                            StatusBar.clock.disarm();
                                        }
                                        StatusBar.visObscureTimeout = null;
                                    }, 800);
            }
        }
    }

    if (clientParams.activityIndicator){
        ActivityIndicator.handleRequest(clientParams);
    }
    // set up text
    // supporting primary/secondary and left/middle for now
    
    // indicates the default primary text is to be shown
    if ( (clientParams.useDefaultPrimary != undefined) && (State.appState.useDefaultPrimary !== clientParams.useDefaultPrimary) ) {
        Pillow.logDbgLow("clientParams.useDefaultPrimary is ", clientParams.useDefaultPrimary);
        State.appState.useDefaultPrimary = clientParams.useDefaultPrimary;
        textLabelsChanged = true;
    }
    
    Pillow.logDbgLow("State.appState.useDefaultPrimary is ", State.appState.useDefaultPrimary);
    
    //primary
    if ( ( (clientParams.primary != undefined) && (State.appState.primary !== clientParams.primary) ) ||
            ( (clientParams.secondary != undefined) && (State.appState.secondary !== clientParams.secondary) ) ){
        State.appState.primary = clientParams.primary || "";
        State.appState.secondary = clientParams.secondary || "";
        textLabelsChanged = true;
    }
    
    //default primary over rides primary
    if ( (clientParams.defaultPrimary != undefined) && (State.appState.defaultPrimary !== clientParams.defaultPrimary) ){
        State.appState.defaultPrimary = clientParams.defaultPrimary;
        textLabelsChanged = true;
    }

    
    //resolve primary and secondary text
    if (textLabelsChanged){
        State.statusBarTextPending = true;
        StatusBar.resolveText ();
    }


    //register app-specific tap handler
    if (clientParams.handleTap) {
        if (clientParams.handleTap == 'ignore') {
            Pillow.logDbgHigh('status-bar-handle-tap-ignore');
            State.appState.tapHandler = function() { /* empty */ };
        } else if (clientParams.handleTap == 'notifyapp') {
            Pillow.logDbgHigh('status-bar-handle-tap-notifyapp');
            var appId = nativeBridge.getAppId();
            State.appState.tapHandler = function(button) { nativeBridge.setLipcProperty(appId, TITLE_BAR_TAPPED_PROPERTY, button); };
        } else if (clientParams.handleTap == 'default') {
            Pillow.logDbgHigh('status-bar-handle-tap-default');
            State.appState.tapHandler = nativeBridge.raiseChrome;
        } else {
            Pillow.logWarn("status-bar-invalid-tap-handler", {name: clientParams.handleTap});
        }
    }
};

/**
 * set the DatetimeFormatter object with the current correct timezone
 */
StatusBar.setDateTimeFormatter = function(){

        DateTimeFormatter = new DateTimeFormat("short-time");
};

/**
 * handle timezone changed event from kaf and reset the 
 * DateTimeFormatter we use for time
 * @param {Array} values
 *      lipc values array
 */
StatusBar.handleTimeZoneChangedEvent = function(values){
    if (values){
        // the value that comes in via the event is a timezone 
        // display name not the olson string id, so dont use 
        // the value
        Pillow.logDbgHigh("timezone changed event ", values[2]);
    }
    
    // the time zone's ID (Olson name or "GMT+xx:yy") is the
    // third parameter of the event
    DateTimeFormatter = new DateTimeFormat("short-time", values[2]);
    
    // fix time
    StatusBar.clock.update();
};

/**
* handle the app state changed event
* @param {Array} values
*       lipc values array
*/
StatusBar.handleAppStateChanged = function(values){

    Pillow.logDbgHigh("+++++StatusBar.handleAppStateChanged");
    for (value in values){
        Pillow.logDbgLow("value ", value, ":", values[value]);
    }
    
    var appId = values[0];
    var appEventType = values[1];
    var appEventStage = values[2];
    
    const EVENT_START = 0;
    const EVENT_DONE = 1;
    
    var appMgrActivity = null;
    var delay = 0;
    if (appEventType === "load"){
        if ((appEventStage === EVENT_START) && (nativeBridge.getAppId() !== appId)){ 
            // got a load for an app that is not the current app

            // make a priority spinner
            appMgrActivity = {activityIndicator:{clientId:"com.lab126.pillow.appmgr",action:"start",timeout:6000,priority:true}};
            Pillow.logDbgLow("Starting spinner on App Load");
        }
    } else if (appEventType === "go"){
        if (appEventStage === EVENT_START){
            if (nativeBridge.getAppId() !== appId){
                // go event for an app that is not the current app
                State.cachedAppState = cloneAppState(State.appState);
                State.appState.tapHandler = nativeBridge.raiseChrome;
                Pillow.logDbgLow("new cached state is " + JSON.stringify(State.cachedAppState));

                appMgrActivity = {activityIndicator:{clientId:"com.lab126.pillow.appmgr",action:"start",timeout:6000000,priority:true}};
                Pillow.logDbgLow("Starting spinner on App Go");
            }
        } else if (appEventStage === EVENT_DONE){
            //go finished for current app, stop the spinner and release the cachedAppState
            appMgrActivity = {activityIndicator:{clientId:"com.lab126.pillow.appmgr",action:"stop"}};
            State.cachedAppState = null;
            delay = 1000;
            Pillow.logDbgLow("Stopping spinner on App Go finished");
        }
    } 

    /*
     * Disabling activity spinner on app launch. Leaving the code structure in place
     * as we may make use of it if launching is taking larger then a certain threshold 
    if (appMgrActivity){
        if (delay){
            setTimeout(function(){ActivityIndicator.handleRequest(appMgrActivity);}, 
                    delay);
        } else {
            ActivityIndicator.handleRequest(appMgrActivity);
        }
    }*/
};

/**
* handle the appFailedInGo lipc event from appmgr
* by reloading the cached appState
* @param {Array} values
*       lipc values array
*/
StatusBar.handleAppFailedInGo = function(values){
    Pillow.logDbgHigh("handleAppFailedInGo");
    // go back to cached appState
    if (State.cachedAppState){
        Pillow.logDbgMid("reverting to cached app state in statusbar");

        State.appState = State.cachedAppState;
        State.cachedAppState = null;
    } else {
        Pillow.logDbgMid("no cached app state in statusbar; reverting to empty state");

        State.appState = new AppState("");
    }
    
    ActivityIndicator.handleRequest({activityIndicator:{clientId:"com.lab126.pillow.appmgr",action:"stop"}});
    State.statusBarTextPending = true;
    StatusBar.resolveText();
};

//LIPC events subscribed to and corresponding callbacks
var SubscribedEvents = {
                sources: [
                    {
                        name: "com.lab126.asr",
                        events: [{
                                name:"ASRState",
                                callback: AudioIcon.ASRStateChangeCallback
                            }
                        ]

                    },
                    {
                        name: "com.lab126.powerd",
                        events: [{
                                name:"battLevelChanged",
                                callback: BatteryState.battLevelChangedCallback
                            },
                            {
                                name:"battStateInfoChanged",
                                callback: BatteryState.battStateInfoChangedCallback
                            }
                        ]
                    },
                    {
                        name: "com.lab126.cmd",
                        events: [
                            {
                                name:"interfaceChange",
                                callback: ConnectionState.interfaceChangeCallback
                            },
                            {
                                name:"wirelessEnableChanged",
                                callback: ConnectionState.wirelessEnableChangedCallback
                            }
                        ]
                    },
                    {
                        name: "com.lab126.wan",
                        events: [
                            {
                                name:"serviceStateChanged",
                                callback: ConnectionState.wanServiceStateChangedCallback
                            }
                        ]
                    },
                    {
                        name: "com.lab126.wifid",
                        events: [
                            {
                                name:"signalStrength",
                                callback: ConnectionState.wifiSignalStrengthCallback
                            }
                        ]
                    },
                    {
                        name: "com.lab126.dpmManager",
                        events: [
                            {
                                name:"deviceControlsStateChange",
                                callback: ParentalControlsState.deviceControlsStateChangeCallback
                            },
                            {
                                name:"parentalControlsStateChange",
                                callback: ParentalControlsState.parentalControlsStateChangeCallback
                            }
                        ]
                    },
                    {
                        name: "com.lab126.kaf",
                        events: [
                            {
                                name:"tzRequested",
                                callback: StatusBar.handleTimeZoneChangedEvent
                            }
                        ]
                    },
                    {
                        name: "com.lab126.appmgrd",
                        events: [
                            {
                                name:"appStateChange",
                                callback: StatusBar.handleAppStateChanged
                            },
                            {
                                name:"appFailedInGo",
                                callback: StatusBar.handleAppFailedInGo
                            }
                        ]
                    },
                    {
                        name: "com.lab126.foobar",
                        events: [
                            {
                                name:"appStateChange",
                                callback: StatusBar.handleAppStateChanged
                            },
                            {
                                name:"appFailedInGo",
                                callback: StatusBar.handleAppFailedInGo
                            }
                        ]
                    }
                ]
            };

/**
* callback function for all LIPC events subscribed to
*/
StatusBar.eventsCallback = function(jsonString){

    Pillow.logDbgMid("+++++StatusBar.eventsCallback : ", jsonString);

    if (!jsonString){
        return;
    }

    var eventIn = JSON.parse(jsonString);

    if (!eventIn){
        return;
    }

    for (srcKey in SubscribedEvents.sources){
        var src = SubscribedEvents.sources[srcKey];
        if (src.name === eventIn.eventSrc)
        {
            for (eventKey in src.events){
                var event = src.events[eventKey];
                if (event.name === eventIn.eventName){
                    event.callback(eventIn.eventValues); //eventIn.eventValues
                    break;
                }
            }
        }
    }
    StatusBar.resolveText();
};

/**
* initialize func
*/
StatusBar.init = function(){

    Pillow.logDbgHigh("title bar init function called");
    State.windowTitle = new WindowTitle(WINMGR.LAYER.CHROME, WINMGR.ROLE.TITLEBAR);
    State.windowTitle.sendTitle();

    //hide the textual activity indicator
    document.getElementById('textualActivity').style.display = 'none';

    document.getElementById('hiddenTextTester').style.display = 'none';

    AudioIcon.show(nativeBridge.getIntLipcProperty("com.lab126.winmgr", "ASRMode") == 1);

    // now set the DateTimeFormatter with local
    if (typeof DateTimeFormat !== "undefined"){
        StatusBar.setDateTimeFormatter();
    }
    
    document.getElementById('timeDiv').style.width = StatusBar.getTimeLength();

    //register to be caleld back when clientParams are updated
    nativeBridge.registerClientParamsCallback(StatusBar.clientParamsCallback);

    //register events callback
    nativeBridge.registerEventsWatchCallback(StatusBar.eventsCallback);
    
    //get initial battery state
    var battLevel = nativeBridge.getStringLipcProperty("com.lab126.powerd", "battStateInfo");
    if (battLevel != undefined){
        BatteryState.battStateInfoChangedCallback([battLevel]);
    }
    
    // resolve battery
    BatteryState.resolveLabel();
    
    //subscribe to events
    for (srcKey in SubscribedEvents.sources){
        var src = SubscribedEvents.sources[srcKey];
        for (eventKey in src.events){
            var event = src.events[eventKey];
            nativeBridge.subscribeToEvent(src.name, event.name);
        }
    }

    window.addEventListener('resize', function() {
            Pillow.logDbgHigh("status bar width changed; recalculating");
            State.statusBarTextPending = true;
            StatusBar.resolveText();
        });

    ConnectionState.init(StatusBar.setConnectionIcon, StatusBar.setSignalStrengthIcon, StatusBar.setStatusBarTextPending);
    ParentalControlsState.init(StatusBar.setStatusBarTextPending);

    //nativeBridge.logDbg("VERSION : ", navigator.userAgent);

    BeachBallAnimation.hideSpinner();

    ActivityIndicator.setIndicatorCallbacks(
        BeachBallAnimation.startActivityIndicator,
        BeachBallAnimation.stopActivityIndicator,
        BeachBallAnimation.setSpinnerlessText,
        BeachBallAnimation.setPriority);

    // get visibility events to optimize wan signal strength
    // querying to only when we are visible
    nativeBridge.getVisibilityEvents();

    setTimeout(function(){
        var screenSize = nativeBridge.getScreenSize();
        nativeBridge.setWindowSize(screenSize.width, document.body.offsetHeight);
        nativeBridge.showMe();
    }, 0);
    
    Pillow.logDbgLow("title bar init function done");
};


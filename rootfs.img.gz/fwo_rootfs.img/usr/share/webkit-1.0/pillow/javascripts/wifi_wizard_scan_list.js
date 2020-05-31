/**
* The Wifi map/object contains all the wifi related bussiness logic
*/


/**
 * networkList the current network/scan list. It is an array of WifiNetwork objects.
 * If we are already connected to a network, the first element on the array will
 * be the currently connected network. (always)
 */
var Wifi = {
    networkList : new Array(),
    eventCallback : null,
    currentConnectedNetwork : null,
    currentIsCaptive : null,
    wifiIsActiveInterface   : false,
    lastConnectionFailure : null
};



// class to maintain created profiles list
var PendingProfiles = function(){
    // array object of essids
    var m_list = new Array();
    
    /**
    * add a new essid to list
    * @param essid
    *       essid to add to list
    */
    this.add = function(essid){
        var temp = m_list.indexOf(essid);

        var found = m_list.indexOf(essid) !== -1;

        if (!found){
            m_list.push(essid);
        }
    };

    /**
    * removes essid from list
    * @param essid
    *       essid to remove from list
    */
    this.remove = function(essid){
        if (!m_list.length){
            return;
        }

        Pillow.logDbgHigh("removing essid from list ", essid);
        var i;
        for (i=(m_list.length -1); i >= 0; i--){
            if (m_list[i] === essid){
                m_list.splice(i, 1);
            }
        }
    };
    
    /**
    * call action method for each essid in list
    * @param actionMethod
    *       called for each essid in list. Should take
    *       essid as a param
    */
    this.forEach = function(actionMethod){
        if (!actionMethod){
            return;
        }

        m_list.forEach(actionMethod);
    };

    /**
    * empty out list
    */
    this.empty = function(){
        Pillow.logDbgHigh("number of profiles to delete ", m_list.length);
        m_list.forEach(WifiLipc.deleteProfile);
        m_list = new Array();
    };

    /**
    * returns size of list
    */
    this.getSize = function(){
        return m_list.length;
    };
};

// maintain a list of profils we have created so we can
// delete the ones we dont actually connect to
Wifi.pendingProfiles = new PendingProfiles();

/**
* forward error on to dialog layer
* 
* @params errorId
*           ID of error
*/
Wifi.handleError = function(errorId){
    
    if (Wifi.eventCallback){
        Wifi.eventCallback("error", errorId || "");
    }
};

const ACTION_LOCK_NONE = 0;
const ACTION_LOCK_CREATE = 1;
const ACTION_LOCK_DELETE = 2;
const ACTION_LOCK_CONNECT = 3;
var ActionLock = function(){

   var m_actions = [
        {},
        {
            timeout: 3000,
            errorString: 'ProfileCreateError'
        },
        {
            timeout: 3000,
            errorString: 'ProfileDeleteError'
        },
        {
            timeout: 180000,
            errorString: 'ProfileConnectError'
        },
   ];

   // current lock action type
   var m_currentLock = ACTION_LOCK_NONE;
   
   // JS timer for current lock
   var m_timer = null;
   
   // abstract data object for current lock
   var m_data = null;
   
   /**
    * handle timeout for current lock. Clear 
    * and error out
    */
   var handleTimeout = function(){
       m_timer = null;
       var m_data = null;
       
       if (m_currentLock){
           Wifi.handleError(m_actions[m_currentLock].errorString);
       }
       
       m_currentLock = ACTION_LOCK_NONE;
   };
   
   /**
    * set a new lock.
    * 
    * @param action 
    *       action type
    * @param data
    *       data object for this lock
    * @return
    *       true is lock succeeds. false if already locked.
    */
   this.set = function(action, data){
       if (m_timer){
           return false;
       }

       Wifi.lastConnectionFailure = null;
       
       m_currentLock = action;
       m_data = data;
       
       //set a new timer
       m_timer = setTimeout(handleTimeout, m_actions[m_currentLock].timeout);
       
       return true;
   };
   
   /**
    * clear the curren tlock
    */
   this.clear = function(){
       if (m_timer){
           // clear
           clearTimeout(m_timer);
           m_timer = null;
       }
       
       m_currentLock = ACTION_LOCK_NONE;
   };
   
   /**
    * gets the current lock type and data
    */
   this.getCurrent = function(){
       return {action: m_currentLock, data: m_data};
   };
};

// lock object
Wifi.actionLock = new ActionLock();

/**
 * maps the wifi strength to our visible strength
 * @param {Number} signalStrength
 *      value in from Wifi
 */
Wifi.mapSignalStrength = function(signalStrength){
    var returnVal;
    switch (signalStrength){
    case 1:
    case 2:
        returnVal = 1;
        break;
    case 3:
    case 4:
        returnVal = 2;
        break;
    case 5:
        returnVal = 3;
        break;
    default:
        returnVal = 0;
        break;
    }
    
    return returnVal;
}
/** 
* cleans up network entry in scan list for list to use
* 
* @params network
*       network object to sanitize
*/
Wifi.sanitizeNetworkEntry = function(network) {
    if ( !network ) {
        return null;
    }
    Pillow.logDbgLow("Wifi.sanitizeNetworkEntry :: " + JSON.stringify(network));

    if ((!network.essid) || (network.essid.length == 0)){
        //TODO what to do here? returning null will result
        //in this being removed from list
        return null;
    }

    var visibleStrength = Wifi.mapSignalStrength(network.signal);
    network.signalIcon = 'connection' + visibleStrength + 'Bar';

    Pillow.logDbgLow("network.signalIcon ", network.signalIcon);

    // wifid returns "yes" rather than true for these values
    network.supported = network.supported == "yes";

    network.known = network.known == "yes";

    network.enterprise = network.enterprise == "yes";

    network.wps = network.wps == "yes";

    if (network.secured === "yes"){
        network.secured =  true;
        network.secureIcon = 'networkSecured';
    } else {
        network.secured =  false;
        network.secureIcon = '';
    }

    return network;
};

/**
* run through entire list
* --sanitize each list element
* --remove bad elements
* --move connected to network to top of list
* 
* @params list
*       list to sanitize
* @params
*       essid of current connected network
*/
Wifi.sanitizeList = function(list, currentEssid){
    if (!list){
        return;
    }

    //sort first. Compare on signal strength then
    //alpha of essid
    var sortList = function(a,b){
        var aStrength = Wifi.mapSignalStrength(a.signal);
        var bStrength = Wifi.mapSignalStrength(b.signal);
        if (bStrength !== aStrength){
            return bStrength - aStrength;
        } else if (b.essid.toLowerCase() > a.essid.toLowerCase()){
            return -1;
        } else {
            return 1;
        }
    };
    list.sort(sortList);

    var i = 0;
    while (i < list.length){
        if (!Wifi.sanitizeNetworkEntry(list[i])){
            //remove this one and continue so that i is not iterated up
            Pillow.logDbgHigh("removing invalid ssid element from list");
            list.splice(i,1);
        } else {

            //check to see if this matches the current active network
            //so we can take it out
            if (list[i].essid === currentEssid){
                Pillow.logDbgHigh("found current ssid at index ", i);

                //removing item at i and
                //pushing it back at front of list, so
                //iteration of i stays the same
                var removed = list.splice(i,1);

                Pillow.logDbgLow("removed :: ", JSON.stringify(removed));
                removed[0].connected = true;

                list.unshift(removed[0]);
            }

            i++;
        }
    }
}

/**
* Retrieves the current connected network.  Can be null if 
* we are not connected to anything
*/
Wifi.queryWifiForConnectedNetwork = function() {

    if (!Wifi.wifiIsActiveInterface){
        Pillow.logDbgHigh("!!!!!!!wifi is not active interface");
        return null;
    }

/* sample output from command line, not in JSON
Hash Index: 0
    essid = "Mobile"
    connected = "yes"
    signal = (4)
    signal_max = (5)
    secured = "yes"
*/
    var result = WifiLipc.getCurrentEssidNetwork();
    var returnVal = null;

    if (result){

        // TODO validate what happens when there is no connected network

        returnVal = Wifi.sanitizeNetworkEntry(result[0]);

        Pillow.logDbgHigh("current connected network :: ", JSON.stringify(returnVal));
    } else {
        Pillow.logDbgHigh("getCurrentEssidNetwork returned false value");
    }

    return returnVal;
};

/**
* Retrieves the network list from wifid, without triggering a scan first. 
* This scan list may/may not be a fresh one
*/
Wifi.getCachedNetworks = function() {

    Pillow.logDbgHigh("+++++Wifi.getCachedNetworks");

/* sample results

[
    {
        "essid": "Guest",
        "secured": "no",
        "known": "no",
        "signal": 2,
        "signal_max": 5,
        "supported": "yes"
    },
    {
        "essid": "JalajaAP",
        "secured": "no",
        "known": "no",
        "signal": 3,
        "signal_max": 5,
        "supported": "yes"
    },
    {
        "essid": "Mobile",
        "secured": "yes",
        "known": "yes",
        "signal": 4,
        "signal_max": 5,
        "supported": "yes"
    }
]
*/
    var result = WifiLipc.getCurrentScanList();
    
    if (!(result instanceof Array)){
        return new Array();
    }

    var currentEssid = null;

    if (Wifi.currentConnectedNetwork){
        currentEssid = Wifi.currentConnectedNetwork.essid;
        Pillow.logDbgHigh("current essid is ", currentEssid);
    } else{
        Pillow.logDbgHigh("no current connected network");
    }

    Wifi.sanitizeList(result, currentEssid);

    Pillow.logDbgLow("returning result is ", JSON.stringify(result));

    return result;
};

/**
 * Retrieves a scanlist from wifid (async).  This method will trigger a
 * scan.  The callback will be called when the results come back
 */
Wifi.scanList = function() {

    Pillow.logDbgHigh("+++++Wifi.getScanList");

    //trigger a scan first
    WifiLipc.scan();
};

/**
* connect to an existing profile
* @params essid
*       essid of network to connect to
*/
Wifi.connectToProfile = function(essid){
    if (!Wifi.actionLock.set(ACTION_LOCK_CONNECT, essid)){
        Pillow.logWarn("lock-prevents-connect", {action: Wifi.actionLock.getCurrent().action});
        return;
    }

    // See if wifid knows the security type of this network, in which case we will remember it
    // in case the user goes to Advanced Options.
    var profiles = WifiLipc.getProfiles();
    var foundProfile = false;
    if (profiles instanceof Array && Wifi.eventCallback) {
        profiles.forEach(function (profile) { Wifi.eventCallback("profileInfo", profile); });
    }

    if (Wifi.eventCallback) {
        Wifi.eventCallback("connecting");
    }
    
    WifiLipc.ensureConnection(essid);
};

/**
* call wifi to create a new profile and then connect to it
* @params connectTo
*       profile object of profile to create and then connect to
* @params useWps [defaults to false]
*       use WPS to connect
*/
Wifi.createAndConnectToProfile = function(connectTo, useWps){

    //TODO TEMP HACK REMOVE ME - fakes an error for quick testing
    //Wifi.handleError("Key too short");
    //Wifi.handleError("Bad password");
    //Wifi.handleError("Other Error");
    //Wifi.handleError("Failed to connect to WiFi network");
    //Wifi.handleError("");
    //Wifi.handleError(undefined);
    //Wifi.handleError(null);
    //return;

    if (!Wifi.actionLock.set(ACTION_LOCK_CREATE, connectTo)){
        Pillow.logWarn("lock-prevents-create", {action: Wifi.actionLock.getCurrent().action});
        return;
    }

    var profile = {
        essid : connectTo.essid
    };

    if (useWps !== true && useWps !== false) {
        useWps = false;
    }

    if (connectTo.isAdvanced){
        var securityType = connectTo.securityType.getSelectedValue();
        // Upload credential if user has selected to save it.
        profile.store_nw_user_pref = (connectTo.storeCredentials) === true ? 1 : 0;
        if (securityType === "open"){
            Pillow.logDbgHigh("connecting to open network : ", connectTo.essid);
            profile.secured = "no";
        } else if (securityType === "wep" || connectTo.wpaType.getSelectedValue() === "personal") {
            Pillow.logDbgHigh("connecting to secure personal network : ", connectTo.essid);
            profile.smethod = connectTo.securityType.getSelectedValue();
            profile.secured = "yes";
            profile.psk = connectTo.password;
        } else {
            Pillow.logDbgHigh("connecting to secure enterprise network : ", connectTo.essid);
            profile.smethod = "eap";
            profile.eapmethod = connectTo.eapMethod.getSelectedValue();
            profile.phase2 = connectTo.phase2Auth.getSelectedValue();
            profile.secured = "yes";
            profile.identity = connectTo.identity;
            profile.psk = connectTo.password;
            profile.ca_cert = connectTo.caCertificate;
        }
    } else {
        if (useWps && connectTo.isWps) {
            Pillow.logDbgHigh("connecting to wps network : ", connectTo.essid);
            profile.secured = "yes";
            profile.wps = "yes";
        } else if (connectTo.password) {
            Pillow.logDbgHigh("connecting to secure network : ", connectTo.essid);

            profile.secured = "yes";
            profile.psk = connectTo.password;
            profile.store_nw_user_pref = (connectTo.storeCredentials) === true ? 1 : 0;
            if (connectTo.identity) {
                profile.identity = connectTo.identity;
            }
            if (connectTo.isEnterprise()) {
                profile.smethod = "eap";
            }
        } else {
            Pillow.logDbgHigh("connecting to open network : ", connectTo.essid);
            profile.secured = "no";
        }
    }

    // add to pending list on create profile
    Wifi.pendingProfiles.add(connectTo.essid);
    
    var result = WifiLipc.createProfile (profile);

    //
    Pillow.logDbgMid("back from createprofile :: ", JSON.stringify(result));

    if (!result){
        Pillow.logDbgHigh("failed to create profile ");
        WifiLipc.deleteProfile(Wifi.actionLock.getCurrent().data.essid);
        
        //set error
        Wifi.actionLock.clear();
        Wifi.handleError("ProfileCreateError");
    } 
};

/**
* delete profile with essid
*/
Wifi.deleteProfile = function (essid){

    Pillow.logDbgHigh("deleteProfile");
    //set a timeout on the delete action
    if (!Wifi.actionLock.set(ACTION_LOCK_DELETE, essid)){
        Pillow.logWarn("lock-prevents-delete", {action: Wifi.actionLock.getCurrent().action});
        return;
    }

    var profile = {
            essid : essid
    };

    // remove from pending list if there
    Wifi.pendingProfiles.remove(essid);
    
    WifiLipc.deleteProfile (essid);

};

/*
Pillow events I get on a scan
** (pillowd:20872): DEBUG: +++++WifiWizardDialog.eventsCallback : {"eventName":"scanning","eventSrc":"com.lab126.wifid","eventValues":[]}
** (pillowd:20872): DEBUG: +++++Wifi.eventScanning :: no params

** (pillowd:20872): DEBUG: +++++WifiWizardDialog.eventsCallback : {"eventName":"scanComplete","eventSrc":"com.lab126.wifid","eventValues":[]}
** (pillowd:20872): DEBUG: +++++Wifi.eventScanComplete :: no params
*/

/**
* callback from wifi that profile create failed
* @params values
*       lipc event array
*/
Wifi.eventProfileUpdateFailed = function(values) {
    if (values && values[0]){
        Pillow.logDbgHigh("+++++Wifi.eventProfileUpdateFailed :: ", values[0]);
    } else {
        Pillow.logDbgHigh("+++++Wifi.eventProfileUpdateFailed :: no params");
    }

    var lock = Wifi.actionLock.getCurrent();
    // show an error if we failed to create a profile
    // this includes updating a profile
    // if we failed deleting a profile OR if
    // we failed during the auto delete of non connected to profiles
    // do not go to an error dialog
    if (lock.action === ACTION_LOCK_CREATE){
        
        Pillow.logDbgLow("showing alert on profile update failed");
        /* Wifi.eventProfileUpdateFailed comes in as follows
         ** {"eventName":"profileUpdateFailed","eventSrc":"com.lab126.wifid","eventValues":["Key too short"]}
         */
        Wifi.actionLock.clear();
        
        Pillow.logDbgLow("prof update fail");
        Wifi.handleError(values[0]);
    } else {
        Wifi.actionLock.clear();
    }

};

/**
* callback from wifi that profile create worked
* @params values
*       lipc event values
*/
Wifi.eventProfileUpdateOk = function(values) {

    if (values && values[0]){
        Pillow.logDbgHigh("+++++Wifi.eventProfileUpdateOk :: ", values[0]);
    } else {
        Pillow.logDbgHigh("+++++Wifi.eventProfileUpdateOk :: no params");
    }

    var lock = Wifi.actionLock.getCurrent();
    //connectionAvailable connectionNotAvailable event from CMD
    //get wifi SSID

    //Wifi.eventProfileUpdateOk comes back after a delete or create request
    if (lock.action === ACTION_LOCK_DELETE){

        // waiting on a delete action
        // TODO validate that the delete was on the network requested
        
        Wifi.actionLock.clear();

        Pillow.logDbgMid("Wifi.eventProfileUpdateOk waiting on delete ", lock.data);
        Wifi.scanList();
    } else if (lock.action === ACTION_LOCK_CREATE){

        Wifi.actionLock.clear();
        
        // waiting on a create action
        Pillow.logDbgMid("Wifi.eventProfileUpdateOk waiting on create ", lock.data.essid);

        //look for static net config
        if (lock.data.connectionType.getSelectedValue() === "static"){

            var netConfig = {
                essid           : lock.data.essid,
                ipaddr          : lock.data.ipAddress,
                netmask         : lock.data.subnetMask,
                gw              : lock.data.router,
                ns1             : lock.data.dns
            };

            //sychronus LIPC set hash prop to set static up
            if (!WifiLipc.setStaticNetConfig(netConfig)){
                //failed to set static netconfig
                //delete profile
                WifiLipc.deleteProfile(lock.data.essid);
                Wifi.actionLock.clear();
                Wifi.handleError("ProfileCreateError");
                return;
            }
        }

        // we assume it is the profile we created
        Wifi.connectToProfile (lock.data.essid);

        //callback UI to indicate profile created
        if (Wifi.eventCallback){
            Wifi.eventCallback("profileCreated");
        }

    } else {
        Pillow.logDbgMid("Wifi.eventProfileUpdateOk not waiting on create or delete");
    }

};

/** 
* callback from wifi that we are scanning
* @params values
*       lipc event values
*/
Wifi.eventScanning = function(values) {
    if (values && values[0]){
        Pillow.logDbgMid("+++++Wifi.eventScanning :: ", values[0]);
    } else {
        Pillow.logDbgMid("+++++Wifi.eventScanning :: no params");
    }
};

/**
* callback from wifi when scan completes
* @params values
*       lipc event values
*/
Wifi.eventScanComplete = function(values) {
    if (values && values[0]){
        Pillow.logDbgHigh("+++++Wifi.eventScanComplete :: ", values[0]);
    } else {
        Pillow.logDbgHigh("+++++Wifi.eventScanComplete :: no params");
    }

    var lock = Wifi.actionLock.getCurrent();
    if (lock.action === ACTION_LOCK_NONE){

        //upadate the connected profile
        Wifi.currentConnectedNetwork = Wifi.queryWifiForConnectedNetwork();

        //callback the UI layer with the updated list
        if (Wifi.eventCallback){
            Wifi.eventCallback("scanList", Wifi.getCachedNetworks());
        }
    } else {
        Pillow.logDbgHigh("ignoring scan complete as we are still wating on UI locks during connection process");
    }
};

/**
* callback from wifi when captive portal 
* connected. Currently we use the local param on the eventCmdConnectionAvailable
* cmd event so this is not being used outside of logging
* @params values
*       lipc event values
*/
Wifi.eventCaptivePortalDetected = function(values) {
    if (values && values[0]){
        Pillow.logDbgHigh("+++++Wifi.eventCaptivePortalDetected :: ", values[0]);
    } else {
        Pillow.logDbgHigh("+++++Wifi.eventCaptivePortalDetected :: no params");
    }
};

/**
* callback from cmd when interface changes. this can be a switch to a different
* interface or a switch to a different connection on the same interface
* @params values
*       lipc event values
*/
Wifi.eventCmdActiveInterfaceChange = function(values){

    if (values && values[0]){
        Pillow.logDbgHigh("+++++Wifi.eventCmdActiveInterfaceChange :: ", values[0]);
    } else {
        Pillow.logDbgHigh("+++++Wifi.eventCmdActiveInterfaceChange :: no params");
    }

    //if this is a change from wifi to wifi there may have been a profile scan change
    //such as a network gone, we need to kick off a new scan unless we are in a connection process
    if (values[0] === "wifi"){

        Wifi.wifiIsActiveInterface = true;
        
        var lock = Wifi.actionLock.getCurrent();

        if (lock.action === ACTION_LOCK_NONE){
            Wifi.scanList();
        } else {
            Pillow.logDbgHigh("interface change but we are locked waiting for connect");
        }

    } else {
        Wifi.wifiIsActiveInterface = false;
        Wifi.currentConnectedNetwork = null;
        Wifi.currentIsCaptive = null;
        Pillow.logDbgHigh("interface change not wifi");
    }
};

/**
* callback from cmd when connection works
* @params values
*       lipc event values
*/
Wifi.eventCmdConnectionAvailable = function(values){
    if (values && values[0]){
        Pillow.logDbgHigh("+++++Wifi.eventCmdConnectionAvailable :: ", values[0]);

        // TODO there seems to be a problem with this callback as I understand it is supposed to work,
        // it is not reporting the essid of the connected network, so for now query it
        // NOTE : this seems to be inconsistent, sometimes it does. In other words values[0]
        // shoud be of the form "wifi:essid", but sometimes I have seen it as just "wifi" so rather
        // than rely on it I call queryWifiForConnectedNetwork here to get the conencted network.

        var current = Wifi.queryWifiForConnectedNetwork();

        // HACK REMOVE
        // This simulates the situation in PH-11288.
        // Wifi.eventCmdConnectionNotAvailable(["wifi:" + current.essid,"Connection Timeout"]);
        
        var lock = Wifi.actionLock.getCurrent();

        Pillow.logDbgLow("lock = " + JSON.stringify(lock) + "; current = " + JSON.stringify(current) + "; lcf = " + Wifi.lastConnectionFailure);
        var valid = false;
        if ( (lock.action === ACTION_LOCK_CONNECT) && (current) && (current.essid === lock.data) ){
            valid = true;
            Pillow.logDbgMid("connection success (no preceding failure)");
            Wifi.actionLock.clear();
        } else if ( (lock.action === ACTION_LOCK_NONE) && (current) && (Wifi.lastConnectionFailure) && (current.essid === Wifi.lastConnectionFailure) ){
            valid = true;
            Wifi.lastConnectionFailure = null;
            Pillow.logDbgMid("connection success (after preceding failure)");
        }

        if ( valid ){
            // on successful create remove from out pending list
            // so we dont delete this profile
            Wifi.pendingProfiles.remove(current.essid);

            // record information about connected network
            Wifi.currentConnectedNetwork = current;
            Wifi.currentIsCaptive = values[1] === "local";

            //callback to the dialog layer to indicate connection made
            Wifi.eventCallback("connected");
        } else {
            Pillow.logDbgHigh("interface change not to network we are waiting on");
        }

    } else {
        Pillow.logDbgHigh("+++++Wifi.eventCmdConnectionAvailable :: no params");
    }

};

/**
 * Split a string in two at the first occurrence of a given delimiter.
 * @param {String} delim The delimiter
 */
String.prototype.splitOnce = function(delim){
    var idx = this.indexOf(delim);
    if (idx == -1)
    {
        return [this];
    }
    else
    {
        var first = idx == 0 ? "" : this.substr(0, idx - 1);
        var second = this.substr(idx + delim.length);
        return [first, second];
    }
};

/**
* callback from CMD when connection fails
* @params values
*       lipc event values
*/
Wifi.eventCmdConnectionNotAvailable = function(values){

    /*
    * error case
    ** {"eventName":"connectionNotAvailable","eventSrc":"com.lab126.cmd","eventValues":["wifi:Guest","Connection Timeout"]}
    */

    if (values && values[0]){
        Pillow.logDbgHigh("+++++Wifi.eventCmdConnectionNotAvailable :: ", values[0]);
        
        var lock = Wifi.actionLock.getCurrent();

        //TODO better validation around the string we get in here
        if ( (lock.action === ACTION_LOCK_CONNECT) && (values[0].splitOnce(':')[1] === lock.data) ){
            Pillow.logDbgMid("connection fail");
            Wifi.currentConnectedNetwork = null;
            Wifi.currentIsCaptive = null;
            Wifi.lastConnectionFailure = lock.data;
            Wifi.actionLock.clear();
            Wifi.handleError(values[1]);

        } else {
            Pillow.logDbgHigh("interface change not to network we are waiting on");
        }

    } else {
        Pillow.logDbgHigh("+++++Wifi.eventCmdConnectionAvailable :: no params");
    }

};

/**
* Clean up un connected
* to profiles we have created
*/
Wifi.cleanupProfiles = function(){
    // delete any pending profiles we created but did not connect to
    Wifi.pendingProfiles.empty();
};

/**
* init Wifi layer
* @params eventCallback
*       callback func on dialog layer
*/
Wifi.init = function(eventCallback){
    Wifi.eventCallback = eventCallback;

    if ("wifi" === WifiLipc.getActiveInterface()){
        Wifi.wifiIsActiveInterface = true;
    } else {
        Wifi.wifiIsActiveInterface = false;
    }

    Wifi.currentConnectedNetwork = Wifi.queryWifiForConnectedNetwork();
};

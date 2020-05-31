ConnectionState = {
    iconClass                   : '',
    connection                  : '',
    connectionOnOff             : 2,
    wifiSignalStrength          : '',
    wanSignalStrength           : '',
    setConnectionIconFunc       : null,
    setSignalStrengthFunc       : null,
    setStatusBarTextPendingFunc : null,
    wanType                     : 'connectionWanIcon connectionWanIcon3G'
};

const CONNECTION_TYPE = ['', 'threeG', 'edge', 'twoG'];

/*
resolves the conenction icon to WAN/WIFI/OFF/NO CONNECTION
*/
ConnectionState.resolveInterfaceLabel = function(){
    var showDiv = true;
    var hideConnectionStatusIconDiv = false;
    if (ConnectionState.connectionOnOff === 0){
        //show off in UI
        if (Pillow.hasWirelessMenu) {
	    ConnectionState.iconClass = '';
	    showDiv = false;
        } else {
	    ConnectionState.iconClass = 'connectionAirplaneOnIcon';
        }

        //if signal strength is visible set to 0 bars
        if (ConnectionState.setSignalStrengthFunc){
            ConnectionState.setSignalStrengthFunc('');
        }
    } else if (!ConnectionState.connection){
        //before anything is set show no connection
        ConnectionState.iconClass = 'connectionNoServiceIcon';

        //if signal strength is visible set to 0 bars
        if (ConnectionState.setSignalStrengthFunc){
            ConnectionState.setSignalStrengthFunc('');
        }
    } else if (ConnectionState.connection.indexOf("wifi") === 0){
        //dont show Connection Status Icon Div
        ConnectionState.iconClass = '';
        hideConnectionStatusIconDiv = true;
    } else if (ConnectionState.connection.indexOf("wan") === 0){
        //show wan icon
        ConnectionState.iconClass = ConnectionState.wanType;
    } else {
        // for no connection case show no icon
        ConnectionState.iconClass = 'connectionNoServiceIcon';
        
        //if signal strength is visible set to 0 bars
        if (ConnectionState.setSignalStrengthFunc){
            ConnectionState.setSignalStrengthFunc('');
        }
    }

    if (ConnectionState.setConnectionIconFunc){
        ConnectionState.setConnectionIconFunc(ConnectionState.iconClass);
    }

    if (ConnectionState.setStatusBarTextPendingFunc){
        ConnectionState.setStatusBarTextPendingFunc(true);
    }

    var statusBarConnectionDivElements = document.getElementsByClassName("statusBarConnectionDiv");
    if(statusBarConnectionDivElements.length > 0) {
        statusBarConnectionDivElements[0].style.display = showDiv ? "-webkit-box" : "none";
    }
    
    var connectionStatusIconDivElements = document.getElementById("connectionStatusIconDiv");
    connectionStatusIconDivElements.style.display = hideConnectionStatusIconDiv ? "none" : "block";

};

/*
resolve wifi signal strength icon
*/
ConnectionState.resolveWifiSignalStrengthLabel = function(value){

    if (!value){
        Pillow.logDbgHigh("value is undefined or null, wifi sig strength 0");
        ConnectionState.wifiSignalStrength = 'connectionWifiBars connectionWifi0Bars';
        return;
    }

    Pillow.logDbgMid("ConnectionState.resolveWifiSignalStrengthLabel : ", value);

    // value is of form "2/5" where first char is the signal strength
    var signal = value.charAt(0);

    // resolve to the correct css class
    // note that we get wifi signal strength from 0 to 5 but the
    // icon we show only has 4 states so it is not a 1 to 1 mapping
    if (signal === '5'){
        ConnectionState.wifiSignalStrength = 'connectionWifiBars connectionWifi3Bars';
    }else if (signal === '4'){
        ConnectionState.wifiSignalStrength = 'connectionWifiBars connectionWifi2Bars';
    }else if (signal === '3'){
        ConnectionState.wifiSignalStrength = 'connectionWifiBars connectionWifi2Bars';
    }else if (signal === '2'){
        ConnectionState.wifiSignalStrength = 'connectionWifiBars connectionWifi1Bars';
    }else if (signal === '1'){
        ConnectionState.wifiSignalStrength = 'connectionWifiBars connectionWifi1Bars';
    }else if (signal === '0'){
        ConnectionState.wifiSignalStrength = 'connectionWifiBars connectionWifi0Bars';
    }else{
        Pillow.logDbgHigh("bad signal value, default to 0 bar icon");
        ConnectionState.wifiSignalStrength = 'connectionWifiBars connectionWifi0Bars';
    }

    Pillow.logDbgMid("ConnectionState.wifiSignalStrength set to : ", ConnectionState.wifiSignalStrength);
};

/*
resolve the wan signal strength icon
*/
ConnectionState.resolveWanSignalStrengthLabel = function(value){
    
    if (!value){
        Pillow.logDbgHigh("value is undefined or null, wan sig strength 0");
        ConnectionState.wanSignalStrength = 'connectionWanBars connectionWan0Bars';
        return;
    }

    Pillow.logDbgMid("ConnectionState.resolveWanSignalStrengthLabel : ", value);

    // mask out to get signal strength
    var signal = value & 0x0F;

    // resolve to the correct CSS class
    if ((signal >= 0) && (signal <= 5)) {
        ConnectionState.wanSignalStrength = 'connectionWanBars connectionWan' + signal + 'Bars';
    } else {
        Pillow.logDbgHigh("bad signal value, default to 0 bar icon");
        ConnectionState.wanSignalStrength = 'connectionWanBars connectionWan0Bars';
    }
    
    // bits 4 and 5 contain connection type
    var wanConnectionType = (value & 0x30) >> 4;
    ConnectionState.wanType = 'connectionWanIcon ' + CONNECTION_TYPE[wanConnectionType];

    Pillow.logDbgMid("ConnectionState.wanSignalStrength set to : ", ConnectionState.wanSignalStrength);
};

/*
resolve the signal strength icon
*/
ConnectionState.resolveSignalStrengthLabel = function(){
    var classLabel = null;

    Pillow.logDbgLow("+++++ConnectionState.resolveSignalStrengthLabel");
    
    // show wifi sig strength or wan based on active interface
    if (ConnectionState.connection == "wifi"){
        //update signal strength icon
        classLabel = ConnectionState.wifiSignalStrength;
    } else if (ConnectionState.connection == "wan"){
        classLabel = ConnectionState.wanSignalStrength;
    } else {
        // if not wan or wifi no signal strength shown
        classLabel = '';
    }

    Pillow.logDbgMid("classLabel set to ", classLabel);

    if (ConnectionState.setSignalStrengthFunc){
        
        ConnectionState.setSignalStrengthFunc(classLabel);
    }

    if (ConnectionState.setStatusBarTextPendingFunc){
        ConnectionState.setStatusBarTextPendingFunc(true);
    }
};

/*
handle interfaceChange, resolve icons for signal strenth and conenction icon
*/
ConnectionState.interfaceChangeCallback = function(values){
    Pillow.logInfo("status-iface-change", {param: values[0]});

    if ((!values) ||
            (values[0] === undefined) ||
            (typeof values[0] !== 'string')){
        Pillow.logDbgHigh("ConnectionState.interfaceChangeCallback :: bad values");
        return;
    }

    // first value is "wifi" or "wan"
    ConnectionState.connection = values[0];

    ConnectionState.resolveInterfaceLabel();

    ConnectionState.resolveSignalStrengthLabel();
};

/*
handle wifiSignalStrength event, resolve signal strength icon
*/
ConnectionState.wifiSignalStrengthCallback = function(values){
    Pillow.logDbgHigh("+++++ConnectionState.wifiSignalStrengthCallback");

    if ((!values) ||
            (values[0] === undefined) ||
            (typeof values[0] !== 'string')){
        Pillow.logDbgHigh("ConnectionState.wifiSignalStrengthCallback :: bad values");
        return;
    }

    // resolve for icon for wifi
    // first value is string of form "2/5" where the first num is
    // signal strength
    ConnectionState.resolveWifiSignalStrengthLabel(values[0]);

    // resolve what icon we show
    ConnectionState.resolveSignalStrengthLabel();
};

/*
handle wanServiceStateChanged event, resolve wan signal strenth icon
*/
ConnectionState.wanServiceStateChangedCallback = function(values){
    Pillow.logDbgHigh("+++++ConnectionState.wanServiceStateChangedCallback");

    if ((!values) ||
        (values[0] === undefined) ||
        (typeof values[0] !== 'number')){
        Pillow.logDbgHigh("ConnectionState.wanServiceStateChangedCallback :: bad values");
        return;
    }

    // check for wan signal strength
    // first value is an int which masked with 0x0f give you signal strength
    ConnectionState.resolveWanSignalStrengthLabel(values[0]);

    // resolve the icon we show the user
    ConnectionState.resolveSignalStrengthLabel();
    
    // make sure 3g, 2g, edge icon is correct
    ConnectionState.resolveInterfaceLabel();

};

/*
handle the wirelessEnableChanged event. set the value an resolve the icon in
the titlebar
*/
ConnectionState.wirelessEnableChangedCallback = function(values){
    Pillow.logDbgHigh("+++++ConnectionState.wirelessEnableChangedCallback");

    if ((!values) ||
            (values[0] === undefined) ||
            (typeof values[0] !== 'number')){
        Pillow.logDbgHigh("ConnectionState.wirelessEnableChangedCallback :: bad values");
        return;
    }

    //first value in the event is a 0/1 flag indicating off/on
    ConnectionState.connectionOnOff = values[0];

    ConnectionState.resolveInterfaceLabel();
};

/*
initialize ConenctionState
*/
ConnectionState.init = function(setConnectionIconFunc, setSignalStrengthFunc, setStatusBarTextPendingFunc){
    
    ConnectionState.setConnectionIconFunc = setConnectionIconFunc;
    ConnectionState.setSignalStrengthFunc = setSignalStrengthFunc;
    ConnectionState.setStatusbarTextPendingFunc = setStatusBarTextPendingFunc;

    // get the active interface, tells us what to show as connection and if sig strength
    // is there which to show
    ConnectionState.connection = nativeBridge.getStringLipcProperty("com.lab126.cmd", "activeInterface");
    Pillow.logDbgHigh("cmd connection set to : ", ConnectionState.connection);

    // get wifi sig strength and resolve label
    var wifiConnection = nativeBridge.getStringLipcProperty("com.lab126.wifid", "signalStrength");
    ConnectionState.resolveWifiSignalStrengthLabel(wifiConnection);

    //get initial wirelessEnable value
    ConnectionState.connectionOnOff = nativeBridge.getIntLipcProperty("com.lab126.cmd", "wirelessEnable");
    Pillow.logDbgHigh("initial connection on/off prop ", ConnectionState.connectionOnOff);

    // get wan sig strength and resolve label
    var wanConnection = nativeBridge.getIntLipcProperty("com.lab126.wan", "serviceState");
    ConnectionState.resolveWanSignalStrengthLabel(wanConnection);

    
    // resolve the interface label
    ConnectionState.resolveInterfaceLabel();

    // resolve the sig strength label, this takes into account the activeInterface
    ConnectionState.resolveSignalStrengthLabel();
};

/*
interface out the Lipc calls so they canbe replaced in a
unit testing scenario
*/
var WifiLipc = {};

WifiLipc.ensureConnection = function(essid){
    nativeBridge.setLipcProperty("com.lab126.cmd","ensureConnection", "wifi:" + essid);
};

WifiLipc.scan = function(){
    nativeBridge.setLipcProperty("com.lab126.wifid","scan", "");
};

WifiLipc.deleteProfile = function(essid){
    var cur = WifiLipc.getCurrentEssidNetwork();
    if (cur && cur.connected && cur.connected == "yes" && cur.essid && cur.essid == essid) {
        Pillow.logDbgHigh("not deleting profile for " + essid + " because it is connected");
    } else {
        nativeBridge.setLipcProperty("com.lab126.wifid","deleteProfile", essid);
    }
};

WifiLipc.deleteCertificate = function(certificate){
    nativeBridge.setLipcProperty("com.lab126.wifid","deleteCertificate", certificate);
};

WifiLipc.getActiveInterface = function(){
    return nativeBridge.getStringLipcProperty("com.lab126.cmd", "activeInterface");
};

WifiLipc.getCurrentEssidNetwork = function(){
    return nativeBridge.accessHasharrayProperty("com.lab126.wifid","currentEssid");
};

WifiLipc.getCurrentScanList = function(){
    return nativeBridge.accessHasharrayProperty("com.lab126.wifid","scanList");
};

WifiLipc.getProfiles = function(){
    return nativeBridge.accessHasharrayProperty("com.lab126.wifid","profileData");
};

WifiLipc.getCertificates = function(){
    return nativeBridge.accessHasharrayProperty("com.lab126.wifid","certificateData");
};

WifiLipc.createProfile = function(profile){
    return nativeBridge.accessHasharrayProperty("com.lab126.wifid","createProfile", profile);
};

WifiLipc.setStaticNetConfig = function(netConfig){
    return nativeBridge.accessHasharrayProperty("com.lab126.wifid","createNetConfig", netConfig);
};

WifiLipc.getOrientation = function(){
    return nativeBridge.getStringLipcProperty("com.lab126.winmgr", "orientation");
};

WifiLipc.isAsrMode = function(){
    return nativeBridge.getIntLipcProperty("com.lab126.winmgr","ASRMode");
};

var HouseholdLipc = {};

HouseholdLipc.getActiveProfileRole = function(){
    return nativeBridge.getStringLipcProperty("com.lab126.household", "activeProfileRole");
};

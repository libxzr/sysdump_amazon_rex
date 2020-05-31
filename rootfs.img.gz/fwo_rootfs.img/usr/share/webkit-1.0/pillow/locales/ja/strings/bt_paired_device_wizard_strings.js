
// string map for default mode
var BTPairedDeviceStringTable = {
    switchDialogButtonLayout: BUTTON_LAYOUT_NORMAL,
    title                   : "Bluetooth",
    subtitle                : new MessageFormat("\u7aef\u672b({numDevices,number,integer})"),
    headerText		    : "Bluetooth\u7aef\u672b\u304c\u30aa\u30f3\u306b\u306a\u3063\u3066\u3044\u308b\u304b\u78ba\u8a8d\u3057\u3066\u304f\u3060\u3055\u3044\u3002\u7aef\u672b\u3078\u306e\u63a5\u7d9a\u3092\u78ba\u7acb\u307e\u305f\u306f\u89e3\u9664\u3059\u308b\u306b\u306f\u3001\u7aef\u672b\u540d\u3092\u30bf\u30c3\u30d7\u3057\u3066\u304f\u3060\u3055\u3044\u3002",
    pairNewDevice           : "Bluetooth\u30a6\u30a3\u30b6\u30fc\u30c9",
    pairNewDeviceDescription: "\u63a5\u7d9a\u89e3\u9664\u3057\u3066\u5225\u306e\u30aa\u30fc\u30c7\u30a3\u30aa\u7aef\u672b\u3068\u30da\u30a2\u30ea\u30f3\u30b0\u3057\u307e\u3059",
    disconnect              : "\u5207\u65ad",
    okay                    : "OK",
    cancel                  : "\u30ad\u30e3\u30f3\u30bb\u30eb",
    connect	            : "\u63a5\u7d9a",
    forget                  : "\u63a5\u7d9a\u89e3\u9664",
    forgetDevice            : "\u7aef\u672b\u3092\u63a5\u7d9a\u89e3\u9664",
    forgetDeviceTitle       : "\u7aef\u672b\u3092\u63a5\u7d9a\u89e3\u9664",
    connectOrForgetDevice   : "\u7aef\u672b\u3092\u63a5\u7d9a\u307e\u305f\u306f\u63a5\u7d9a\u89e3\u9664",
    noPairedDevice	    : "\u30da\u30a2\u30ea\u30f3\u30b0\u6e08\u307f\u306e\u7aef\u672b\u304c\u898b\u3064\u304b\u308a\u307e\u305b\u3093",
    switchTextMessageFormat : new MessageFormat("{string}\u3068\u63a5\u7d9a\u307e\u305f\u306f\u63a5\u7d9a\u89e3\u9664\u3057\u307e\u3059\u304b?"),
    forgetTextMessageFormat : new MessageFormat("{string}\u306b\u63a5\u7d9a\u6e08\u307f\u3067\u3059\u3002"),
    forgetConfirm           : "\u3053\u306e\u7aef\u672b\u3068\u306e\u63a5\u7d9a\u3092\u89e3\u9664\u3057\u307e\u3059\u304b\uff1f <br><br>\u3053\u306e\u64cd\u4f5c\u3092\u5b9f\u884c\u3059\u308b\u3068VoiceView\u30b9\u30af\u30ea\u30fc\u30f3\u30ea\u30fc\u30c0\u30fc\u304c\u7121\u52b9\u306b\u306a\u308a\u307e\u3059\u3002<br><br>\u518d\u5ea6VoiceView\u3092\u6709\u52b9\u306b\u3059\u308b\u306b\u306f\u3001\u96fb\u6e90\u30dc\u30bf\u30f3\u30929\u79d2\u9593\u9577\u62bc\u3057\u3057\u3066\u304b\u3089\u3001Kindle\u306e\u753b\u9762\u4e0a\u306b\u63072\u672c\u3092\u7f6e\u3044\u3066\u304f\u3060\u3055\u3044\u3002"
    
};

// string map for large mode
var BTPairedDeviceStringTableLarge = {
    pairNewDevice           : "Bluetooth\u30a6\u30a3\u30b6\u30fc\u30c9",
    disconnect              : "\u63a5\u7d9a\u89e3\u9664",
    cancel                  : "\u30ad\u30e3\u30f3\u30bb\u30eb",
    connect                 : "\u63a5\u7d9a",
    forget                  : "\u5fd8\u308c\u308b",
    forgetDevice            : "\u7aef\u672b\u3092\u63a5\u7d9a\u89e3\u9664"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTPairedDeviceStringTable = constructTableOnDisplayModeChange(BTPairedDeviceStringTable,BTPairedDeviceStringTableLarge);

var BTAccessibilityStringTable = {
    close 		    : "\u9589\u3058\u308b"
};

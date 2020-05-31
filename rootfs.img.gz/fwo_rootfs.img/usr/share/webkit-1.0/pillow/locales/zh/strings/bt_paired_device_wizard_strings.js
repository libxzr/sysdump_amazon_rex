
// string map for default mode
var BTPairedDeviceStringTable = {
    switchDialogButtonLayout: BUTTON_LAYOUT_NORMAL,
    title                   : "\u84dd\u7259",
    subtitle                : new MessageFormat("\u8bbe\u5907 ({numDevices,number,integer})"),
    headerText		    : "\u8bf7\u786e\u4fdd\u5f00\u542f\u84dd\u7259\u8bbe\u5907\u3002\u70b9\u51fb\u8bbe\u5907\u540d\u79f0\u5373\u53ef\u5ffd\u7565\u6216\u8fde\u63a5\u8bbe\u5907",
    pairNewDevice           : "\u84dd\u7259\u5411\u5bfc",
    pairNewDeviceDescription: "\u65ad\u5f00\u8fde\u63a5\u5e76\u914d\u5bf9\u65b0\u97f3\u9891\u8bbe\u5907",
    disconnect              : "\u65ad\u5f00\u8fde\u63a5",
    okay                    : "\u786e\u5b9a",
    cancel                  : "\u53d6\u6d88",
    connect	            : "\u8fde\u63a5",
    forget                  : "\u5ffd\u7565",
    forgetDevice            : "\u5ffd\u7565\u8bbe\u5907",
    forgetDeviceTitle       : "\u5ffd\u7565\u8bbe\u5907",
    connectOrForgetDevice   : "\u8fde\u63a5\u6216\u5ffd\u7565\u8bbe\u5907",
    noPairedDevice	    : "\u627e\u4e0d\u5230\u914d\u5bf9\u7684\u8bbe\u5907",
    switchTextMessageFormat : new MessageFormat("\u60a8\u8981\u8fde\u63a5\u8fd8\u662f\u5ffd\u7565 {string}\uff1f"),
    forgetTextMessageFormat : new MessageFormat("\u60a8\u5df2\u8fde\u63a5 {string}\u3002"),
    forgetConfirm           : "\u60a8\u786e\u5b9a\u8981\u5ffd\u7565\u6b64\u8bbe\u5907\u5417\uff1f<br><br>\u8fd9\u5c06\u7981\u7528 VoiceView \u5c4f\u5e55\u6717\u8bfb\u5668\u3002<br><br>\u5982\u9700\u518d\u6b21\u542f\u7528 VoiceView\uff0c\u8bf7\u957f\u6309\u7535\u6e90\u5f00\u5173 9 \u79d2\uff0c\u7136\u540e\u7528\u4e24\u6307\u6309\u4f4f Kindle \u5c4f\u5e55\u3002"
    
};

// string map for large mode
var BTPairedDeviceStringTableLarge = {
    pairNewDevice           : "\u84dd\u7259\u5411\u5bfc",
    disconnect              : "\u65ad\u5f00\u8fde\u63a5",
    cancel                  : "\u53d6\u6d88",
    connect                 : "\u8fde\u63a5",
    forget                  : "\u5ffd\u7565",
    forgetDevice            : "\u5ffd\u7565\u8bbe\u5907"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTPairedDeviceStringTable = constructTableOnDisplayModeChange(BTPairedDeviceStringTable,BTPairedDeviceStringTableLarge);

var BTAccessibilityStringTable = {
    close 		    : "\u5173\u95ed"
};

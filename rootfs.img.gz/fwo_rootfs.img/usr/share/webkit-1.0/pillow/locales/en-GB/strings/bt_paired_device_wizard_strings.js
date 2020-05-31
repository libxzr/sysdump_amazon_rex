
// string map for default mode
var BTPairedDeviceStringTable = {
    switchDialogButtonLayout: BUTTON_LAYOUT_NORMAL,
    title                   : "Bluetooth",
    subtitle                : new MessageFormat("Devices ({numDevices,number,integer})"),
    headerText		    : "Please make sure your Bluetooth device is on. Tap the device name to forget or connect to the device",
    pairNewDevice           : "BLUETOOTH WIZARD",
    pairNewDeviceDescription: "Disconnect and pair new audio device",
    disconnect              : "DISCONNECT",
    okay                    : "OK",
    cancel                  : "CANCEL",
    connect	            : "CONNECT",
    forget                  : "FORGET",
    forgetDevice            : "FORGET DEVICE",
    forgetDeviceTitle       : "Forget Device",
    connectOrForgetDevice   : "Connect to or Forget Device",
    noPairedDevice	    : "No Paired Devices Found",
    switchTextMessageFormat : new MessageFormat("Would you like to connect to or forget {string}?"),
    forgetTextMessageFormat : new MessageFormat("You are currently connected to {string}."),
    forgetConfirm           : "Are you sure you want to forget this device?<br><br>This will disable the VoiceView screen reader. <br><br>To enable VoiceView again, press and hold the Power button for 9 seconds and then hold 2 fingers on your Kindle screen."
    
};

// string map for large mode
var BTPairedDeviceStringTableLarge = {
    pairNewDevice           : "Bluetooth Wizard",
    disconnect              : "Disconnect",
    cancel                  : "Cancel",
    connect                 : "Connect",
    forget                  : "Forget",
    forgetDevice            : "Forget Device"
};

//checks for large mode and constructs BTPairedDeviceStringTable based on the display mode
BTPairedDeviceStringTable = constructTableOnDisplayModeChange(BTPairedDeviceStringTable,BTPairedDeviceStringTableLarge);

var BTAccessibilityStringTable = {
    close 		    : "Close"
};

#!/bin/sh

#check either bluetooth supported or not
if [ 0 -eq $(devcap-get-feature -a bluetooth) ]
then
   exit 0
fi
#check either ScreenSaver Window
if [ 1 -eq "$(lipc-get-prop com.lab126.winmgr isScreenSaverLayerWindowActive)"  ]
then
   f_log I "startBTBackground" "Dropping gesture in ScreenSaver Window" ""
   exit 0
fi
# start Xasr 
start xasr

#touch this file because multiples app can be waiting for gestureDetected action, to determine power button held specific
touch /var/local/POWER_BUTTON_HELD_1
touch /var/local/POWER_BUTTON_HELD

#waiting for 15 sec for user to perform gesture if not perforemed then clsoed xasr
sleep 15 

# stop Xasr 
if [ "$(lipc-get-prop com.lab126.winmgr ASRMode)" -ne 0 ]; then
    stop xasr
fi

rm /var/local/POWER_BUTTON_HELD
rm /var/local/POWER_BUTTON_HELD_1 || true

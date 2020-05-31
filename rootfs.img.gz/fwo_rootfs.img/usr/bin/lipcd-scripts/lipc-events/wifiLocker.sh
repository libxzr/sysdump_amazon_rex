#!/bin/sh

EVENT_NAME_PARAM=$1
EVENT_PARAM=$2

checkAndStartWifiLocker () {  
    lipc-set-prop com.lab126.wifilocker newNetworkConnected ""
    if [ $? -ne 0 ]
    then
        echo "Unable to start WifiLocker Successfully" | logger
        exit 1
    fi
}

if [ $EVENT_NAME_PARAM == "registrationChanged" ]
then
    if [ $EVENT_PARAM == "'2'" ]
    then
        echo "WifiLocker::Starting WifiLocker on De-registration Event" | logger
        lipc-set-prop com.lab126.wifid resetSavePasswordPreference 1
        if [ $? -ne 0 ]
        then
            echo "ERROR:: Unable to reset password preference in wifid" | logger
        fi

        echo "WifiLocker:: Resetting Wi-Fi Locker DB on De-registration " | logger
        lipc-set-prop com.lab126.wifilocker networkDeleted ""
        if [ $? -ne 0 ]
        then
            echo "ERROR:: Unable to reset preference in wifilocker" | logger
        fi
    elif [ $EVENT_PARAM == "'1'" ]
    then 
	"WifiLocker::Starting WifiLocker on registration Event" | logger
	checkAndStartWifiLocker
    fi
elif [ $EVENT_NAME_PARAM == "newNetworkConnected" ]
then 
    checkAndStartWifiLocker
fi
exit 0

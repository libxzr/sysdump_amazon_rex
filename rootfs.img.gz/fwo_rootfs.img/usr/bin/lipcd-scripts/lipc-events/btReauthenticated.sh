#!/bin/sh

#send pillow alert for device reauthenticated
source /etc/upstart/functions

#For debug purpose
isBtchOn=`lipc-get-prop com.lab126.btfd isBtchRunning`
f_log I "btReauthenticated" "isBtchOn = $isBtchOn" ""

lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"btRemoteReauthenticationAlert", "show":true}}'

#wait for btReconfirmed Event
fparam=`lipc-wait-event -s 7 com.lab126.btmd btReconfirmed`
if [ -z "$fparam" ]; then
    f_log I "btReauthenticated" "no user confirmation" ""
    echo "$0:  didn't receive any user confirmation"
    /usr/bin/lipcd-scripts/lipc-events/startBTCH.sh
    lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"btRemoteReauthenticationAlert", "hide":true}}'
    exit 0
else
    echo "$0:  received user confirmation exiting"
    f_log I "btReauthenticated" "got user confirmation" ""
    exit 0
fi

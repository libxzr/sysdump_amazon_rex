#!/bin/sh
lipc-set-prop com.lab126.wifilocker newNetworkConnected ""
if [ $? -ne 0 ]
then
        echo "Unable to start WifiLocker Successfully" | logger
        exit 1
fi
exit 0

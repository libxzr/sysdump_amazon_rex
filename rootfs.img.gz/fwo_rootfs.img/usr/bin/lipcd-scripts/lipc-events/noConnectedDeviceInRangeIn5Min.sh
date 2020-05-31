#!/bin/sh
# tear down the stack only if we are not in screensaver, and we are in ASR mode.

# Consider the following use-case.
# 1. ASR started 2. device goes out of range 3. reboot 4. Wait for 5 min without BT device in range.
# Here, ASR_ON flag check will fail here since its removed on ASR start after reboot.
# Therefore, IN_ASR_MODE flag is proper for determining asr mode.
inAsrMode=0
if [ -e "/var/local/IN_ASR_MODE" ]; then
   inAsrMode=1
fi

f_log I "noConnectedDeviceInRangeIn5Min" "" "inAsrMode=$inAsrMode"

if [ "$(lipc-get-prop com.lab126.powerd state)" != "screenSaver" -a "$inAsrMode" -eq 1 ] ; then
    #dismiss no connected device in Range alert
    lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"noConnectedDeviceInRangeAlert", "hide":true}}'

    #show reconnect failed alert
    lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"btReconnectFailedAlert", "show":true}}' 

    /usr/bin/lipcd-scripts/lipc-events/stopVoiceView.sh
    rm /var/local/NO_DEVICE_IN_RANGE_ALERT_SHOWN
fi

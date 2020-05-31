#!/bin/sh

source /etc/upstart/functions
BTFD_LIPC_SRC="com.lab126.btfd"

f_log I "startBTPD" "entered"  "arg=$1"

if [ -e "/var/local/VOICE_VIEW_STARTED" ]; then
    f_log I "startBTPD" "voice-view bring up is in progress" ""
    #Voice files check
    if !( [ -e /mnt/us/voice/vox_en_us_salli22i ] && [ -e /mnt/us/voice/lang_en_us.dat ] ) ; then
        lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"voiceFileNotDetectedAlert", "show":true}}' &
        lipc-send-event com.lab126.system.event screenReaderDisabled -s "VoiceFileNotDetected" || true

        # bring down the stack
        /usr/bin/lipcd-scripts/lipc-events/stopVoiceView.sh
        exit 0
    fi
    f_log I "startBTPD" "calling startBTCH" "" 
    /usr/bin/lipcd-scripts/lipc-events/startBTCH.sh

elif [ "$1" = "scanBtDevices" ]; then
    /usr/bin/lipcd-scripts/lipc-events/startBTCH.sh
else
    # Suspend case. noConnectedDeviceInRange event received. throw the alert.
    btchIsOn=`lipc-get-prop "$BTFD_LIPC_SRC" isBtchRunning`
    inAsrMode=0
    if [ -e "/var/local/IN_ASR_MODE" ]; then
        inAsrMode=1
    fi
    f_log I "startBTPD" "btchIsOn=$btchIsOn" "inAsrMode=$inAsrMode"
    if [ "$btchIsOn" -eq 0 -a "$inAsrMode" -eq 1 ]; then
        if ! ( [ -e /var/local/NO_DEVICE_IN_RANGE_ALERT_SHOWN ]); then
           lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"noConnectedDeviceInRangeAlert", "show":true}}'
           touch /var/local/NO_DEVICE_IN_RANGE_ALERT_SHOWN
        fi
    fi
fi

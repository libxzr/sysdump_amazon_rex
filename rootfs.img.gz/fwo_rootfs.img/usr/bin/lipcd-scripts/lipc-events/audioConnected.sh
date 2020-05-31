#!/bin/sh

source /etc/upstart/functions
EVENT_NAME=$1
EVENT_SOURCE=$2
EVENT_VALUE=$3
BTFD_LIPC_SRC="com.lab126.btfd"

f_log I "AudioConnected Script" "Event Received" "$EVENT_SOURCE $EVENT_NAME $EVENT_VALUE"

start_bt()
{
    LOCAL_EVENT_NAME=$1
    rm /var/local/VOICE_VIEW_STARTED
    f_log I "AudioConnected Script" "voice-view-started flag does not exist" ""

    inAsrMode=0
    if [ -e "/var/local/IN_ASR_MODE" ]; then
        inAsrMode=1
    fi

    if [ "$(lipc-get-prop com.lab126.winmgr ASRMode)" -eq 1 ]
    then
        # do nothing
        f_log I "AudioConnected Script" "ASR Already Started" "Skipping!!!"

    else
        f_log I "AudioConnected Script" "ASR is off right now" ""
        isBtchOn=`lipc-get-prop "$BTFD_LIPC_SRC" isBtchRunning`
        startAsrWithBtchOff=0
        if [ $isBtchOn -eq 0 -a $inAsrMode -eq 1 ]; then
            startAsrWithBtchOff=1
        fi

        f_log I "AudioConnected Script" "start_bt - btch-on=$isBtchOn asr-mode=$inAsrMode startAsrWithBtchOff=$startAsrWithBtchOff" ""

        if [ "$startAsrWithBtchOff" -eq 1 -o "$LOCAL_EVENT_NAME" = "userConfirmedAudioConnection" -o "$LOCAL_EVENT_NAME" = "audioDeviceConnected" ]
        then
            #dismiss noConnectedDeviceInRange alert if it is on the screen
            rm /var/local/NO_DEVICE_IN_RANGE_ALERT_SHOWN
            lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"noConnectedDeviceInRangeAlert", "hide":true}}'
            f_log I "AudioConnected Script" "start_bt - about to call audioDeviceConnected" ""
            /usr/bin/lipcd-scripts/lipc-events/audioDeviceConnected.sh
        fi
    fi
}
if [ "$EVENT_SOURCE" = "com.lab126.audiomgrd" -a "$EVENT_NAME" = "audioOutputChanged" ]; then 
    if [ $EVENT_VALUE = "'1'" ]; then
        f_log I "AudioConnected Script" "BT output connected!!!" ""
        start_bt $EVENT_NAME 
    elif [ $EVENT_VALUE = "'2'" ]; then
        f_log I "AudioConnected Script" "OTG output connected!!!" ""
        initctl emit audio_device_detected
    else
        # audio device disconnected
        f_log I "AudioConnected Script" "No output connected!!!" "Emitting audio_device_disconnected to stop asr and ivona"
        initctl emit audio_device_disconnected
    fi
elif [ "$EVENT_SOURCE" = "com.lab126.btfd" ]; then
    start_bt $EVENT_NAME
fi

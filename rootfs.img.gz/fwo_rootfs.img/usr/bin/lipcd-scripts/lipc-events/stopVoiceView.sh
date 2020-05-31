#!/bin/sh
source /etc/upstart/functions
BT_CONNECTION_HELPER_STOPPING="BTConnectionHelperStopping"
BT_STATE_OFF=0

# Disable BT from ASR mode. Parameter format should be in sync with btfd
BTFD_DISABLE_FROM_ASR_MODE="0:1"
BTFD_LIPC_SRC="com.lab126.btfd"

# This property value when passed to stopVoiceView will delete ASR flags alone
DELETE_ASR_FLAGS="deleteAsrFlags"

ensureBTDisabled () {
    btfdGetStateLipcCmd="lipc-get-prop $BTFD_LIPC_SRC BTstate"
    if [ "$($btfdGetStateLipcCmd)" -eq BT_STATE_OFF ]; then
        f_log I "stopVoiceView-ensureBTDisabled" "BT Chip turned OFF" ""
    else
        fparam=`lipc-wait-event -s 5 $BTFD_LIPC_SRC BTEnableResult`
        if [ -z "$fparam" ]; then
            f_log I "stopVoiceView-ensureBTDisabled" "Did not receive BTEnableResult event" ""
        else
            btEnable=$($btfdGetStateLipcCmd)
            f_log I "stopVoiceView-ensureBTDisabled" "BTEnableResult" "$fparam"
            f_log I "stopVoiceView-ensureBTDisabled" "BTenable" "$btEnable"
            if [ $btEnable -eq $BT_STATE_OFF ]; then
                f_log I "stopVoiceView-ensureBTDisabled" "BT chip is now turned Off" ""
            else
                f_log I "stopVoiceView-ensureBTDisabled" "ERROR: BT chip is NOT turned Off" ""
            fi
        fi
    fi
}

tearDown () {
    asr_stack_teardown
    # turn off BT
    lipc-set-prop "$BTFD_LIPC_SRC" BTenable "$BTFD_DISABLE_FROM_ASR_MODE"
    # Make sure BT chip is turned OFF
    ensureBTDisabled
    f_log I "stopVoiceView-tearDown" "DELETED the flag files" ""
    lipc-send-event com.lab126.hal voiceViewStatus -s "stopped"
}

f_log I "stopVoiceView" "entered" "arg=$1"

if [ "$1" = "$DELETE_ASR_FLAGS" ]
then
    f_log I "stopVoiceView" "Deleting ASR Flags"
    delete_asr_flags
    lipc-send-event com.lab126.hal voiceViewStatus -s "stopped"
    exit 0
fi

usbAudioConnected=`lipc-get-prop com.lab126.deviced usbaudioConnected`
if [ 0 -eq $(devcap-get-feature -a bluetooth) -a 0 -eq ${usbAudioConnected} ]
then
    f_log I "stopVoiceView" "start" "Bluetooth not supported and also Audio dongle is not connected"
    lipc-send-event com.lab126.hal voiceViewStatus -s "stopped"
    exit 1
elif [ 1 -eq ${usbAudioConnected} ]
then
    f_log I "stopVoiceView" "start" "Stopping VoiceView"
    /usr/bin/lipcd-scripts/lipc-events/usbaudioStateDisconnected.sh &
    lipc-send-event com.lab126.hal voiceViewStatus -s "stopped"
    exit 1
else
    f_log I "stopVoiceView" "BT-case" "$1"
fi

isBtchOn=`lipc-get-prop "$BTFD_LIPC_SRC" isBtchRunning`
f_log I "stopVoiceView" "isBtchRunning = $isBtchOn" "" 

if [ "$1" = "$BT_CONNECTION_HELPER_STOPPING" ]
then
    f_log I "stopVoiceView" "btConnectionhelper" "$1"
    # if asr is up then dont bring down the stack. otherwise teardown the stack
    if [ "$(lipc-get-prop com.lab126.winmgr ASRMode)" -eq 0 ] ; then
        f_log I "stopVoiceView" "tear down BT - asr is off" ""
        tearDown
    fi
else
    if [ "$isBtchOn" -eq 1 ]
    then
        lipc-send-event com.lab126.btstopper StopBt &
        f_log I "stopVoiceView" "StopBt event sent successfully" "$1"
    else
        f_log I "stopVoiceView" "Tear down BT" "$1"
        tearDown
    fi
fi

#!/bin/sh

LOCALE_FILE=/var/local/system/locale
POWER_BUTTON_HELD_FLAG="/var/local/POWER_BUTTON_HELD"
# New flag as we have some dependency on POWER_BUTTON_HELD flag in pillow layer
POWER_BUTTON_HELD_FLAG_1="/var/local/POWER_BUTTON_HELD_1"
TWO_FINGER_HOLD_EVENT="twoFingerHold"
START_VOICE_VIEW="startVoiceView"
START_VOICE_VIEW_ON_REBOOT="startVoiceViewOnReboot"

# Enable BT in ASR mode. Parameter format should be in sync with btfd
# <enable-value:ASR mode>
BTFD_ENABLE_IN_ASR_MODE="1:1"
BTFD_LIPC_SRC="com.lab126.btfd"
BT_STATE_OFF=0
BT_STATE_CONNECTED=2
ASR_GESTURE=0

source /etc/upstart/functions
source /usr/bin/record_device_metric.sh

recordMetrics() {
    if [ "$ASR_GESTURE" -eq 1 ] ; then
        record_device_metrics VoiceViewActivated userPerformedASRGesture ASRStart 1 '' $METRIC_PRIORITY_LOW $METRIC_TYPE_COUNTER
    elif [ "$1" = "$START_VOICE_VIEW" ] || [ "$1" = "$START_VOICE_VIEW_ON_REBOOT" ] ; then
        record_device_metrics VoiceViewActivated voiceViewSettings ASRStart 1 '' $METRIC_PRIORITY_LOW $METRIC_TYPE_COUNTER
    fi    
}
enableBT () {
    lipc-set-prop "$BTFD_LIPC_SRC" BTenable "$BTFD_ENABLE_IN_ASR_MODE"
    if [ $? -eq 0 ]
    then
        f_log I "initVoiceView-enableBT" "BTenable property set on BTFD" ""
    fi
}

ensureBTEnabled () {
    BtfdGetStateLipcCmd="lipc-get-prop $BTFD_LIPC_SRC BTstate"
    state=$($BtfdGetStateLipcCmd)
    f_log I "initVoiceView" "BTFD BTstate check" "$state"
    if [ $state -gt $BT_STATE_OFF ]; then
        f_log I "initVoiceView" "BT chip is On" ""
    else
        # Increasing wait time to 10 seconds(previously 5 seconds), as BTEnableResult
        # signifies start of both audio stack and BT stack(previously only BT stack)
        # TODO: XXX Timeout and event to be checked and modified
        fparam=`lipc-wait-event -s 300 $BTFD_LIPC_SRC BTstateChanged`
        if [ -z "$fparam" ]; then
            f_log I "initVoiceView" "Did not receive BTstateChanged event" ""
        else
            btState=$($BtfdGetStateLipcCmd)
            f_log I "initVoiceView-ensureBTEnabled" "btState" "$fparam"
            f_log I "initVoiceView-ensureBTEnabled" "BTenable" "$btState"
            if [ $btState -gt $BT_STATE_OFF ]; then
                f_log I "initVoiceView-ensureBTEnabled" "BT chip is now turned On" ""
            else
                f_log I "initVoiceView-ensureBTEnabled" "ERROR: BT chip is NOT turned On" ""
            fi
        fi
    fi
}

# process the gesture and start the bluetooth stack and the ASR.
processTheGesture () {
    f_log I "initVoiceView" "Process the gesture." "$1"
    if [ "$(lipc-get-prop com.lab126.winmgr ASRMode)" -ne 1 ]; then
    
       if [ -z "$(pgrep xasr)" ]; then
           start xasr
       fi
    
       # incase of reboot with ASR On, dont touch this file.
       if [ -e /var/local/ASR_ON ]; then
           rm /var/local/ASR_ON
       else
           touch /var/local/VOICE_VIEW_STARTED
       fi
       
       f_log I "initVoiceView" "Bring up BT stack" "$1"
       lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"btReconnectFailedAlert", "hide":true}}'
       # Bring up bluetooth and audio stack
       enableBT

       start ivona_ttsd
       # Make sure BT chip is turned ON
       ensureBTEnabled
       recordMetrics $1
    elif [ "$1" = "$START_VOICE_VIEW_ON_REBOOT" ]; then
        lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"btReconnectFailedAlert", "hide":true}}'
        recordMetrics $1
    fi
}

# validate if we need to process the gesture or do special handling with the gesture
validateAndProcessTheGesture () {
    if [ -e "$POWER_BUTTON_HELD_FLAG_1" -a "$1" = "$TWO_FINGER_HOLD_EVENT" ] || [ "$1" = "$START_VOICE_VIEW" ] || [ "$1" = "$START_VOICE_VIEW_ON_REBOOT" ]; then
        if [ -e "$POWER_BUTTON_HELD_FLAG_1" ]; then
            rm "$POWER_BUTTON_HELD_FLAG_1"
            ASR_GESTURE=1
        fi

        #LOCALE CHECK
        if [ -e $LOCALE_FILE ]; then
           LANG=`awk -F'=' '/LANG/{print $2}' $LOCALE_FILE`
           if [ "$LANG" != "en_US.utf8" -a "$LANG" != "en_GB.utf8" ]; then
               f_log E "initVoiceView" "localeNotSupported" "Discarding this voice-view request"
               lipc-send-event com.lab126.system.event screenReaderDisabled -s "localeNotSupported"
               lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"localeNotSupportedASRAlert", "show":true}}' &
               f_log I locale read "lang=$LANG,lc_all=$LC_ALL" "Retrieved Language"
               return 0
           fi
        fi

        touch /var/local/IN_ASR_MODE
        f_log I "initVoiceView" "flag file for ASR mode is created" ""
        # check if device is bluetooth capable, and if already audio-connected.
        isAsrOn=`lipc-get-prop com.lab126.winmgr ASRMode`
        usbAudioConnected=`lipc-get-prop com.lab126.deviced usbaudioConnected`
        btState=`lipc-get-prop com.lab126.btfd BTstate`
        btAudioConnected=0
        if [ $btState -eq $BT_STATE_CONNECTED ]; then
           btAudioConnected=1
        fi
        if [ 0 -eq $(devcap-get-feature -a bluetooth) -a 0 -eq ${usbAudioConnected} ]; then
            f_log I "initVoiceView" "Bluetooth not supported and also Audio dongle is not connected. exiting the operation" ""
            return 0
        elif [ 1 -eq ${usbAudioConnected} ]; then
            if [ -e /var/local/ASR_ON ]; then
                rm /var/local/ASR_ON
            fi
            /usr/bin/lipcd-scripts/lipc-events/usbaudioStateConnected.sh &
            return 0
        elif [ 1 -eq ${btAudioConnected} -a $isAsrOn -eq 0 ]; then
            if [ -e /var/local/ASR_ON ]; then
                rm /var/local/ASR_ON
            fi
            # Record ASR mode to btfd
            f_log I "initVoiceView" "Record ASR mode to btfd" "BT already connected."
            enableBT
            ensureBTEnabled
            f_log I "initVoiceView" "calling audioDeviceConnected.sh" "BT already connected."
            lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"shutdownAlert", "hide":true}}'
            /usr/bin/lipcd-scripts/lipc-events/audioDeviceConnected.sh &
            return 0
        fi
        
        #Dismissing power dialog
        lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"shutdownAlert", "hide":true}}' 
        
        #validate if we need to process this gesture or not

        #case 1: asr is on. 
        #        user initiated gesture to switch his bluetooth device (After PowerButtonHeld event)
        #        Set "triggerBTscan" to BTFD to go through the devices one by one
        if [ "$isAsrOn" -eq 1 ] && [ "$ASR_GESTURE" -eq 1 ]; then
            f_log I "initVoiceView" "User wants to switch the connection" "Will call startBTCH"
            /usr/bin/lipcd-scripts/lipc-events/startBTCH.sh
            record_device_metrics BTswitch userPerformedGesture addorSwitchBTDevice 1 '' $METRIC_PRIORITY_LOW $METRIC_TYPE_COUNTER
            return 0	
        fi
    
        #case 2: btfd is up. ASR is not on
        #        user initiated gesture as he is seeing delay in starting asr.
        #        ignore the gesture as we are already processing the same
        # TODO: XXX Rethink the below logic and modify
        # TODO: Put a condition for who started BTD - ASR or non-ASR.
        btState=`lipc-get-prop "$BTFD_LIPC_SRC" BTstate`
        if [ ! -z "$(pgrep btd)" ] && [ "$btState" -lt $BT_STATE_CONNECTED ] && [ "$1" != "$START_VOICE_VIEW_ON_REBOOT" ] ; then
            # btfd is running. if btState is not any of (Connected, Paired) then there are two cases
            # 1. btfd is still in the process of enabling the BT stack
            # 2. btfd is in the process of reconnecting.
            # in both the cases Set "triggerBTscan" to BTFD
            
            btchIsOn=`lipc-get-prop "$BTFD_LIPC_SRC" isBtchQueuedOrRunning`
            f_log I "initVoiceView" "btchIsOn=$btchIsOn btState=$btState" ""

            if [ "$btchIsOn" -eq 0 ] && [ "$ASR_GESTURE" -eq 1 ]; then

                # dimiss all reconnect related dialogs
                rm /var/local/NO_DEVICE_IN_RANGE_ALERT_SHOWN

                lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"btReconnectFailedAlert", "hide":true}}'
                lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"noConnectedDeviceInRangeAlert", "hide":true}}'
                touch /var/local/VOICE_VIEW_STARTED                                                                                                             

                # Record ASR mode to btfd
                f_log I "initVoiceView" "Record ASR mode to btfd" "BT already connected."
                enableBT
                ensureBTEnabled

                f_log I "initVoiceView" "Will call startBTCH" ""
                /usr/bin/lipcd-scripts/lipc-events/startBTCH.sh

            elif [ "$btchIsOn" -eq 0 ] && [ "$1" = "$START_VOICE_VIEW" ]; then

                # dimiss all reconnect related dialogs
                rm /var/local/NO_DEVICE_IN_RANGE_ALERT_SHOWN

                lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"btReconnectFailedAlert", "hide":true}}'
                lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"noConnectedDeviceInRangeAlert", "hide":true}}'
                touch /var/local/VOICE_VIEW_STARTED                                                                                                             

                # Record ASR mode to btfd
                f_log I "initVoiceView" "Record ASR mode to btfd" "BT already connected."
                enableBT
                ensureBTEnabled

                f_log I "initVoiceView" "Will call startBTCH" ""
                /usr/bin/lipcd-scripts/lipc-events/startBTCH.sh

            else	
                #Possibly, we can remove this else case.
                f_log I "initVoiceView" "Already processing the gesture. drop the duplicate gesture" ""
            fi
            return 0	
        fi

        #case 3: process the gesture as user wants to start the asr
        f_log I "initVoiceView" "Process the gesture. start the bluetooth stack for ASR" ""

        #case 4: If device is mounted to system then, don't start process
        if [ "$(lipc-get-prop com.lab126.volumd userstoreIsAvailable)" -eq 0 ] ; then
           return 0
        fi
        processTheGesture $1
        return $?
    fi
}

f_log I "initVoiceView" "$1" ""
validateAndProcessTheGesture $1
ret=$?
lipc-send-event com.lab126.hal voiceViewStatus -s "started"
return $ret

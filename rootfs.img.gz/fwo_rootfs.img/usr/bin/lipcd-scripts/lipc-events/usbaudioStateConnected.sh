#!/bin/sh
source /etc/upstart/functions

if [ ! -e /var/local/IN_ASR_MODE ]; then
   touch /var/local/IN_ASR_MODE
   f_log I "usbaudioStateConnected" "flag file for ASR mode is created" "OTG case"
fi

start audiomgrd

if [ "$(lipc-get-prop com.lab126.audiomgrd isStarted)" -eq 1 ]
then
    f_log I "initVoiceView" "audiomgrd started" ""
else
    audiomgrdState=`lipc-wait-event -s 1 com.lab126.audiomgrd StateChanged`
    if [ -z "$audiomgrdState" ]
    then
        f_log I "initVoiceView" "Didn't receive StateChanged event" ""
    else
        f_log I "initVoiceView" "audiomgrd StateChanged" "$audiomgrdState"
    fi
fi

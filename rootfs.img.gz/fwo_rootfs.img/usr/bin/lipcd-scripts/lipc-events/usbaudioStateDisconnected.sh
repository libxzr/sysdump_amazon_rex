#!/bin/sh

if [ 0 -eq $(devcap-get-feature -a bluetooth) -a  -e /var/local/ASR_ON ] ; then
    rm /var/local/ASR_ON
fi

if [ 0 -eq $(devcap-get-feature -a bluetooth) -a  -e /var/local/IN_ASR_MODE ] ; then
    rm /var/local/IN_ASR_MODE
    f_log I "usbaudioStateDisconnected" "flag file for ASR mode is removed" "OTG case"
fi

stop audiomgrd

initctl emit audio_device_disconnected

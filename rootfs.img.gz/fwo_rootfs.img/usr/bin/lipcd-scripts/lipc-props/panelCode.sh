#!/bin/sh
source /etc/upstart/functions 
waveformInfo=`kdb get system/driver/DISPLAY/PANEL_CODE`
if [ "$waveformInfo" == "" ] ; then
    exit 1
fi
cat "$waveformInfo" | awk -F"_" '{printf "%s_%s", $2,$4}'

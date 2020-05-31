#!/bin/sh

PID=`ps -e | grep relayd | grep -v grep | awk '{print $1}'`
if [[ "" != "$PID" ]]; then
    echo "Stopping relay daemon"
    killall relayd
fi
echo "Turn off WAN"
wancontrol wanoffkill


#!/bin/sh

PID=`ps -e | grep relayd | grep -v grep | awk '{print $1}'`
if [[ "" != "$PID" ]]; then
    echo "Stopping relay daemon"
    killall relayd
fi
while [ "" != "$PID" ]; do
    echo "Stopping relay daemon"
    sleep 1
    PID=`ps -e | grep relayd | grep -v grep | awk '{print $1}'`
done
echo "Turn on WAN"
wancontrol wanontph
sleep 1
echo "Start relay daemon"
nohup relayd > /dev/null 2>&1 &
sleep 1
echo "Relay daemon started"


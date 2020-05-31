#!/bin/sh
source /etc/upstart/functions

#give some time to settle the screen
sleep 5

echo unlock > /proc/touch
if [ "$(f_platform)" = "wario" ]; then
	modprobe cyttsp4_device_access
	sleep 1
	echo "cali" > /proc/touch
	sleep 5
	modprobe -r cyttsp4_device_access

elif [ "$(f_platform)" = "yoshime3" ]; then
	cat /sys/devices/platform/cyttsp.0/recalibrate
	sleep 5
fi

echo "user recalibrated" > /dev/kmsg


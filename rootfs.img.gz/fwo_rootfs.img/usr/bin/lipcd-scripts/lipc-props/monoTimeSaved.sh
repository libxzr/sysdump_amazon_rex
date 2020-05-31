#!/bin/sh
cat /sys/devices/platform/mxc_rtc.0/rtc_saved_last_seconds | xargs echo -n

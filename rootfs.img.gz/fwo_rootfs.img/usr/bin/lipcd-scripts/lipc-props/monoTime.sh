#!/bin/sh
cat /sys/devices/platform/mxc_trc.0/rtc_pmic_epoch_time | xargs echo -n

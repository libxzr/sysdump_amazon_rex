#!/bin/sh

# Copyright (c) 2017 Amazon Technologies, Inc.  All rights reserved.
# PROPRIETARY/CONFIDENTIAL
# Use is subject to license terms.

source /etc/upstart/functions

f_log I turnOnLed start ""

echo 1 >  /sys/class/leds/amber/manual || true

echo 255 > /sys/class/leds/amber/brightness || true

f_log I turnOnLed end ""



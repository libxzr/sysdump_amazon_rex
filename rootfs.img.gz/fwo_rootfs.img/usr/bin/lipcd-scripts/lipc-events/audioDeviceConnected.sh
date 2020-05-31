#!/bin/sh
#
# Copyright (c) 2015 Amazon Technologies, Inc.  All rights reserved.
# PROPRIETARY/CONFIDENTIAL
# Use is subject to license terms.

# remove the power button combo flag
rm /var/local/POWER_BUTTON_HELD

# remove the universal gesture xasr
stop xasr

# send upstart event to inform audio device detected
initctl emit audio_device_detected

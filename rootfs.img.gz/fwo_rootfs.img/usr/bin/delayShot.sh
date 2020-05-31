#!/bin/sh
#
# Copyright (c) 2013 Amazon Technologies, Inc.  All rights reserved.
# PROPRIETARY/CONFIDENTIAL
# Use is subject to license terms.

# verify we are on a pre GM device 
if ! [ -e "/PRE_GM_DEBUGGING_FEATURES_ENABLED__REMOVE_AT_GMC" ]; then
    exit 0
fi

# sleep first
sleep $1

# log window state
xwininfo -root -tree | logger

# take screenshot
screenshot -x

# flash the screen to indicate it took
lipc-set-prop com.lab126.winmgr liglPause 0

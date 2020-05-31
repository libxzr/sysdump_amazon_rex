#!/bin/sh
#
# Copyright (c) 2015 Amazon Technologies, Inc.  All rights reserved.
# PROPRIETARY/CONFIDENTIAL
# Use is subject to license terms.


if [ $1 == "on" ]; then
    lipc-set-prop com.lab126.winmgr setPreference "key:Inverted" 
elif [ $1 == "off" ]; then
    lipc-set-prop com.lab126.winmgr setPreference "key:Normal"
fi


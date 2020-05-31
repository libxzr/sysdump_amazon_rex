#!/bin/sh
#
# Copyright (c) 2015 Amazon.com, Inc. or its affiliates. All rights reserved.
#
# PROPRIETARY/CONFIDENTIAL
#
# Use is subject to license terms.
#
# 1. Enables/disables hibernate or quickboot feature. 
# 2. Updates the suspend to hibernate rtc time.

if ! [ -e "/PRE_GM_DEBUGGING_FEATURES_ENABLED__REMOVE_AT_GMC" ]; then
    exit 1
fi

KEY=$1
VALUE=$2
if [ "$KEY" = "" -o "$VALUE" = "" ]; then
    exit 1
fi

echo "HIBERNATE_DEBUG_SCRIPT Executing the script with (key = "$KEY") and (value = "$VALUE")" 2>&1 | logger

if ! [ "$VALUE" -eq "$VALUE" ] 2>/dev/null; then
    echo "HIBERNATE_DEBUG_SCRIPT Invalid parameter!!! Value is not a number"; 2>&1 | logger
fi

DYNCONFIG_NAME=""
DYNCONFIG_VALUE=$2
if [ "$1" = "enable" ]; then
    DYNCONFIG_NAME="hibernate.enabled"
    if [ $DYNCONFIG_VALUE -gt 1 ]; then
        echo "HIBERNATE_DEBUG_SCRIPT Invalid parameter!!! Value is not in range" 2>&1 | logger
        exit 1
    fi
elif [ "$1" = "s2hrtc" ]; then
    DYNCONFIG_NAME="hibernate.s2h.rtc.secs"
    if [ $DYNCONFIG_VALUE -lt 0 ]; then
        echo "HIBERNATE_DEBUG_SCRIPT Invalid parameter!!! Value is not in range" 2>&1 | logger
        exit 1
    fi
elif [ "$1" = "h2hrtc" ]; then
    DYNCONFIG_NAME="hibernate.h2h.rtc.secs"
    if [ $DYNCONFIG_VALUE -lt 0 ]; then
        echo "HIBERNATE_DEBUG_SCRIPT Invalid parameter!!! Value is not in range" 2>&1 | logger
        exit 1
    fi
elif [ "$1" = "metric" ]; then
    DYNCONFIG_NAME="powerd.metric.program_name"
    DYNCONFIG_VALUE="powerd-j7-beta"
elif [ "$1" = "force" ]; then
    echo "HIBERNATE_DEBUG_SCRIPT Executing Snapshot" | logger
    lipc-set-prop com.lab126.powerd powerButton 1
    sleep 3
    snapshot
else
    echo "HIBERNATE_DEBUG_SCRIPT Invalid parameter!!! Key is not supported" 2>&1 | logger
    exit 1
fi

sqlite3 /var/local/appreg.db "INSERT or REPLACE into properties VALUES ('dcc', '$DYNCONFIG_NAME', '$DYNCONFIG_VALUE')" 
echo "HIBERNATE_DEBUG_SCRIPT Restarting powerd" | logger
restart powerd

sleep 1

echo "HIBERNATE_DEBUG_SCRIPT Going to screensaver" | logger
lipc-set-prop com.lab126.powerd powerButton 1

echo "HIBERNATE_DEBUG_SCRIPT Executed Successfully" 2>&1 | logger
exit 0

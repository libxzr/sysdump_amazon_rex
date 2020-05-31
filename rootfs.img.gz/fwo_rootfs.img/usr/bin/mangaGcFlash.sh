#!/bin/sh

# verify we are on a pre GM device 
if ! [ -e "/PRE_GM_DEBUGGING_FEATURES_ENABLED__REMOVE_AT_GMC" ]; then
    exit 0
fi

lipc-set-prop com.lab126.winmgr liglDebugParams useGcManga:"$1"

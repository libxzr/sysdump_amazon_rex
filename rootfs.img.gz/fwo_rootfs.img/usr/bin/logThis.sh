#!/bin/sh

if [ -f /PRE_GM_DEBUGGING_FEATURES_ENABLED__REMOVE_AT_GMC ]; then
    # add all the args 
    logger "I logger:manual::$@"
fi

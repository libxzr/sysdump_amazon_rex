#!/bin/sh

if [ -f /PRE_GM_DEBUGGING_FEATURES_ENABLED__REMOVE_AT_GMC ]; then
    lipc-set-prop com.lab126.pillow customDialog '{"name":"sensitivity_control","clientParams":{"show":true}}'
fi

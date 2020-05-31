#!/bin/sh
#
# Copyright (c) 2013 Amazon.com, Inc. or its affiliates. All rights reserved.
# PROPRIETARY/CONFIDENTIAL
# Use is subject to license terms.
#
# configure grip suppresion

if [ -f /PRE_GM_DEBUGGING_FEATURES_ENABLED__REMOVE_AT_GMC ]; then
    lipc-set-prop com.lab126.winmgr grip_enabled $1
fi



#!/bin/sh
#
# Copyright (c) 2012 Amazon.com, Inc. or its affiliates. All rights reserved.
#
# PROPRIETARY/CONFIDENTIAL
#
# Use is subject to license terms.
#
# This script to force campaign update. It will ignore last update time and download campaigns from Store.

UPDATE_TIME=/var/local/merchant/update_time
if [ -f $UPDATE_TIME ]
then
    rm $UPDATE_TIME
fi

sleep 2

lipc-set-prop com.lab126.todo scheduleToDo 0

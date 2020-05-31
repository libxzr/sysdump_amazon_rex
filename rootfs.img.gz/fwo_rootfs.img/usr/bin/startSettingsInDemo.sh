#!/bin/sh
#
# Copyright (c) 2014 Amazon Technologies, Inc.  All rights reserved.
# PROPRIETARY/CONFIDENTIAL
# Use is subject to license terms.

DEMO_MODE_FILE=/var/local/system/DEMO_MODE
[ -e "$DEMO_MODE_FILE" ] && lipc-set-prop com.lab126.appmgrd start app://com.lab126.booklet.settings

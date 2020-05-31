#!/bin/sh
#
# Copyright (c) 2014 Amazon Technologies, Inc.  All rights reserved.
# PROPRIETARY/CONFIDENTIAL
# Use is subject to license terms.

DEMO_MODE_FILE=/var/local/system/DEMO_MODE
NO_TRANSITIONS=/var/local/system/no_transitions
[ -e "$DEMO_MODE_FILE" ] && touch "$NO_TRANSITIONS"

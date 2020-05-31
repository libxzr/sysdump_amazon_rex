#!/bin/sh
#
# resetTutorial.sh
#
# Copyright (c) 2015 Amazon Technologies, Inc.  All rights reserved.
# PROPRIETARY/CONFIDENTIAL
# Use is subject to license terms.

lipc-set-prop com.lab126.tutorialService clearAllTutorialStatus 1
lipc-set-prop com.lab126.appmgrd start app://com.lab126.booklet.oobe.tutorial


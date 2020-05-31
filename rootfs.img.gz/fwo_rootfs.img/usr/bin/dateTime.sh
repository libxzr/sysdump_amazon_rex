#!/bin/sh
#
# Copyright (c) 2010-2011 Amazon Technologies, Inc.  All rights reserved.
# PROPRIETARY/CONFIDENTIAL
# Use is subject to license terms.
#
# Called from the ;setTime and ;st debug commands

epochTime=`date -D "%F %H:%M" +%s -d "$1 $2"`

setdate $epochTime

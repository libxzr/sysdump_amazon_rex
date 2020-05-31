#!/bin/sh
#
# Copyright (c) 2013 Amazon Technologies, Inc.  All rights reserved.
# PROPRIETARY/CONFIDENTIAL
# Use is subject to license terms.
#
# links in and enables the uitest feature for testability framework to interact with 
# ACXs

# requires root rw 
ln -s /usr/lib/mesquite/test/features/uitest.kac /usr/lib/mesquite/features/uitest.kac
ln -s /usr/lib/mesquite/test/jscore/libjscoreUITest.so /usr/lib/mesquite/jscore/libjscoreUITest.so

#set flag file in var
touch /var/local/uitest.flag

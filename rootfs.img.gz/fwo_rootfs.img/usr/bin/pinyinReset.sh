#!/bin/sh
#
# Copyright (c) 2016 Amazon.com, Inc. or its affiliates. All rights reserved.
#
# PROPRIETARY/CONFIDENTIAL
#
# Use is subject to license terms.
#
# This script to reset Pinyin plugit state. It turns off the feature, reset FTUX and remove the Pinyin dictionary.

lipc-set-prop com.lab126.reader.languagelayer.pinyin reset all

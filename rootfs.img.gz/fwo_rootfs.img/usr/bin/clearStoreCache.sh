#!/bin/sh
# clearStoreCache.sh
# Copyright (c) 2014 Amazon.com, Inc. or its affiliates. All rights reserved.
# PROPRIETARY/CONFIDENTIAL
# Use is subject to license terms.

	
source /etc/upstart/functions
source /usr/bin/record_device_metric.sh

rm -rf "/mnt/us/.active_content_sandbox/store/resource/cachedResources/" || true
record_device_metrics clearstorecache debugscript csc 1 '' $METRIC_PRIORITY_LOW $METRIC_TYPE_COUNTER
restart stored;

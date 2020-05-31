#!/bin/bash
source /usr/bin/record_device_metric.sh
source /etc/upstart/functions

isAudibleAvailable=`lipc-get-prop com.lab126.btService isAudibleAvailable`

# We are recording AUDIBLE HEARTBEAT metric
if [ "$isAudibleAvailable" == "1" ] || [ "$isAudibleAvailable" == "0" ]; then

    # The below program source is predefined value given by DCM client to forward metric
    # to a specific table in warehouse.
    # https://wiki.labcollab.net/confluence/display/EINK/Metrics+Schema+for+Non-DEM+Metrics
    program_source="4eb62774-a0c8-49d6-b627-d2453b1bca32/1/00830003"
    clickstream_metadata="$TEAM_NAME=\"$TEAM_NAME_VALUE\",$SITE_VARIANT=\"$SITE_VARIANT_VALUE\",\
$PAGE_ACTION=\"AUDIBLE_HEARTBEAT\""
    discrete_metadata="isSubscribed=\"$isAudibleAvailable\""

    record_clickstream_metric_user_opt $S3_FORWARDING_PROGRAM_NAME $program_source $clickstream_metadata $discrete_metadata
else
    f_log E "record_audible_heartbeat" "Did not record metrics due to lipc error."
fi

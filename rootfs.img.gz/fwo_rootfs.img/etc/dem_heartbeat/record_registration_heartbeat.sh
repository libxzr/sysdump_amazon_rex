#!/bin/bash
source /usr/bin/record_device_metric.sh
source /etc/upstart/functions

isRegistered=`lipc-get-prop com.lab126.amazonRegistrationService isRegistered`

# We are recording REGISTRATION_HEARTBEAT metric
if [ "$isRegistered" == "1" ] || [ "$isRegistered" == "0" ]; then

    # The below program source is predefined value given by DCM client to forward metric
    # to a specific table in warehouse.
    # https://wiki.labcollab.net/confluence/display/EINK/Metrics+Schema+for+Non-DEM+Metrics
    program_source="a6feb5bb-9e82-4399-9019-21025c2af9a8/1/00830003"
    clickstream_metadata="$TEAM_NAME=\"$TEAM_NAME_VALUE\",$SITE_VARIANT=\"$SITE_VARIANT_VALUE\",\
$PAGE_ACTION=\"REGISTRATION_HEARTBEAT\""
    discrete_metadata="isRegistered=\"$isRegistered\""

    record_clickstream_metric_user_opt $S3_FORWARDING_PROGRAM_NAME $program_source $clickstream_metadata $discrete_metadata
else
    f_log E "record_registration_heartbeat" "Did not record metrics due to lipc error."
fi

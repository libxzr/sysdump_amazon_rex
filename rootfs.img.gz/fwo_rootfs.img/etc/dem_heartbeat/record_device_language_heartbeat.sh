#!/bin/bash
source /usr/bin/record_device_metric.sh
source /etc/upstart/functions

LOCALE_FILE="/var/local/system/locale"

# We are recording DEVICE_LANGUAGE Heartbeat metric
if [ -e $LOCALE_FILE ]; then
    LANG=`awk -F'=' '/LANG/{print $2}' /var/local/system/locale | awk -F "." '{print $1}'`

    # The below program source is predefined value given by DCM client to forward metric
    # to a specific table in warehouse.
    # https://wiki.labcollab.net/confluence/display/EINK/Metrics+Schema+for+Non-DEM+Metrics
    program_source="264912f5-d9ee-4f7c-95e1-c83563a03cfc/1/00830003"
    clickstream_metadata="$TEAM_NAME=\"$TEAM_NAME_VALUE\",$SITE_VARIANT=\"$SITE_VARIANT_VALUE\",\
$PAGE_ACTION=\"DEVICE_LANGUAGE\""
    discrete_metadata="selectedValue=\"$LANG\""

    record_clickstream_metric_user_opt $S3_FORWARDING_PROGRAM_NAME $program_source $clickstream_metadata $discrete_metadata
else
    f_log E "record_device_language_heartbeat" "Did not record metrics as locale file was missing."
fi

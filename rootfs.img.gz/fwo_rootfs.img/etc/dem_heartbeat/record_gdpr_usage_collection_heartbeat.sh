#!/bin/bash
source /usr/bin/record_device_metric.sh
source /etc/upstart/functions

# The below values are predefined value given by DCM client to forward metric
# to a specific table in warehouse.
# https://wiki.labcollab.net/confluence/display/EINK/Juno+Engagement+Metrics+-+Design 
PROGRAM_SOURCE="UsageReporter"
HIT_TYPE_VALUE="deviceAction"
GDPR_TOGGLE_DISABLED=0
GDPR_TOGGLE_ENABLED=1

gdprValue=`lipc-get-prop com.lab126.legalComplianceService gdprValue`

# We are recording GDPR HEARTBEAT metric
if [ "$gdprValue" == "$GDPR_TOGGLE_ENABLED" ]; then
    clickstream_metadata="$PAGE_ACTION=\"USAGE_METRICS_MARKETING_ENABLED_ON_HEARTBEAT\""
elif [ "$gdprValue" == "$GDPR_TOGGLE_DISABLED" ]; then
    clickstream_metadata="$PAGE_ACTION=\"USAGE_METRICS_MARKETING_ENABLED_OFF_HEARTBEAT\""
else
    f_log D "record_gdpr_usage_collection_heartbeat" "Did not record metrics for GDPR heartbeat."
    exit 1
fi
clickstream_metadata="$clickstream_metadata,$TEAM_NAME=\"$TEAM_NAME_VALUE\",$SITE_VARIANT=\"$SITE_VARIANT_VALUE\",$HIT_TYPE=\"$HIT_TYPE_VALUE\""
record_clickstream_metric_user_opt $PROGRAM_NAME $PROGRAM_SOURCE $clickstream_metadata NULL

#!/bin/bash
source /usr/bin/record_device_metric.sh

# We are recording POWER_ON_HEARTBEAT metric

# The below program source is predefined value given by DCM client to forward metric
# to a specific table in warehouse.
program_source="PowerReporter"
clickstream_metadata="$PAGE_TYPE=\"DevicePowerStats\",$HIT_TYPE=\"deviceAction\",\
$TEAM_NAME=\"$TEAM_NAME_VALUE\",$SITE_VARIANT=\"$SITE_VARIANT_VALUE\",$PAGE_ACTION=\"POWER_ON_HEARTBEAT\""

record_clickstream_metric $PROGRAM_NAME $program_source $clickstream_metadata NULL
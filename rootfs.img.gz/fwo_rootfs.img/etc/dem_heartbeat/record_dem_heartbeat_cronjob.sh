#!/bin/sh
# This file is executed by cronjob at 12am if the device is active.
source /usr/bin/record_device_metric.sh

powerd_state=`lipc-get-prop com.lab126.powerd state`
wifid_cmState=`lipc-get-prop com.lab126.wifid cmState`
cmd_activeInterface=`lipc-get-prop com.lab126.cmd activeInterface`

# Emit a heartbeat event
lipc-send-event com.lab126.dem "heartbeat"

# We are logging INTERNET_CONNECTED_HEARTBEAT metric
# when the cron job at 12AM executes this script,
# we check the values for cmState(wifid) and the active interface (cmd)
if [ "$cmd_activeInterface" == "wan" ] || [ "$wifid_cmState" == "CONNECTED" ]; then
    clickstream_metadata="$PAGE_TYPE=\"InternetStats\",$HIT_TYPE=\"deviceAction\",\
$TEAM_NAME=\"$TEAM_NAME_VALUE\",$SITE_VARIANT=\"$SITE_VARIANT_VALUE\",$PAGE_ACTION=\"INTERNET_CONNECTED_HEARTBEAT\""
    record_clickstream_metric $PROGRAM_NAME InternetReporter $clickstream_metadata NULL
fi

# We are logging USER_PRESENT_HEARTBEAT metric
# when the cron job at 12AM executes this script,
# we check the values for powerd state
if [ "$powerd_state" == "active" ]; then
    clickstream_metadata="$PAGE_TYPE=\"UsageStats\",$HIT_TYPE=\"deviceAction\",\
$TEAM_NAME=\"$TEAM_NAME_VALUE\",$SITE_VARIANT=\"$SITE_VARIANT_VALUE\",$PAGE_ACTION=\"USER_PRESENT_HEARTBEAT\""
    record_clickstream_metric $PROGRAM_NAME UsageReporter $clickstream_metadata NULL
fi

# Record other heartbeat metrics.
/etc/dem_heartbeat/record_dem_heartbeat.sh
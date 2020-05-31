#!/bin/bash
source /etc/upstart/functions
HEARTBEAT_DATE_FILE="/var/local/dem_last_heartbeat_date"
CURRENT_DATE=`date +%D`

record_engagement_heartbeat_metrics()
{
    # Running the below in background as it should not block the lipc-daemon
    /etc/dem_heartbeat/record_dem_heartbeat.sh &
}

# Check if file does not exists and make this as
# the first instance of heartbeat metrics recording.
if [ ! -f $HEARTBEAT_DATE_FILE ]; then
    f_log I "clickstreamHeartbeatMetricsFramework" "Triggering metrics recording for the date $CURRENT_DATE, file did not exists"
    record_engagement_heartbeat_metrics
    exit 0
fi

# Read the file to know the date, when last heartbeat was recorded.
LAST_HEARTBEAT_DATE=`cat $HEARTBEAT_DATE_FILE`

# Checking if last heartbeat recorded date and current date is not equal.
if [ "$CURRENT_DATE" != "$LAST_HEARTBEAT_DATE" ]; then
    f_log I "clickstreamHeartbeatMetricsFramework" "Triggering metrics recording for the date $CURRENT_DATE"
    record_engagement_heartbeat_metrics
else
    f_log I "clickstreamHeartbeatMetricsFramework" "Skipping metrics recording, as it is the same day"
fi

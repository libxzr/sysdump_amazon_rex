#!/bin/bash
# This is the file from which, all the files where heartbeat metrics are recorded, is executed.
# If there is a new heartbeat in future,
# it should be recorded in a new file under /etc/dem_heartbeat/ and executed from here.

HEARTBEAT_DATE_FILE="/var/local/dem_last_heartbeat_date"
CURRENT_DATE=`date +%D`

activeProfileRole=`lipc-get-prop com.lab126.household activeProfileRole`
if [ $activeProfileRole != "ADULT" ]; then
    f_log I "clickstreamHeartbeatMetricsFramework" "Skipping metrics recording as the device is in child profile"
    exit 0
fi

# Write current date to file
echo $CURRENT_DATE > $HEARTBEAT_DATE_FILE

/etc/dem_heartbeat/record_power_on_heartbeat.sh
/etc/dem_heartbeat/record_audible_heartbeat.sh
/etc/dem_heartbeat/record_registration_heartbeat.sh
/etc/dem_heartbeat/record_device_language_heartbeat.sh
/etc/dem_heartbeat/record_gdpr_usage_collection_heartbeat.sh

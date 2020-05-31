#!/bin/sh
source /etc/upstart/functions
source /etc/upstart/perfdfuncs

if [ "$(f_platform)" = "rex" ]; then
      # Enabling the cpu to performance mode for 10 seconds
      reserve_perf_mode postRegistrationActivities 10
fi

sh /usr/bin/lipcd-scripts/lipc-events/wifiLocker.sh $1 $3

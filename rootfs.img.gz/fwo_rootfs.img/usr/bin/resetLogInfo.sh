#!/bin/sh
if [ -f /PRE_GM_DEBUGGING_FEATURES_ENABLED__REMOVE_AT_GMC ]; then
	for daemon in `lipc-probe -l`
	do
		daemon_name=`echo $daemon | awk -F"com.lab126." '{print $2}'`
		if [ -n "$daemon_name" ]; then
		        output=`lipc-get-prop $daemon logLevel`
		        if [ $? -eq 0 ]; then
				`lipc-set-prop $daemon logLevel  p_info`
			fi
		fi
	done
fi

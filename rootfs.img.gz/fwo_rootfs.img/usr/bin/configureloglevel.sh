#!/bin/sh

if [ -f /PRE_GM_DEBUGGING_FEATURES_ENABLED__REMOVE_AT_GMC ]; then
	i=0;
	command="lipc-set-prop com.lab126.pillow customDialog '{\"name\":\"configure_log_level\",\"clientParams\":{\"show\":true, \"process\": ["
	for daemon in `lipc-probe -l`
	do
		daemon_name=`echo $daemon | awk -F"com.lab126." '{print $2}'`
		if [ -n "$daemon_name" ]; then
			logline=`lipc-get-prop $daemon logLevel`
			loglevel=`echo "$logline" |head -1| awk -F=  '{print $2}'`
			if [ -n "$loglevel" ];then
				if [ $i -ge 1 ]; then
					command="$command, "
				fi

				command="$command {\"daemon\": \"$daemon_name\", \"logInfo\": \""
				command="$command$loglevel\"}"
				i=$((i+1))
			fi
		fi
	done
	command="$command ]}}'"
	eval "$command"
fi

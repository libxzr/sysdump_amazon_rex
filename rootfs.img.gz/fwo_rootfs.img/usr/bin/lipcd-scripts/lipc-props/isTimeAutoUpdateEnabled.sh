#!/bin/sh
if [ -e /var/run/AUTOTIME_OFF ]; then 
    echo -n "false"
else 
    echo -n "true"
fi

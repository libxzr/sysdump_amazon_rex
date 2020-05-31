#!/bin/sh

DEMO_MODE_FILE=/var/local/system/DEMO_MODE

if [ -e "$DEMO_MODE_FILE" ]; then
    # Launch the demo configuration menu (if already in demo mode).
    lipc-set-prop com.lab126.appmgrd start app://com.lab126.booklet.demo?action=configure;
else
    # Launch the demo activation screen (if the device is not in demo mode).
    lipc-set-prop com.lab126.appmgrd start app://com.lab126.booklet.demo?action=acknowledge;  
fi


#!/bin/sh

DEMO_MODE_FILE=/var/local/system/DEMO_MODE
NO_TRANSITIONS_FILE=/var/local/system/no_transitions

if [ -e "$DEMO_MODE_FILE" ]; then

    #This flag is used to specify that the system is in demo mode
    /bin/rm "$DEMO_MODE_FILE"

    #This flag is used to prevent volumd from mounting userstore over USB
    /bin/rm "$NO_TRANSITIONS_FILE"

    #Restore initial screen saver state, modified by createDemoModeFlagFile.sh
    /usr/bin/lipc-set-prop com.lab126.powerd preventScreenSaver 0

    #Restore initial state of merchandising, modified by DemoService
    /usr/bin/sqlite3 /var/local/appreg.db 'update properties set value="false" where name="merchant.disabled" and handlerId="dcd";'

    #Restore initial unloadPolicy for oobe tutorial, modified by
    #createDemoModeFlagFile.sh
    /usr/bin/sqlite3 /var/local/appreg.db "update properties set value='unloadOnPause' where handlerId='com.lab126.booklet.oobe.tutorial' AND name ='unloadPolicy';"

fi

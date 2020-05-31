#!/bin/sh

#This flag is used to specify that the system is in demo mode
/bin/touch /var/local/system/DEMO_MODE

#This property is used to prevent screensaver until demo activation finishes
#This should only happen the first time the demo flag is created (from langpicker)
/usr/bin/lipc-set-prop com.lab126.powerd preventScreenSaver 1

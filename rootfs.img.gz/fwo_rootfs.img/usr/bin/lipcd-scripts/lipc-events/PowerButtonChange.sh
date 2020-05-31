#!/bin/sh
/usr/bin/lipcd-scripts/lipc-events/dumpBTFrameworkLogs.sh
lipc-set-prop com.lab126.kaf callInspector dumpAllThreads
if [ $? -ne 0 ]; then
    killall -3 cvm
fi
/usr/sbin/tinyrot --force && sync

#!/bin/sh
event=$1
if [ -z "$3" ]; then
arg=1
else
arg=$(echo $3 | xargs echo)
fi

/usr/bin/lipc-set-prop amazon.device.messaging $event $arg

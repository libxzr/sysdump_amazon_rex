#!/bin/sh

if [ "$3" != "''" ]; then
    # We need to update time only if we are connected on some interface
    # When disconnection from interface(like Wifi) happens and there is no interface currently,
    # this script is called with interface(argument 3) as "''". Using this fact in if check
    /usr/sbin/updatetime
fi
/usr/bin/lipcd-scripts/lipc-events/eventToAdmProperty.sh "$@"

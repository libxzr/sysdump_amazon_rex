#!/bin/sh
# TODO: Investigate whether it can be done in a better way
# BT initialization should happen in background to ensure lipcd does not get blocked
/usr/bin/lipcd-scripts/lipc-events/initVoiceView.sh $1 &

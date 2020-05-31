#!/bin/sh

source /etc/upstart/functions 
if [ "$(f_platform)" = "wario" -o "$(f_platform)" = "duet" ]; then 
    waveformInfo="/proc/eink/panel/waveform/human_version"
else 
    exit 1 
fi

cat "$waveformInfo" | xargs echo -n

#!/bin/sh

source /etc/upstart/functions 

if [ "$(f_platform)" = "yoshi" -o "$(f_platform)" = "yoshime3" ]; then 
    waveformInfo="/proc/wf/version" 
else 
    waveformInfo="/proc/eink/waveform/human_version"
fi

cat "$waveformInfo" | xargs echo -n

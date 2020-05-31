#!/bin/bash

source /etc/upstart/functions

lipc-wait-event -s 20 com.lab126.pillow "pillowReady"
f_log I "pillowLauncher" "pillow is ready!"

#!/bin/sh

if [ 1 -eq $(devcap-get-feature -a wan) ] 
then
    lipc-set-prop com.lab126.appmgrd start app://com.lab126.booklet.settings?diagnosticMode=\;311
fi


#!/bin/sh
rm /var/local/system/ASR_DEVICE
lipc-send-event com.lab126.system.event screenReaderDisabled
true

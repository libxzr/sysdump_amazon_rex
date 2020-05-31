#!/bin/sh

# Log extra information for BT devices
if [ "$(devcap-get-feature -a bluetooth)" -eq 1 ]; then
    _LOG="/usr/bin/logger -s -t dumpBTFrameworkLogs"

    ${_LOG} "#### Start Dumping BT Related Info ####"

    # Dump the BTFD audio source state information
    lipc-set-prop com.lab126.btfd DumpStateInfo ""

    # Dump the BTFD persistence state file
    btState=`cat /var/local/system/bt_source_state.conf`
    ${_LOG} "${btState}"

    # Dump the state of every process
    processStates=`ps aux`
    ${_LOG} "${processStates}"

    # Check and report the presence of ASR flags
    if [ -f /var/local/VOICE_VIEW_STARTED ]; then
        ${_LOG} "VOICE_VIEW_STARTED present"
    fi
    if [ -f /var/local/ASR_ON ]; then
        ${_LOG} "ASR_ON present"
    fi
    if [ -f /var/local/NO_DEVICE_IN_RANGE_ALERT_SHOWN ]; then
        ${_LOG} "NO_DEVICE_IN_RANGE_ALERT_SHOWN present"
    fi
    if [ -f /var/local/IN_ASR_MODE ]; then
        ${_LOG} "IN_ASR_MODE present"
    fi
    ${_LOG} "#### End Dumping BT Related Info ####"
fi

#!/bin/sh

BTFD_LIPC_SRC="com.lab126.btfd"
BTFD_LIPC_PROP_TRIGGER_BT_SCAN="triggerBTscan"
BTFD_LIPC_VALUE_TRIGGER_BT_SCAN=1
#value 1 for triggerBTscan signifies ASR mode.

source /etc/upstart/functions

bringUpBtch() {

    if [ "$(lipc-get-prop com.lab126.winmgr ASRMode)" -eq 1 ] ; then
        # stop asr and it related components
        f_log I startBTCH "asr and ivona are already running. Stopping them. Scan or Switch case." ""
        f_emit stop-asr
        f_emit stop-ivona
    fi

    #Voice files check
    if !( [ -e /mnt/us/voice/vox_en_us_salli22i ] && [ -e /mnt/us/voice/lang_en_us.dat ] ) ; then
        lipc-set-prop com.lab126.pillow pillowAlert '{"clientParams":{"alertId":"voiceFileNotDetectedAlert", "show":true}}' &
        lipc-send-event com.lab126.system.event screenReaderDisabled -s "VoiceFileNotDetected" || true
        # bring down the stack
        /usr/bin/lipcd-scripts/lipc-events/stopVoiceView.sh
        exit 0
    fi

    f_emit start-xasr
    f_emit start-ivona

    if [ "$(lipc-get-prop com.lab126.ivonatts ivonaStarted)" -eq 1 ] ; then
        f_log I startBTCH "ivona has started."
    else
        lipc-wait-event -s 1 com.lab126.ivonatts ivonaTtsdStarted || true
        f_log I startBTCH "Wait for ivona bring-up is over."
    fi

    if [ -z "$(pgrep xasr)" ]; then
       # Printing BT-state below for debug purpose.
       btState=`lipc-get-prop com.lab126.btfd BTstate`
       f_log I startBTCH "Xasr is not up" "btState=$btState"
       # Here, we are checking  whether xasr was stopped due to asr-bringup or not.
       # So, we check : if(its a scan/switch request or BT is not connected) then stop ivona.
       # In any case, we don't pursue our request for BTCH bringup since xasr is must for it.
       # We will wait for ASR to come up in case xasr was stopped by it during its startup.
       lipc-wait-event -s 5 com.lab126.asr ASRState || true
       if [ "$(lipc-get-prop com.lab126.winmgr ASRMode)" -eq 0  ]; then
           f_log E startBTCH "Won't ask BTFD. Stopping ivona and returning..."
           f_emit stop-ivona
       fi
       return -1
    fi

    # Adding one extra check for ASR (or BT-state) before asking BTFD for BTCH bringup.
    # This will minimize posibility of an existing race-condition which happens when BT is
    # connected just before asking BTFD.
    if [ "$(lipc-get-prop com.lab126.winmgr ASRMode)" -eq 1  ]; then
        f_log I startBTCH "ASR is up, so won't ask BTFD. Returning..."
        return 0
    fi

    f_log I startBTCH "About to ask BTFD for bring-up BTCH"
    lipc-set-prop $BTFD_LIPC_SRC $BTFD_LIPC_PROP_TRIGGER_BT_SCAN $BTFD_LIPC_VALUE_TRIGGER_BT_SCAN
    return 0;

}

f_log I startBTCH "In startBTCH."
bringUpBtch
f_log I startBTCH "Exit."

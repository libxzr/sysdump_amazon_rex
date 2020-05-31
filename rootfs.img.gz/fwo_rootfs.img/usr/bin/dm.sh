#!/bin/sh

FILENAME_SYS="/mnt/us/documents/all_system_logs_as_of_"`echo $(date) | sed 's/ /_/g' | sed 's/:/./g'`".txt"
FILENAME_NET="/mnt/us/documents/all_netlog_logs_as_of_"`echo $(date) | sed 's/ /_/g' | sed 's/:/./g'`".txt"
FILENAME_WPA="/mnt/us/documents/all_wpa_supplicant_logs_as_of_"`echo $(date) | sed 's/ /_/g' | sed 's/:/./g'`".txt"
FILENAME_WININFO="/mnt/us/documents/wininfo_logs_as_of_"`echo $(date) | sed 's/ /_/g' | sed 's/:/./g'`".txt"
FILENAME_611="/mnt/us/documents/611_logs_as_of_"`echo $(date) | sed 's/ /_/g' | sed 's/:/./g'`".txt"
FILENAME_BSA="/mnt/us/documents/all_bsa_server_logs_as_of_"`echo $(date) | sed 's/ /_/g' | sed 's/:/./g'`".txt"
FILENAME_BSA_LOG="/var/log/bsa_server_log"
BTDEST_DIR=/mnt/us/documents/btlogs
BTLOG_DIR=/var/local/log/
BTLOGNAME=bsalogs.tgz
BTSNOOPLOGNAME=btsnooplogs.tgz
USER_611_OP=1
NONUSER_611_OP=0
echo "creating logdump filename $FILENAME_SYS"

showlog > $FILENAME_SYS

echo "creating logdump filename $FILENAME_NET"

showlog -n > $FILENAME_NET

echo "creating logdump filename $FILENAME_WPA"

showlog -w > $FILENAME_WPA

# Only dump 611 logs for WAN capable devices
if [ 1 -eq $(devcap-get-feature -a wan) ] 
then

echo "creating logdump filename $FILENAME_611"

lipc-set-prop com.lab126.wan logString $NONUSER_611_OP
lipc-get-prop com.lab126.wan logString > $FILENAME_611
lipc-set-prop com.lab126.wan logString $USER_611_OP

fi

if [ 1 -eq $(devcap-get-feature -a bluetooth) ]
then
    if [ -e "$FILENAME_BSA_LOG" ];then
        echo "creating logdump filename $FILENAME_BSA"
        showlog -z > $FILENAME_BSA
    else
        echo "Bluetooth file doesn't exist"
    fi
    #gather bsalogs if they are present in /var/local/log
    if [ -e /mnt/us/bsa_log ];then
        echo "copying log for bsa_log "
        mkdir -p /mnt/us/documents/btlogs
       cd "/mnt/us" && tar zcf "${BTDEST_DIR}/bsa_log_current.tgz" bsa_log
    fi

    if [ 0 -lt $(ls /var/local/log/bsa_log* 2>/dev/null | wc -w) ]; then
        echo "copying /var/local/log/bsa_log*"
        mkdir -p /mnt/us/documents/btlogs
       cd "${BTLOG_DIR}" && tar zcf "${BTDEST_DIR}/${BTLOGNAME}" bsa_log*
    fi

    if [ -e /mnt/us/bt_snoop_log ];then
        echo "copying log for bt_snoop_log"
        mkdir -p /mnt/us/documents/btlogs
       cd "/mnt/us" && tar zcf "${BTDEST_DIR}/bt_snoop_log_current.tgz" bt_snoop_log
    fi

    if [ 0 -lt $(ls /var/local/log/bt_snoop_log* 2>/dev/null | wc -w) ]; then
        echo "copying /var/local/log/bt_snoop_log*"
        mkdir -p /mnt/us/documents/btlogs
       cd "${BTLOG_DIR}" && tar zcf "${BTDEST_DIR}/${BTSNOOPLOGNAME}" bt_snoop_log*
    fi
fi

echo "creating dump of current window state"

xwininfo -root -tree > $FILENAME_WININFO

echo "done dumping all logs"

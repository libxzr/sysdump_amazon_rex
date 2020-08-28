#!/bin/sh
#
# Copyright (c) 2013-2020 Amazon Technologies, Inc.  All rights reserved.
# PROPRIETARY/CONFIDENTIAL
# Use is subject to license terms.

#  Use to collect network traffic for analysis / debugging

#  Accepts 5 optional flags, and 1 positional parameter.
#
#  -t   time_limit      Maximum time to run tcpdump (in minutes)
#                       10 minutes by default.  Setting to 0
#                       will result in running indefinitely.
#               
#      
#  -s   size_limit      Maximum allowable .pcap file size (in MB)
#                       10 MB by default.  Setting to 0 allows
#                       for arbitrarly large files.
#      
#      
#  -n   file_name       Desired name of .pcap file.  By default,
#                       will be set to a timestamp of when the capture began.
#                       
#        
#  -i   interface       Desired interface to monitor.  Selection of 'any' is not
#                       supported for the kindle's kernel.  Will default
#                       to the current internet connection route, but
#                       setting manually between wlan0 and ppp0 may be
#                       desirable when using packet capture to debug
#                       connectivity issues.
#       
#       
#  -c                   Redirect appAlert output to console.
#                       
#                       
#                 
#       
#       action ($1)     Selects whether to 'start' or 'stop' packet capture.  
#                       'start' is the default behavior.
#   
  
# Prints commands and their arguments as they are executed from shell
set -x  

# verify we are on a pre GM device
if ! [ -e "/PRE_GM_DEBUGGING_FEATURES_ENABLED__REMOVE_AT_GMC" ]; then
    exit 0
fi

usage=`echo "Usage: pcap.sh [-t time_limit] [-s size_limit] [-n file_name]"\
                           "[-i interface] [-q] [action] [-c]"`


# tcpdump output is sent to PCAP_DIR for eventual retrieval by dmcc.sh
PCAP_DIR=/mnt/us/pcap/
PATH=/usr/local/sbin/:/usr/local/bin:/usr/sbin/:/usr/bin/



################################# appAlert1 ###################################
#
# Bring up a simple pillow alert window.  
#
# Useful for providing feedback that doesn't require console access.
#
# $1    Title of window
# $2    Message to display
#

exec 3>&1   #'save' copy of stdout for console output

appAlert1()
{   
    if $console
    then
        echo "$2" >&3

    else
        lipc-set-prop com.lab126.pillow pillowAlert \
        '{
            "clientParams":{
                "alertId":"appAlert1",
                "show":true,
                "customStrings":[
                    { "matchStr":"alertTitle", "replaceStr":"'"$1"'" },
                    { "matchStr":"alertText", "replaceStr":"'"$2"'" } ]
                }
            }'

    fi
}


time_limit=10                       #default time limit (Minutes)
size_limit=10                       #default pcap file size limit (MB)
file_name=`date +%b_%d_%H.%M.%S_%Y` #default .pcap filename
console=false                       #default to showing dialogue windows

#default to active interface
interface=$(ip route | grep default | awk '{print $5}')


############  input flags parsing  ############
args=`getopt -o t:s:n:i:c -- "$@" 2>&1`

if [ $? != 0 ]
then
 
    appAlert1 $(basename "$0") "`echo $args` $usage"
  
    exit 1
fi

eval set -- $args

for i
do
  case "$i" in
    -t) shift; time_limit=$1;      shift;;
    -s) shift; size_limit=$1;      shift;;
    -n) shift;  file_name=$1;      shift;;
    -i) shift;  interface=$1;      shift;;
    -c)         console=true;      shift;;
  esac
done

shift                   #shift out the '--' that marks end of option list


case ${1:-"start"} in

  stop)
    killall tcpdump;;

  start)
    #create pcap storage directory.
    mkdir -p ${PCAP_DIR}
    full_path=${PCAP_DIR}${file_name}.pcap

    #caputure tcpdump output messages
    output=$(
    
        #begin packet capture
        
        #-n turns off name resolution
        #-s 0 option tells tcpdump to save the entire packet.
        #-w sets output file name
       
        `if [ "$time_limit" -gt 0 ]; \
        then \
             echo timeout -t "$(($time_limit * 60))"; \
        fi` \
            tcpdump ${interface:+-i ${interface}} \
                -n \
                -s 0 \
                -w "${full_path}" \
                2>&1 &
     
       
        appAlert1 $(basename "$0") "tcpdump has started running...\
                   Interface: ${interface}"
        
        
        #loop until a termination condition is met.
        {
            until { ! kill -0 $! ||
                  { [ "$size_limit" -gt 0 ] &&
                    [ `stat -c %s "$full_path"` -gt $((size_limit * 1000000)) ]; }; }
            do
                sleep 1;

            done
        
            kill %1;
        } &>/dev/null     #discard unneccessary stat & kill before 
                          #it reaches $output
        
    )
   
    appAlert1 "Packet Capture Ended" "`echo $output`";;

  *)
    appAlert1 $(basename "$0") "Unrecognized parameter: $1 $usage";;
esac


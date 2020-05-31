#!/bin/sh

#------------ Define & Variables ------------
INPUT_PARAMETER=$(echo $1 | tr "[A-Z]" "[a-z]")
USB_RELAY_ENABLE_FILE=/usr/sbin/usb_relay_enable.sh
USB_RELAY_DISABLE_FILE=/usr/sbin/usb_relay_disable.sh
USB_RELAY_DAEMON_FILE=/usr/sbin/relayd
TEST_RESULT=0

#------------ Function ------------
show_help()
{
cat <<EOF
Usage:
This is USB relay function switch between Host PC and Banff WAN module.
Parameter option: enable, disable
EOF
}

check_arguments()
{
    if [ -z $INPUT_PARAMETER ]; then
        show_help
        exit 1
    fi
}

run()
{
    _lsmod=`lsmod | grep usb_f_acm | grep -v grep | awk '{print $1}'`
    if [[ "" == "$_lsmod" ]]; then
        echo "No usb_f_acm module loaded"
        exit 1
    fi

    if [ ! -r "/dev/ttyGS0" -o ! -r "/dev/ttyGS1" ]; then
        echo "No ACM ports exist"
        exit 1
    fi

    if ! [ -f $USB_RELAY_DAEMON_FILE ]; then
        echo "No" $USB_RELAY_DAEMON_FILE "file exist"
        exit 1
    fi

    case $INPUT_PARAMETER in
        "enable")
            echo "Enable USB relay function"
            if ! [ -f $USB_RELAY_ENABLE_FILE ]; then
                echo "No" $USB_RELAY_ENABLE_FILE "file exist"
                exit 1
            fi
            $USB_RELAY_ENABLE_FILE
            TEST_RESULT=$?
            ;;
        "disable")
            echo "Disable USB relay function"
            if ! [ -f $USB_RELAY_DISABLE_FILE ]; then
                echo "No" $USB_RELAY_DISABLE_FILE "file exist"
                exit 1
            fi
            $USB_RELAY_DISABLE_FILE
            TEST_RESULT=$?
            ;;
        *)
            show_help
            exit 1
            ;;
    esac
}

#------------ Main ------------
check_arguments
run
exit $TEST_RESULT


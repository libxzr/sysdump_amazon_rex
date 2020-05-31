#!/bin/sh

source /etc/upstart/functions
chroot_umount

# There are four cases in USB mount 
# case 1: ASR is up and running, don't tear down but stop ASR as voice files can be deleted when ASR is using it
# case 2: BTconnectionHelper is running. tear down the stack
# case 3: BT stack is in reconnect procedure, dont do anything, we can try reconnecting in the background.
# case 4: BT stack is up, no reconnect procedure, no BTConnectionHelper, no ASR - Ideally tear down the stack, but as of now
# dont do anything, because we dont have an API to check if the BT is in reconnect procedure or not. TODO: fix it if this is reproducible practically

if [ ! -z "$(pgrep btd)" ]; then
    if [ "$(lipc-get-prop com.lab126.winmgr ASRMode)" -eq 1 ] ; then
        f_log I asr_setup "Stop ASR as voice files can be deleted by user"
        stop asr
	mplay /usr/share/wavFiles/usbMount.wav
    elif [ "$(lipc-get-prop com.lab126.btfd isBtchRunning)" -eq 1 ]; then
        f_log I asr_setup "btconnectionhelper is running teardown the stack"
        /usr/bin/lipcd-scripts/lipc-events/stopVoiceView.sh &
    else 
        f_log I asr_setup "btd is up. may be in the process of enabling or reconnect"
	#TODO: check if btd is in reconnect procedure if not tear down the stack
    fi
fi
	




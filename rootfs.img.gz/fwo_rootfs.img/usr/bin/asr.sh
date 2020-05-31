#!/bin/sh
export DISPLAY=:0.0
killall ivona_ttsd
killall xasr
killall asrd
lipc-set-prop com.lab126.winmgr ASRMode 0
if [ $1 -eq 1 ]
then
	/usr/bin/ivona_ttsd &
        /usr/bin/asrd &
fi
			

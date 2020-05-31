#!/bin/sh

source /etc/upstart/functions

if [ "$(f_board)" = "eanab" ]; then
	exit 0
fi

WAVEFORM_DIRS="/mnt/wfm/waveform_to_use"

err() {
	echo "$@" >&2
	logger -t "${0##*/}[$$]" "$@" 2>/dev/null || true
}

FIRMWARE="*.wrf.gz"

if [ ! -e /sys$DEVPATH/loading ]; then
	err "waveform loader missed sysfs directory"
	exit 1
fi

wfm_mount

for DIR in "$WAVEFORM_DIRS"; do
	for FILE in "$DIR"/$FIRMWARE; do
		[ -n "$FILE" ] || [ -e "$FILE" ] || continue
		echo 1 > /sys$DEVPATH/loading
		cat "$FILE" > /sys$DEVPATH/data
		echo 0 > /sys$DEVPATH/loading

		wfm_umount
		exit 0
	done
done

echo -1 > /sys$DEVPATH/loading
wfm_umount
exit 1

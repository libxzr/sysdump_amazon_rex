#! /bin/sh
# early script to handle sys/upstart switch and normal init duties
# init {sysv|upstart} will switch

PATH=/sbin:/bin:/usr/sbin:/usr/bin:/app/bin:/app/tools
export PATH

RW=
mount_ro() { [ -n "$RW" ] && mount -o ro,remount / ; }
mount_rw() { [ -z "$RW" ] && mount -o rw,remount / ; RW=yes ; }

do_sysv() {
    mount_rw
    rm /etc/init
    ln -sf /etc/sysv /etc/init
    sed -i -r -e '/pmon|OTA/s/^#//' /etc/crontab/root
    mount_ro
}

do_upstart() {
    mount_rw
    rm /etc/init
    ln -sf /etc/upstart /etc/init
    sed -i -r -e '/pmon|OTA/s/^/#/' /etc/crontab/root
    mount_ro
}

# things we do if we are *NOT* PID 1 (i.e. run by script/user, not startup)

if [ $$ -ne 1 ]; then
  case "$*" in
    *upstart*) do_upstart ; exit 0 ;;
    *sysv*) do_sysv ; exit 0 ;;
  esac
  exec /sbin/init.exe "$@"
fi

#ILYA tmp code stop before upstart
#calling this script again to get into upstart
#/bin/mount / -o remount,rw
#/bin/mount /proc
#/bin/sh

# otherwise, we're in startup city, so check for the boot args
# that switch sysv/upstart and get us going verbosely.

DID_PROC=
[ ! -d /proc/1 ] && mount /proc && DID_PROC=yes

# word boundaries

CMDLINE=$(cat /proc/cmdline)
CMDLINE=":${CMDLINE// /:}:"

case "$CMDLINE" in
  *:upstart:*) do_upstart ;;
  *:sysv:*) do_sysv ;;
esac

[ -n "$DID_PROC" ] && umount /proc

exec /sbin/init.exe

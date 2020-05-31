#!/bin/sh

source /etc/upstart/functions
chroot_umount
chroot_mount
#send upstart event to detect user store is available
initctl emit user_store_available

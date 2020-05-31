#!/bin/sh

mntroot rw
ln -s /lib/modules/4.1.15-lab126 /lib/modules/`uname -r`
modprobe -r g_mass_storage
sync
fsck -y -f /dev/loop/0
sleep 2
modprobe libcomposite
sleep 2
cd /tmp/root
mkdir cfg
mount none cfg -t configfs
mkdir cfg/usb_gadget/g1
cd cfg/usb_gadget/g1
mkdir configs/c.1
mkdir functions/mass_storage.0
echo /dev/loop/0 > functions/mass_storage.0/lun.0/file
mkdir functions/ffs.adb
mkdir strings/0x409
mkdir configs/c.1/strings/0x409
echo 0x9996 > idProduct
echo 0x1949 > idVendor
echo 1111 > strings/0x409/serialnumber
echo Amazon > strings/0x409/manufacturer
echo "FunctionFS gadget (ums, adb, acm)" > strings/0x409/product
echo "Conf 1" > configs/c.1/strings/0x409/configuration
echo 120 > configs/c.1/MaxPower
#mkdir functions/rndis.0
#ln -s functions/rndis.0 configs/c.1
ln -s functions/mass_storage.0 configs/c.1
ln -s functions/ffs.adb configs/c.1
mkdir -p /dev/usb-ffs
mkdir -p /dev/usb-ffs/adb
mount -t functionfs adb /dev/usb-ffs/adb -o uid=2000,gid=2000
modprobe usb_f_acm
mkdir -p functions/acm.usb0
mkdir -p functions/acm.usb1
ln -s functions/acm.usb0 configs/c.1
ln -s functions/acm.usb1 configs/c.1
adbd &
sleep 4
echo ci_hdrc.0 > UDC
#sleep 2
#ifconfig usb0 192.168.0.20 up
#sleep 2
#udhcpd &
#sleep 1
cd /
mkdir system
cd system
mkdir bin
cd bin
ln -s ../../bin/bash sh
cd /


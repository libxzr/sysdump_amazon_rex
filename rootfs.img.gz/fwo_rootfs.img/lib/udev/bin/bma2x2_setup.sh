#!/bin/sh

# orient_theta controls how many radians away from the device being perfectly flat (as in on a table) you need to be
# for orientation interrupts to trigger. The formula (from the bma222e data sheet) is angle = atan(sqrt(orient_theta)/8)
# The value is allowed to be from 0 to 63.
# Based on WS-1223
echo 14 > /sys$DEVPATH/device/orient_theta

# Change of up/down
# 1 for generates an orientation interrupt
# 0 for Ignored and will not generate an orientation interrupt
echo 1 > /sys$DEVPATH/device/orient_ud_en

# Enable interrupt 10, the orientation interrupt
echo 10 1 > /sys$DEVPATH/device/enable_int

# By default the device holds onto an interrupt reason for 250 ms after it sends one. If a device is rapidly rotated
# this can cause the orientation interrupt for the final orientation to be dropped because of the held interrupt for the
# "sideways" orientation, making the accelerometer appear stuck. Writing 12 to int_mode sets the hold time to 50 ms,
# giving the driver enough time to read the current value, but not so long as to block plausible human motion.
# See section 4.7.1 of the BMA222E datasheet for this timing table.
echo 12 > /sys$DEVPATH/device/int_mode

# Sets the hysteresis of the orientation interrupt
echo 0 > /sys$DEVPATH/device/orient_hyst

# This adds a 100 ms hysteresis period prior to the chip sending the orientation interrupt, and also excludes cases
# where the device is experiencing more than 1.5 g in acceleration due to shaking/impact.
echo 3 > /sys$DEVPATH/device/orient_blocking

# Sets the thresholds for switching between the different orientations. The
# Settings:00b maps to symmetrical
echo 0 > /sys$DEVPATH/device/orient_mode

# The default "normal mode" consumes quite a bit more power than the "low power 1" mode. After screensaver deviced will
# put the device into this op_mode, but we might as well save the power before the first screen saver happens.
echo 1 > /sys$DEVPATH/device/op_mode


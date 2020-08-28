#!/bin/sh
PARAM="-l ./kterm/layouts/keyboard.xml"
export TERM=linux TERMINFO=${EXTENSION}/vte/terminfo
export DISPLAY=:0.0
./kterm/kterm ${PARAM} "$@"

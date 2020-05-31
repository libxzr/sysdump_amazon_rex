#!/bin/bash
/usr/bin/AdmDaemon "$@" 3>&1 1>&2 2>&3 | logger -t ADM -p local2.error

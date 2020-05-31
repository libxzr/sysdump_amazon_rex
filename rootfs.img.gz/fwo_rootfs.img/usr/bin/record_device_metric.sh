#
# record_device_metrics.sh
#
# Copyright (c) 2013-2019 Amazon Technologies, Inc.  All rights reserved.
#
# PROPRIETARY/CONFIDENTIAL
#
# Use is subject to license terms.
#
# This is device side shell interface to Device Metrics Logging API defined in:
# https://wiki.corp.lab126.com/mediawiki-1.10/index.php?title=Platform/Framework/DesignDocs/DeviceMetrics/ClientAPI
# Corresponding native interface definitions/implementations are at: platform/include/metrics.h and platform/lib/metrics/src/metrics.c
# Any changes to native interface definition/implementation should also reflect here.
#
# Example:
# First source this script in your shell. Then you can call record_device_metric function with suitable arguments
#
# . /usr/bin/record_device_metric.sh
# record_device_metric "browser" "com.lab126.browser.loadTime" "loadTime" 24 "key=value" $METRIC_PRIORITY_LOW $METRIC_TYPE_TIMER
#

METRIC_PRIORITY_HIGH="metric_high_priority"
METRIC_PRIORITY_LOW="metric_generic"
METRIC_TYPE_COUNTER="counter"
METRIC_TYPE_TIMER="timer"
METRIC_MAX_STRLEN=120
METRIC_MAX_METADATA_STRLEN=1000

#constants for DEM Metrics
#clickstream metadata, constant keys
PAGE_TYPE=page-type
HIT_TYPE=hitType
TEAM_NAME=team-name
SITE_VARIANT=site_variant
PAGE_ACTION=page-action
MARKETPLACE=marketPlace
COUNTRY_OF_RESIDENCE=cor

#demd lipc source
DEMD_LIPC_NAME=com.lab126.demd

#metric data hash keys and it is tightly coupled with demd for unpacking.
PROGRAM_NAME_KEY=program_name
PROGRAM_SOURCE_KEY=program_source
TIME_STAMP_KEY=time_stamp

# dem metric type
OS_DEM_METRIC=0;
APP_DEM_METRIC=1;

# demd lipc hash array property names
LOG_DEM_OS_METRIC=logDemOsMetric
LOG_DEM_APP_METRIC=logDemAppMetric

#clickstream metadata, constant values
TEAM_NAME_VALUE=EinkFramework
SITE_VARIANT_VALUE=EinkApplication

#clickstream program name
PROGRAM_NAME="EMP.MetricsCollectionAgent"

#clickstream program name for non dem metrics
S3_FORWARDING_PROGRAM_NAME="METRICS_S3_FORWARDING"

#Metrics logging Status
METRICS_RECORD_SUCCESS=0
METRICS_RECORD_FAILURE=1
METRICS_NOT_APPLICABLE=2

#syntax: record_device_metric <programName> <programSource> <metricName>
#                             <metricValue> <metadata> <priority> <type>
#
#       programName   string: Name of the app, service, or component calling
#                             this function. Max length $METRIC_MAX_STRLEN
#
#       programSource string: Name of the particular method, function,
#                             or sub-component of the program calling.
#                             Max length $METRIC_MAX_STRLEN
#
#       metricName    string: Name of the metric to be recorded
#                             Max length $METRIC_MAX_STRLEN
#
#       metricValue   number: Value to record of the specified metric
#
#       metadata      string: Can be empty string "" if there is no metadata.
#                             Max length $METRIC_MAX_METADATA_STRLEN
#                             Arbitrary app-specified metadata corresponding
#                             to the given metric, such as random cookie values
#                             to anonymously match metric logs to device logs
#                             for debugging. This string consists of
#                             comma-delimited "key=value" pairs. Key or value
#                             should not contain delimiters ',' and '='.
#                             Example: "name=ABC,version=1.3,cookie=ujAoexYpLl"
#
#       priority      string: Possible vaules:
#                                 $METRIC_PRIORITY_HIGH 
#                                 $METRIC_PRIORITY_LOW
#                             Priority of metric to be updated. Determines
#                             whether metric is pushed to server at regular
#                             intervals by Device Metrics and Logging Service,
#                             or unsent until pulled by the DET server.
#
#       type          string: Possible values:
#                                 $METRIC_TYPE_COUNTER
#                                 $METRIC_TYPE_TIMER
#                             Type of the metric to be recorded
#
# return: METRICS_RECORD_SUCCESS, METRICS_RECORD_FAILURE, METRICS_NOT_APPLICABLE
#

record_device_metric ()
{
    if [ $# -ne 7 ]; then
        prv_metric_error "Argument mismatch. Syntax: record_device_metric <programName> <programSource> <metricName> <metricValue> <metadata> <priority> <type>"
        return $METRICS_RECORD_FAILURE
    fi

    DEVICEMETRIC_PROGNAME=$1
    DEVICEMETRIC_PROGSRC=$2
    DEVICEMETRIC_NAME=$3
    DEVICEMETRIC_VAL=$4
    DEVICEMETRIC_METADATA=$5
    DEVICEMETRIC_PRIORITY=$6
    DEVICEMETRIC_TYPE=$7

    prv_check_str_arg $DEVICEMETRIC_PROGNAME
    if [ $METRIC_ERROR ]; then
        prv_metric_error "program name - $METRIC_ERROR_STR"
        return $METRICS_RECORD_FAILURE
    fi

    prv_check_str_arg $DEVICEMETRIC_PROGSRC
    if [ $METRIC_ERROR ]; then
        prv_metric_error "program source - $METRIC_ERROR_STR" 
        return $METRICS_RECORD_FAILURE
    fi

    prv_check_str_arg $DEVICEMETRIC_NAME
    if [ $METRIC_ERROR ]; then
        prv_metric_error "metric name - $METRIC_ERROR_STR"
        return $METRICS_RECORD_FAILURE
    fi

    prv_record_device_metric_check_int_arg $DEVICEMETRIC_VAL
    if [ $METRIC_ERROR ]; then
        prv_metric_error "metric val - $METRIC_ERROR_STR"
        return $METRICS_RECORD_FAILURE
    fi

    prv_check_metadata_arg $DEVICEMETRIC_METADATA
    if [ $METRIC_ERROR ]; then
        prv_metric_error "metadata - $METRIC_ERROR_STR"
        return $METRICS_RECORD_FAILURE
    fi

    prv_record_device_metric_check_priority_arg $DEVICEMETRIC_PRIORITY
    if [ $METRIC_ERROR ]; then
        prv_metric_error "priority - $METRIC_ERROR_STR"
        return $METRICS_RECORD_FAILURE
    fi

    prv_record_device_metric_check_type_arg $DEVICEMETRIC_TYPE
    if [ $METRIC_ERROR ]; then
        prv_metric_error "type - $METRIC_ERROR_STR"
        return $METRICS_RECORD_FAILURE
    fi
    
    DEVICEMETRIC_TIME=`date +%s`

    DEVICEMETRIC_LOG_STR=${DEVICEMETRIC_PRIORITY},${DEVICEMETRIC_TIME},${DEVICEMETRIC_TYPE},${DEVICEMETRIC_PROGNAME},${DEVICEMETRIC_PROGSRC},${DEVICEMETRIC_NAME},${DEVICEMETRIC_VAL}

    if ! [[ -z $DEVICEMETRIC_METADATA ]]; then
        DEVICEMETRIC_LOG_STR=${DEVICEMETRIC_LOG_STR},${DEVICEMETRIC_METADATA}
    fi

    logger -p local7.0 $DEVICEMETRIC_LOG_STR
    return $?
}

#syntax: record_clickstream_metric_user_opt <programName> <programSource> <clickstream_metadata> <metadata>
#
#       programName           string: This field carries the name of framework component which is reporting metrics.
#                                     this function. Max length $METRIC_MAX_STRLEN
#
#       programSource         string: This field carries the source name of the metrics inside the framework component.
#                                     Max length $METRIC_MAX_STRLEN
#
#       metadata              string: should be NULL, if there is no metadata.
#                                     Max length $METRIC_MAX_METADATA_STRLEN
#                                     Arbitrary app-specified metadata corresponding
#                                     to the given metric. This string consists of
#                                     comma-delimited key="value" pairs. Key or value
#                                     should not contain delimiters ',' and '='.
#                                     Example: hit_type="DeviceAction",page_action="test"
#
#       clickstream_metadata  string: should be NULL, if there is no cilckstream metadata.
#                                     Max length $METRIC_MAX_METADATA_STRLEN
#                                     This string consists of comma-delimited key="value"
#                                     pairs. Key or value should not contain delimiters ',' and '='.
#                                     Example: hit_type="DeviceAction",page_action="test"
#
# return: METRICS_RECORD_SUCCESS, METRICS_RECORD_FAILURE, METRICS_NOT_APPLICABLE
#
# This API should only be used for APP level logging and the behavior is controlled by privacy/whispersync user toggle. for example DISPLAY_USAGE metric
#
record_clickstream_metric_user_opt ()
{
    if [ $# -ne 4 ]; then
        prv_metric_error "Argument mismatch. Syntax: record_clickstream_metric_user_opt <programName> <programSource>  <clickstream_metadata> <metadata>"
        return $METRICS_RECORD_FAILURE
    fi
    __record_clickstream_metric_utility $1 $2 $3 $4 $APP_DEM_METRIC
}

#syntax: record_clickstream_metric <programName> <programSource> <clickstream_metadata> <metadata>
#
#       programName           string: This field carries the name of framework component which is reporting metrics.
#                                     Max length $METRIC_MAX_STRLEN
#
#       programSource         string: This field carries the source name of the metrics inside the framework component.
#                                     Max length $METRIC_MAX_STRLEN
#
#       metadata              string: should be NULL, if there is no metadata.
#                                     Max length $METRIC_MAX_METADATA_STRLEN
#                                     Arbitrary app-specified metadata corresponding
#                                     to the given metric. This string consists of
#                                     comma-delimited key="value" pairs. Key or value
#                                     should not contain delimiters ',' and '='.
#                                     Example: hit_type="DeviceAction",page_action="test"
#
#       clickstream_metadata  string: should be NULL, if there is no cilckstream metadata.
#                                     Max length $METRIC_MAX_METADATA_STRLEN
#                                     This string consists of comma-delimited key="value"
#                                     pairs. Key or value should not contain delimiters ',' and '='.
#                                     Example: hit_type="DeviceAction",page_action="test"
#
# return: METRICS_RECORD_SUCCESS, METRICS_RECORD_FAILURE, METRICS_NOT_APPLICABLE
#
# This API should only be used for OS level logging. for example POWER_ON metric
#
record_clickstream_metric ()
{
    if [ $# -ne 4 ]; then
        prv_metric_error "Argument mismatch. Syntax: record_clickstream_metric <programName> <programSource>  <clickstream_metadata> <metadata>"
        return $METRICS_RECORD_FAILURE
    fi
    __record_clickstream_metric_utility $1 $2 $3 $4 $OS_DEM_METRIC
}

###################################################################
# private utility function which is used internally in the script.#
# please avoid calling the function directly.                     #
###################################################################
__record_clickstream_metric_utility ()
{
   if [ $# -ne 5 ]; then
        prv_metric_error "Argument mismatch. Syntax: record_engagement_metric <programName> <program_source> <clickstream_metadata> <metadata> <metric_type>"
        return $METRICS_RECORD_FAILURE
    fi

    CLICKSTREAM_METRIC_PROGNAME=$1
    CLICKSTREAM_METRIC_PROGSRC=$2
    CLICKSTREAM_METRIC_CLICKSTREAM_METADATA=$3
    CLICKSTREAM_METRIC_METADATA=$4
    CLICKSTREAM_METRIC_TYPE=$5
    TIMESTAMP=`date +%s`

    prv_check_str_arg $CLICKSTREAM_METRIC_PROGNAME
    if [ $METRIC_ERROR ]; then
        prv_metric_error "program name - $METRIC_ERROR_STR"
        return $METRICS_RECORD_FAILURE
    fi

    prv_check_str_arg $CLICKSTREAM_METRIC_PROGSRC
    if [ $METRIC_ERROR ]; then
        prv_metric_error "program source - $METRIC_ERROR_STR"
        return $METRICS_RECORD_FAILURE
    fi

    prv_check_metadata_arg $CLICKSTREAM_METRIC_CLICKSTREAM_METADATA
    if [ $METRIC_ERROR ]; then
        prv_metric_error "metadata - $METRIC_ERROR_STR"
        return $METRICS_RECORD_FAILURE
    fi

    prv_check_metadata_arg $CLICKSTREAM_METRIC_METADATA
    if [ $METRIC_ERROR ]; then
        prv_metric_error "clickstream_metadata -  $METRIC_ERROR_STR"
        return $METRICS_RECORD_FAILURE
    fi

    params="{$PROGRAM_NAME_KEY=\"$CLICKSTREAM_METRIC_PROGNAME\", $PROGRAM_SOURCE_KEY=\"$CLICKSTREAM_METRIC_PROGSRC\",$TIME_STAMP_KEY=\"$TIMESTAMP\" }"

    if [ "$CLICKSTREAM_METRIC_CLICKSTREAM_METADATA" != "NULL" ]; then
       params="$params {$CLICKSTREAM_METRIC_CLICKSTREAM_METADATA}"
    fi

    if [ "$CLICKSTREAM_METRIC_METADATA" != "NULL" ]; then
       params="$params {$CLICKSTREAM_METRIC_METADATA}"
    fi

    if [ $CLICKSTREAM_METRIC_TYPE -eq $OS_DEM_METRIC ]; then
        echo $params | lipc-hash-prop $DEMD_LIPC_NAME $LOG_DEM_OS_METRIC
    elif [ $CLICKSTREAM_METRIC_TYPE -eq $APP_DEM_METRIC ]; then
        echo $params | lipc-hash-prop $DEMD_LIPC_NAME $LOG_DEM_APP_METRIC
    fi
    return $?
}

# All functions below are private to this script. Do not directly use.
prv_record_device_metric_check_int_arg ()
{
    METRIC_ERROR=
    if [[ -z $1 ]]; then
        METRIC_ERROR_STR="Argument empty"
        METRIC_ERROR=$METRICS_RECORD_FAILURE
        return
    fi
    if [ $1 -eq $1 ] 2>/dev/null; then
        METRIC_ERROR=
    else
        METRIC_ERROR_STR="Argument not number"
        METRIC_ERROR=$METRICS_RECORD_FAILURE
        return 
    fi
}



prv_check_str_arg ()
{
    METRIC_ERROR=
    if [[ -z $1 ]]; then
        METRIC_ERROR_STR="Argument empty"
        METRIC_ERROR=$METRICS_RECORD_FAILURE
        return
    fi

    if [ ${#1} -gt $METRIC_MAX_STRLEN ]; then
        METRIC_ERROR_STR="Argument longer than $METRIC_MAX_STRLEN"
        METRIC_ERROR=$METRICS_RECORD_FAILURE
        return 
    fi

    echo $* | grep -q [^a-zA-Z0-9.:@_/-]
    if [ $? == 0 ]; then
            # success in finding non-whitelisted char
            METRIC_ERROR_STR="Argument can only contain this whitelist of characters a-zA-Z0-9.:@_/-"
            METRIC_ERROR=$METRICS_RECORD_FAILURE
    fi
}

prv_check_metadata_arg ()
{
    METRIC_ERROR=
    if [ ${#1} -gt $METRIC_MAX_METADATA_STRLEN ]; then
        METRIC_ERROR_STR="Argument longer than $METRIC_MAX_METADATA_STRLEN"
        METRIC_ERROR=$METRICS_RECORD_FAILURE
        return 
    fi
}

prv_record_device_metric_check_priority_arg ()
{
    METRIC_ERROR=
    if [[ -z $1 ]]; then
        METRIC_ERROR_STR="Argument empty"
        METRIC_ERROR=$METRICS_RECORD_FAILURE
        return
    fi
    if [ $1 != $METRIC_PRIORITY_HIGH -a $1 != $METRIC_PRIORITY_LOW ]; then
        METRIC_ERROR_STR="Unrecognized priority"
        METRIC_ERROR=$METRICS_RECORD_FAILURE
        return 
    fi
}

prv_record_device_metric_check_type_arg ()
{
    METRIC_ERROR=
    if [[ -z $1 ]]; then
        METRIC_ERROR_STR="Argument empty"
        METRIC_ERROR=$METRICS_RECORD_FAILURE
        return
    fi
    if [ $1 != $METRIC_TYPE_COUNTER -a $1 != $METRIC_TYPE_TIMER ]; then
        METRIC_ERROR_STR="Unrecognized type"
        METRIC_ERROR=$METRICS_RECORD_FAILURE
        return 
    fi
}

prv_metric_error ()
{
    echo "[shmetrics] Error: $1" 1>&2
}

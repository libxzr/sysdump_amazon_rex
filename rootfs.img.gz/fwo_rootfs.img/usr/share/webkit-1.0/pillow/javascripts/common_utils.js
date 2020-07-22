/*
 * common_utils.js
 *
 * Copyright (c) 2017-2020 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

var sIsDisplayModeLarge = nativeBridge.isDisplayModeLarge();

//checks for large mode and constructs DialogStringTable based on the display mode
function constructTableOnDisplayModeChange(defaultTable,LargeTable) {
    if (sIsDisplayModeLarge) {
	return merge(defaultTable,LargeTable);
    } else {
    	return defaultTable;
    }
}

//function to merge large value with default value without duplicates
function merge(a, b) {
    for(var idx in b) {
        a[idx] = b[idx];
    }
    return a;
}

// Change class name of the DOM if in large mode.
function modifyClassNameDOM() {
    if (sIsDisplayModeLarge) {
        var all = document.getElementsByTagName('*');
        for (var i=0, max=all.length; i < max; i++) {
            all[i].className = all[i].className + " large";
        }
    }
}

// Change class name of DOM element in large mode.
function modifyClassNameElement(element) {
    if (sIsDisplayModeLarge) {
        element.className = element.className + " large";
    }
}

/* Adding escapeHTML utility to string prototype.
* escapeHTML will replace the HTML entities
* "&, <, >, ", ', /" with corresponding html escape
* characters
*/
(function () {
    var entityMap = {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': '&quot;',
        "'": '&#39;',
        "/": '&#x2F;'
    };

    function escapeHTML() {
        return this.replace(/[&<>"'\/]/g, function (s) {
            return entityMap[s];
        });
    }

    if (typeof(String.prototype.escapeHTML) !== 'function') {
        String.prototype.escapeHTML = escapeHTML;
    }
})();

// escapeHTML utility wrapper with type check.
function escapeHTML(text) {
    if (typeof text == "string") {
        return text.escapeHTML();
    }
    return text;
};

/*
 * Helper function will record wifi error dialogs metric in FM
 * @param errorReason: Reason for the error
 * @param errorDialogSelection: Selection in the error dialog
 */
function recordWifiErrorDialogMetric(errorReason, errorDialogSelection) {
    var fmEmitter = new FMEmitter();
    fmEmitter.addString(KEY_WIFI_ERROR_DIALOG_ERROR_REASON, errorReason);
    if (errorDialogSelection != null) {
        fmEmitter.addString(KEY_WIFI_ERROR_DIALOG_SELECTED_OPTION, errorDialogSelection);
    }
    fmEmitter.emitFastMetrics(SCHEMA_WIFI_ERROR_DIALOGS, SCHEMA_VERSION_WIFI_ERROR_DIALOGS);
};

/**
 * Object to add values to FM payload and emit a metric in FM
 */
var FMEmitter = function() {

    const INT_MAX = 2147483647;
    const INT_MIN = -2147483648;

    var fmPayload = {};

    /**
    * Const defining Payload Keys, used to process data by Native FM SDK
    */
    const fmPayloadKey = {
        INT : "INT_",
        STRING : "STRING_",
        LONG : "LONG_"
    };

    /**
    * Method to add int to Fast Metrics Payload
    * @param key: key of metric emitted
    * @param value: value of corresponding key
    */
    this.addInt = function(key, value) {
        if (typeof value === 'number' && typeof key === 'string') {
            if ((value >= 0 && value <= INT_MAX) || (value < 0 && value >= INT_MIN)) {
                var payload_key = fmPayloadKey.INT + key;
                fmPayload[payload_key] = value.toString();
            } else {
                Pillow.logError("RangeError: Int value out of range");
            }
        } else {
            Pillow.logError("TypeError: key is not a string or value is not a number");
        }
    }

    /**
    * Method to add long to Fast Metrics Payload
    * @param key: key of metric emitted
    * @param value: value of corresponding key
    */
    this.addLong = function(key, value) {
        if (typeof value === 'number' && typeof key === 'string') {
            var payload_key = fmPayloadKey.LONG + key;
            fmPayload[payload_key] = value.toString();
        } else {
            Pillow.logError("TypeError: key is not a string or value is not a number");
        }
    }

    /**
    * Method to add string to Fast Metrics Payload
    * @param key: key of metric emitted
    * @param value: value of corresponding key
    */
    this.addString = function(key, value) {
        if (typeof value === 'string' && typeof key === 'string') {
            var payload_key = fmPayloadKey.STRING + key;
            fmPayload[payload_key] = value;
        } else {
            Pillow.logError("TypeError: key or value is not a string");
        }
    }

    /**
    * Method to add bool to Fast Metrics Payload
    * @param key: key of metric emitted
    * @param value: value of corresponding key
    */
    this.addBool = function(key, value) {
        if (typeof value === 'boolean' && typeof key === 'string') {
            var payload_key = fmPayloadKey.STRING + key;
            fmPayload[payload_key] = Boolean(value).toString();
        } else {
            Pillow.logError("TypeError: key is not a string or value is not a boolean");
        }
    }

    /**
     * This method is used to emit a FM metric via nativeBridge
     * @param schema name: Name of the schema to be emitted to
     * @param schema version: version of the schema to be emitted to
     */
    this.emitFastMetrics = function(schemaName, schemaVersion) {
        nativeBridge.emitFastMetrics(schemaName, schemaVersion, fmPayload);
    }
};
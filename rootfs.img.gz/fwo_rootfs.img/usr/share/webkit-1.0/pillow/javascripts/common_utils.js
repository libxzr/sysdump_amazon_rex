/*
 * common_utils.js
 *
 * Copyright (c) 2017-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
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
 * This function will log error dialogs metrics considering WhisperSync
 * If device is registered and Whispersync is enabled then metrics are emitted
 * non-anonymously else it goes anonymously
 */
function logErrorDialogMetric(errorReason, errorDialogSelection) {

    var clickstreamMetadata = {};
    clickstreamMetadata[EM_KEY_TEAM_NAME] = EM_VALUE_TEAM_NAME;
    clickstreamMetadata[EM_KEY_SITE_VARIANT] = EM_VALUE_SITE_VARIANT;
    clickstreamMetadata[EM_KEY_PAGE_ACTION] = EM_VALUE_PAGE_ACTION;

    var discreteMetadata = {};
    discreteMetadata[EM_KEY_ERROR_REASON] = errorReason;
    if (errorDialogSelection != null) {
        discreteMetadata[EM_KEY_SELECTED_VALUE] = errorDialogSelection;
    }

    nativeBridge.recordClickstreamMetricUserOpt(EM_VALUE_PROGRAM_NAME, EM_VALUE_SOURCE_NAME,
        clickstreamMetadata, discreteMetadata);

};

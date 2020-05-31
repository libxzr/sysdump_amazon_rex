/*
 * dpm.js
 *
 * Copyright 2012-2013 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

var DevicePolicyManager = function() {

    const DPM_ID = 'com.lab126.dpmManager';
    const STORE_PROPERTY = 'isKindleStoreDisabled';
    const DISCOVERY_PROPERTY = 'isDiscoveryDisabled';

    var storeDisabled = null;
    var discoveryDisabled = null;

    var refreshStoreDisabled = function() {
        var old = storeDisabled;
        storeDisabled = nativeBridge.getIntLipcProperty(DPM_ID, STORE_PROPERTY) > 0;
        if (old !== storeDisabled) {
            this.onStoreDisabled(storeDisabled);
        }
    };
    
    var refreshDiscoveryDisabled = function() {
        var old = discoveryDisabled;
        discoveryDisabled = nativeBridge.getIntLipcProperty(DPM_ID, DISCOVERY_PROPERTY) > 0;
        if (old !== discoveryDisabled) {
            this.onDiscoveryDisabled(discoveryDisabled);
        }
    };

    /**
     * @method refresh
     *
     * Refresh all device policy states.
     */
    this.refresh = function() {
        refreshStoreDisabled.call(this);
        refreshDiscoveryDisabled.call(this);
    };

    /**
     * @method handleLipcEvent
     * @param values  (Array) The LIPC event values
     *
     * Use this function as the handler for the devicePolicyValueChanged event.
     */
    this.handleLipcEvent = function(values) {
        if (values) { 
            if (values[0] === STORE_PROPERTY) {
                refreshStoreDisabled.call(this);
            } else if (values[0] === DISCOVERY_PROPERTY) {
                refreshDiscoveryDisabled.call(this);
            }
        }
    };

    /**
     * @method onStoreDisabled
     * @param state  (Boolean) True if the store is disabled
     *
     * Called when the disabled state of the store changes.
     * Does nothing by default, but can be overridden.
     */
    this.onStoreDisabled = function(ignored) {
        // empty
    };
    
    /**
     * @method onDiscoveryDisabled
     * @param state  (Boolean) True if discovery is disabled
     *
     * Called when the disabled state of the discovery changes.
     * Does nothing by default, but can be overridden.
     */
    this.onDiscoveryDisabled = function(ignored) {
        // empty
    };
};


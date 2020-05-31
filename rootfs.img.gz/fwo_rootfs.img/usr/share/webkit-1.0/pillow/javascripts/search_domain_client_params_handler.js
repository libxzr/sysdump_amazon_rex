/*
 * search_domain_client_params.js
 *
 * Copyright 2013 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */
 
/**
 * Constructs a clientParams handler for the SearchDomain dialog.
 * @class Handles all the incoming clientParams information.  Each method
 *        handles a different incoming parameter.
 * @extends Pillow.ClientParamsHandler
 * @param {Pillow.Case} pillowCase Pass in the Pillow.Case we should dispatch to
 */
Pillow.SearchDomain.ClientParamsHandler = function(pillowCase) {
    var parent = Pillow.extend(this, new Pillow.ClientParamsHandler());

    var handleConfig = function(clientParams) {
        if (clientParams.domains && clientParams.activeId) {
            pillowCase.setDomains(clientParams.domains, clientParams.activeId);
            delete clientParams.domains;
            delete clientParams.activeId;
        }
        if (clientParams.position) {
            pillowCase.setPosition(clientParams.position);
            delete clientParams.position;
        }
    };

    /**
     * Called to set the domains to display in the selection list.
     */
    this.domains = handleConfig;

    /**
     * Called to set the position. The input should be the absolute screen
     * coordinates of the top-center pixel of the caron.
     */
    this.position = handleConfig;

    /**
     * Allows the search bar to show and hide the dialog.
     */
    this.show = function(clientParams) {
        clientParams.show ? pillowCase.show() : pillowCase.hide();
    };

    /**
     * Allows the search bar to close the dialog.
     */
    this.close = function() {
        pillowCase.close();
    };

    /**
     * Called when our window is forcibly destroyed
     */
    this.windowDestroyed = function(clientParams) {
        if (clientParams.windowDestroyed) {
            pillowCase.windowDestroyed();
        }
    };

    /**
     * Called when the user taps away
     */
    this.windowDeleteEvent = function(clientParams) {
        if (clientParams.windowDeleteEvent) {
            pillowCase.windowDeleteEvent();
        }
    };

    /**
     * Called when user swipes
     */
    this.gesture = function(clientParams) {
        if (clientParams.gesture === 'swipeUp') {
            pillowCase.swipeUp();
        } else if (clientParams.gesture === 'swipeDown') {
            pillowCase.swipeDown();
        }
    };

    Pillow.logWrapObject('Pillow.SearchDomain.ClientParamsHandler', this);
};

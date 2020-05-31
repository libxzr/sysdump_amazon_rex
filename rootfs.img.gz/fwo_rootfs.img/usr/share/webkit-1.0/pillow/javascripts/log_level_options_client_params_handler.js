/*
 * log_level_options_client_params_handler.js
 *
 * Copyright 2011-2012 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * Constructs a clientParams handler for the LogLevelOptions dialog.
 * @class Handles all the incoming clientParams information.  Each method
 *        handles a different incoming parameter.
 * @extends Pillow.ClientParamsHandler
 * @param {Pillow.Case} pillowCase Pass in the Pillow.Case we should dispatch to
 */
Pillow.LogLevelOptions.ClientParamsHandler = function(pillowCase) {
    var parent = Pillow.extend(this, new Pillow.ClientParamsHandler());

    this.show = function(clientParams) {
        pillowCase.show();
    };
    
    this.hide = function(clientParams) {
        pillowCase.hide();
    };
    
    this.close = function(clientParams) {
        pillowCase.close();
    };
    
    this.setActiveItem = function(clientParams) {
    	pillowCase.setActiveOption(clientParams.setActiveItem);
    };
    
    this.gesture = function(clientParams) {
    	if (clientParams.gesture === 'swipeUp') {
    	    pillowCase.swipeUp();
    	} else if (clientParams.gesture === 'swipeDown') {
    	    pillowCase.swipeDown();
    	}
    };
    
    Pillow.logWrapObject('Pillow.LogLevelOptions.ClientParamsHandler', this);
};

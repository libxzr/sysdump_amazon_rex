/*
 * configure_log_level_client_params_handler.js
 *
 * Copyright 2011-2012 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */


/**
 * Constructs a clientParams handler for the ConfigureLogLevel dialog.
 * @class Handles all the incoming clientParams information.  Each method
 *        handles a different incoming parameter.
 * @extends Pillow.ClientParamsHandler
 * @param {Pillow.Case} pillowCase Pass in the Pillow.Case we should dispatch to
 */
Pillow.ConfigureLogLevel.ClientParamsHandler = function(pillowCase) {
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
    
    this.process = function(clientParams) {
    	pillowCase.setDaemons(clientParams.process);
    };
    
    this.activeLogType = function(clientParams) {
    	pillowCase.setActiveLogType(clientParams.activeLogType);
    }
    
    
    this.gesture = function(clientParams) {
    	if (clientParams.gesture === 'swipeUp') {
    	    pillowCase.swipeUp();
    	} else if (clientParams.gesture === 'swipeDown') {
    	    pillowCase.swipeDown();
    	}
    };
    
    Pillow.logWrapObject('Pillow.ConfigureLogLevel.ClientParamsHandler', this);
};

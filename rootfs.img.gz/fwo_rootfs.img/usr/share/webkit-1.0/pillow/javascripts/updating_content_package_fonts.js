/*
 * updating_content_package_fonts.js
 *
 * Copyright 2013 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * @class This Pillow.Case displays a screen showing the fonts being updated.
 * @extends Pillow.Case
 */
Pillow.UpdatingContentPackageFonts = function() {
    var parent = Pillow.extend(this, new Pillow.Case('UpdatingContentPackageFonts'));

    /**
     * Sets up the dialog with Pillow and prepares the interface.
     */
    this.onLoad = function() {
    	nativeBridge.showMe();
    	parent(this).onLoad();
    	
        document.getElementById('titleDiv').innerHTML = UpdatingFontsConfig.title;
        document.getElementById('messageDiv').innerHTML = UpdatingFontsConfig.message;
    };                                                               
        
    this.show = function() {   
    	nativeBridge.showMe();
    };                                                     
                                                                                    
    this.close = function() {                                                       
        nativeBridge.dismissMe();                                                   
    };                                                                              
                                                                                    
    Pillow.logWrapObject('Pillow.UpdatingContentPackageFonts', this);                         
};                                                         
                                                           
/**
 * Constructs a clientParams handler for the UpdatingContentPackageFonts dialog.
 * @class Handles all the incoming clientParams information.  Each method
 *        handles a different incoming parameter.
 * @extends Pillow.ClientParamsHandler
 * @param {Pillow.Case} pillowCase Pass in the Pillow.Case we should dispatch to
 */
Pillow.UpdatingContentPackageFonts.ClientParamsHandler = function(pillowCase) {
    var parent = Pillow.extend(this, new Pillow.ClientParamsHandler());

    this.show = function(clientParams) {
        pillowCase.show();
    };
    
    this.close = function(clientParams) {
        pillowCase.close();
    };
    
    Pillow.logWrapObject('Pillow.UpdatingContentPackageFonts.ClientParamsHandler', this);
};

window.UpdatingContentPackageFonts = new Pillow.UpdatingContentPackageFonts();    
UpdatingContentPackageFonts.register();                    


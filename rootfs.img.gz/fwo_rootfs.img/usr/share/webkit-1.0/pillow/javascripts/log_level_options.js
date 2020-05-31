/*
 * log_level_options.js
 *
 * Copyright 2011-2012 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */


/**
 * @class This Pillow.Case displays a search domain selection dialog.
 * @extends Pillow.Case
 */
Pillow.LogLevelOptions = function() {
    var parent = Pillow.extend(this, new Pillow.Case('LogLevelOptions'));
    var windowTitle = null;
    var listWidget = null;
    const titleText = "DAEMON: ";
    var options = [{"logType": "p_all",}, 
                   {"logType": "p_perf"}, 
                   {"logType": "p_info"}, 
                   {"logType": "p_warn"}, 
                   {"logType": "p_error"}, 
                   {"logType": "p_crit"},
                   {"logType": "p_debug0"}, 
                   {"logType": "p_debug1"}, 
                   {"logType": "p_debug2"}, 
                   {"logType": "p_debug3"}, 
                   {"logType": "p_debug4"}, 
                   {"logType": "p_debug5"}, 
                   {"logType": "p_debug6"}, 
                   {"logType": "p_debug7"}, 
                   {"logType": "p_debug8"}, 
                   {"logType": "p_none"}];

    /**
     * Sets up the dialog with Pillow and prepares the interface.
     * @private
     */
    this.onLoad = function() {
        windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, WINMGR.ROLE.ALERT);
        windowTitle.withChanges(function() {
        	this.addParam(WINMGR.KEY.WIN_IS_MODAL, WINMGR.MODALITY.DISMISSIBLE_MODAL);});
        
        listWidget = new ListWidget('logLevels', {
            fields: ['logType',  'selected-icon'],
            handler: sendSelection,
            initialMaxVisibleItems: 6,
            xor: true,
            showScrollBar: true
        });
        this.swipeDown = Pillow.bind(listWidget, 'scrollUp');
        this.swipeUp = Pillow.bind(listWidget, 'scrollDown');
        
        var cancelButton = document.getElementById('advancedCancelButton');
        new XorButton(cancelButton,this.close,cancelButton,'dialog-close','dialog-close xor');
        
        nativeBridge.showMe();
        parent(this).onLoad();  
    };                                                                          
  
    /**
     * update the selected log level to the parent window
     */
    var sendSelection = function(item) {
        var message = JSON.stringify({activeLogType: item.logType});
        nativeBridge.messagePillowCase("configure_log_level", message);
    	nativeBridge.dismissMe();
    };
    
    /**
     * Populate the list with available log levels
     */
    this.setOptions = function(options) {
        listWidget.setItems(options);
        var dialogElem = document.getElementById('dialog');
        nativeBridge.setWindowSize(dialogElem.offsetWidth, dialogElem.offsetHeight);
    };
    
    /**
     * Identify the current selected log option and update the CSS 
     */
    this.setActiveOption = function(setActiveItem) {
    	// Update the window Title with the selected daemon Name
    	var title = document.getElementById('advancedTitleText');
    	title.innerHTML = titleText + setActiveItem.Daemon;
    	
    	// Identify the current selected log option and update the CSS 
        activeId = setActiveItem.logInfo;
        for (var i in options) {
            var option = options[i];
            option['selected-icon'] = option.logType === activeId ? 'selected' : null;
        }
        
        //Update the list with new set of values
        this.setOptions(options);
    }
    
    this.setlogOptions = function(options) {
        listWidget.setItems(options);
    };
    
    this.show = function() {   
        windowTitle.removeParam(WINMGR.KEY.HIDE_DIALOG);   
    };                                                     
                                                           
    this.hide = function() {                               
        windowTitle.addParam(WINMGR.KEY.HIDE_DIALOG, WINMGR.DIALOG_HIDE.BACKGROUND);
    };                                                                              
                                                                                    
    this.close = function() {  
        nativeBridge.dismissMe();                                                   
    };                                                                              
                                                                                    
    Pillow.logWrapObject('Pillow.LogLevelOptions', this);                         
};                                                         
                                                           
var logLevelOptions = new Pillow.LogLevelOptions();    
logLevelOptions.register();                    
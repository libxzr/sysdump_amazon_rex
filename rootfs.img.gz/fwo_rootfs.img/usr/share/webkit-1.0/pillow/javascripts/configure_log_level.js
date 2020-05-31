/*
 * configure_log_level.js
 *
 * Copyright 2011-2012 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * @class This Pillow.Case displays available daemons and their log levels.
 * @extends Pillow.Case
 */
Pillow.ConfigureLogLevel = function() {
    var parent = Pillow.extend(this, new Pillow.Case('ConfigureLogLevel'));
    var windowTitle = null;
    var listWidget = null;
    var selectedItem = null;
    var daemonList = null;

    /**
     * Sets up the dialog with Pillow and prepares the interface.
     */
    this.onLoad = function() {
        windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, WINMGR.ROLE.ALERT);
        windowTitle.withChanges(function() {
        	this.addParam(WINMGR.KEY.WIN_IS_MODAL, WINMGR.MODALITY.DISMISSIBLE_MODAL);});
        
        listWidget = new ListWidget('daemons', {
            fields: ['daemon', 'logInfo'],
            handler: sendSelection,
            initialMaxVisibleItems: 8,
            xor: true,
            showScrollBar: true
        });
        this.swipeDown = Pillow.bind(listWidget, 'scrollUp');
        this.swipeUp = Pillow.bind(listWidget, 'scrollDown');
        
        var cancelButton = document.getElementById('advancedCancelButton');
        new XorButton(cancelButton,this.close,cancelButton,'dialog-close','dialog-close xor');
        var listCmdButtons = [
                              {
                                  text: "Reset",
                                  id: 'reset'
                              },
                              {
                                  text: "Cancel",
                                  id: "cancel"
                              },
                          ];
        new ButtonBar('ConfigLogCmdBar',listCmdButtons, handleListCommandBarSelect);
        
        nativeBridge.showMe();
        parent(this).onLoad();   
    };                                                                          

    
    /**
     * handle button taps on the CMD bar at the bottom of the list view
     */
    var handleListCommandBarSelect = function(button){
        if (button.id === "reset"){
            resetAllDaemons();
        } else if (button.id === "cancel"){
            nativeBridge.dismissMe();
        }
    };
    
    /**
     * Reset all the Daemons log level to info
     * @return
     */
    var resetAllDaemons = function() {
        // reset the log level
    	nativeBridge.dbgCmd(";rll","");
    	
    	//wait for 3 seconds for the script to execute 
    	waitCall(3000);
    	updateAllLogInfo(); 
    }
    
    /**
     * wait for specified milli seconds
     * @param time in milli seconds
     * @return
     */
    var waitCall = function(time) {
    	var date = new Date();
    	var endTime =  date.getTime() + time; 
    	while(date.getTime() <= endTime){
    		date = new Date();
    	}
    }
    
    /**
     * Recompute all log informations
     * @return
     */
    var updateAllLogInfo = function() {
        for (var i in daemonList) {
            var item = daemonList[i];
            //get the log level
            var logInfo = nativeBridge.getStringLipcProperty("com.lab126."+item.daemon,"logLevel");
            item['logInfo'] = (((((logInfo.split("="))[1]).split("("))[0]).trim());
    	}
        
        listWidget.setItems(daemonList);
    };
    
    
    /**
     * Update the user selected log level
     */
    this.setActiveLogType = function(logType) {
        // LIPC event to set the selected log level
        nativeBridge.setLipcProperty("com.lab126."+selectedItem,"logLevel", logType);
        
        for (var i in daemonList) {
            var item = daemonList[i];
            if(item.daemon === selectedItem) {
                var logInfo = nativeBridge.getStringLipcProperty("com.lab126."+selectedItem,"logLevel");
                // Get the log level for the selected daemon to update the UI
                item['logInfo'] =  (((((logInfo.split("="))[1]).split("("))[0]).trim());
            }
        }
	    this.setDaemons(daemonList);
    };
    
    /**
     * update Daemons and their log levels
     */
    this.setDaemons = function(Daemons) {
    	daemonList = Daemons;
        listWidget.setItems(daemonList);
        var dialogElem = document.getElementById('dialog');
        nativeBridge.setWindowSize(dialogElem.offsetWidth, dialogElem.offsetHeight);
    };
        
    /**
     * Allow the currently selected Daemon to configure their log levels
     * @param item
     * @return
     */
    var sendSelection = function(item) {
    	var message = JSON.stringify({show: "true", setActiveItem: {"Daemon": item.daemon, "logInfo": item.logInfo}});
    	selectedItem = item.daemon;
    	nativeBridge.showDialog("log_level_options",message);
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
                                                                                    
    Pillow.logWrapObject('Pillow.ConfigureLogLevel', this);                         
};                                                         
                                                           
var configureLogLevel = new Pillow.ConfigureLogLevel();    
configureLogLevel.register();                    
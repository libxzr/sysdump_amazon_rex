/*
 * wifi_wizard_dialog.js
 *
 * Copyright 2011-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

var WifiWizardDialog = function(){
    var that = this;

    // dismiss types
    const DISMISS_REPLY_STRINGS = ["canceled", "captive", "connected"];
    const DISMISS_CANCELED = 0;
    const DISMISS_CAPTIVE = 1;
    const DISMISS_CONNECTED = 2;

    // minimum number of milliseconds between hiding and showing the window
    const MINIMUM_HIDE_SHOW_DELAY = 100;

    // button bar objects for list view
    var m_listCmdBar;

    // button bar for error/confirmation dialogs
    var m_errorButtonBar;

    // true once running
    var m_wifiWizardDialogRunning = true;

    // An array of lipc reply sources to send reply to on close
    var m_replySrc = [];

    // true is the underlying window is visible
    var m_windowIsVisible = false;

    // modality of the wifi wizard dialog window
    var m_modality = WINMGR.MODALITY.DISMISSIBLE_MODAL;

    // current orientation of the window
    var m_orientation = null;
    
    // list object for list view
    var m_availableNetworksList;

    /**
     * set the orientation and update the class on the body
     */
    var setOrientation = function(newOrientation) {
        Pillow.logInfo('pillow-wifi-set-orientation', {prev: m_orientation, next: newOrientation});
        if (newOrientation !== m_orientation) {
            m_orientation = newOrientation;
            if (m_orientation === "L" || m_orientation === "R") {
                cls = 'dialog landscape';
            } else {
                cls = 'dialog portrait';
            }
            document.body.setAttribute('class', cls);
        }
    };

    /**
     * current entry object
     */
    function CurrentEntry(){

        var that = this;
        this.essid            = "";
        this.password         = "";
        this.storeCredentials = true;
        this.identity         = "";
        this.isManual         = false;
        this.isAdvanced       = false;
        this.isWps            = false;
        this.ipAddress        = "";
        this.subnetMask       = "";
        this.router           = "";
        this.dns              = "";
        this.connectionType   = null;
        this.securityType     = null;
        this.wpaType          = null;
        this.eapMethod        = null;
        this.phase2Auth       = null;
        this.caCertificate    = "";

        /**
         * Refine the current entry with outside information.
         *
         * In general, the purpose of this is to make the entry state match the
         * reality of the network being described.
         *
         * Currently, we only update the security type. We don't have this
         * information up-front in all cases, because if we only know the SSID,
         * we don't find out the security type until a profile for that network
         * has been created.
         *
         * @params    A wifid profile object from
         */
        this.refine = function(params){
            if (params && params.essid == that.essid) {
                if (params.smethod) {
                    that.securityType.setSelectedValue(params.smethod);
                }
            }
        };
        
        this.reset = function(){
            that.essid          = "";
            that.password       = "";
            that.identity       = "";
            that.isManual       = false;
            that.isAdvanced     = false;
            that.isWps          = false;
            if (that.connectionType){
                that.connectionType.setSelectedIdx(0);
            }
            if (that.securityType){
                that.securityType.setSelectedIdx(0);
            }
            if (that.wpaType){
                that.wpaType.setSelectedIdx(0);
            }
            if (that.eapMethod){
                that.eapMethod.setSelectedIdx(0);
            }
            if (that.phase2Auth){
                that.phase2Auth.setSelectedIdx(0);
            }
            that.caCertificate  = "";
            that.ipAddress      = "";
            that.subnetMask     = "";
            that.router         = "";
            that.dns            = "";
        };

        this.isEnterprise = function(){
            if (!that.securityType || !that.wpaType){
                return false;
            }
            var securityType = that.securityType.getSelectedValue();
            return (securityType === "wpa/wpa2" || securityType === "wpa2") && that.wpaType.getSelectedValue() === "enterprise";
        };
    };
    this.currentEntry = new CurrentEntry();

    // true is the main list area is temporarily disabled
    this.mainAreaDisabled = false;

    // string id of the current popup window shown
    // null when in list view
    this.visiblePopup = null;

    // current focused field
    this.focusedField = null;

    // true if submit is disabled because
    // minimum field entry is not met
    this.submitDisabled = true;

    // hieght of the list view
    this.listViewHeight = 0;

    // advanced entry dialog 
    var m_advancedEntry = new AdvancedEntry();
    
    // simple entry
    var m_simpleEntry = new SimpleEntry();

    /**
     * wrapper class on activity indicator spinner interaction
     */
    var m_activityIndicator = function(){
        // inner
        var spinning = {};
        return {
            /**
             * start activity spinner with appropriate text
             */
            start : function(clientIdSuffix, text){
                if (spinning[clientIdSuffix]){
                    return;
                }
                spinning[clientIdSuffix] = true;
                nativeBridge.setLipcProperty("com.lab126.chromebar", "activityIndicator", 
                        '{"activityIndicator":{"action":"start","clientId":"com.lab126.pillow.' + clientIdSuffix + '","timeout":60000,"text":"' + text + '"}}');
            },
            /**
             * Stop the spinner. Stop fills in a action "completed" string
             */
            stop : function(clientIdSuffix, text){
                if (!spinning[clientIdSuffix]){
                    return;
                }
                spinning[clientIdSuffix] = false;
                nativeBridge.setLipcProperty("com.lab126.chromebar", "activityIndicator", 
                    '{"activityIndicator":{"action":"stop","clientId":"com.lab126.pillow.' + clientIdSuffix + '","text":"' + text + '"}}');
            },
            /**
             * Kills the spinner. This differs from stop in that no action "completed" string
             * is presented to the user. Mostly used to clean up on dialog exit.
             */
            kill : function(){
                for (var clientIdSuffix in spinning){
                    if (!spinning[clientIdSuffix]){
                        continue;
                    }
                    nativeBridge.setLipcProperty("com.lab126.chromebar", "activityIndicator", 
                            '{"activityIndicator":{"action":"stop","clientId":"com.lab126.pillow.' + clientIdSuffix + '"}}');
                }
            }
        };
    }();

    /**
     * controls when the wifi popup initiates a auto scan request
     */
    var m_autoScanner = function(){
        var visible = false;
        var enabled = true;
        var autoScanTimer = null;
        const WIFI_WIZARD_AUTO_SCAN_TIMEOUT = 60000;

        /**
         * useful function to fake a scan with controlled results for
         * testing. Leave commented out on checkins
         */
        /*
        //var temp;
        var fakeScan = function(){
            setTimeout(function(){
                var SampleWifiAvailNetworkksList = [
    {"essid":"homegsfg fgsdfgsdfgs dfgdfgsdfgdsf gsdfgsdfgdfgsd","secured":true,"known":false,"signal":5,"signal_max":5,"supported":true,
            "wps":"yes","signalCssClass":"connection3Bar","secureCssClass":"networkSecured"},
    {"essid":"  LEADING SPACES","secured":false,"known":false,"signal":4,"signal_max":5,"supported":true,"wps":"no",
             "signalCssClass":"connection2Bar","secureCssClass":""},
    {"essid":"Guest","secured":false,"known":false,"signal":4,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection2Bar",
             "secureCssClass":""},
    {"essid":"ilaw","secured":true,"known":false,"signal":4,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection2Bar",
             "secureCssClass":"networkSecured"},
    {"essid":"Mobile","secured":true,"known":false,"signal":4,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection2Bar",
              "secureCssClass":"networkSecured"},
    {"essid":"NG-Jalaja","secured":true,"known":false,"signal":4,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection2Bar",
              "secureCssClass":"networkSecured"},
    {"essid":"PORTAL6448","secured":true,"known":false,"signal":4,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection2Bar",
              "secureCssClass":"networkSecured"},
    {"essid":"PORTALHOLE","secured":false,"known":false,"signal":4,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection2Bar",
              "secureCssClass":""},
    {"essid":"wpa2","secured":true,"known":false,"signal":4,"signal_max":5,"supported":false,"wps":"no","signalCssClass":"connection2Bar",
              "secureCssClass":"networkSecured"},
    {"essid":"anh-wep","secured":true,"known":false,"signal":1,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection1Bar",
              "secureCssClass":"networkSecured"},
    {"essid":"attwifi","secured":false,"known":false,"signal":1,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection1Bar",
              "secureCssClass":""},
    {"essid":"belkin-n1","secured":true,"known":false,"signal":1,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection1Bar",
              "secureCssClass":"networkSecured"},
    {"essid":"Belkin_N+_5FCE70","secured":false,"known":false,"signal":2,"signal_max":5,"supported":true,"wps":"yes",
              "signalCssClass":"connection1Bar","secureCssClass":""},
    {"essid":"BLG","secured":true,"known":false,"signal":2,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection1Bar",
              "secureCssClass":"networkSecured"},
    {"essid":"va link !@#$%^& *()_+ ?ABABhellopppppppppppppppppppp","secured":true,"known":false,"signal":1,"signal_max":5,"supported":true,
              "wps":"no", "signalCssClass":"connection1Bar","secureCssClass":"networkSecured"},
    {"essid":"kimpton","secured":false,"known":false,"signal":1,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection1Bar",
              "secureCssClass":""},
    {"essid":"linksys","secured":false,"known":false,"signal":1,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection1Bar",
              "secureCssClass":""},
    {"essid":"Netgear_hwlab","secured":false,"known":false,"signal":1,"signal_max":5,"supported":true,"wps":"yes",
              "signalCssClass":"connection1Bar","secureCssClass":""},
    {"essid":"pegaguest","secured":false,"known":false,"signal":1,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection1Bar",
              "secureCssClass":""},
    {"essid":"pegawifie!","secured":true,"known":false,"signal":1,"signal_max":5,"supported":false,"wps":"no","signalCssClass":"connection1Bar",
              "secureCssClass":"networkSecured"},
    {"essid":"Superman","secured":true,"known":false,"signal":1,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection1Bar",
              "secureCssClass":"networkSecured"},
    {"essid":"va link !@#$%^& *()_+ ?><. hello","secured":true,"known":false,"signal":1,"signal_max":5,"supported":true,"wps":"yes",
              "signalCssClass":"connection1Bar", "secureCssClass":"networkSecured"},
    {"essid":"Vanitha-AP","secured":true,"known":false,"signal":1,"signal_max":5,"supported":true,"wps":"no","signalCssClass":"connection1Bar",
              "secureCssClass":"networkSecured"}];

                //if (temp >= SampleWifiAvailNetworkksList.length){
                //    temp = 0;
                //}

                //var sendMe = SampleWifiAvailNetworkksList.slice(0, SampleWifiAvailNetworkksList.length - temp);

                //temp++;

                //WifiWizardDialog.wifiEventCallback ("scanList", sendMe);
                wifiEventCallback ("scanList", SampleWifiAvailNetworkksList);
            }, 2000);
        }*/

        /**
         * rescans
         */
        var rescan = function(){

            // stopTimer() should get called via disable
            // main area
            that.disableMainArea();
            
            m_activityIndicator.start("wifiScanning", WifiWizardDialogStringTable.scanningForNetwork);

            // use to fake a scan a swap out with 
            //Wifi.scanList(); below
            //fakeScan();

            Wifi.scanList();
        };
        /**
         * stops/cancels the timer
         */
        var stopTimer = function(){
            if (autoScanTimer){
                Pillow.logDbgMid("stopping autoScanner timer...");
                clearTimeout(autoScanTimer);
                autoScanTimer = null;
            }
        };
        /**
         * starts the timer
         */
        var startTimer = function(){
            // stop any existing timer first
            stopTimer();

            Pillow.logDbgMid("starting autoScanner timer...");
            autoScanTimer = setTimeout(rescan, WIFI_WIZARD_AUTO_SCAN_TIMEOUT);
        };

        return {
            /**
             * forces a rescan now
             */
            forceRescan : function(){
                Pillow.logDbgHigh("++++autoScanner::forceRescan");
                rescan();
            },
            /**
             * called when the visibility of the wifi popup
             * changes. 
             * @param {Boolean} isVisible true if window is visible
             */
            setVisibleState : function(isVisible){
                Pillow.logDbgMid("++++autoScanner::setVisibleState ", isVisible);
                // go visible -> scan
                // go invisible -> stop timer
                if (visible !== isVisible){
                    visible = isVisible;
                    if (enabled && visible){
                        rescan();
                    } else {
                        stopTimer();
                    }
                }
            },
            /**
             * called when the UI area is enabled/disabled
             * @param {Boolean} isEnabled true if enabled
             */
            setEnabledState : function(isEnabled){
                Pillow.logDbgMid("++++autoScanner::setEnabledState ", isEnabled);
                // go enabled -> start timer
                // go diabled -> stop timer
                if (enabled !== isEnabled){
                    enabled = isEnabled;
                    if (enabled && visible){
                        startTimer();
                    } else {
                        stopTimer();
                    }
                }
            }
        }
    }();

    /**********************
    * Error Popup
    ***********************/

    /**
    * show the error popup
    * @param error
    */
    var showErrorWindow = function(error){

        Pillow.logDbgHigh("+++++WifiWizardDialog.showErrorWindow");

        //hide the entire dialog window
        //to prep for the change
        that.hideWindow();

        //clear any popup already there
        if (that.visiblePopup){
            document.getElementById(that.visiblePopup).style.display = 'none';
        }

        that.visiblePopup = "errorPopup";

        //show the error popup div
        var errorPopup = document.getElementById("errorPopup");
        errorPopup.style.display = '';

        //hide the main area
        document.getElementById("wifiWizardMainDiv").style.display = 'none';
        
        //determine error to show
        WifiWizardErrors.routeError(error);

        that.disableMainArea();

        //password dialog does not require KB
        that.windowTitle.removeParam(WINMGR.KEY.REQUIRES_KB);

        //set the window size.
        Pillow.setWindowSizeByElement(errorPopup);

        //show the window again
        that.showWindow();
    };

    /**
    * hides the error window if it is visible
    */
    var hideErrorWindow = function(){

        Pillow.logDbgHigh("+++++WifiWizardDialog.hideErroWindow");

        // there is only one visible popup at a time
        if (that.visiblePopup === "errorPopup"){
            //hide the entire dialog window
            //to prep for the change
            that.hideWindow();

            m_errorButtonBar.notVisible();

            //hide the error popup div
            document.getElementById("errorPopup").style.display = 'none';

            that.visiblePopup = null;

            //if there is a hidden row swap it back to normal
            m_availableNetworksList.moveTopNetworkBackDown();

            //list view does not require KB
            that.windowTitle.removeParam(WINMGR.KEY.REQUIRES_KB);

            //show the main div
            document.getElementById("wifiWizardMainDiv").style.display = '';

            //set the window size back to original size
            Pillow.logDbgLow("win size on hide password");
            Pillow.setWindowSizeByElement(document.getElementById('wifiWizardMainDiv'));

            //show the window again
            that.showWindow();
        } else {
            document.getElementById("errorPopup").style.display = 'none';
        }

    };

    /************************************
     * 
     ***********************************/

    /**
     * dismiss the wifi wizard dialog
     * @params dismiss_type
     *       type of dismiss
     */
     var dismissWifiWizardDialog = function (dismiss_type){

         Pillow.logDbgHigh("dismissWifiWizardDialog " + dismiss_type);

         if (!m_wifiWizardDialogRunning){
             Pillow.logDbgHigh("dialog not shown no need to dismiss alert");
             return;
         }

         if ((dismiss_type === DISMISS_CONNECTED || dismiss_type === DISMISS_CAPTIVE) && that.visiblePopup === "errorPopup"){
             Pillow.logDbgHigh("not dismissing error dialog on connection success");
             return;
         }
         
         m_activityIndicator.kill();

         //undefined is canceled
         if (!dismiss_type){
             dismiss_type = DISMISS_CANCELED;
         }

         // call conutils back with dismiss type
         if(m_replySrc){
             for (index in m_replySrc) {
             	nativeBridge.setLipcProperty(m_replySrc[index], "wifiPopupDone", DISMISS_REPLY_STRINGS[dismiss_type]);
             }
	     m_replySrc = [];
         } else {
             Pillow.logDbgLow("no reply source");
         }

         // done
         m_wifiWizardDialogRunning = false;
         
         nativeBridge.dismissMe();
     };

    /**
     * called to bring up either the simple or
     * advanced entry popup
     * 
     * @param jumpToPassword
     *          if true then jump to the view with the password
     *          field
     */
    var showEntryPopup = function(jumpToPassword){
        //determine which entry we are one, simple or advanced
        if (that.currentEntry.isAdvanced){
            m_advancedEntry.show(jumpToPassword);
        } else {
            m_simpleEntry.show();
        }
    };

    /**
    * hide the entry popup (simple or advanced)
    */
    var hideEntryPopup = function(enableMainArea){

        if (that.visiblePopup === "netNameAndPasswordPopup"){
            m_simpleEntry.hide(enableMainArea);
        } else if (that.visiblePopup === "advancedPopup"){
            m_advancedEntry.hide(enableMainArea);
        }
    };

    /**
     * sets the title up with number of 
     * networks correctly set
     * @param newScanList
     *      current scan list in list view
     */
    var setListViewTitle = function(newScanList){
        var numNetworks;
        if (newScanList){
            numNetworks = newScanList.length;
        } else {
            numNetworks = 0;
        }
        
        document.getElementById("title").textContent = 
            WifiWizardDialogStringTable.title.replace("{numNetworks}", numNetworks);
    };

    /**
     * new scan list has come in from WiFi
     */
    var scanListUpdated = function(newScanList){

        setListViewTitle(newScanList);
         
        //re-enable the main area as long as we are do not
        //have a popup like an error popup visible
        if (!that.visiblePopup){
            m_availableNetworksList.applyListContent(newScanList);
            Pillow.logDbgHigh("enabling main area on scan list updated");
            that.enableMainArea();
        } else {
            Pillow.logDbgHigh("that.visiblePopup set to true, leaving main area disabled");
        }
    };

     /**
      * profile has been created
      */
    var profileCreated = function(){
         if (!m_windowIsVisible){
             Pillow.logDbgMid("Profile Created. Switch to list view while we connect");

             //show window if its waiting
             // TODO we get here because we delay showing the list view after submit until the 
             // profile is created because profile create is rather a quick action. If it fails
             // we do not want to switch to the list view and then to the error. Generally,
             // this is fine, but if wifi is down we have a 3 second timeout before we time out 
             // the action. In this case we are out of the window for 3 seconds. I think it would
             // be better to spin a progress in the submit button on the submit dialog for the 3 seconds.
             // I need to follow up with UI team on this interaction.
             that.showWindow();
         }
     };

     /**
      * user canceled the password entry
      */
     var networkEntryCancelButtonSelect = function(){

         Pillow.logDbgHigh("WifiWizardDialog.passwordCancelButtonSelect");

         // hide the first row and reshow the hidden row
         m_availableNetworksList.moveTopNetworkBackDown();

         hideEntryPopup(true);

         //do a rescan on cancel
         m_autoScanner.forceRescan();

     };

     /**
      * user selected submit on the password entry dialog
      */
     var networkEntrySubmitButtonSelect = function(useWps){

         Pillow.logDbgHigh("WifiWizardDialog.passwordSubmitButtonSelect");

         if (that.submitDisabled && !useWps){
             Pillow.logDbgHigh("submit button disabled, ignore submit");
             return;
         }

         //blur the focus to force the last field to
         //set to currentEntry
         if (that.focusedField){
             that.focusedField.blur();
         }

         // if this was a manual entry, push it to the first row
         // so the user sees it as the connecting network
         if ((that.currentEntry.isManual) || (that.currentEntry.isAdvanced)){
             //fill in first row and show
             m_availableNetworksList.moveNetworkToTop(that.currentEntry.essid, 
                     that.currentEntry.password?'networkSecured':null);
         }

         //disable main area until connect is done
         that.disableMainArea();

         // close the entry popup
         // this will return it to list view
         hideEntryPopup(false);

         //set a timer as a max time to waif for a profile to be created
         Wifi.createAndConnectToProfile(that.currentEntry, useWps);

     };

    /**
    * handle an error from wifi. 
    */
    var handleError = function(error){

        Pillow.logInfo("pillow-wifi-error-received", {error: error});

        //show error
        showErrorWindow(error);
    };

    /**
    * propagate gesture to correct view 
    */
    var handleGesture = function(gesture){
        Pillow.logDbgHigh("+++++gesture event :: ", gesture);

        if (that.visiblePopup === null){
            Pillow.logDbgLow("no popup visible, assume list view");
            // handle swipe left and right as list scroll
            // on main view
            if (gesture === "swipeDown"){
                if (!that.mainAreaDisabled){
                    m_availableNetworksList.previous();
                }
            } else if (gesture === "swipeUp"){
                if (!that.mainAreaDisabled){
                    m_availableNetworksList.next();
                }
            }
        } else if (that.visiblePopup === 'advancedPopup'){
            Pillow.logDbgLow("swipe while advancedPopup visible");
            // handle gesture in advanced view as a move to
            // next/prev advanced view
            if (gesture === "swipeDown"){
                m_advancedEntry.advancedPreviousView();
            } else if (gesture === "swipeUp"){
                m_advancedEntry.advancedNextView();
            }
        }
    };

    /**
    * open up manual simple entry popup
    */
    var manualButtonSelect = function(){

        Pillow.logDbgHigh("WifiWizardDialog.manualButtonSelect");

        //eat taps if main area is disabled
        if (that.mainAreaDisabled){
            Pillow.logDbgMid("main area is disabled, do nothing");
            return;
        }

        //clear the current entry
        that.currentEntry.reset();

        //set to manual entry and launch simple entry
        that.currentEntry.isManual = true;
        m_simpleEntry.show();

    };

    /**
    * close wifi popup
    */
    this.doneButtonSelect = function(){

        Pillow.logDbgHigh("doneButtonSelect");

        if (Wifi.currentConnectedNetwork){
            if (Wifi.currentIsCaptive){
                dismissWifiWizardDialog(DISMISS_CAPTIVE);
            }else{
                dismissWifiWizardDialog(DISMISS_CONNECTED);
            }
        }
        else{
            dismissWifiWizardDialog(DISMISS_CANCELED);
        }
    };

    /**
    * force a rescan
    */
    var rescanButtonSelect = function(){
        m_autoScanner.forceRescan();
    };
        
    /**
    * check to see if submit button on current entry form
    * should be enabled or disabled
    */
    var checkSubmitButton = function(){
        Pillow.logDbgMid("+++++checkSubmitButton");
        if (that.visiblePopup === "advancedPopup"){
            m_advancedEntry.checkSubmitDisabled();
        } else if (that.visiblePopup === "netNameAndPasswordPopup"){
            m_simpleEntry.checkSubmitDisabled();
        }
    };


    /**************************************************
    * Callbacks and handlers
    ***************************************************/
    
    /**
     * callback when user selects a button from an error dialog.
     * @param button : button selected containing what action to take
     */
     var handleErrorBarSelect = function(button){

         Wifi.cleanupProfiles();
         logErrorDialogMetric(WifiWizardErrors.currentDialog.error, button.id);

         switch(button.action){
             case WifiErrorActions.gotoList:
                 //return to list view

                 Pillow.logDbgHigh("gotoList action select from error dialog");

                 hideErrorWindow();

                 //main area will re-enable on scan list complete
                 m_autoScanner.forceRescan();

                 break;
             case WifiErrorActions.gotoPassword:

                 //open up netname/password "non manual" entry with current
                 //essid
                 Pillow.logDbgHigh("gotoPassword action select from error dialog");

                 that.currentEntry.isManual = false;

                 showEntryPopup(true);

                 break;

             case WifiErrorActions.gotoManual:

                 //open up netname/password "manual" entry
                 Pillow.logDbgHigh("gotoManual action select from error dialog");

                 that.currentEntry.isManual = true;

                 if (that.currentEntry.isEnterprise()){
                     // It's impossible to connect to an enterprise network using
                     // the non-advanced manual mode because there's no entry for
                     // the identity.
                     that.currentEntry.isAdvanced = true;
                 }

                 showEntryPopup(false);
                 break;
             case WifiErrorActions.deleteProfile:
                 Pillow.logDbgHigh("deleting profile...");

                 hideErrorWindow();

                 //remove profile
                 Wifi.deleteProfile(that.currentEntry.essid);
                 break;

             case WifiErrorActions.tryAgain:
                 nativeBridge.logDbg("tryAgain action select from error dialog");
                 hideErrorWindow();
                 Wifi.createAndConnectToProfile(that.currentEntry, false);
                 break;
         }
     };

     /**
     * called back to configure error popup for error that came in
     */
     var errorApplyDialog = function(dialogDef, error){

         Pillow.logDbgMid("+++++WifiWizardDialog.errorApplyDialog ", error);

         var isEnterprise = that.currentEntry && that.currentEntry.isEnterprise();
         var errorTitleId = isEnterprise ? (dialogDef.enterpriseTitle || dialogDef.title) : dialogDef.title;
         var errorTextId = isEnterprise ? (dialogDef.enterpriseError || dialogDef.error) : dialogDef.error;

         //set error title
         document.getElementById('errorTitleText').textContent = WifiWizardDialogStringTable[errorTitleId];

         var errorText;
         var formattedEssid = "<pre class=\"device-name-inline\" dir=\"auto\">" + escapeHTML(that.currentEntry.essid) + "</pre>";
         if (errorTextId === "defaultError" || !WifiWizardDialogStringTable[errorTextId]) {

             // this error does not have a specified error dialog, use default
             Pillow.logDbgLow("using defaultError dialog ", errorTextId);

             //put in essis and error as received
             errorText = WifiWizardDialogStringTable["defaultError"].replace("{essid}", formattedEssid);
             errorText = errorText.replace("{error}", error);
         } else {

             //put in essid
             errorText = WifiWizardDialogStringTable[errorTextId].replace("{essid}", formattedEssid);
         }

         //set error text
         document.getElementById('errorText').innerHTML = errorText;

         //get button layout
         var buttonLayout = dialogDef.buttonLayout ? WifiWizardDialogStringTable[dialogDef.buttonLayout] : BUTTON_LAYOUT_NORMAL;

         var buttons;
         if (that.currentEntry.securityType && that.currentEntry.securityType.getSelectedValue() == "open" && that.currentEntry.essid) {
             var buttons = dialogDef.buttons;
         } else {
             //"try again" is only a valid button for unsecured networks, so filter it out
             var buttons = dialogDef.buttons.filter(function(b) { return b.id != "tryAgain"; });
         }

         // localize 
         for (button in buttons){
             buttons[button].text = WifiWizardDialogStringTable[buttons[button].id];
         }

         m_errorButtonBar.resetButtons(buttons, buttonLayout);
     };

    /**
     * Called back when an event has occured in the WiFi layer. This 
     * method is registered with WiFi at init time
     */
     var wifiEventCallback = function(eventType, params){
         switch (eventType){
             case "scanList":
                 m_activityIndicator.stop("wifiScanning", WifiWizardDialogStringTable.scanComplete);
                 scanListUpdated(params);
                 break;
             case "profileCreated":
                 profileCreated();
                 break;
             case "error":
                 m_activityIndicator.stop("wifiConnecting", WifiWizardDialogStringTable.connectionFailed);
                 handleError(params);
                 break;
             case "connecting":
                 m_activityIndicator.start("wifiConnecting", WifiWizardDialogStringTable.connecting);
                 break;
             case "connected":
                 // close the dialog on connection
                 if (Wifi.currentIsCaptive){
                     dismissWifiWizardDialog(DISMISS_CAPTIVE);
                 } else {
                     dismissWifiWizardDialog(DISMISS_CONNECTED);
                 }
                 m_activityIndicator.stop("wifiConnecting", WifiWizardDialogStringTable.connected);
                 break;
             case "profileInfo":
                 that.currentEntry.refine(params);
                 break;
         }
     };

    /**
     * clientParamsCallback is a single callback used for just about all communications
     * up to the JS layer from the C Layer.
     */
    var clientParamsCallback = function (clientParamsString){
        Pillow.logDbgHigh("clientParams received by wifi dialog JS");
        Pillow.logDbgMid(clientParamsString);

        // parse clientParams
        var clientParams = JSON.parse(clientParamsString);

        if(clientParams.windowDeleteEvent && WifiWizardErrors.currentDialog !== undefined) {
            logErrorDialogMetric(WifiWizardErrors.currentDialog.error, "tapAway");
        }

        //check for State check call
        if (clientParams.getState){
            var logState = {
                    mainAreaDisabled : that.mainAreaDisabled,
                    visiblePopup: that.visiblePopup,
                    m_windowIsVisible : m_windowIsVisible,
                    m_wifiWizardDialogRunning : m_wifiWizardDialogRunning,
                    m_replySrc : m_replySrc.toString()
            }
            Pillow.logInfo("wifi-getstate", logState);

            Pillow.logInfo("wifi-pending", {count: Wifi.pendingProfiles.getSize()});
            Wifi.pendingProfiles.forEach(
                function(essid){
                    Pillow.logInfo("wifi-pending", {essid: essid});
                });
            return;
        }
        
        if (clientParams.testErrorDialog){
            // force a test error to show for QA purposes
            showErrorWindow(clientParams.testErrorDialog);
            return;
        }
        
        if (clientParams.listErrorDialogs){
            // list out the error keys
            var allKeys;
            for (var key in WifiWizardErrorIds){
                if (key.length){
                    allKeys += key + ", ";
                }
            }
            Pillow.logInfo("** List of WiFi Error Dialog Keys -- " + allKeys);
            return;
        }

        if (clientParams.show){
            Pillow.logDbgMid("got a show request");
            if (!m_wifiWizardDialogRunning){
                // show request came in when we were in dismiss process
                m_wifiWizardDialogRunning = true;
            }
            
            that.showWindow(true);
            // TODO consider using hide flag to hide/show window rather than 
            // map/unmap, we would nee to map window here
            //nativeBridge.showMe();
        }

        m_modality = clientParams.winmgrModal ? WINMGR.MODALITY.MODAL : WINMGR.MODALITY.DISMISSIBLE_MODAL;

        if (clientParams.gesture){
            handleGesture(clientParams.gesture);
        }

        // check to see if this is just a setup
        if (clientParams.setup){
            return;
        }

        if (clientParams.replySrc !== undefined){
            Pillow.logDbgMid("wifi wizard reply src = ", clientParams.replySrc);
            if(m_replySrc.indexOf(clientParams.replySrc) == -1) {
	    	//Do not add duplicate reply sources
		m_replySrc.push(clientParams.replySrc);
	    } else {
	    	Pillow.logInfo("Skipping to add duplicate replySrc into the list :: reply source = ", clientParams.replySrc);
	    }	
        } else {
            Pillow.logDbgLow("no reply src in this call");
        }

        if (clientParams.dismiss || clientParams.windowDeleteEvent){
            dismissWifiWizardDialog (DISMISS_CANCELED);
        }
        
        if (clientParams.visObscure){
            Pillow.logDbgMid("visibility state received on wifi popup client params :: ", clientParams.visObscure);

            // "full" means fully obscured
            if (clientParams.visObscure === "full"){
                // not visible
                m_autoScanner.setVisibleState(false);
            } else {
                // visible 
                m_autoScanner.setVisibleState(true);
            }
        }
    };
    
    /**
     * Callback from List object.
     */
    var listCallback = function(action, listItem){
        //clear the current entry
        that.currentEntry.reset();

        if (action == "delete"){
            //get essid
            that.currentEntry.essid = listItem.essid;
            Pillow.logDbgHigh("essid ", that.currentEntry.essid);

            showErrorWindow("profileDeleteConfirmation");
        } else if (action = "connect"){
            that.currentEntry.essid = listItem.essid;
            if (listItem.secured && that.currentEntry.securityType){
                // When connecting to an unknown, secured network from the scan
                // list, set the security type to our best guess in case we end
                // up in advanced mode.
                if (listItem.enterprise) {
                    that.currentEntry.securityType.setSelectedValue("wpa/wpa2");
                    that.currentEntry.wpaType.setSelectedValue("enterprise");
                } else {
                    that.currentEntry.securityType.setSelectedValue("wep");
                }
            }
            if (listItem.wps){
                that.currentEntry.isWps = true;
            }
            Pillow.logDbgHigh("essid ", that.currentEntry.essid);

            if (listItem.supported){
                if (listItem.known){
                    // connect to known networks, no password required
                    Pillow.logDbgHigh("connecting to known network " + that.currentEntry.essid);
                    Wifi.connectToProfile(that.currentEntry.essid);
                    that.disableMainArea();
                } else if (listItem.secured){
                    // simple entry, not manual results in just password entry
                    Pillow.logDbgHigh("creating profile for secured network " + that.currentEntry.essid);
                    m_simpleEntry.show();
                } else {
                    //open networks we go directly to create profile and conenct

                    //open network
                    Pillow.logDbgHigh("creating profile for open network " + that.currentEntry.essid);
                    that.currentEntry.securityType.setSelectedIdx(0);
                    Wifi.createAndConnectToProfile(that.currentEntry);
                    that.disableMainArea();
                }
            } else {
                // When attempting to create a profile for an unsupported network, wifid immediately
                // responds with an error. (The details of the profile we attempt to create do not
                // matter.) Causing this error is the only way to find out the particular reason why
                // a network is unsupported, which is necessary in order to show the correct error
                // message.
                // See PH-9892 and PH-9896.
                Pillow.logDbgHigh("creating profile for unsupported network " + that.currentEntry.essid);
                if (listItem.secured){
                    // Wifid doesn't send back the correct error message if we don't
                    // provide a password when creating a profile for a secured but
                    // unsupported network.
                    that.currentEntry.password = "foobarbazquux";
                }
                Wifi.createAndConnectToProfile(that.currentEntry);
                that.disableMainArea();
            }
        }
    };

    /**
    * callback function for all LIPC events subscribed to
    */
    var eventsCallback = function(jsonString){

        Pillow.logDbgHigh("+++++WifiWizardDialog.eventsCallback : ", jsonString);

        if (!jsonString){
            return;
        }

        var eventIn = JSON.parse(jsonString);

        if (!eventIn){
            return;
        }

        for (srcKey in m_subscribedEvents.sources){
            var src = m_subscribedEvents.sources[srcKey];
            if (src.name === eventIn.eventSrc)
            {
                for (eventKey in src.events){
                    var event = src.events[eventKey];
                    if (event.name === eventIn.eventName){
                        event.callback(eventIn.eventValues); //eventIn.eventValues
                        break;
                    }
                }
            }
        }
    };

    /**
     * handle button taps on the CMD bar at the bottom of the list view
     */
    var handleListCommandBarSelect = function(button){
        Pillow.logDbgHigh("+++++handleListCommandBarSelect " + button.id);

        if (button.id === "manual"){
            manualButtonSelect();
        }else if (button.id === "rescan"){
            rescanButtonSelect();
        }
    };

    /**
     * handle button taps on the Simple and Advanced Entry button bars
     */
    this.handleButtonBarSelect = function(button){
        Pillow.logDbgHigh("+++++handleButtonBarSelect " + button.id);

        if (button.id === "connect"){
            networkEntrySubmitButtonSelect(false);
        }else if (button.id === "cancel"){
            networkEntryCancelButtonSelect();
        }else if (button.id === "advanced"){
            m_advancedEntry.show(false);
        }else if (button.id === "wpsConnect"){
            networkEntrySubmitButtonSelect(true);
        }
    };

    /**************************************
     * Init/Setup
     **************************************/
    // LIPC events subscribed to and corresponding callbacks
    var m_subscribedEvents = {
                sources: [
                    {
                        name: "com.lab126.wifid",
                        events: [{
                                name:"profileUpdateFailed",
                                callback: Wifi.eventProfileUpdateFailed
                            },
                            {
                                name:"profileUpdateOk",
                                callback: Wifi.eventProfileUpdateOk
                            },
                            {
                                name:"scanning",
                                callback: Wifi.eventScanning
                            },

                            {
                                name:"scanComplete",
                                callback: Wifi.eventScanComplete
                            },
                            {
                                name:"captivePortalDetected",
                                callback: Wifi.eventCaptivePortalDetected
                            }
                        ]
                    },
                    {
                        name: "com.lab126.cmd",
                        events: [
                            {
                                name:"interfaceChange",
                                callback: Wifi.eventCmdActiveInterfaceChange
                            },
                            {
                                name:"connectionAvailable",
                                callback: Wifi.eventCmdConnectionAvailable
                            },
                            {
                                name:"connectionNotAvailable",
                                callback: Wifi.eventCmdConnectionNotAvailable
                            }
                        ]
                    },
                    {
                        name: "com.lab126.appmgrd",
                        events: [
                            {
                                name:"appActivating",
                                callback: function(values){
                                    if (values && (values[0] === 0)){
                                        Pillow.logDbgHigh("===== app switch");
                                        
                                        // set to no flash on hide as flashing is part of the app switch
                                        // already
                                        that.windowTitle.addParam(
                                                WINMGR.KEY.FLASH_ON_HIDE,
                                                WINMGR.FLASH_ON_HIDE.SUPPRESS);
                                        
                                        // once we get the current app id from conutils 
                                        // we can adjust this. For now assume app switch
                                        // means dismiss
                                        dismissWifiWizardDialog(DISMISS_CANCELED);
                                    }
                                }
                            },
                        ]
                    },
                    {
                        name: "com.lab126.winmgr",
                        events: [
                            {
                                name: "orientationChange",
                                callback: function(values){
                                    if (m_wifiWizardDialogRunning && values && values[0]) {
                                        setOrientation(values[0]);
                                    }
                                }
                            }
                        ]
                    }
                ]
            };

    /**
    * iterate through and subscribe to all events defined above
    */
    var subscribeToEvents = function(){

        //register events callback
        nativeBridge.registerEventsWatchCallback(eventsCallback);

        //subscribe to events
        for (srcKey in m_subscribedEvents.sources){
            var src = m_subscribedEvents.sources[srcKey];
            for (eventKey in src.events){
                var event = src.events[eventKey];
                nativeBridge.subscribeToEvent(src.name, event.name);
            }
        }
    };
    
    /**
     * localize static labels, titles, etc.
     */
     var localizeContent = function() {
         //document.getElementById("title").textContent = 
         //    WifiWizardDialogStringTable.title.replace("{numNetworks}", that.numNetworks);

         document.getElementById("advancedNetNameLabel").textContent = WifiWizardDialogStringTable.networkNameLabel;
         document.getElementById("advancedConnectionType").textContent = WifiWizardDialogStringTable.connectionTypeLabel;
         document.getElementById("advancedIpAddressLabel").textContent = WifiWizardDialogStringTable.ipAddressLabel;
         document.getElementById("advancedSubnetMaskLabel").textContent = WifiWizardDialogStringTable.subnetMaskLabel;
         document.getElementById("advancedRouterLabel").textContent = WifiWizardDialogStringTable.routerLabel;
         document.getElementById("advancedDnsLabel").textContent = WifiWizardDialogStringTable.dnsLabel;
         document.getElementById("advancedSecurityType").textContent = WifiWizardDialogStringTable.securityTypeLabel;
         document.getElementById("advancedWpaType").textContent = WifiWizardDialogStringTable.wpaTypeLabel;
         document.getElementById("advancedEapMethod").textContent = WifiWizardDialogStringTable.eapMethodLabel;
         document.getElementById("advancedPhase2Auth").textContent = WifiWizardDialogStringTable.phase2AuthLabel;
         document.getElementById("advancedCaCertificateLabel").textContent = WifiWizardDialogStringTable.caCertLabel;
         document.getElementById("advancedIdentityLabel").textContent = WifiWizardDialogStringTable.identityLabel;
         document.getElementById("advancedPasswordLabel").textContent = WifiWizardDialogStringTable.passwordLabel;
         document.getElementById("advancedDescriptionText").textContent = WifiWizardDialogStringTable.advancedDialogDescription;
         document.getElementById("advancedConnectButtonText").textContent = WifiWizardDialogStringTable.connect;

         document.getElementById("advancedTitleText").textContent = WifiWizardDialogStringTable.advancedOptionsTitle;

         document.getElementById("netNameLabel").textContent = WifiWizardDialogStringTable.networkNameLabel;
         document.getElementById("identityLabel").textContent = WifiWizardDialogStringTable.identityLabel;
         document.getElementById("passwordLabel").textContent = WifiWizardDialogStringTable.passwordLabel;
         document.getElementById("userGuidePart1").textContent = WifiWizardDialogStringTable.userGuidePart1;
        document.getElementById("userGuidePart2").textContent = WifiWizardDialogStringTable.userGuidePart2;

         var lastPreference = nativeBridge.getDynamicConfigValue(DYNCONFIG_STORE_PASSWORD_PREF) === "0";
         var isDemoMode = nativeBridge.checkFileFlag(DEMO_MODE_FILE_FLAG);
         if(lastPreference) {
            that.currentEntry['storeCredentials'] = false;
            document.getElementById('storeCredentials').setAttribute('class', 'checkbox');
         }
         var activeProfileRole = HouseholdLipc.getActiveProfileRole();
         if(activeProfileRole !== HOUSEHOLD_ADULT_ROLE || isDemoMode) {
            document.getElementById('storeCredentialsCheckbox').style.display='none';
            that.currentEntry['storeCredentials'] = false;
         }

         document.getElementById("storeCredentialsLabel").textContent = WifiWizardDialogStringTable.storeCredentials;
	
	 document.getElementById("learnMoreLabel").textContent = WifiWizardDialogStringTable.learnMoreLabel;
 
         document.getElementById("passwordHideLabel").textContent = WifiWizardDialogStringTable.passwordHide;
         document.getElementById("passwordHideAdvancedLabel").textContent = WifiWizardDialogStringTable.passwordHide;
         
     };

    /**
     * Initializae the UI on the error popup
     */
    var initErrorPopup = function(){
        m_errorButtonBar = new ButtonBar('wifiWizardErrorButtonBar',
                [], handleErrorBarSelect);
        document.getElementById("errorPopup").style.display = 'none';

        WifiWizardErrors.init(errorApplyDialog);
    };

    /**
     * Initializae the UI on the List view
     */
    var initListView = function(){
        var doneButton = document.getElementById('scanListDoneButton');
        new XorButton(
                doneButton,
                Pillow.bind(that, that.doneButtonSelect),
                doneButton,
                'dialog-close',
                'dialog-close xor');

        var listCmdButtons = [
                              {
                                  text: WifiWizardDialogStringTable.join,
                                  id: 'manual'
                              },
                              {
                                  text: WifiWizardDialogStringTable.rescan,
                                  id: "rescan"
                              },
                          ];
        m_listCmdBar = new ButtonBar('wifiWizardListViewCmdBar',
                                  listCmdButtons, handleListCommandBarSelect);

        var listHeight = document.getElementById('wifiWizardMainDiv').offsetHeight -
                document.getElementById('wifiWizardMainDivCmdheader').offsetHeight -
                                 document.getElementById('userGuide').offsetHeight -
                  document.getElementById('wifiWizardListViewCmdBar').offsetHeight;

        m_availableNetworksList = new WifiList(listHeight, listCallback);

        var isAsrModeOn = WifiLipc.isAsrMode();
        if(isAsrModeOn == 0) {
            // Non-ASR case
            var cachedNetworks = Wifi.getCachedNetworks();
            setListViewTitle(cachedNetworks);
            if (cachedNetworks){
                m_availableNetworksList.applyListContent(cachedNetworks);
            } else {
                m_availableNetworksList.applyListContent(new Array());
            }
        } else {
            // ASR case. Skip displaying the cached networks and set a header
            document.getElementById("title").textContent =
                WifiWizardDialogStringTable.title.replace("{numNetworks}", WifiWizardDialogStringTable.scanning);
        }
    };

    /************************************************************
    Main entry point
    *************************************************************/
    this.init = function(){
        Pillow.logDbgHigh("wifi dialog init function called");
        Pillow.setOption(OPTION_SEND_DELETE_EVENTS, true);	

        setOrientation(WifiLipc.getOrientation());

        //set the window size
        Pillow.logDbgLow("win size on init");
        that.listViewHeight = document.getElementById('wifiWizardMainDiv').offsetHeight;
        Pillow.setWindowSizeByElement(document.getElementById('wifiWizardMainDiv'));

        //register to be called back when clientParams are updated
        nativeBridge.registerClientParamsCallback(clientParamsCallback);

        subscribeToEvents ();

        that.windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, WINMGR.ROLE.DIALOG);
        that.windowTitle.withChanges(function() {
                this.addParam(WINMGR.KEY.WIN_IS_MODAL, m_modality);
                this.addParam(WINMGR.KEY.SHOWEVENT, "wifiWizardShow");
                this.addParam(WINMGR.KEY.AFTER_HIDE_DAMAGE_TIMEOUT, 100);
            });

        localizeContent();

        Wifi.init(wifiEventCallback);

        // Init UI 
        initErrorPopup();

        initListView();
	
        var LearnMoreLabel = document.getElementById("learnMoreLabel");
	new XorButton(LearnMoreLabel,null,LearnMoreLabel,'learnMoreLabel','learnMoreLabel xor');

        m_simpleEntry.initUI();

        m_advancedEntry.initUI();

        // get visibility events so we can suspend/resume scanning coming in and out
        // of screen saver
        nativeBridge.getVisibilityEvents();

        //API to check for larger display mode and parsing the DOM to pick large property values
        modifyClassNameDOM();
    };

    /****************************************
     * Public Methods
     ****************************************/
    /**
     * onfocus callback for all fields
     * open KB on field focus
     */
    this.fieldFocused = function(event){
        Pillow.logDbgHigh("+++++WifiWizardDialog.fieldFocused ", event.target.id);

        if (!m_wifiWizardDialogRunning){
            Pillow.logDbgHigh("focus field request, but dialog is in shut down process");
            return;
        }
        
        // show keyboard
        switch(event.target.id){
            case "networkNameEntryInput":
            case "advancedNetworkNameEntryInput":
            case "passwordEntryInput":
            case "advancedPasswordEntryInput":
            case "identityEntryInput":
            case "advancedIdentityEntryInput":
            case "advancedCaCertificateEntryInput":
                nativeBridge.showKb('abc', false);
                break;
            case "advancedSubnetMaskEntryInput":
            case "advancedIpAddressEntryInput":
            case "advancedRouterEntryInput":
            case "advancedDnsEntryInput":
                nativeBridge.showKb('123', false);
                break;
        }

        //record focused field so we can blur on window down
        that.focusedField = event.target;
    };

    /**
     * 
    * close KB on field lose focus
    */
    this.fieldBlured = function(event){

        Pillow.logDbgHigh("+++++WifiWizardDialog.fieldBlured :: ", event.target.id);

        var entryKey = event.target.getAttribute("entryKey");

        Pillow.logDbgLow("entryKey :: ", entryKey);

        if (that.focusedField !== event.target){
            Pillow.logDbgLow("no need to handle blur as this is not the focused field");
            return;
        }

        //set the field value back to the currentEntry
        if (entryKey){
            that.currentEntry[entryKey] = event.target.value;

            if (that.visiblePopup === "netNameAndPasswordPopup" && entryKey === "password"){
                var st = that.currentEntry.securityType;
                if (st && st.getSelectedValue() === "open"){
                    // The user set a password in simple mode, so let the
                    // security type be "wep" instead of "open" if we end up in
                    // advanced mode.
                    st.setSelectedValue("wep");
                }
            }
        }

        nativeBridge.hideKb();

        that.focusedField = null;
    };
    
    /**
     * handle keyup events and validate submit button state
     */
     this.genericFieldKeyUp = function(event){

         Pillow.logDbgMid("key up event target ", event.target.id);
         
         if (that.submitDisabled){
             // submit currently disabled check to see if value of target 
             // went from blank to valid value
             if (event.target.value){
                 Pillow.logDbgMid("key entered while submit disabled");

                 var entryKey = event.target.getAttribute("entryKey");

                 Pillow.logDbgMid("entryKey :: ", entryKey);

                 //set the field value back to the currentEntry
                 if (entryKey){
                     if (!that.currentEntry[entryKey]){
                         Pillow.logDbgMid("state of field was empty, set field and re-eval");
                         
                         that.currentEntry[entryKey] = event.target.value;
                         
                         //validate again
                         checkSubmitButton();
                     }
                 }
             }
         } else {
             // submit currently enabled, check to see it value went from 
             // valid to blank
             if (!event.target.value){
                 Pillow.logDbgMid("field cleared while submit was enabled");

                 var entryKey = event.target.getAttribute("entryKey");

                 Pillow.logDbgMid("entryKey :: ", entryKey);

                 //set the field value back to the currentEntry
                 if (entryKey){
                     that.currentEntry[entryKey] = "";
                     
                     //validate again
                     checkSubmitButton();
                 }
             }
         }

     };

    /**
    * handles mouse downs in input forms and limits focus 
    * change to input fields
    */
    this.handleEntryFormMouseDown = function(event){
        
        //only allow mousedown on input fields to keep focus on only input fields
        if (event.target.tagName === 'INPUT') {
            return true;
        } else {
            return false;
        }
    };

    /**
     * onSubmit handler for entry forms, submit and 
     * stop event from propogating
     */
    this.handleOnSubmit = function(){
        Pillow.logDbgHigh("+++++handleOnSubmit");
        networkEntrySubmitButtonSelect(false);
        // false to indicate handled
        return false;
    };

    /**
     * handle select show/hide password field checkbox
     * in either simple or advanced entry dialogs
     * @param e 
     *          event object
     */
    this.handleShowHidePassword = function(e){
        var ele = e.currentTarget.querySelector('.checkbox, .checkboxChecked'); 
        var currentState = ele.className;
        
        document.getElementById('passwordHide').removeAttribute('class');
        document.getElementById('passwordHideAdvanced').removeAttribute('class');
            
        if(currentState === "checkbox") {
            document.getElementById('passwordHide').setAttribute('class', 'checkboxChecked');
            document.getElementById('passwordHideAdvanced').setAttribute('class', 'checkboxChecked');

            document.getElementById('passwordEntryInput').type = "password";
            document.getElementById('advancedPasswordEntryInput').type = "password";
        } else {
            document.getElementById('passwordHide').setAttribute('class', 'checkbox');
            document.getElementById('passwordHideAdvanced').setAttribute('class', 'checkbox');

            document.getElementById('passwordEntryInput').type = "text";
            document.getElementById('advancedPasswordEntryInput').type = "text";
        }
    }

    this.handleStoreCredentials = function(e) {
        var element = e.currentTarget.querySelector('.checkbox, .checkboxChecked');

        var entryKey = 'storeCredentials';
        
        if(Pillow.hasClass(element, "checkbox")) {
            that.currentEntry[entryKey] = true;
            nativeBridge.setDynamicConfigValue(DYNCONFIG_STORE_PASSWORD_PREF, "1");
            Pillow.removeClass(element, "checkbox");
            Pillow.addClass(element, "checkboxChecked");
        } else {
            that.currentEntry[entryKey] = false;
            nativeBridge.setDynamicConfigValue(DYNCONFIG_STORE_PASSWORD_PREF, "0");
            Pillow.removeClass(element, "checkboxChecked");
            Pillow.addClass(element, "checkbox");
        }
    }

    this.showLearnMoreDialog = function() {
        var message = JSON.stringify({show: "true"});
	nativeBridge.showDialog("wifilocker_legal_dialog", message);
    };

    /**
     * disables the main area while blocking action is happening
     */
     this.disableMainArea = function(){
         if (that.mainAreaDisabled){
             Pillow.logDbgHigh("main area already disabled nothing to do");
         }

         Pillow.logDbgHigh("disabling main area");

         that.mainAreaDisabled = true;
         m_availableNetworksList.setDisableList(true);
         m_listCmdBar.setButtonDisabled(0, true);
         m_listCmdBar.setButtonDisabled(1, true);
         document.getElementById('networksAndButtons').setAttribute('class', 'disabled');

         m_autoScanner.setEnabledState(false);
     };

    /**
     * enables the main area after blocking action finishes
     */
     this.enableMainArea = function(){
         if (!that.mainAreaDisabled){
             Pillow.logDbgHigh("main area aready enable nothing to do");
         }

         Pillow.logDbgHigh("enabling main area...");

         that.mainAreaDisabled = false;
         m_availableNetworksList.setDisableList(false);
         m_listCmdBar.setButtonDisabled(0, false);
         m_listCmdBar.setButtonDisabled(1, false);
         document.getElementById('networksAndButtons').setAttribute('class', '');
         
         m_autoScanner.setEnabledState(true);
     };

     var lastHideTime = 0;
     
     var showTimeout = null;

     /**
      * hides the window
      */
     this.hideWindow = function(){
         if (m_windowIsVisible){
             // expect reshow.
             nativeBridge.createFlashTrigger(FLASH_TRIGGER_TYPE_WAIT_FOR_RESHOW, FLASH_TRIGGER_FIDELITY_FAST_FULL, 2000, 0);
             nativeBridge.hideMe();
             
             // TODO consider using hide flag to hide/show window rather than 
             // map/unmap
             //that.windowTitle.addParam(WINMGR.KEY.HIDE_DIALOG, WINMGR.DIALOG_HIDE.BACKGROUND);
             
             m_windowIsVisible = false;
             lastHideTime = Date.now();
         }
     };

     var showWindowNow = function(){
         nativeBridge.showMe();
         
         // TODO consider using hide flag to hide/show window rather than 
         // map/unmap
         //that.windowTitle.removeParam(WINMGR.KEY.HIDE_DIALOG);
         
         m_windowIsVisible = true;
     };

     /**
      * shows the window
      * @param force
      *     call show even if already visible
      */
     this.showWindow = function(force){
         if ((!m_windowIsVisible || force) && !showTimeout){
             var timeSinceHide = Date.now() - lastHideTime;
             if (timeSinceHide < MINIMUM_HIDE_SHOW_DELAY) {
                 var delay = MINIMUM_HIDE_SHOW_DELAY - timeSinceHide;
                 Pillow.logInfo('pillow-wifi-delay-show', {delay: delay});
                 showTimeout = setTimeout(function() {
                         showTimeout = null;
                         showWindowNow();
                         }, delay);
             } else {
                 showWindowNow();
             }
         }
     };

     /**
      * x button in top right corner of advanced view
      */
     this.handleCancelButton = function(){
         networkEntryCancelButtonSelect();
     };

     this.getAdvancedEntry = function() {
         return m_advancedEntry;
     };
};

window.wifiWizardDialog = new WifiWizardDialog();

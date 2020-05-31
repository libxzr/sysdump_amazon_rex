function SimpleEntry() {
    
    var that = this;

    //button bars
    var m_manualButtonBar;
    var m_simpleButtonBar;
    var m_wpsButtonBar;

    /**
    * check to see if we disable the submit button
    */
    this.checkSubmitDisabled = function(){

        //check to see if min field requirements met
        // manual entry requires an essid has been entered but not a password
        // non manual entry there is no essid but we require a password

        var cur = wifiWizardDialog.currentEntry;
        
        if ( ( cur.isManual && cur.essid) ||
             (!cur.isManual && cur.password && ( !cur.isEnterprise() || cur.identity ) ) ){
            m_simpleButtonBar.setButtonDisabled(0, false);
            m_manualButtonBar.setButtonDisabled(1, false);
            m_wpsButtonBar.setButtonDisabled(0, false);
            wifiWizardDialog.submitDisabled = false;
        } else {
            m_simpleButtonBar.setButtonDisabled(0, true);
            m_manualButtonBar.setButtonDisabled(1, true);
            m_wpsButtonBar.setButtonDisabled(0, true);
            wifiWizardDialog.submitDisabled = true;
        }
    };

    /**
    * show the password entry popup
    * which can be manual or password only
    */
    this.show = function(){

        Pillow.logDbgHigh("+++++WifiWizardDialog.showSimpleEntry");

        //hide the entire dialog window
        //to prep for the change
        wifiWizardDialog.hideWindow();

        //clear any popup already there
        if (wifiWizardDialog.visiblePopup){
            document.getElementById(wifiWizardDialog.visiblePopup).style.display = 'none';
        }

        wifiWizardDialog.visiblePopup = "netNameAndPasswordPopup";

        document.getElementById("passwordEntryInput").value = wifiWizardDialog.currentEntry.password;

        //wifiWizardDialog.simpleInputHeight
        var focusedField = document.getElementById("passwordEntryInput");
        if (!wifiWizardDialog.currentEntry.isManual){
            document.getElementById("netNameAndPasswordEntryDiv").setAttribute('class', 'simple' + (wifiWizardDialog.currentEntry.isWps ? ' wps' : ''));

            //non manual entry has set essid
            document.getElementById("networkName").textContent = wifiWizardDialog.currentEntry.essid;

            //enter password title
            document.getElementById("netNameAndPasswordPopupTitleText").textContent =
                wifiWizardDialog.currentEntry.isEnterprise() ? WifiWizardDialogStringTable.loginTitle : WifiWizardDialogStringTable.passwordEntryTitle;

        } else {
            document.getElementById("netNameAndPasswordEntryDiv").setAttribute('class', 'manual');

            //manual entry has text field to enter essid
            document.getElementById("networkNameEntryInput").value = wifiWizardDialog.currentEntry.essid;

            //set focus to network name input
            focusedField = document.getElementById("networkNameEntryInput");

            //enter wifi network title
            document.getElementById("netNameAndPasswordPopupTitleText").textContent = WifiWizardDialogStringTable.manualEntryTitle;
        }

        //non manual entry has user name field if network is enterprise
        if (!wifiWizardDialog.isManual && wifiWizardDialog.currentEntry.isEnterprise()){
            document.getElementById("identityEntryInput").value = wifiWizardDialog.currentEntry.identity;
            document.getElementById("identityEntryInput").style.display = '';
            document.getElementById("identityLabel").style.display = '';
            focusedField = document.getElementById("identityEntryInput");
        } else {
            document.getElementById("identityEntryInput").style.display = 'none';
            document.getElementById("identityLabel").style.display = 'none';
        }

        that.checkSubmitDisabled();

        //show the password div
        document.getElementById("netNameAndPasswordPopup").style.display = '';

        //hide the main area
        document.getElementById("wifiWizardMainDiv").style.display = 'none';

        //disable the main area
        wifiWizardDialog.disableMainArea();

        //password dialog requires KB
        wifiWizardDialog.windowTitle.addParam(WINMGR.KEY.REQUIRES_KB, "abc");

        //set the window size. Height is the height of the popup plus 2*popupArea.offsetTop
        //to account for the border
        Pillow.setWindowSizeByElement(document.getElementById('netNameAndPasswordPopup'));

        //show the window again
        wifiWizardDialog.showWindow();

        // set focus has to happen after the showWindow
        focusedField.focus();
    };

    /**
    * hide the simple entry dialog
    */
    this.hide = function(enableMainArea){

        Pillow.logDbgHigh("+++++WifiWizardDialog.hideSimpleEntry");

        // there is only one visible popup at a time
        if (wifiWizardDialog.visiblePopup === "netNameAndPasswordPopup"){

            //celar focus off of field if it has one
            if (wifiWizardDialog.focusedField){
                wifiWizardDialog.focusedField.blur();
            }

            //hide the entire dialog window
            //to prep for the change
            wifiWizardDialog.hideWindow();

            m_manualButtonBar.notVisible();
            m_simpleButtonBar.notVisible();

            wifiWizardDialog.visiblePopup = null;

            //list view does not require KB
            wifiWizardDialog.windowTitle.removeParam(WINMGR.KEY.REQUIRES_KB);

            //show the main div
            document.getElementById("wifiWizardMainDiv").style.display = '';

            //hide the password entry
            document.getElementById("netNameAndPasswordPopup").style.display = 'none';

            //set the window size back to original size
            Pillow.setWindowSizeByElement(document.getElementById('wifiWizardMainDiv'));

            // if we are switching right back to the main area
            // than do so. Otherwise, the first thing that submit
            // does is create a profile which is a "very" quick action
            // and to keep the UI from flickering in the fail case
            // we hold off until its done
            if (enableMainArea){
                wifiWizardDialog.enableMainArea();
                wifiWizardDialog.showWindow();
            }

        } else {
            //hide the password div
            document.getElementById("netNameAndPasswordPopup").style.display = 'none';
        }

    };

    /**
     * Initialize the UI in the Simple Entry popup
     */
    this.initUI = function(){
        var manualButtons = [
                             {
                                 text: WifiWizardDialogStringTable.advanced,
                                 id: 'advanced'
                             },
                             {
                                 text: WifiWizardDialogStringTable.connect,
                                 id: "connect"
                             },
                         ];
        m_manualButtonBar = new ButtonBar('wifiWizardManualButtonBar', 
               manualButtons, wifiWizardDialog.handleButtonBarSelect,
               WifiWizardDialogStringTable.passwordDialogButtonLayout);

        var simpleButtons = [
                            {
                                text: WifiWizardDialogStringTable.connect,
                                id: "connect"
                            },
                        ];
        m_simpleButtonBar = new ButtonBar('wifiWizardSimpleButtonBar', 
              simpleButtons, wifiWizardDialog.handleButtonBarSelect,
              WifiWizardDialogStringTable.passwordDialogButtonLayout);

        var wpsButtons = [
                            {
                                text: WifiWizardDialogStringTable.connect,
                                id: "connect"
                            },
                            {
                                text: WifiWizardDialogStringTable.wpsConnect,
                                id: "wpsConnect"
                            }
                        ];
        m_wpsButtonBar = new ButtonBar('wifiWizardWpsButtonBar', 
              wpsButtons, wifiWizardDialog.handleButtonBarSelect,
              WifiWizardDialogStringTable.passwordDialogButtonLayout);

        // add listener for cancel button
        var cancelButton = document.getElementById('simpleCancelButton');
        new XorButton(
                cancelButton,
                wifiWizardDialog.handleCancelButton,
                cancelButton,
                'dialog-close',
                'dialog-close xor');
        //init hide the simple entry
        that.hide(false);
    };
};

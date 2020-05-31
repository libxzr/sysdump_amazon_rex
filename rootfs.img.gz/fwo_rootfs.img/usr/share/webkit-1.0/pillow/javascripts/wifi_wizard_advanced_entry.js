/*
 * wifi_wizard_advanced_entry.js
 *
 * Copyright 2012-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

function AdvancedEntry() {

    // copy of this for use in callbacks
    var that = this;

    // current viewfisAdvanced
    var m_advancedEntryView = 0;
    
    var m_scrollBar;

    var m_xorConnectButton;

    // description of views for scrolling through
    // advanced settings
    // focus = field which takes focus when view comes up
    // start = first element visible in the view
    // end = last element visible int he view
    const m_advancedEntryViews = [{focus: 'advancedNetworkNameEntryInput', 
                                start: 'advancedDescriptionText', 
                                end: 'advancedNetworkNameEntryInput'},
                               {focus: 'advancedIpAddressEntryInput',
                                start: 'advancedPage2Start', 
                                end: 'advancedPage2End'},
                               {focus: 'advancedRouterEntryInput',
                                start: 'advancedPage3Start', 
                                end: 'advancedPage3End'},
                               {focus: null,
                                start: 'advancedPage4Start',
                                end: 'advancedPage4End'},
                               {focus: null,
                                start: 'advancedPage5Start',
                                end: 'advancedPage5End'},
                               {focus: ['advancedIdentityEntryInput', 'advancedPasswordEntryInput'],
                                start: 'advancedPage6Start', 
                                end: 'advancedButtonBar'}];

    /**
     * reset the input focus to the first visible control
     */
    var resetFocus = function(){
        var initFocus = m_advancedEntryViews[m_advancedEntryView].focus;
        if (initFocus !== null) {
            if (initFocus instanceof Array) {
                for (var i in initFocus) {
                    var el = document.getElementById(initFocus[i]);
                    if (!el.getAttribute("disabled")) {
                        el.focus();
                        break;
                    }
                }
            } else {
                document.getElementById(initFocus).focus();
            }
        }
    };

    /**
    * callback when connection type selector is changed
    */
    var handleConnectionTypeChanged = function(newValue){

        Pillow.logDbgHigh("+++++wifiWizardDialog.handleConnectionTypeChanged : ", newValue);

        if (newValue === "dhcp"){
            //blur focus
            if ((m_advancedEntryView === 1) && (wifiWizardDialog.focusedField)){
                wifiWizardDialog.focusedField.blur();
            }

            // disable UI when DHCP
            document.getElementById("advancedIpAddressEntryInput").setAttribute("disabled", "disabled");
            document.getElementById("advancedSubnetMaskEntryInput").setAttribute("disabled", "disabled");
            document.getElementById("advancedRouterEntryInput").setAttribute("disabled", "disabled");
            document.getElementById("advancedDnsEntryInput").setAttribute("disabled", "disabled");

            document.getElementById("advancedIpAddressEntryInput").value = "";
            document.getElementById("advancedSubnetMaskEntryInput").value = "";
            document.getElementById("advancedRouterEntryInput").value = "";
            document.getElementById("advancedDnsEntryInput").value = "";

            document.getElementById('advancedIpAddressLabel').setAttribute("class", "wifiLabelDisabled");
            document.getElementById('advancedSubnetMaskLabel').setAttribute("class", "wifiLabelDisabled");
            document.getElementById('advancedRouterLabel').setAttribute("class", "wifiLabelDisabled");
            document.getElementById('advancedDnsLabel').setAttribute("class", "wifiLabelDisabled");

        } else {
            //enable ui
            document.getElementById("advancedIpAddressEntryInput").removeAttribute("disabled");
            document.getElementById("advancedSubnetMaskEntryInput").removeAttribute("disabled");
            document.getElementById("advancedRouterEntryInput").removeAttribute("disabled");
            document.getElementById("advancedDnsEntryInput").removeAttribute("disabled");

            document.getElementById("advancedIpAddressEntryInput").value = wifiWizardDialog.currentEntry.ipAddress;
            document.getElementById("advancedSubnetMaskEntryInput").value = wifiWizardDialog.currentEntry.subnetMask;
            document.getElementById("advancedRouterEntryInput").value = wifiWizardDialog.currentEntry.router;
            document.getElementById("advancedDnsEntryInput").value = wifiWizardDialog.currentEntry.dns;

            document.getElementById('advancedIpAddressLabel').setAttribute("class", "wifiLabel");
            document.getElementById('advancedSubnetMaskLabel').setAttribute("class", "wifiLabel");
            document.getElementById('advancedRouterLabel').setAttribute("class", "wifiLabel");
            document.getElementById('advancedDnsLabel').setAttribute("class", "wifiLabel");
            
            resetFocus();
        }

        //check to see if setting change effects submit button
        that.checkSubmitDisabled();
    };

    /**
     * Disable or enable an input element.
     *
     * elem:     the ID of the input element
     * label:    the ID of the corresponding label
     * key:      the key in wifiWizardDialog.currentEntry where the value is kept
     * newState: the new state (true means enabled)
     *
     * Label and key are optional.
     *
     * If label is provided, its class will be set to wifiLabel or
     * wifiLabelDisabled.
     *
     * If key is provided, the input will be cleared when disabled and filled
     * in from the currentEntry when enabled. Otherwise, the input will never
     * be cleared or filled.
     */
    var setInputEnabled = function(elem, label, key, newState) {
        // look up element by ID
        elem = document.getElementById(elem);
        // look up label by ID
        label = document.getElementById(label);

        if (elem instanceof HTMLInputElement) {
            var oldState = !elem.getAttribute("disabled");
            /**
             * We only do the enabling logic on a false->true transition,
             * because the field could have unsaved data which we would stomp
             * on if we executed this logic on a true->true transition.
             *
             * The disabling logic is safe to do on both true->false and
             * false->false transitions, the latter of which is convenient as a
             * way to ensure that a field starts out disabled during
             * initialization of the dialog.
             */
            if (!oldState && newState) {
                // enable
                Pillow.logDbgMid("enabling advanced input with key " + key);
                if (key) {
                    elem.value = wifiWizardDialog.currentEntry[key];
                }
                elem.removeAttribute("disabled");
                if (label) {
                    label.setAttribute("class", "wifiLabel");
                }
            } else if (!newState) {
                // disable
                Pillow.logDbgMid("disabling advanced input with key " + key);
                elem.setAttribute("disabled", "disabled");
                if (key) {
                    elem.value = "";
                }
                if (label) {
                    label.setAttribute("class", "wifiLabelDisabled");
                }
            }
        } else {
            Pillow.logDbgHigh('setInputEnabled called on non-HTMLInputElement ' + elem);
        }
    };

    /**
    * callback when security type, WPA type, or EAP method changes
    */
    var handleSecurityConfigChanged = function() {
        var curEntry = wifiWizardDialog.currentEntry;
        var securityType = curEntry.securityType.getSelectedValue();
        var wpaType = curEntry.wpaType.getSelectedValue();
        var eapMethod = curEntry.eapMethod.getSelectedValue();

        var notOpen = securityType !== "open";
        var isWpa = securityType === "wpa/wpa2" || securityType === "wpa2";
        var isEnterprise = isWpa && wpaType === "enterprise";
        var isTtls = isEnterprise && eapMethod === "TTLS";

        Pillow.logInfo("security-input-state-changed",
                {secType: securityType, wpaType: wpaType, eapMethod: eapMethod,
                 notOpen: notOpen, isWpa: isWpa, isEnt: isEnterprise, isTtls: isTtls});

        setInputEnabled("advancedPasswordEntryInput", "advancedPasswordLabel", "password", notOpen);
        setInputEnabled("advancedIdentityEntryInput", "advancedIdentityLabel", "identity", isEnterprise);
        curEntry.wpaType.setEnabled(isWpa);
        curEntry.eapMethod.setEnabled(isEnterprise);
        curEntry.phase2Auth.setEnabled(isTtls);
        if (isEnterprise && !isTtls) {
            curEntry.phase2Auth.setSelectedValue("mschapv2");
        }
        m_advancedEntryViews[4].skip = !isEnterprise;

        //check to see if setting change effects submit button
        that.checkSubmitDisabled();
    };

    /**
     * callback when Phase 2 Auth changes
     *
     * It's empty because nothing else depends on Phase 2 Auth right now.
     */
    var handlePhase2AuthChanged = function(newValue){
        // empty
    };

    /**
     * scroll the view to the appropriate palce in the view scroll box
     * 
     * @param newView new view to show
     */
    var setAdvancedView = function(newView){

        if (wifiWizardDialog.focusedField){
            wifiWizardDialog.focusedField.blur();
        }

        // set the view
        m_advancedEntryView = newView;
        var startElem = document.getElementById(m_advancedEntryViews[m_advancedEntryView].start);
        var endElem = document.getElementById(m_advancedEntryViews[m_advancedEntryView].end);

        // scroll the container to offset
        document.getElementById('wifiAdvancedEntryScrollContainer').scrollTop = startElem.offsetTop;
        
        // size the container to only show what we want
        var height = endElem.offsetTop + endElem.offsetHeight - startElem.offsetTop;
        Pillow.logDbgLow("height being set to ", height);
        document.getElementById('wifiAdvancedEntryScrollContainer').style.height = height + 'px';

        //set scroll bar
        m_scrollBar.setScrollbar(m_advancedEntryViews.length, 1, newView);
        
        // set the input focus
        resetFocus();
    };

    /**
     * called when fields update in advanced entry view. Validate
     * if submit should be enables and update UI
     */
    this.checkSubmitDisabled  = function(){

        //check to see if minimum field entry is met
        // must have essid
        // must be dhcp or have static fields filled out
        // must be open network or have password
        var cur = wifiWizardDialog.currentEntry;
        var securityType = cur.securityType.getSelectedValue();
        var connectButton = document.getElementById('advancedConnectButton');
        if ( cur.essid && 
             ( securityType === "open" || cur.password ) &&
             ( securityType === "open" || securityType === "wep" || cur.wpaType.getSelectedValue() === "personal" || cur.identity ) &&
             ( cur.connectionType.getSelectedValue() === "dhcp" || ( cur.subnetMask && cur.ipAddress && cur.router && cur.dns ) ) 
            ){
            connectButton.setAttribute("class",
                    "lab126DialogButton lab126DialogButtonEnabled");
            wifiWizardDialog.submitDisabled = false;
        } else {
            connectButton.setAttribute("class",
                    "lab126DialogButton lab126DialogButtonDisabled");
            wifiWizardDialog.submitDisabled = true;
        }
        modifyClassNameElement(connectButton);
    };

    /**
    * show the advanced entry view
    */
    this.show = function(jumpToPassword){

        Pillow.logDbgLow("+++++advancedEntry.show");

        // set addvanced entry to be true
        wifiWizardDialog.currentEntry.isAdvanced = true;
        
        var essid = wifiWizardDialog.currentEntry.essid;

        //hide the entire dialog window
        //to prep for the change
        wifiWizardDialog.hideWindow();

        //clear any popup already there
        if (wifiWizardDialog.visiblePopup){
            document.getElementById(wifiWizardDialog.visiblePopup).style.display = 'none';
        }

        wifiWizardDialog.visiblePopup = "advancedPopup";

        //show the div
        document.getElementById("advancedPopup").style.display = '';

        /**
         * Disable the password and identity fields so that
         * handleSecurityConfigChanged initializes them correctly.
         */
        setInputEnabled("advancedPasswordEntryInput", "advancedPasswordLabel", "password", false);
        setInputEnabled("advancedIdentityEntryInput", "advancedIdentityLabel", "identity", false);

        handleSecurityConfigChanged();
        handlePhase2AuthChanged(wifiWizardDialog.currentEntry.phase2Auth.getSelectedValue());
        handleConnectionTypeChanged(wifiWizardDialog.currentEntry.connectionType.getSelectedValue());

        if (jumpToPassword){
            // jump to the view with password
            setAdvancedView(5);
        } else {
            // start on first view
            setAdvancedView(0);
        }

        // fill in values from current entry
        // note password filled in via handleSecurityConfigChanged if
        // security is not OPEN
        document.getElementById("advancedNetworkNameEntryInput").value = wifiWizardDialog.currentEntry.essid;
        document.getElementById("advancedIpAddressEntryInput").value = wifiWizardDialog.currentEntry.ipAddress;
        document.getElementById("advancedSubnetMaskEntryInput").value = wifiWizardDialog.currentEntry.subnetMask;
        document.getElementById("advancedRouterEntryInput").value = wifiWizardDialog.currentEntry.router;
        document.getElementById("advancedDnsEntryInput").value = wifiWizardDialog.currentEntry.dns;
        document.getElementById("advancedCaCertificateEntryInput").value = wifiWizardDialog.currentEntry.caCertificate;

        // check whether "submit" should be disabled once everything is filled in
        that.checkSubmitDisabled();

        //password dialog requires KB
        wifiWizardDialog.windowTitle.addParam(WINMGR.KEY.REQUIRES_KB, "abc");

        //set to advanced popup height
        Pillow.setWindowSizeByElement(document.getElementById('advancedPopup'));

        //show the window again
        wifiWizardDialog.showWindow();

        Pillow.logDbgLow("-----advancedEntry.show");
    };

    /**
    * hide the advanced view
    * @param enableMainArea see inline comment below
    */
    this.hide = function(enableMainArea){
        Pillow.logDbgLow("+++++advancedEntry.hide");

        // there is only one visible popup at a time
        if (wifiWizardDialog.visiblePopup === "advancedPopup"){

            //clear focus off of field if it has one
            if (wifiWizardDialog.focusedField){
                wifiWizardDialog.focusedField.blur();
            }

            //hide the entire dialog window
            //to prep for the change
            wifiWizardDialog.hideWindow();

            m_xorConnectButton.notVisible();

            wifiWizardDialog.visiblePopup = null;

            //list view does not require KB
            wifiWizardDialog.windowTitle.removeParam(WINMGR.KEY.REQUIRES_KB);

            //show the main div
            document.getElementById("wifiWizardMainDiv").style.display = '';

            //hide the password entry
            document.getElementById("advancedPopup").style.display = 'none';

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
            document.getElementById("advancedPopup").style.display = 'none';
        }
    };

    /**
    * scroll to next advanced view
    */
    this.advancedNextView = function(){
        var view = m_advancedEntryView;
        var max = m_advancedEntryViews.length - 1;
        while (view < max) {
            ++view;
            if (!m_advancedEntryViews[view].skip) {
                break;
            }
        }
        setAdvancedView(view);
    };

    /**
    * scroll to previous advanced view
    */
    this.advancedPreviousView = function(){
        var view = m_advancedEntryView;
        while (view > 0) {
            --view;
            if (!m_advancedEntryViews[view].skip) {
                break;
            }
        }
        setAdvancedView(view);
    };

    /**
    * return current advanced view start element
    */
    this.getCurrentViewStartElement = function() {
        return m_advancedEntryViews[m_advancedEntryView].start;
    };
    
    /**
    * return current advanced view start element
    */
    this.getCurrentViewEndElement = function() {
        return m_advancedEntryViews[m_advancedEntryView].end;
    };

    /**
     * Initalize the UI in the advanced entry popup
     */
    this.initUI = function(){

        // hook up the selector widgets in the advacned view to the current entry
        wifiWizardDialog.currentEntry.connectionType = new Selector('connectionTypeSelector',
                 [{label:WifiWizardDialogStringTable.connectionTypeDhcp, value:"dhcp"},
                  {label:WifiWizardDialogStringTable.conenctionTypeStatic, value:"static"}],
                  0, handleConnectionTypeChanged);
        wifiWizardDialog.currentEntry.securityType   = new Selector('securityTypeSelector',
                 [{label:WifiWizardDialogStringTable.securityTypeOpen, value:"open"},
                  {label:WifiWizardDialogStringTable.securityTypeWep, value:"wep"},
                  {label:WifiWizardDialogStringTable.securityTypeWpawpa2, value:"wpa/wpa2"},
                  {label:WifiWizardDialogStringTable.securityTypeWpa2, value:"wpa2"}],
                  1, handleSecurityConfigChanged);
        wifiWizardDialog.currentEntry.wpaType        = new Selector('wpaTypeSelector',
                 [{label:WifiWizardDialogStringTable.wpaTypePersonal, value:"personal"},
                  {label:WifiWizardDialogStringTable.wpaTypeEnterprise, value:"enterprise"}],
                  0, handleSecurityConfigChanged);
        wifiWizardDialog.currentEntry.eapMethod      = new Selector('eapMethodSelector',
                 [{label:WifiWizardDialogStringTable.eapMethodPeap, value:"PEAP"},
                  {label:WifiWizardDialogStringTable.eapMethodTtls, value:"TTLS"}],
                  0, handleSecurityConfigChanged);
        wifiWizardDialog.currentEntry.phase2Auth     = new Selector('phase2AuthSelector',
                 [{label:WifiWizardDialogStringTable.phase2AuthPap, value:"pap"},
                  {label:WifiWizardDialogStringTable.phase2AuthMschapv2, value:"mschapv2"}],
                  0, handlePhase2AuthChanged);

        // add listener for connect button
        var connectButton = document.getElementById('advancedConnectButton');
        m_xorConnectButton = new XorButton(
                connectButton,
                wifiWizardDialog.handleOnSubmit,
                connectButton,
                "",
                "xor",
                {checkEnabledCallback: function() { return !wifiWizardDialog.submitDisabled; }});

        m_scrollBar = new ScrollBar('advancedScrollbarContainer');

        // add listener for cancel button
        var cancelButton = document.getElementById('advancedCancelButton');
        new XorButton(
                cancelButton,
                wifiWizardDialog.handleCancelButton,
                cancelButton,
                'dialog-close',
                'dialog-close xor');

        //init hide of advanced entry
        that.hide(false);
    };
};

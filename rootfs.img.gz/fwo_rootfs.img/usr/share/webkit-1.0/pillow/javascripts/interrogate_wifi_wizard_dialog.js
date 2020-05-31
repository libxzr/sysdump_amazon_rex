
window.LocalTest = {};

/**
 * Private context for LocalTest module
 */
(function() {

    /**
     * @class Network   A network entry in the scan list
     * @param itemElem  The list item DOM element
     */
    LocalTest.Network = function(itemElem) {
        itemElem = Test.ensureElement(itemElem, 'button');
        Test.HtmlButtonWidget.call(this, itemElem);

        var getFieldClass = function(name, type) {
            var elem = itemElem.querySelector('.' + name + '.' + type);
            if (!elem) {
                return null;
            }
            var cls = elem.getAttribute('class').
                replace(RegExp('\\b(' + name + '|' + type + ')\\b', 'g'), '').
                trim();
            if (cls === '') {
                return null;
            } else {
                return cls;
            }
        };

        // override
        this.getValue = function() {
            var labelElem = itemElem.querySelector('.label.text-field');
            var signalStr = getFieldClass('signalIcon', 'class-field');
            var signalDigits = signalStr ? signalStr.replace(/\D/g, '') : '';
            return {
                empty: getFieldClass('emptyFlag', 'class-field') === 'true',
                selected: getFieldClass('selectedIcon', 'class-field') === 'selectedWifi',
                essid: labelElem ? labelElem.textContent : null,
                secure: getFieldClass('secureIcon', 'class-field') === 'networkSecured',
                signal: signalDigits === '' ? null : Number(signalDigits)
            };
        };

        this.getAccessibilityData = function() {
            var labelElem = itemElem.querySelector('.label.text-field');
            var a11yData = this.getValue();
            a11yData['accessible'] = true;
            a11yData['aria-role'] = "wifi-scan-item";
            a11yData['aria-label'] = labelElem ? labelElem.textContent : null;
            a11yData['actionMap'] = {'tap' : 'tap'};
            return a11yData;
        };
    };

    LocalTest.isAdvancedEntryElementVisible = function(elem) {
        if (!(elem instanceof HTMLElement)) {
            return false;
        }

        if (! window.wifiWizardDialog.currentEntry.isAdvanced) {
            return false;
        } 

        var currentAdvancedViewStartElement = document.getElementById(window.wifiWizardDialog.getAdvancedEntry().getCurrentViewStartElement());
        var currentAdvancedViewEndElement = document.getElementById(window.wifiWizardDialog.getAdvancedEntry().getCurrentViewEndElement());

        var top = currentAdvancedViewStartElement.offsetTop;
        var bottom = currentAdvancedViewEndElement.offsetTop + currentAdvancedViewEndElement.offsetHeight;

        if (elem.offsetTop >= top && (elem.offsetTop + elem.offsetHeight) <= bottom) {
            return Test.isElementVisible(elem);
        } else {
            return false;
        }

    };

    /**
     * @class ScrollBar   A network scroll bar in the scan list
     * @param itemElem  The list scrollbar DOM element
     */
    LocalTest.ScrollBar = function(itemElem) {
        itemElem = Test.ensureElement(itemElem, 'div');
        Test.HtmlDiv.call(this, itemElem);

        
        // override
        this.getValue = function() {
            return {
                top: itemElem.style.top,
                bottom: itemElem.style.bottom
            };
        };
    };

    LocalTest.LabelContainerWidget = function(element) {
        element = Test.ensureElement(element, 'div');
        Test.Widget.call(this, element);

        this.getValue = function() {
            return element.textContent;
        };

        this.getAccessibilityData = function() {
            var a11yData = {"accessible": true, "aria-role": "labelContainer", "aria-label": element.textContent};
            return a11yData;
        };
    };

    LocalTest.LabelSpanWidget = function(element) {
        element = Test.ensureElement(element, 'span');
        Test.Widget.call(this, element);
        
        this.getValue = function() {
            return element.textContent;
        }

        this.getAccessibilityData = function() {
            var a11yData = {"accessible": true, "aria-role": "labelContainer", "aria-label": element.textContent};
            return a11yData;
        }
    };

    LocalTest.LabelLinkWidget = function(element) {
        element = Test.ensureElement(element, 'span');

        Test.Widget.call(this, element);

        this.isEnabled = function() {
            return !Pillow.hasClass(element, 'wifiLabelDisabled');
        }

        this.getValue = function() {
            return element.textContent;
        }

        this.getAccessibilityData = function() {
            var a11yData = {"accessible" : true, "aria-role": "link", "aria-label": element.textContent};
            return a11yData;
        }
    };

    /**
     * @class FakeCheckbox  A checkbox implemented with a div
     * @param element       The div
     * @param labelContainerWidgetName [Optional] The label container that labels this check box
     */
    LocalTest.FakeCheckbox = function(element, labelContainerWidgetName) {
        element = Test.ensureElement(element, 'div');
        Test.Widget.call(this, element);

        this.isEnabled = function() {
            return true;
        };

        this.getValue = function() {
            return Boolean(element.getAttribute('class').match(/\bcheckboxChecked\b/));
        };

        this.getAccessibilityData = function() {
            var a11yData = {"accessible": true, "aria-role": "checkbox"};
            a11yData['aria-selected'] = this.getValue();
            if (labelContainerWidgetName) {
                a11yData['aria-labelledby'] = labelContainerWidgetName;
            }
            return a11yData;
        };
    };

    LocalTest.AdvancedEntryWidget = function(elem, baseClass, arg) {
        if (arg) {
            //In case baseClass requires more than the element in its constructor
            baseClass.call(this, elem, arg);
        } else {
            baseClass.call(this, elem);
        }

        if (!(elem instanceof HTMLElement)) {
            elem = document.getElementById(elem);
        }
    
        //Overriding this to be wifi wizard dialog specific
        this.isVisible = function() {
            return LocalTest.isAdvancedEntryElementVisible(elem);        
        };

        var getAccessibilityData = this.getAccessibilityData;
        this.getAccessibilityData = function() {
            var a11yData = getAccessibilityData.call(this);
            a11yData ['parent'] = Test.advanced_dialog_str;
            return a11yData;
        };
        
    };

    LocalTest.AdvancedEntrySelectorItemWidget = function(container, elem) {
        Test.SelectorOptionWidget.call(this, container, elem);

        //Overriding this to be wifi wizard dialog specific
        this.isVisible = function() {
            return LocalTest.isAdvancedEntryElementVisible(elem);        
        };

        var getAccessibilityData = this.getAccessibilityData;
        this.getAccessibilityData = function() {
            var a11yData = getAccessibilityData.call(this);
            a11yData['parent'] = Test.advanced_dialog_str;
            return a11yData;
        };

    };

    LocalTest.AdvancedEntryDialog = function(elem, scrollElem) {
        Test.HtmlDiv.call(this, elem);
        scrollElem = Test.ensureElement(scrollElem);

        this.getAccessibilityData = function() {
            var a11yData = {"accessible": true, "aria-role": "listContainer"};

            var scrollTopPct = scrollElem.getAttribute('scroll-extent-top-pct');
            if(scrollTopPct) a11yData['scroll-extent-top-pct'] = parseFloat(scrollTopPct);

            var scrollBottomPct = scrollElem.getAttribute('scroll-extent-bottom-pct');
            if(scrollBottomPct) a11yData['scroll-extent-bottom-pct'] = parseFloat(scrollBottomPct);

            var size = document.getElementById('advancedPopup').querySelectorAll('.wifiLabel').length;
            if (size) a11yData['aria-setsize'] = parseInt(size);

            return a11yData;

        };
    };

    LocalTest.CloseButtonWidget = function(elem) {
        Test.HtmlCloseButtonWidget.call(this, elem);

        this.getValue = function() {
            return WifiWizardDialogAccessibilityStringTable.closeButtonLabel;
        };
    };

    LocalTest.AlertTitleWidget = function(elem) {
        Test.HtmlTextContent.call(this, elem);

        this.getAccessibilityData = function() {
            var a11yData = {"accessible": true, "aria-role": "alertdialog"};
            return a11yData;
        };
    };
    
    LocalTest.init = function() {
        
        /**
         * Scan list dialog
         */
        Test.addWidget('list_dialog', new Test.HtmlDiv('wifiWizardMainDiv'));
        Test.addListItems('list_item_', 'availableNetworks', LocalTest.Network, LocalTest.ScrollBar);
	Test.addWidget('user_guide', new Test.HtmlTextContent('userGuide'));
        Test.addButtonBarButtons('wifi_', 'wifiWizardListViewCmdBar');
        Test.addWidget('list_close', new LocalTest.CloseButtonWidget('scanListDoneButton'));
        Test.addWidget('scan_title', new LocalTest.AlertTitleWidget(document.getElementById('title')));

        /**
         * Error dialog
         */
        Test.addWidget('error_dialog', new Test.HtmlDiv('errorPopup'));
        Test.addWidget('error_title', new LocalTest.AlertTitleWidget(document.getElementById('errorTitleText')));
        Test.addWidget('error_text', new Test.HtmlTextContent(document.getElementById('errorText')));
        Test.addButtonBarButtons('error_', 'wifiWizardErrorButtonBar');

        /**
         * Learn More dialog
         */

        Test.addWidget('learn_more_dialog', new Test.HtmlDiv('learnMorePopup'));
        Test.addWidget('learn_more_title', new LocalTest.AlertTitleWidget(document.getElementById('learnMoreDialogTitleText')));
        Test.addWidget('learn_more_text', new Test.HtmlTextContent(document.getElementById('learnMoreDialogText')));
        Test.addButtonBarButtons('learn_more_', 'wifiWizardLearnMoreButtonBar');

        /**
         * Join dialog
         */
        Test.addWidget('join_dialog', new Test.HtmlDiv('netNameAndPasswordPopup'));
        Test.addWidget('scan_title', new LocalTest.AlertTitleWidget(document.getElementById('netNameAndPasswordPopupTitleText')));
        Test.addWidget('simple_close', new LocalTest.CloseButtonWidget('simpleCancelButton'));
        Test.addWidget('join_net_name', new Test.HtmlTextContent('netNameLabel'));
        Test.addWidget('join_network_name', new Test.HtmlTextContent('networkName'));
        Test.addWidget('join_essid_input', new Test.HtmlTextInput('networkNameEntryInput'));
        Test.addWidget('join_identity_label', new Test.HtmlTextContent('identityLabel'));
        Test.addWidget('join_identity_input', new Test.HtmlTextInput('identityEntryInput'));
        Test.addWidget('join_password_label', new LocalTest.LabelContainerWidget('passwordLabel'));
        Test.addWidget('join_password_input', new Test.HtmlTextPasswordInput('passwordEntryInput', 'join_password_label'));
        Test.addWidget('join_password_hide_label', new LocalTest.LabelContainerWidget('passwordHideLabel'));
        Test.addWidget('join_password_hide', new LocalTest.FakeCheckbox('passwordHide', 'join_password_hide_label'));
        Test.addWidget('join_learn_more_label', new LocalTest.LabelLinkWidget('learnMoreLabel'));
        Test.addWidget('join_store_wifi_credential_label', new LocalTest.LabelSpanWidget('storeCredentialsLabel'));
        Test.addWidget('join_store_wifi_credential', new LocalTest.FakeCheckbox('storeCredentials', 'join_store_wifi_credential_label'));
        Test.addButtonBarButtons('join_simple_', 'wifiWizardSimpleButtonBar');
        Test.addButtonBarButtons('join_wps_', 'wifiWizardWpsButtonBar');
        Test.addButtonBarButtons('join_manual_', 'wifiWizardManualButtonBar');

        /**
         * Advanced dialog
         */

        Test.advanced_dialog_str = 'advanced_dialog';
        Test.addWidget(Test.advanced_dialog_str,
                new LocalTest.AdvancedEntryDialog('advancedPopup', 'advancedScrollbarContainer'));
        Test.addWidget('advanced_title',
                new LocalTest.AlertTitleWidget('advancedTitleText'));
        Test.addWidget('advanced_close',
                new LocalTest.CloseButtonWidget('advancedCancelButton'));

        //Add all advanced labels to the list of widgets
        var advancedEntryWifiLabelElements = document.getElementById('advancedPopup').querySelectorAll('.wifiLabel');
        for (var i = 0; i < advancedEntryWifiLabelElements.length; i++) {
            var elem = advancedEntryWifiLabelElements[i];
            Test.addWidget(elem.id, new LocalTest.AdvancedEntryWidget(elem, Test.HtmlTextContent));
        }

        Test.addWidget('advanced_essid_input',
                new LocalTest.AdvancedEntryWidget('advancedNetworkNameEntryInput', Test.HtmlTextInput));
        Test.addSelectorOptions('advanced_type_', 'connectionTypeSelector', LocalTest.AdvancedEntrySelectorItemWidget);
        Test.addWidget('advanced_ip_input',
                new LocalTest.AdvancedEntryWidget('advancedIpAddressEntryInput', Test.HtmlTextInput));
        Test.addWidget('advanced_netmask_input',
                new LocalTest.AdvancedEntryWidget('advancedSubnetMaskEntryInput', Test.HtmlTextInput));
        Test.addWidget('advanced_router_input',
                new LocalTest.AdvancedEntryWidget('advancedRouterEntryInput', Test.HtmlTextInput));
        Test.addWidget('advanced_dns_input',
                new LocalTest.AdvancedEntryWidget('advancedDnsEntryInput', Test.HtmlTextInput));

        Test.addSelectorOptions('advanced_security_', 'securityTypeSelector', LocalTest.AdvancedEntrySelectorItemWidget);
        Test.addSelectorOptions('advanced_wpa_', 'wpaTypeSelector', LocalTest.AdvancedEntrySelectorItemWidget);
        Test.addSelectorOptions('advanced_eap_', 'eapMethodSelector', LocalTest.AdvancedEntrySelectorItemWidget);
        Test.addSelectorOptions('advanced_phase2_', 'phase2AuthSelector', LocalTest.AdvancedEntrySelectorItemWidget);

        Test.addWidget('advanced_identity_input',
                new LocalTest.AdvancedEntryWidget('advancedIdentityEntryInput', Test.HtmlTextInput));
        Test.addWidget('advanced_password_input',
                new LocalTest.AdvancedEntryWidget('advancedPasswordEntryInput', Test.HtmlTextInput));
        Test.addWidget('advanced_password_hide_label',
                new LocalTest.AdvancedEntryWidget('passwordHideAdvancedLabel', LocalTest.LabelContainerWidget));
        Test.addWidget('advanced_password_hide',
                new LocalTest.AdvancedEntryWidget('passwordHideAdvanced', LocalTest.FakeCheckbox, 'advanced_password_hide_label'));

        Test.addWidget('advanced_connect_button',
                new Test.HtmlButtonWidget('advancedConnectButton', '.button-text'));
        
    };

    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();


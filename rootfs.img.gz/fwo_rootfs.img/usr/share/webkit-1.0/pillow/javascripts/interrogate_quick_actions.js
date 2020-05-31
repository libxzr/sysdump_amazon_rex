/*
 * interrogate_quick_actions.js
 *
 * Copyright (c) 2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */


/**
 * Private context for LocalTest module
 */
(function() {

    OFF_SUFFIX = '-off';

    // quick-actions-item-icon airplaneMode-icon-off
    STATE_OFF = QuickActionsStyles['QUICK_ACTIONS_ITEM_STYLE'] + QuickActionsStyles['ICON_SUFFIX'] + " " + AIRPLANE_MODE_ID + QuickActionsStyles['ICON_SUFFIX'] + OFF_SUFFIX;

    // css prefix for the id of an element
    CSS_ELEMENT_ID_PREFIX = '#';

    /**
     * A custom class for the toggle button widget
     * @param element  The HTMLInputElement with type "button"
     */

    LocalTest.AirplaneModeWidget = function(elem){
        elem = Test.ensureElement(elem, 'button');
        Test.Widget.call(this, elem);

        this.getValue = function(){
            return elem.textContent;
        };

        this.isEnabled = function() {
            return !elem.disabled;
        };

        this.isSelected = function(){
            return !(document.getElementById(AIRPLANE_MODE_ID + QuickActionsStyles['ICON_SUFFIX']).className.trim() == STATE_OFF);
        };

        this.getCustomData = function() {
            var customData = {};
            var isStateOff = document.getElementById(AIRPLANE_MODE_ID + QuickActionsStyles['ICON_SUFFIX']).className.trim() == STATE_OFF;

            customData['toggle_button_text'] = (isStateOff ? AirplanemodeAccessibilityStringTable.turnOffAirplaneModeLabel : AirplanemodeAccessibilityStringTable.turnOnAirplaneModeLabel);
            customData['is_selected'] = !isStateOff;
            return customData;
        };

        this.getAccessibilityData = function() {
            var a11yData = {"accessible": true, "aria-role": "toggleButton"};
            var isStateOff = document.getElementById(AIRPLANE_MODE_ID + QuickActionsStyles['ICON_SUFFIX']).className.trim() == STATE_OFF;

            a11yData['aria-label'] = this.getValue();
            a11yData['aria-description'] = (isStateOff ? AirplanemodeAccessibilityStringTable.turnOnAirplaneModeDesc : AirplanemodeAccessibilityStringTable.turnOffAirplaneModeDesc);
            a11yData['actionMap'] = {'tap':'tap'};
            return a11yData;
        };
    };

    LocalTest.init = function() {
        Test.logger = Pillow;

	var items = Pillow.QuickActionsProvider.Items;

	for( itemKey in items) {
            var itemId = items[itemKey].itemId;

            if(AIRPLANE_MODE_ID == itemId){
                Test.addWidget(itemId, new LocalTest.AirplaneModeWidget(itemId, CSS_ELEMENT_ID_PREFIX + itemId + QuickActionsStyles['TEXT_SUFFIX']));
            } else {
                Test.addWidget(itemId, new Test.HtmlButtonWidget(itemId, CSS_ELEMENT_ID_PREFIX + itemId + QuickActionsStyles['TEXT_SUFFIX']));
            }
        }

        // Including all the light dialog widgets here
	LocalTest.initLightDialog();
    };

    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();

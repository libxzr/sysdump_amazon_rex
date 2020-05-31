
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
            var labelElem = itemElem.querySelector('.device.text-field');
            return {
                selected: getFieldClass('selectedIcon', 'class-field') === 'selectedDevice',
                deviceId: labelElem ? labelElem.textContent : null,
            };
        };

        this.getAccessibilityData = function() {
            var labelElem = itemElem.querySelector('.device.text-field');
            var a11yData = this.getValue();
            a11yData['accessible'] = true;
            a11yData['aria-role'] = "bt-paired-item";
            a11yData['aria-label'] = labelElem ? labelElem.textContent : null;
            a11yData['actionMap'] = {'tap' : 'tap'};
            return a11yData;
        };
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

    LocalTest.CloseButtonWidget = function(elem) {
        Test.HtmlCloseButtonWidget.call(this, elem);

        this.getValue = function() {
            return BTAccessibilityStringTable.close;
        };
    };

    LocalTest.init = function() {
        Test.addListItems('bt_item_', 'devices', LocalTest.Network, LocalTest.ScrollBar);
        Test.addButtonBarButtons('bt_', 'BTDeviceCmdBar');
        Test.addWidget('list_close', new LocalTest.CloseButtonWidget('advancedCancelButton'));
        Test.addWidget('bt_title', new Test.AlertTitleWidget(document.getElementById('btTitleText')));
        Test.addWidget('bt_text', new Test.HtmlTextContent(document.getElementById('btHeaderText')));
    };

    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();


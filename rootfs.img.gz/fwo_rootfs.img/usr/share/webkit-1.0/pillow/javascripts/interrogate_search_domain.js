
window.LocalTest = {};

/**
 * Private context for LocalTest module
 */
(function() {

    /**
     * @class SearchDomainButtonWidget
     *
     * A class for search domain <button> elements. We have this separate from HTMLButtonWidget because
     *     we need a special check for is_selected
     *
     * @param elem       The DOM element of the button
     * @param textQuery  (Optional) A query selector to apply to the button element
     *                   to find the element which contains the text
     */
    LocalTest.SearchDomainButtonWidget = function(elem, textQuery) {
        elem = Test.ensureElement(elem, 'button');
        Test.Widget.call(this, elem);

        this.isEnabled = function() {
            return !elem.disabled;
        };

        this.getValue = function() {
            var textElem = textQuery ? elem.querySelector(textQuery) : elem;
            if (textElem) {
                return textElem.textContent;
            } else {
                return null;
            }
        };
        
        this.isSelected = function() {
            return Boolean(elem.querySelector('.class-field.selected-icon.selected'));
        };
        
        this.getAccessibilityData = function() {
            if (!this.getValue()) {
                return {"accessible": false};
            }

            var a11yData = {};
            a11yData['accessible'] = true;
            a11yData['aria-role'] = "button";
            a11yData['aria-label'] = this.getValue();
            a11yData['actionMap'] = {'tap' : 'tap'};
            return a11yData;
        };
    };

    LocalTest.addSearchDomains = function(element) {
        Test.addListItems('domain_', element, function(elem) {
            LocalTest.SearchDomainButtonWidget.call(this, elem, '.text-field.description');
        });
    };

    LocalTest.init = function() {
        Test.logger = Pillow;
        var elem = document.getElementById('domains')
        Test.addWidget('searchDomainScrollPane', new Test.HtmlDiv(elem))
        LocalTest.addSearchDomains('domains');
    };

    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();


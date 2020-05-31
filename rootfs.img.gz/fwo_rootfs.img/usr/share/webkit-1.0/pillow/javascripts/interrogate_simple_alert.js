
window.LocalTest = {};

/**
 * Private context for LocalTest module
 */
(function() {

    LocalTest.AlertId = function(pillowCase) {
        Test.Widget.call(this);

        this.isVisible = function() {
            return false;
        };

        this.getPosition = function() {
            return {left: 0, top: 0};
        };

        this.isEnabled = function() {
            return true;
        };

        this.getValue = function() {
            var stack = pillowCase.getState();
            if (stack.length === 0) {
                return null;
            } else {
                return stack[stack.length - 1].alertId;
            }
        };

       this.getSize = function() {
            return {width: 10, height: 10};
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
        Test.addButtonBarButtons('', 'buttonBar');
        Test.addWidget('title', new LocalTest.AlertTitleWidget('title'));
        Test.addWidget('text', new Test.HtmlTextContent('text'));
        Test.addWidget('alert-id', new LocalTest.AlertId(window.simpleAlert));
    };

    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();

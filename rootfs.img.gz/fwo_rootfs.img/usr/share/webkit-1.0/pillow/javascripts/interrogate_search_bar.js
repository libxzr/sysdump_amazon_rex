
window.LocalTest = {};

/**
 * Private context for LocalTest module
 */
(function() {

    LocalTest.init = function() {
        Test.logger = Pillow;

        LocalTest.DiscoverySearchBarButton = function(elem) {
            elem = Test.ensureElement(elem, 'button');
            Test.Widget.call(this, elem);

            this.isEnabled = function() {
                return !elem.disabled;
            };

            this.getValue = function() {
                return elem.className;
            };
        };

	/**
	 * A custom HtmlDiv for searchPlaceholder widget.
	 */
        LocalTest.HtmlDiv = function(element) {
            element = Test.ensureElement(element, 'span');
            Test.Widget.call(this, element);
        
            this.isEnabled = function() {
                return !element.disabled;
            };

            this.getValue = function() {
                return element.innerText;
            };

            this.getAccessibilityData = function() {
                a11yData = {"accessible": false};
                return a11yData;
            };
        };

	

        var buttons = ['home', 'back', 'periodical-home', 'periodical-contents', 'blog-home', 'forward', 'discovery', 
            'store', 'font', 'exit', 'search', 'wide-search', 'domain', 'refresh', 'cancel', 'menu', 'go', 'badge', 'character', 'quickActions'];

        for (var i in buttons) {
            var id = buttons[i];
            Test.addWidget(id, new Test.HtmlButtonWidget(id, '.button-text'));
        }

        Test.addWidget('exit', new Test.HtmlCloseButtonWidget('exit', '.button-text'));
        
        Test.addWidget('search-input', new Test.HtmlTextInput('input'));

        Test.addWidget('search-icon', new Test.HtmlImage('search-icon'));

        Test.addWidget('custom-icon', new Test.HtmlImage('custom-icon'));

        Test.addWidget('input-container', new Test.HtmlDiv('input-container'));

        Test.addWidget('searchPlaceholder', new LocalTest.HtmlDiv('searchPlaceholder'));
    };

    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };

})();



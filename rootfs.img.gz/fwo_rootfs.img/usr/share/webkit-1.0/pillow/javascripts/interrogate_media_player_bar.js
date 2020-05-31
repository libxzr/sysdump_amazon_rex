window.LocalTest = {};

/**
 * Private context for LocalTest module
 */
(function() {

    /**
     * @class HTMLCanvas
     * @param element  canvas element
     *
     * 
     */
    Test.HTMLCanvas = function(element) {
        element = Test.ensureElement(element, 'canvas');
        Test.Widget.call(this, element);

        this.isEnabled = function() {
            return true;
        };

        this.getValue = function() {
            return element.getAttribute('volume');
        };
    };
    
    LocalTest.init = function() {
        Test.logger = Pillow;

        var buttons = ['previous', 'next', 'playControl', 'pauseControl', 'volumeIncreaseButton', 'turnOffButton', 'volumeDecreaseButton'];

        for (var i in buttons) {
            var id = buttons[i];
            Test.addWidget(id, new Test.HtmlButtonWidget(id, '.button-text'));
        }

        Test.addWidget('track', new Test.HTMLPTag('track'));
        Test.addWidget('title', new Test.HTMLPTag('title'));
        Test.addWidget('artist', new Test.HTMLPTag('artist'));

        Test.addWidget('volumeMeterCanvas', new Test.HTMLCanvas('volumeMeterCanvas'));

    };
    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();


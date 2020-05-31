
window.LocalTest = {};

/**
 * Private context for LocalTest module
 */
(function() {


    /**
     * @class HtmlDiv
     * @param element  The HTMLDivElement
     *
     * returns the text contained within the div element
     */
    LocalTest.HtmlDiv = function(element) {
        element = Test.ensureElement(element, 'div');
        Test.Widget.call(this, element);

        this.isEnabled = function() {
            return true;
        };

        this.getValue = function() {
            return element.textContent;
        };

        this.getAccessibilityData = function() {
            var a11yData = {"accessible": true, "aria-role": "labelContainer", "aria-label": element.textContent};
            return a11yData;
        };
    };

    /**
     * @class AlsModeCheckBox
     * @param element  The Button element corresponding to the Check-box
     *
     * returns the als mode Either ON or OFF
     */
    LocalTest.AlsModeCheckBox = function(element) {
    	element = Test.ensureElement(element, 'button');
        Test.Widget.call(this, element);

        this.isEnabled = function() {
            return !element.disabled;
        };

        this.getValue = function() {
            return document.getElementById("check-box").className;
        };

        this.getAccessibilityData = function() {
            var a11yData = {"accessible": true, "aria-role": "checkbox", "aria-labelledby": "als-label", "aria-selected": (document.getElementById("check-box").className == " alsON")};
            return a11yData;
        };
    };

    /**
     * @class LightDialogDiscreteSlider
     *
     * A class for the light dialog's discrete slider widget control
     *
     * @param elem       The DOM element of the slider
     */
    LocalTest.LightDialogDiscreteSlider = function(elem) {
        elem = Test.ensureElement(elem, 'div');
        Test.Widget.call(this, elem);

        this.isEnabled = function() {
            var element = document.getElementById('dialog');
            return element.style.opacity == 1;
        };

        this.getValue = function() {
            var textElem = 0;
            if (elem.getElementsByClassName("box full last").length > 0) {
                textElem = elem.getElementsByClassName("box full last")[0].firstChild.innerText;
            }
            return textElem;
        };
    };

    /**
     * @class HtmlTextContent  A widget which displays text
     * @param element          The DOM element
     */
    LocalTest.HtmlTextContent = function(element) {
        if (!(element instanceof HTMLElement)) {
            // ensureElement forces the element to be a div
            element = Test.ensureElement(element);
        }
        Test.Widget.call(this, element);

        this.isEnabled = function() {
            var element = document.getElementById('dialog');
            return element.style.opacity == 1;
        };

        this.getValue = function() {
            return element.textContent;
        };
    };

    LocalTest.LightDialogIncreaseButtonWidget = function(elem, nextFlowTo) {
        elem = Test.ensureElement(elem, 'button');
        Test.HtmlButtonWidget.call(this, elem);

        this.isEnabled = function() {
            return (lightSlider.getIndex() != lightSlider.getMax());
        };

        this.getAccessibilityData = function() {
            var a11yData = {"accessible": true, "aria-role": "button"};
            var curBrightness = lightSlider.getIndex();
            var maxBrightness = lightSlider.getMax();

            a11yData['aria-label'] = new MessageFormat(LightControlAccessibilityStringTable.increaseLabel).format({current:curBrightness, max:maxBrightness});

            if (nextFlowTo) {
                a11yData['aria-flowto'] = nextFlowTo;
            }

            a11yData['actionList'] = ['increase.brightness'];
            return a11yData;
        };
    };

    LocalTest.LightDialogDecreaseButtonWidget = function(elem, nextFlowTo) {
        elem = Test.ensureElement(elem, 'button');
        Test.HtmlButtonWidget.call(this, elem);

        this.isEnabled = function() {
            return (lightSlider.getIndex() != 0);
        };

        this.getAccessibilityData = function() {
            var a11yData = {"accessible": true, "aria-role": "button"};
            var curBrightness = lightSlider.getIndex();
            var maxBrightness = lightSlider.getMax();

            a11yData['aria-label'] = new MessageFormat(LightControlAccessibilityStringTable.decreaseLabel).format({current:curBrightness, max:maxBrightness});

            if (nextFlowTo) {
                a11yData['aria-flowto'] = nextFlowTo;
            }

            a11yData['actionList'] = ['decrease.brightness'];
            return a11yData;
        };
    };

    LocalTest.initLightDialog = function() {
        Test.addWidget('high-info', new LocalTest.HtmlTextContent('high-info'));

        Test.addWidget('low-info', new LocalTest.HtmlTextContent('low-info'));

        Test.addWidget('light-slider', new LocalTest.LightDialogDiscreteSlider('light-slider'));

        if ( !hasAlsDeviceCapability) {

            Test.addWidget('max-brightness-button',  new Test.FlowToButtonWidget('TurboBrightnessSelector','increase-button'));

            Test.addWidget('increase-button', new LocalTest.LightDialogIncreaseButtonWidget('light-incr', 'decrease-button'));

            Test.addWidget('decrease-button', new LocalTest.LightDialogDecreaseButtonWidget('light-decr'));

        } else {

            Test.addWidget('als-label', new LocalTest.HtmlDiv('auto'));

            Test.addWidget('als-check-box', new LocalTest.AlsModeCheckBox('check-box'));

            Test.addWidget('increase-button', new LocalTest.LightDialogIncreaseButtonWidget('light-incr-als'));

            Test.addWidget('decrease-button', new LocalTest.LightDialogDecreaseButtonWidget('light-decr-als'));
        }

    };
    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();


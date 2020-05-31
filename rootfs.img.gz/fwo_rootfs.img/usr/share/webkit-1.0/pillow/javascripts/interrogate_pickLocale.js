
window.LocalTest = {};

/**
 * Private context for LocalTest module
 */
(function() {

    const ACCESSIBILITY_SUPPORTED_LANGUAGES = ['en'];
    /**
     * @class LanguageDiv
     * @param element
     *            The DIV element containing the language
     * 
     * A language div element
     */
    LocalTest.LanguageDiv = function(element) {
        Test.Widget.call(this, element);

        this.isEnabled = function() {
            return true;
        };

        this.getValue = function() {
            return element.innerText;
        };
        
    };

    LocalTest.AccessibleLanguageDiv = function(element, id) {
        LocalTest.LanguageDiv.call(this, element);

        this.getAccessibilityData = function() {
            a11yData = {"accessible": true, "aria-role": "radioButton"};
            var label = element.innerText;
            if (label) {
                a11yData['aria-label'] = label;
            }

            if(window.LanguagePicker.selectedLanguageWidget !== undefined && window.LanguagePicker.selectedLanguageWidget.id === element.id) {
                a11yData['aria-selected'] = true;
                a11yData['dontHighlight'] = true;
            } else {
                a11yData['aria-selected'] = false;
            }

            return a11yData;
        };

    };

    LocalTest.addLanguagePickerWidgets = function(langPicker) {
        var languageWidgets = langPicker.querySelectorAll(".languageDiv");
        for (var i = 0; i < languageWidgets.length; ++i) {
            if (ACCESSIBILITY_SUPPORTED_LANGUAGES.indexOf(languageWidgets[i].getAttribute('lang')) != -1) {
                Test.addWidget('language'+languageWidgets[i].id, new LocalTest.AccessibleLanguageDiv(languageWidgets[i], languageWidgets[i].id));
            } else {
                Test.addWidget('language'+languageWidgets[i].id, new LocalTest.LanguageDiv(languageWidgets[i]));
            }
        }
    }

    LocalTest.MetaData = function(element) {
        Test.HtmlButtonWidget.call(this, element);

        this.getAccessibilityData = function() {
            a11yData = {"accessible": true, "aria-role": "alertdialog", "aria-label": "This page allows you to choose your preferred device language. After you select a language, your Kindle will be silent for a few more moments while we complete configuration. You will then be prompted to setup a Wi-Fi connection, register your Kindle, and update to the latest Kindle software, if available. Swipe right, or drag a finger around the screen, to find the available language options. Double tap to select the option you want, and then find the Next button at the bottom of the screen and double tap to select it." };
            return a11yData;
        };

        this.isVisible = function() {
            return true;
        };
    };
    
    LocalTest.init = function() {
        Test.logger = Pillow;
        var elem = document.getElementsByClassName("lang_picker")[0];
        LocalTest.addLanguagePickerWidgets(elem);
        Test.addWidget('nextButton', new Test.HtmlButtonWidget('nextButton'));
        Test.addWidget('langPicker', new LocalTest.MetaData('langPicker'));
    };

    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();


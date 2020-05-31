
window.LocalTest = {};

/**
 * Private context for LocalTest module
 */
(function() {

    LocalTest.SpanButtonWidget = function(elem) {
        elem = Test.ensureElement(elem, 'span');
        Test.Widget.call(this, elem);

        this.isEnabled = function() {
            return (! Pillow.hasClass(elem, 'disabledClear'));
        };

        this.getValue = function() {
            return elem.textContent;
        };

        this.getAccessibilityData = function() {
            a11yData = {"accessible": true, "aria-role": "button"};
            return a11yData;
        };
    };

    LocalTest.SearchResultItemWidget = function(itemElem) {
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
            cls = cls.replace('image','').trim();
            if (cls === '') {
                return null;
            } else {
                return cls;
            }
        };

        this.getValue = function() {
            var resultsHeaderElem = document.getElementById('resultsHeader');
            //Check if this is a "Recent Search Item" or "Search Result Item"
            if (resultsHeaderElem.style.display != 'none') {
                textDivContent = itemElem.querySelector('.text-replace-field').textContent;
                return (textDivContent != "") ? textDivContent : undefined;
            } else {
                var icon = getFieldClass('icon', 'class-field');
                var primaryElem = itemElem.querySelector('.label.text-replace-field');
                var secondaryElem = itemElem.querySelector('.secondary-label.text-replace-field');
                if (icon === null) {
                    textDivContent = itemElem.querySelector('.text-replace-field').textContent;
                    return (textDivContent != "") ? textDivContent : undefined;
                } else {
                    return {
                        icon: icon,
                        primaryText: primaryElem.textContent,
                        secondaryText: secondaryElem.textContent,
                    };
                }
            }
        };

        this.isEnabled = function() {
            return (this.getValue() === undefined) ? false : true;
        };

        this.getAccessibilityData = function() {
            //We add empty list items as padding when there are not enough to fill the screen. 
            //These widgets should be marked inaccessible.
            if (this.getValue() === undefined) {
                return {"accessible": false};
            }

            var unsupportedTypes = ["Entry:Item:FreeTime", "Entry:Item:PVC", "Collection", "Entry:Item:VocabBuilder", "Entry:Item:Dictionary"];            
            var a11yData = {};
            //Check if this is a "Recent Search Item" or "Search Result Item"
            var resultsHeaderElem = document.getElementById('resultsHeader');
            var tValue = this.getValue();
            if (resultsHeaderElem.style.display != 'none' || typeof tValue == 'string' ) {
                a11yData = {"accessible": true, "aria-role": "search-history-item", "actionMap": {'tap' : 'tap'}};
            } else {
                //Return a custom role search-result-item
                a11yData = tValue;
                a11yData['accessible'] = true;
                a11yData['aria-role'] = "search-result-item";
                var docType = itemElem.querySelector('.icon.class-field');
                if(docType)
                {
                    docType = docType.getAttribute('documentType');
                    if(unsupportedTypes.indexOf(docType) >= 0)
                    {
                        a11yData['isASRSupported'] = false;
                    }
                    else
                    {
                        a11yData['actionMap'] = {'tap' : 'tap'};
                    }
                }
            }
            return a11yData;
        };
    };

    LocalTest.SingleTextItemWidget = function(itemElem) {
        itemElem = Test.ensureElement(itemElem, 'button');
        Test.HtmlButtonWidget.call(this, itemElem);

        this.getValue = function() {
            textDiv = itemElem.querySelector('.text-replace-field');
            return textDiv.textContent;
        };
    };

	LocalTest.init = function() {
		Test.logger = Pillow;
        
        Test.addWidget('title', new Test.HtmlTextContent(document.getElementById('title')));

        Test.addWidget('clear', new LocalTest.SpanButtonWidget('clear'));

        Test.addListItems('search-result-', 'results', LocalTest.SearchResultItemWidget);

        Test.addListItems('more-result-', 'moreResults', LocalTest.SingleTextItemWidget);

        Test.addWidget('none-text', new Test.HtmlTextContent(document.getElementById('noResultsTextDiv')));
	};

	LocalTest.parseOkay = true;
	LocalTest.isParsed = function() {
		return LocalTest.parseOkay;
	};

})();

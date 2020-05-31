/*
 * interrogate.js
 *
 * Copyright (c) 2015-2016 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */


/**
 * @module Test
 */
window.Test = {};

/**
 * Private context for Test module.
 */
(function() {

    var widgets = null;

    /**
     * @class BlackHole
     *
     * A logger that discards all messages.
     */
    Test.BlackHole = function() {
        this.logError = function() { };
        this.logWarn = function() { };
        this.logInfo = function() { };
        this.logDbgHigh = function() { };
        this.logDbgMid = function() { };
        this.logDbgLow = function() { };
    };

    /**
     * @class Console
     *
     * A logger class that writes to the browser console.
     */
    Test.Console = function() {
        // TODO: bind doesnt exist on the device...
        this.logError = console.error.bind(console);
        this.logWarn = console.warn.bind(console);
        this.logInfo = console.info.bind(console);
        this.logDbgHigh = console.debug.bind(console);
        this.logDbgMid = console.debug.bind(console);
        this.logDbgLow = console.debug.bind(console);
    };

    /**
     * @property logger
     *
     * A logger object.
     */
    Test.logger = new Test.BlackHole();

    var propertyQueryHandlers = {};

    var makeSimplePropertyQueryHandler = function(widgetMethodName) {
        return function(id, widget) {
            return widget[widgetMethodName] ? widget[widgetMethodName]() : null;
        };
    };

    propertyQueryHandlers.is_visible  = makeSimplePropertyQueryHandler('isVisible');
    propertyQueryHandlers.is_enabled  = makeSimplePropertyQueryHandler('isEnabled');
    propertyQueryHandlers.is_selected = makeSimplePropertyQueryHandler('isSelected');
    propertyQueryHandlers.value       = makeSimplePropertyQueryHandler('getValue');
    propertyQueryHandlers.position    = makeSimplePropertyQueryHandler('getPosition');
    propertyQueryHandlers.size        = makeSimplePropertyQueryHandler('getSize');
    propertyQueryHandlers.custom_data = makeSimplePropertyQueryHandler('getCustomData');

    var allProperties = [];
    for (var i in propertyQueryHandlers) {
        allProperties.push(i);
    }

    Test.handleQuery = function(queryString) {
        var query = JSON.parse(queryString);
        var response = function(resp) {
            if (query && query.hasOwnProperty('request_id')) {
                resp.request_id = query.request_id;
            }
            var respStr = JSON.stringify(resp);
            Pillow.logDbgPrivate('pillow-test-query', {resp: respStr});
            return respStr;
        };
        var error = function(str) {
            return response({error: str});
        };
        if (!query || typeof(query) !== 'object') {
            return error('could not parse input as JSON');
        }

        var widgetNames = Test.getWidgetNames();
        if (query.mode === 'list_widgets') {
            // TODO validate query.window?
            return response({widgets: widgetNames});
        } else if (query.mode === 'query_widgets') {
            // TODO validate query.window?
            // Find the desired widget
            if (query.widget === null) {
                var props = {};
                if (!query.properties || query.properties.indexOf('name') >= 0) {
                    props.name = window.pillowId;
                }
                // The query wants to know about the window, not a widget
                return response({properties: [props]});
            }
            var widgets = Test.getWidgets(query.widget);
            // Get the desired properties of the widget
            var props = query.properties;
            if (!props) {
                // No list was given, so return all properties
                props = allProperties;
            }
            var ret = [];
            for (var k in widgets) {
                var propVals = {};
                var widget = widgets[k];
                for (var i in props) {
                    propVals[props[i]] = propertyQueryHandlers[props[i]](props[i], widget);
                }
                ret.push(propVals);
            }
            return response({properties: ret});
        } else if (query.mode === 'list_and_query_widgets') {
            var props = {};
            var ret = [];
            var len = widgetNames.length; 
            for (var j = 0; j < len; j++) {                                                                     
                 var widgetName = widgetNames.shift();
                 var widgets = Test.getWidgets(widgetName);                                             
                 var props = query.properties;
                 if (!props) {
                     // No list was given, so return all properties
                     props = allProperties;
                 }
                 for (var k in widgets) {                                                              
                      var propVals = {};                                                                
                      var widget = widgets[k];                                                        
                      for (var i in props) {                                                           
                           propVals[props[i]] = propertyQueryHandlers[props[i]](props[i], widget);
                      }  
                      propVals["name"] = widgetName ;
                      propVals["accessibility_data"] = widget.getAccessibilityData();
                      ret.push(propVals);
                  } 
            }     
            return response({all_widget_properties: ret}); 
        } 
        else {
            return error("unknown mode: " + query.mode);
        }
    };

    /**
     * @function logElement
     * @param name  (String) A name to include in the log output
     * @param elem  (HTMLElement) An element to log (or null)
     *
     * Log some information about an element.
     */
    Test.logElement = function(name, elem) {
        var log = Test.logger.logDbgHigh;
        var str = '';
        if (elem) {
            var cur = elem;
            while (cur != null) {
                var tag = cur.tagName.toLowerCase();
                var id = cur.getAttribute('id');
                var cls = cur.getAttribute('class');
                var elemStr = '/' + tag;
                if (id || cls) {
                    elemStr += '[';
                    if (id) {
                        elemStr += 'id=';
                        elemStr += id;
                        if (cls) {
                            elemStr += ',';
                        }
                    }
                    if (cls) {
                        elemStr += 'class=';
                        elemStr += cls;
                    }
                    elemStr += ']';
                }
                str = elemStr + str;
                cur = cur.parentElement;
            }
        } else {
            str = '<null>';
        }
        log(name + ': ' + str);
    };

    /**
     * @property getWindowPosition
     *
     * A function for getting the window's position on screen.
     * This can be overwritten by tests.
     */
    Test.getWindowPosition = nativeBridge.getWindowPosition;

    /**
     * @function init
     *
     * Prepares the test widgets for querying.
     * Also calls LocalTest.init if it exists.
     *
     * Note: any widgets created before calling this function will be
     * forgotten.
     */
    Test.init = function() {
        widgets = {};
        if (LocalTest && LocalTest.init) {
            LocalTest.init();
        }
    };

    /**
     * @function addWidget
     * @param name (String)    The name of the widget
     * @param widget (Widget)  The widget
     *
     * Existing widgets cannot be overwritten.
     */
    Test.addWidget = function(name, widget) {
        if (widgets.hasOwnProperty(name)) {
            widgets[name].push(widget);
        } else {
            widgets[name] = [widget];
        }
    };

    /**
     * @function removeWidget
     * @param name (String)    The name of the widget
     */
    Test.removeWidget = function(name, widget) {
        if (widgets.hasOwnProperty(name)) {
            var arr = widgets[name];
            for (var i in arr) {
                if (arr[i] === widget) {
                    arr.splice(i, 1);
                    if (arr.length == 0) {
                        delete widgets[name];
                    }
                    return;
                }
            }
        }
        Test.logger.logWarn('pillow-test-remove-widget', {problem: 'not found', name: name});
    };

    /**
     * @function getWidgets
     * @param name (String)  The name of a widget
     * @return (Widget)      An array of all widgets with the given name
     */
    Test.getWidgets = function(name) {
        return widgets.hasOwnProperty(name) ? widgets[name] : [];
    };

    /**
     * @function getWidgetNames
     * @return (Array of String)  The names of all known widgets, sorted
     */
    Test.getWidgetNames = function() {
        var names = [];
        for (var name in widgets) {
            names.push(name);
        }
        names.sort();
        return names;
    };

    /**
     * @function ensureElement  Process an input and return a HTMLElement
     * @param    something      Any DOM element, any ID of an element, or null
     * @param    tag            The expected tag name (default 'div')
     * @return                  A DOM element with the expected tag name
     */
    Test.ensureElement = function(something, tag) {
        // default value for tag
        if (!tag) {
            tag = 'div';
        }
        // look up element by ID
        if (something instanceof String || typeof(something) === 'string') {
            something = document.getElementById(something);
        }
        // ensure that we actually have an element, and that it has the right tag
        if (!(something instanceof HTMLElement) ||
                something.tagName.toLowerCase() !== tag.toLowerCase()) {
            something = document.createElement(tag);
        }
        // return
        return something;
    };

    /**
     * @class Position
     */
    Test.Position = function(left, top) {

        /**
         * @property left (Number)
         * The left offset
         */
        Object.defineProperty(this, 'left',
                {value: left, writable: false, configurable: false, enumerable: true});

        /**
         * @property top (Number)
         * The top offset
         */
        Object.defineProperty(this, 'top',
                {value: top, writable: false, configurable: false, enumerable: true});

        Object.defineProperty(this, 'toString',
                {
                    value: function() {
                        return "(" + this.left + "," + this.top + ")";
                    },
                    writable: false,
                    configurable: false
                });
    };

    /**
     * @class Size
     */
    Test.Size = function(width, height) {

        /**
         * @property width (Number)
         * The width offset
         */
        Object.defineProperty(this, 'width',
                {value: width, writable: false, configurable: false, enumerable: true});

        /**
         * @property height (Number)
         * The height offset
         */
        Object.defineProperty(this, 'height',
                {value: height, writable: false, configurable: false, enumerable: true});

        Object.defineProperty(this, 'toString',
                {
                    value: function() {
                        return "(" + this.width + "," + this.height + ")";
                    },
                    writable: false,
                    configurable: false
                });
    };

    /**
     * @function getElementPosition
     * @param element (Element)  Any DOM element in the page
     * @return (Position)  The upper-left corner of the element (absolute on-screen coordinates)
     */
    Test.getElementPosition = function(element) {
        var w = Test.getWindowPosition();
        var r = element.getBoundingClientRect();
        return new Test.Position(w.x + r.left, w.y + r.top);
    };

    /**
     * @function getElementSize
     * @param element (Element)  Any DOM element in the page
     * @return (Size)  The size of the element
     */
    Test.getElementSize = function(element) {
        var r = element.getBoundingClientRect();
        return new Test.Size(r.width, r.height);
    };

    /**
     * @function isElementTruncated
     * @param element (Element)  Any DOM element
     * @return (Boolean)  true if the given element is truncated
     * i.e (scrollWidth > clientWidth) or (scrollHeight > clientHeight)
     */
    Test.isElementTruncated = function(element) {
        //Only HTMLElement will have these properties defined
        if (!(element instanceof HTMLElement)) return false;

        /*Search for the truncated element in this element's subtree as this element 
          could widgetize on behalf of its children*/
        var list = [];
        list.push(element);

        while(list.length) {
            var curElem = list.pop();    
            if ((curElem.scrollWidth > curElem.clientWidth) || 
                    (curElem.scrollHeight > curElem.clientHeight)) {
                return true;
            } 

            var childElems = curElem.childNodes;
            for (i=0; i<childElems.length; i++) {        
                if (childElems[i].nodeName == "#text") continue;
                list.push(childElems[i]);
            }    
        }

        return false;
    };

    /**
     * @function isElementVisible
     * @param element (Element)  Any DOM element
     * @return (Boolean)  true if the given element is displayed and fully within the viewport
     */
    Test.isElementVisible = function(element) {
        Test.logElement('isElementVisible', element);

        // Check that all of the element's ancestors are displayed.
        var cur = element;
        var prev = null;
        while (cur) {
            if (getComputedStyle(cur).display === 'none') {
                Test.logElement('ancestor is display none', cur);
                return false;
            }
            prev = cur;
            cur = cur.parentElement;
        }

        // Check that the element is in the DOM tree.
        if (prev !== document.documentElement) {
            Test.logElement('element is not in the DOM tree', element);
            return false;
        }

        // Check that the element is not scrolled itself.
        var re = element.getBoundingClientRect();
        if (element.offsetHeight != re.height ||
                element.offsetWidth != re.width) {
            Test.logger.logDbgHigh('element is scrolled');
            return false;
        }

        // Check that the element is within the window's viewport.
        // Even a partial visibility is acceptable
        // JFOUR-2227 is_visible property for menu button in chrome shows as "False" in home
        if (re.top > window.scrollY + window.innerHeight && re.bottom < window.scrollY &&
                re.left > window.scrollX + window.innerWidth && re.right < window.scrollX) {
            Test.logger.logDbgHigh('element is outside window viewport');
            return false;
        }

        // Check that the element is not scrolled away by any of its
        // parents.  This is accomplished by looking at "bounding client
        // rects".  These rects are always given in absolute coordinates
        // within the window's viewport.
        //
        // If an element is scrolled away by a parent, the element's
        // bounding client rect will be at least partially outside the
        // parent's bounding client rect.
        //
        // Note that containers whose overflow style is "visible" are
        // skipped because they cannot hide their children by scrolling
        // them away, since the children simply appear outside the
        // container.
        var container = element.parentElement;
        while (container) {
            if (getComputedStyle(container).overflow !== 'visible') {
                var rc = container.getBoundingClientRect();
                // If neither top nor bottom nor left nor right is in bounds then return not visible
                // Basically even partial visibility is returned as visible.
                // JFOUR-2227 is_visible property for menu button in chrome shows as "False" in home
                if (re.top > rc.bottom && re.bottom < rc.top &&
                        re.left > rc.right && re.right < rc.left) {
                    Test.logElement('element is outside parent viewport', container);
                    return false;
                }
            }
            container = container.parentElement;
        }

        Test.logger.logDbgHigh('element is visible');
        return true;
    };

    /**
     * @class Widget
     * @abstract
     *
     * The base class of all widgets
     */
    Test.Widget = function(element) {
        this.element = element;

        this.isVisible = function() {
            return Test.isElementVisible(element);
        };

        /**
         * @method isEnabled
         * @return (Boolean)  True if the widget is enabled
         */
        this.isEnabled = function() {
            return null;
        };

        /**
         * @method getValue
         * @return (Boolean or String)  The value of the widget
         */
        this.getValue = function() {
            return null;
        }

        /**
         * @method getPosition
         * @return (Position)  The center of the widget
         */
        this.getPosition = function() {
            return Test.getElementPosition(element);
        };

        this.getSize = function() {
            return Test.getElementSize(element);
        };

        /**
         * @method getElement
         * @return (HTMLElement)  The DOM node for this widget
         */
        this.getElement = function() {
            return element;
        };

        /**
         * @method isSelected
         * @return (Boolean)  True if this widget is selected
         *
         * The value of isSelected depends on the context:
         *   -For menu items, it means there is a check mark by the item.
         *   -For checkboxes, it means the box is checked.
         *
         * Most scalar widgets cannot be selected, in which case this method
         * always returns false.
         */
        this.isSelected = function() {
            return false;
        };
        
        /**
         * By default, assume that widgets are not accessible
         */
        this.getAccessibilityData = function() {
            return {accessible: false};
        };
        
        /**
         * None of the pillow widgets set any custom data by themselves.
         * We set truncation detection data for widgets in custom data.
         */
        this.getCustomData = function() {
            var customData = {};
            if (nativeBridge.isTruncationDetectionEnabled()) {
                customData['is_truncated'] = Test.isElementTruncated(element);
            }
            return customData;
        };
    };

    /**
     * @class HtmlTextInput
     * @param element  The HTMLInputElement with type "text"
     * 
     * A plain-old HTML text-input widget
     */
    Test.HtmlTextInput = function(element, associatedLabelName) {
        element = Test.ensureElement(element, 'input');
        Test.Widget.call(this, element);

        this.isEnabled = function() {
            return !element.disabled;
        };

        this.getValue = function() {
            return element.value;
        };

        this.getAccessibilityData = function() {
            a11yData = {"accessible": true, "aria-role": "textbox"};
            a11yData['aria-editing'] = (element === document.activeElement);
            a11yData['actionMap'] = {'tap' : 'tap'};
            var placeholder = document.getElementById("searchPlaceholder");
            if (placeholder && !this.getValue())
            {
                a11yData['aria-description'] = placeholder.innerText;
            }
            if(associatedLabelName)
            {
                a11yData['aria-labelledby'] = associatedLabelName;
            }
            return a11yData;
        };

    };

    /**
     * @class HtmlTextPasswordInput
     * @param element  The HTMLInputElement with type "text"
     * 
     * A plain-old HTML text-input widget
     */
    Test.HtmlTextPasswordInput = function(element, associatedLabelName) {
        Test.HtmlTextInput.call(this, element, associatedLabelName);

        var getAccessibilityData = this.getAccessibilityData;
        this.getAccessibilityData = function() {
            var a11yData = getAccessibilityData.call();
            a11yData['aria-role'] = "password";
            return a11yData;
        };
    };

    /**
     * @class HtmlCheckboxInput
     * @param element  The HTMLInputElement with type "checkbox"
     * 
     * A plain-old HTML checkbox widget
     */
    Test.HtmlCheckboxInput = function(element) {
        element = Test.ensureElement(element, 'input');
        Test.Widget.call(this, element);

        this.isEnabled = function() {
            return !element.disabled;
        };

        this.getValue = function() {
            return element.value === "on";
        };

        this.isSelected = this.getValue;
    };

    /**
     * @class HtmlDiv
     * @param element  The HTMLDivElement
     *
     * A plain-old HTML div
     */
    Test.HtmlDiv = function(element) {
        element = Test.ensureElement(element, 'div');
        Test.Widget.call(this, element);

        this.isEnabled = function() {
            return true;
        };

        this.getValue = function() {
            return null;
        };
    };

    /**
     * @class HtmlTextContent  A widget which displays text
     * @param element          The DOM element
     */
    Test.HtmlTextContent = function(element) {
        if (!(element instanceof HTMLElement)) {
            // ensureElement forces the element to be a div
            element = Test.ensureElement(element);
        }
        Test.Widget.call(this, element);

        this.isEnabled = function() {
            return true;
        };

        this.getValue = function() {
            return element.textContent;
        };

        this.getAccessibilityData = function() {
            a11yData = {"accessible": true, "aria-role": "label"};
            a11yData['aria-label'] = element.textContent;

            var widgets = Test.getWidgets('alert-id');
            if(widgets && widgets[0] && widgets[0].getValue() == 'screenReaderStartedLangPickerAlert')
            {
                a11yData['ignoreInitialFocus'] = true;
            }
            return a11yData;
        };
    };

    /**
     * @class HtmlImage
     * @param element  The HTMLImageElement
     *
     * A plain-old HTML image
     */
    Test.HtmlImage = function(element) {
        element = Test.ensureElement(element, 'img');
        Test.Widget.call(this, element);

        this.isEnabled = function() {
            return true;
        };

        this.getValue = function() {
            return element.src;
        };
    };

    /**
     * @class HHTMLPTag
     * @param element  The P element
     */
    Test.HTMLPTag = function(element) {
        element = Test.ensureElement(element, 'p');
        Test.Widget.call(this, element);

        this.isEnabled = function() {
            return true;
        };

        this.getValue = function() {
            return element.textContent;
        };
    };

    /**
     * @class HHTMLATag
     * @param element  The A element
     */
    Test.HTMLATag = function(element) {
        element = Test.ensureElement(element, 'a');
        Test.Widget.call(this, element);

        this.isEnabled = function() {
            return true;
        };

        this.getValue = function() {
            return element.textContent;
        };
    };

    /**
     * @class HtmlButtonWidget
     *
     * A class for HTML <button> elements
     *
     * @param elem       The DOM element of the button
     * @param textQuery  (Optional) A query selector to apply to the button element
     *                   to find the element which contains the text
     */
    Test.HtmlButtonWidget = function(elem, textQuery) {
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

        this.getAccessibilityData = function() {
            a11yData = {"accessible": true, "aria-role": "button"};
            var label = elem.getAttribute('aria-label');
            if (label) a11yData['aria-label'] = label;
            
            var isASRSupported = elem.getAttribute('isASRSupported');
            if (isASRSupported === "false") a11yData['isASRSupported'] = false;

            var widgets = Test.getWidgets('alert-id');
            if(widgets && widgets[0] && widgets[0].getValue() == 'screenReaderStartedLangPickerAlert')
            {
                a11yData['aria-labelledBy'] = 'text';
            }
            
            return a11yData;
        }
    };

    /**
     * @class HtmlButtonWidget
     *
     * A class for HTML <button> elements
     *
     * @param elem       The DOM element of the button
     * @param textQuery  (Optional) A query selector to apply to the button element
     *                   to find the element which contains the text
     */
    Test.HtmlCloseButtonWidget = function(elem, textQuery) {
        Test.HtmlButtonWidget.call(this, elem);
        var getAccessibilityData = this.getAccessibilityData;
        this.getAccessibilityData = function() {
            var a11yData = getAccessibilityData.call();
            a11yData['ignoreInitialFocus'] = true;
            return a11yData;
        };
    };
 
    /**
     * @function FlowToButtonWidget
     * @param elem  The DOM element of the button widget.
     * @param nextFlowTo The name of the next widget to flow to in accessiblity Mode.
     */
    Test.FlowToButtonWidget = function(elem, nextFlowTo) {
        Test.HtmlButtonWidget.call(this, elem);
        var getAccessibilityData = this.getAccessibilityData;
        this.getAccessibilityData = function() {
            var a11yData = getAccessibilityData.call();
            if (nextFlowTo) {
                a11yData['aria-flowto'] = nextFlowTo;
            }
 
            return a11yData;
        };
    };


 
    /**
     * @function addSliderWidget
     * @param elem       The DOM element of the DiscreteSlider
     */
    Test.addSliderWidget = function(elem) {
        elem = Test.ensureElement(elem, 'div');
        //iterates over children of light_slider
        var elemChildNodes = elem.childNodes;
        for (i = 1; i <= elemChildNodes.length; i++) {
            var widget_name = 'slider-box' + i;
            //Widget names start from 1 whereas array of elements start with index 0
            Test.addWidget(widget_name, new Test.HtmlSliderBox(elemChildNodes[i-1]));
        }
    };
    
     /**
     * @class HtmlDiscreteSlider
     *
     * A class for the discrete the slider widget control
     *
     * @param elem       The DOM element of the slider
     * @param boxConstr  The implementation of the slider box widget
     */
    Test.HtmlDiscreteSlider = function(elem, boxConstr) {
        elem = Test.ensureElement(elem, 'div');
        Test.Widget.call(this, elem);

        this.isEnabled = function() {
            return !elem.disabled;
        };

        this.getValue = function() {
            var textElem = 0;
            if (elem.getElementsByClassName("box full last").length > 0) {
                textElem = elem.getElementsByClassName("box full last")[0].firstChild.innerText;
            }
            return textElem;
        };
        
        var sliderBox = function() {
            if (boxConstr != null) {
                boxConstr(elem);
            }
        };
        sliderBox();
    };

    /**
     * @class HtmlSliderBox
     *
     * A class for each box of the discrete slider
     *
     * @param elem       The DOM element of the sliderbox
     */
    Test.HtmlSliderBox = function(elemChildNode) {    
        Test.Widget.call(this, elemChildNode);
        this.isEnabled = function() {
            return !elemChildNode.disabled;
        };
        
        this.getValue = function() {
            var textElem = 0;
            showNumbers = Pillow.hasClass(elemChildNode.parentNode, 'show-numbers');
            if (showNumbers) {
                textElem = elemChildNode.firstChild.textContent;
            }
            return textElem;
            
        };
        
        this.isSelected = function() {
            return elemChildNode.className == "box empty" ? false : true;
        }; 
    };

    /**
     * @class MenuItem
     *
     * A class for items in a standard widget_menu menu
     *
     * @param elem  (HTMLElement) The menu item element
     */
    Test.MenuItem = function(elem) {
        elem = Test.ensureElement(elem, 'button');
        Test.HtmlButtonWidget.call(this, elem, '.label');

        this.isSelected = function() {
            return Boolean(elem.querySelector('.icon.check'));
        };
    };

    /**
     * @function Test.ListContainerWidget  Parent container widget for List items created by widget_list
     * @param elem  (HTMLElement) The container of the list items
     */
    Test.ListContainerWidget = function(elem) {
        elem = Test.ensureElement(elem, 'div');
        Test.Widget.call(this, elem);
        
        this.getAccessibilityData = function() {
            var a11yData = {"accessible": true, "aria-role": "listContainer"};

            var size = elem.getAttribute('aria-setsize');
            if (size) a11yData['aria-setsize'] = parseFloat(size);

            var scrollTopPct = elem.getAttribute('scroll-extent-top-pct');
            if(scrollTopPct) a11yData['scroll-extent-top-pct'] = parseFloat(scrollTopPct);

            var scrollBottomPct = elem.getAttribute('scroll-extent-bottom-pct');
            if(scrollBottomPct) a11yData['scroll-extent-bottom-pct'] = parseFloat(scrollBottomPct);

            return a11yData;
        };
    };

    /**
     * @function Test.ListItemWidget Widget for each list item created by widget_list.
     *           This adds standard aria properties to the list items.
     * @param itemElem  (HTMLElement) The container of the list items
     * @param parent Widget ID of the parent container widget
     * @param baseClass The baseClass constructor to construct remaining properties
     */
    Test.ListItemWidget = function(itemElem, parent, pos, baseClass) {
        itemElem = Test.ensureElement(itemElem, 'button');
        baseClass.call(this, itemElem);
        
        var getAccessibilityData = this.getAccessibilityData;
        this.getAccessibilityData = function() {
            var a11yData = getAccessibilityData.call(this);
            a11yData['aria-posinset'] = pos;
            a11yData['parent'] = parent;
            return a11yData;
        };
    };
    
    /**
     * @function addListItems  Add widgets for the items in a list created by widget_list
     * @param idPrefix  (String) A prefix for the ID of each list item
     * @param listElem  (HTMLElement) The container of the list items
     * @param itemCtor  (Function) The constructor function for the item widget objects
     */
    Test.addListItems = function(idPrefix, listElem, itemCtor, scrollBarCtor) {
        listElem = Test.ensureElement(listElem, 'div');
        var parentContainerWidgetId = idPrefix + "container";
        Test.addWidget(parentContainerWidgetId, new Test.ListContainerWidget(listElem));
        var previousItems = [];
        var adder = function() {
            for (var i in previousItems) {
                Test.removeWidget.apply(Test, previousItems[i]);
            }
            previousItems = [];
            var itemElems = listElem.querySelectorAll('.items > .item');
            for (var i = 0; i < itemElems.length; ++i) { 
                var id = idPrefix + i;
                if(!Pillow.hasClass(itemElems[i], 'empty')) {
                        var widget = new Test.ListItemWidget(itemElems[i], parentContainerWidgetId, i + 1, itemCtor);
                        previousItems.push([id, widget]);
                        Test.addWidget(id, widget);
                }
            }
        };
        adder();
        listElem.onvisualchange = adder;
        if(typeof scrollBarCtor !== 'undefined') {
            scrollBars = listElem.querySelectorAll(".lab126ScrollHandle");
            for(var i = 0; i < scrollBars.length; i++) {
                var scrollBarWidget = new scrollBarCtor(scrollBars[i]);
                Test.addWidget(scrollBars[i].className , scrollBarWidget);
            }
        }
    };

    /**
     * @function addMenuItems  Add widgets for the items in a menu created by widget_menu
     * @param idPrefix  (String) A prefix for the ID of each list item
     * @param elem      (HTMLElement) The container of the list items
     */
    Test.addMenuItems = function(idPrefix, elem) {
        Test.addListItems(idPrefix, elem, Test.MenuItem);
    };

    /**
     * @function addButtonBarButtons  Add widgets for the buttons in a bar created by widget_button_bar
     * @param idPrefix   (String) A prefix for the ID of each list item
     * @param container  (HTMLElement) The container of the buttons
     */
    Test.addButtonBarButtons = function(idPrefix, container) {
        container = Test.ensureElement(container, 'div');
        var previousItems = [];
        var adder = function() {
            for (var i in previousItems) {
                Test.removeWidget.apply(Test, previousItems[i]);
            }
            previousItems = [];
            var elems = container.querySelectorAll('button');
            for (var i = 0; i < elems.length; ++i) {
                var id = idPrefix + elems[i].meaning;
                var widget = new Test.HtmlButtonWidget(elems[i], '.button-text');
                previousItems.push([id, widget]);
                Test.addWidget(id, widget);
            }
        };
        adder();
        container.onvisualchange = adder;
    };

    /**
     * @class SelectorOptionWidget  One option of a SelectorWidget
     * @param par                   (SelectorWidget) The container of the options
     * @param element               (HTMLElement) The DOM element of this option
     */
    Test.SelectorOptionWidget = function(container, element) {
        element = Test.ensureElement(element, 'div');
        Test.Widget.call(this, element);

        this.isEnabled = function() {
            return !Boolean(container.getAttribute('class').match(/\blab126SelectorDisabled\b/));
        };

        this.getValue = function() {
            return element.textContent;
        };

        this.isVisible = function() {
            return LocalTest.isAdvancedEntryElementVisible(element);
        };

        this.isSelected = function() {
            return Pillow.hasClass(element, 'lab126SelectorSelected');
        };

        this.getAccessibilityData = function() {
            a11yData = {"accessible": true, "aria-role": "radioButton"};
            var isSelected = this.isSelected();
            a11yData['aria-selected'] = isSelected;
            if (isSelected) {
                a11yData['dontHighlight'] = true;
            }
            return a11yData;
        };
    };
   
    /**
     *@function ALertTitleWidget  widget-text that should be announced when dialog pops up
     *@param elem  (HTMLElement) The DOM element of this option
     */
    
    Test.AlertTitleWidget = function(elem) {
        Test.HtmlTextContent.call(this, elem);

        this.getAccessibilityData = function() {
            var a11yData = {"accessible": true, "aria-role": "alertdialog"};
            return a11yData;
        };
    };

    /**
     * @function addSelectorOptions  Add widgets for the options of a selector created by widget_selector
     * @param idPrefix   (String) A prefix for the ID of each option
     * @param container  (HTMLElement) The container of the options
     * @param itemCtor  (function) Optional constructor for elements
     */
    Test.addSelectorOptions = function(idPrefix, container, itemCtor) {
        container = Test.ensureElement(container, 'div');
        var elems = container.querySelectorAll('.lab126SelectorSection');
        for (var i = 0; i < elems.length; ++i) {
            if (itemCtor) {
                Test.addWidget(idPrefix + elems[i].meaning, new itemCtor(container, elems[i]));
            } else {
                Test.addWidget(idPrefix + elems[i].meaning, new Test.SelectorOptionWidget(container, elems[i]));
            }
        }
    };

    Test.parseOkay = true;
    Test.isParsed = function() {
        return Test.parseOkay;
    };
})();

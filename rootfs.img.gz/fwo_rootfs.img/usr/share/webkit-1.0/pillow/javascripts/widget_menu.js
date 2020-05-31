/*
 * widget_menu.js
 *
 * Copyright 2012 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

var MenuWidget = function(containerId, userOptions) {

    const DEFAULT_OPTIONS = {
        handler: function(item) { },
        initialMaxVisibleItems: 9,
        xor: true,
        strings: {},
        showIcons: false
    };

    var options;
    var listWidget;
    var containerElem;

    var updateContainerClass = function() {
        if (options.showIcons) {
            Pillow.addClass(containerElem, 'with-icons');
        } else {
            Pillow.removeClass(containerElem, 'with-icons');
        }
    };

    /**
     * @method setShowIcons  Set whether menu item icons are shown
     * @param showIcons  (Boolean) True if icons should be shown
     */
    this.setShowIcons = function(showIcons) {
        options.showIcons = showIcons;
        updateContainerClass();
    };

    var renderItemContents = function(item) {
        // localize
        if (!item.label) {
            item.label = options.strings[item.id];
        }

        // translate disabled state for widget_list
        item.disabled = item.state === 'disabled';
    };

    /**
     * @method renderItem  Render a single item
     * @param item  The item object, which must have a positive position
     */
    this.renderItem = function(item) {
        if (item && item.hasOwnProperty('position') && item.position >= 0) {
            renderItemContents(item);
            listWidget.renderItem(item);
        }
    };

    /**
     * @method setItems       Set the menu's items
     * @param  incoming       An array of the items
     */
    this.setItems = function(incoming) {
        var items = [];

        // remove hidden items
        for (var i in incoming) {
            var item = incoming[i];
            if (item.state === 'enabled' || item.state === 'disabled') {
                items.push(item);
            }
        }

        var maxSoFar = -1;
        for (var i = 0; i < items.length; ++i) {
            var item = items[i];

            // for each negative-index item, determine its positive position
            if (item.position == null) {
                item.position = -1;
            }
            if (item.position < 0) {
                item.position += maxSoFar + 2;
                if (item.position < 0) {
                    item.position = 0;
                }
            }
            if (item.position > maxSoFar) {
                maxSoFar = item.position;
            }

            renderItemContents(item);
        }

        // sort the items
        items.sort(function(a, b) { return a.position - b.position; });

        // update the display
        listWidget.setItems(items);
    };

    var init = function() {
        options = {};
        for (k in DEFAULT_OPTIONS) {
            if (userOptions.hasOwnProperty(k)) {
                options[k] = userOptions[k];
            } else {
                options[k] = DEFAULT_OPTIONS[k];
            }
        }
        containerElem = document.getElementById(containerId);
        if (!containerElem) {
            Pillow.logError('pillow-menu-no-container');
        }
        updateContainerClass();
        listWidget = new ListWidget(containerId, {
            fields: ['label', 'icon'],
            handler: options.handler,
            initialMaxVisibleItems: options.initialMaxVisibleItems,
            showScrollBar: true,
            xor: options.xor
        });
        this.scrollUp = Pillow.bind(listWidget, 'scrollUp');
        this.scrollDown = Pillow.bind(listWidget, 'scrollDown');
        this.setScrollOffset = Pillow.bind(listWidget, 'setScrollOffset');
        this.setMaxVisibleItems = Pillow.bind(listWidget, 'setMaxVisibleItems');
        this.setDisabled = Pillow.bind(listWidget, 'setDisabled');
    };

    init.call(this);
};


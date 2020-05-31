/*
 * search_domain.js
 *
 * Copyright 2013 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */
 
/**
 * @class This Pillow.Case displays a search domain selection dialog.
 * @extends Pillow.Case
 */
Pillow.SearchDomain = function() {
    var parent = Pillow.extend(this, new Pillow.Case('SearchDomain'));

    const SEARCH_BAR_PILLOW_CASE = 'search_bar';
    const SCREEN_MARGIN = Pillow.pointsToPixels(6.8);
    const MAX_ITEMS_PORTRAIT = 6;
    const MAX_ITEMS_LANDSCAPE = 3;
    
    var listWidget = null;
    var windowTitle = null;
    var dialogElem = null;
    var activeId = null;

    // Keyboard type for search domain
    var SearchDomainKbTable = {
        domainLabels: {
            website: 'web',
        },
    };
    
    /**
     * Sends the selection state back to the search bar.
     * @inner
     */
    var sendSelection = function(item) {
        var message = JSON.stringify({ activeSearchDomainId: item.id, kbType: item.kbType });
        nativeBridge.messagePillowCase(SEARCH_BAR_PILLOW_CASE, message);
    };

    /**
     * Short-hand to add an event listener to the provided element.
     * @inner
     * @param {HTMLElement} element Element to attach listener to
     * @param {String} eventName Name of HTML event to listen for
     * @param {Function} callback Function to call when event triggers
     * @param {Boolean} [capture] Optionally capture instead of bubble
     */
    var addEvent = function(element, eventName, callback, capture) {
        element.addEventListener(eventName, callback, capture || false);
    };
    
    /**
     * handle focus event for search domain window
      * @inner
      * @methodOf Pillow.searchDomain#
      * @param {Event} event
     */
    var onWindowFocus = function(event){
        var message = JSON.stringify({
            searchDomainFocusInfo: true
        });
        nativeBridge.messagePillowCase(SEARCH_BAR_PILLOW_CASE, message);
    };
    
    /**
     * handle blur event for search domain window
     * @inner
     * @methodOf Pillow.searchDomain#
     * @param {Event} event
     */
    var onWindowBlur = function(event){
        var message = JSON.stringify({
            searchDomainFocusInfo: false
        });
        nativeBridge.messagePillowCase(SEARCH_BAR_PILLOW_CASE, message);
    };
    
    /**
     * Sets up the dialog with Pillow and prepares the interface.
     * @private
     */
    this.onLoad = function() {
        Pillow.setOption(OPTION_SEND_DELETE_EVENTS, true);

        var maxVisibleItems = getMaxVisibleItems();
        listWidget = new ListWidget('domains', {
            fields: ['description', 'selected-icon', 'arrow-icon'],
            handler: sendSelection,
            initialMaxVisibleItems: maxVisibleItems,
            showScrollBar: true
        });
        this.swipeDown = Pillow.bind(listWidget, 'scrollUp');
        this.swipeUp = Pillow.bind(listWidget, 'scrollDown');

        windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, 'searchDomains');
        windowTitle.withChanges(function() {
                this.addParam(WINMGR.KEY.WIN_IS_MODAL, WINMGR.MODALITY.DISMISSIBLE_MODAL);
                this.addParam(WINMGR.KEY.HIDE_DIALOG, WINMGR.DIALOG_HIDE.BACKGROUND);
                this.addParam(WINMGR.KEY.CHROME_DIALOG, true);
                this.addParam(WINMGR.KEY.TAP_AWAY_CHILD, 'search_bar');
                this.addParam(WINMGR.KEY.TAP_AWAY_BUTTON, 'domain');
            });
        
        dialogElem = document.getElementById('dialog');

        addEvent(window, 'blur', Pillow.bind(this, onWindowBlur));
        addEvent(window, 'focus', Pillow.bind(this, onWindowFocus));
        
        nativeBridge.showMe();

        parent(this).onLoad();
    };

    this.setPosition = function(screenCenter) {
        setDialogPosition(
                dialogElem, screenCenter,
                GROW_LEFT_FIRST, SCREEN_MARGIN);
    };

    /**
     * Clears the list of domains and adds these domains to the list with the
     * active domain selected.
     * @param {Object[]} domains Ids and optionally labels for the domains
     * @param {String} activeId The currently selected domain
     */
    this.setDomains = function(domains, newActiveId) {
        activeId = newActiveId;
        for (var i in domains) {
            var domain = domains[i];
            domain.description = domain.description || domain.label ||
                                 SearchDomainStringTable.domainLabels[domain.id];
            domain['kbType'] = SearchDomainKbTable.domainLabels[domain.id] || 'abc';
            domain['selected-icon'] = domain.id === activeId ? 'selected' : null;
            domain['arrow-icon'] = domain.id === 'deviceSearch' ? 'selected' : null;
        }
        
        var maxVisibleItems = getMaxVisibleItems();
        if(domains.length > maxVisibleItems) {

            // If the preferred width is not provided compute and set proper width to the list
            if(SearchDomainStringTable.offsetWidth === null || SearchDomainStringTable.offsetWidth === undefined) {
            	SearchDomainStringTable.offsetWidth = listWidget.setProperListWidgetSize(domains);
            }
            // Set the proper width.
            dialog.style.width = SearchDomainStringTable.offsetWidth;
            listWidget.clear();
        }

        listWidget.setItems(domains);
        nativeBridge.setWindowSize(dialog.offsetWidth, dialog.offsetHeight);
    };
    
    /**
     * returns the maximum visible items in the search domain based on device orientation. 
     */
    var getMaxVisibleItems = function() {
        var orientation = nativeBridge.getOrientation(); 
        return (orientation === 'L' || orientation === 'R') ? MAX_ITEMS_LANDSCAPE : MAX_ITEMS_PORTRAIT;
    };

    /**
     * Called by the search bar to show the dialog.
     */
    this.show = function() {
        windowTitle.removeParam(WINMGR.KEY.HIDE_DIALOG);
    };

    /**
     * Called by the search bar to hide the dialog.
     */
    this.hide = function() {
        windowTitle.addParam(WINMGR.KEY.HIDE_DIALOG, WINMGR.DIALOG_HIDE.BACKGROUND);
    };

    /**
     * Called by the search bar to close the dialog.
     */
    this.close = function() {
        nativeBridge.dismissMe();
    };

    /**
     * Called if our window has been forcibly destroyed
     */
    this.windowDestroyed = function() {
        var message = JSON.stringify({
            activeSearchDomainId: activeId,
            searchDomainsDialogDestroyed: true
        });
        nativeBridge.messagePillowCase(SEARCH_BAR_PILLOW_CASE, message);
    };

    /**
     * Called when the user taps away
     */
    this.windowDeleteEvent = function() {
        this.hide();
        var message = JSON.stringify({
            activeSearchDomainId: activeId
        });
        nativeBridge.messagePillowCase(SEARCH_BAR_PILLOW_CASE, message);
    };

    Pillow.logWrapObject('Pillow.SearchDomain', this);
};

var searchDomain = new Pillow.SearchDomain();
searchDomain.register();

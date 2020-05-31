/*
 * search_bar.js
 *
 * Copyright (c) 2012-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * @class This Pillow.Case manages the Search Bar chrome just below the status
 *        bar.  Be sure to call #register() to set it up.
 * @extends Pillow.Case
 */
Pillow.SearchBar = function() {
    var parent = Pillow.extend(this, new Pillow.Case('SearchBar'));

    const NAME = 'Pillow.SearchBar';
    const APP_MANAGER_ID = 'com.lab126.appmgrd';
    const STORE_ID = 'app://com.lab126.store';
    const BROWSER_ID = 'app://com.lab126.browser';
    const PAYMENT_ID = 'app://com.lab126.payment';
    const HOME_ID = 'app://com.lab126.booklet.home';
    const DISCOVERY_ID = 'app://com.lab126.booklet.discovery';
    const BADGE_ID = 'app://com.lab126.booklet.badges';
    const READER_ID = 'app://com.lab126.booklet.reader';
    const DEFAULT_ICON = 'assets/search_bar/paper_icon.png';
    const DISCOVERY_SERVICE = "com.lab126.discoveryservice";
    const DISCOVERY_ACTIVITY_PROPERTY = "newActivitiesAvailableProp";
    const DPM_SERVICE = "com.lab126.dpmManager";
    const GET_CONTROL_STATUS = "getControlStatus";
    const BADGE_SERVICE = "com.lab126.badgeservice";
    const BADGE_ACTIVITY_PROPERTY = "newBadgeAvailableProp";
    const FREETIME_SERVICE = "com.lab126.freetime";
    const FREETIME_SUBSCRIPTION_STATUS_PROPERTY = "subscriptionStatus";
    const DYNCONFIG_KFTU_SUPPORTED = "kftu.supported";
    const AMAZON_REGISTRATION_SERVICE = "com.lab126.amazonRegistrationService";
    const IS_REGISTERED_PROPERTY = "isRegistered";
    const DYNCONFIG_GROK_STATE = "grok.state";
    const SETTINGS_ID = 'app://com.lab126.booklet.settings';

    const GROK_STATUS_ENABLED = 0;
    const GROK_STATUS_BLOCKED_PARENTAL = 2;
    const GROK_SUPPORTED_STATE = "supported";
    const KFTU_SUPPORTED_VALUE = "true";
    
    const LIPC_PILLOW_SOURCE = "com.lab126.pillow";
    const DEMO_MODE_FILE_FLAG = "/var/local/system/DEMO_MODE";

    const FREE_TIME_CONTROL = 3;

    const PROGRESS_STYLE = '-webkit-gradient(linear, left top, right top, color-stop(%, #999), color-stop(%, #FFF))';

    const STANDARD_BUTTONS = ['back', 'home', 'periodical-home',
                              'periodical-contents', 'blog-home', 'forward',
                              'store', 'font', 'refresh', 'cancel', 'menu',
                              'quickActions', 'discovery', 'badge', 'character'];

    const SEARCH_DOMAIN_PILLOW_CASE = 'search_domain';
    const SEARCH_RESULTS_PILLOW_CASE = 'search_results';
    const SYSTEM_MENU_PILLOW_CASE = 'system_menu';
    const QUICK_ACTIONS_PILLOW_CASE = 'quick_actions';

    const DEVICE_SEARCH_DOMAIN = {
        id: 'deviceSearch'
    }

    const DISCOVERY_SEARCH_DOMAIN = {
          id: 'discovery',
          launcher: DISCOVERY_ID + '?searchType=content&searchTerm=', 
          resultsSrc: 'com.lab126.grokservice',
          resultsProp: 'searchRequest',
          showResultsPopup: true
    };

    // setting init value to backup, expect dyn config will override
    var baiduSearchUrl = SearchBarStringTable.baiduSearch;
    const BAIDU_SEARCH_DOMAIN = { id: 'baiduSearch',
                               launcher: function (query) {
                                   return BROWSER_ID + '?view=' +
                                          encodeURIComponent( baiduSearchUrl +
                                                            encodeURIComponent(query));
                               }
                             };

    const URL_DOMAIN_ID = 'website';
    const STORE_DOMAIN_ID = 'store';
    const DISCOVERY_DOMAIN_ID = 'discovery';

    // These are properties to set over LIPC
    const BUTTON_CLICKED_PROPERTY = 'searchBarButtonSelected';
    const SEARCH_SUBMIT_PROPERTY = 'searchSelection';

    const HAS_PHYSICAL_HOME = nativeBridge.devcapIsAvailable(DEVCAP_BUTTON_HOME);

    const DIALOG_CLOSED = 1;
    const DIALOG_HIDDEN = 2;
    const DIALOG_ACTIVE = 3;

    const DROP_DOWN_VISIBLE_CLASS = 'drop-down-visible';
    const DISABLED_OVERRIDE_FLAG = 'pillowDisabledOverride';

    const CHINESE_OBFUSCATED_MARKETPLACE = 'AAHKV2X7AFYLW';

    const FILE_PATH_PREFIX = 'file:///mnt/us/documents/';

    // These constants refer to the number of results to be shown 
    // in results popup in different mode
    const NO_OF_ROWS_IN_PORTRAIT  = 6;
    const NO_OF_ROWS_IN_LANDSCAPE = 3;
    
    var m_numberOfResultsInPopUp;
    
    const UNIFIED_DOMAIN = { id: 'unified', launcher: HOME_ID + '?searchType=unified&searchTerm='};

    const CATALOG_DOMAIN = { id: 'catalog', launcher: HOME_ID + '?searchType=content&searchTerm='};

    const STORE_DOMAIN = { id: 'store', launcher: STORE_ID + '?source=pillow&action=search&query='};

    const STORE_SECONDARY_SUGGESTIONS_REF_TAG = "ss_ss"	

    const STORE_SECONDARY_DOMAIN = { id: 'store', launcher: STORE_ID + '?source=pillow&action=search&ref=' + STORE_SECONDARY_SUGGESTIONS_REF_TAG + '&query='};


    const DICTIONARY_DOMAIN = { id: 'dictionary', launcher: READER_ID + '?plugin=Index&term='};

    const STORE_SECONDARY_SUGGESTIONS_DOMAIN = {
        launcherDomain: STORE_SECONDARY_DOMAIN,
        imageStyle: 'store',
        resultsSrc: 'com.lab126.instantSearch',
        resultsProp: 'storeSuggestionsRequest',
        initializeProp: 'initializeSearch',
        isSearchRestricted: function() {
            return m_dom.customButtons.store.disabled;
        }
    };

    const TITLE_AUTHOR_DOMAIN = { id: 'title_author',
        searchSuggestions : { imageStyle: 'book' },
		launcher: HOME_ID + '?searchType=unified&searchTerm=',
        resultsSrc: 'com.lab126.instantSearch',
        resultsProp: 'searchRequest',
        showResultsPopup: true,
        secondarySuggestionsDomain: STORE_SECONDARY_SUGGESTIONS_DOMAIN
    };

    var m_defaultSearchDomains = [
        /*{ id: 'sample',
          launcher: HOME_ID + '?searchTerm=',
          label: 'Sample',
          showResultsPopup: true,
          resultsSrc: 'com.lab126.sampleSearchProvider',
          resultsProp: 'resultsQuery'
        },*/
        TITLE_AUTHOR_DOMAIN,
        UNIFIED_DOMAIN,
        CATALOG_DOMAIN,
        STORE_DOMAIN,
        DICTIONARY_DOMAIN
    ];

    var m_noPopupList = ['google', 'Index', 'website', 'doubanSearch', 'baiduBaike', 'baiduSearch'];
    var m_noSaveHistoryList = ['google', 'website', 'doubanSearch', 'baiduBaike', 'baiduSearch'];
    var m_oldDomain;
    
    var m_profileName = 'default';
    var m_searchDomains = null;
    var m_activeSearchDomain = null;
    var m_searchIsActive = false;
    var m_searchViewSetDirectly = false;
    var m_searchStringSetDirectly;
    var m_activateOnNextFocus = false;
    var m_domainDialogState = DIALOG_CLOSED;
    var m_resultsDialogState = DIALOG_CLOSED;
    var m_progress = null;
    var m_visibleProgress = 0; // the progress level last shown on-screen
    var m_stickyText = "";
    var m_stickyUrl = "";
    var m_showUrlOnBlur = false;
    var m_textAutoSelected = false;
    var m_profileDetails = {};
    var m_windowHasFocus = false;
    var m_visible = false;
    var m_xorButtons = {};
    var m_windowTitle = null;
    var m_addBaidu = false;
    var m_isDemoMode = nativeBridge.checkFileFlag(DEMO_MODE_FILE_FLAG);
    var m_displayGrokButton = (m_isDemoMode) ? false : (nativeBridge.getDynamicConfigValue(DYNCONFIG_GROK_STATE) === GROK_SUPPORTED_STATE) && (nativeBridge.getIntLipcProperty(DPM_SERVICE, GET_CONTROL_STATUS) !== FREE_TIME_CONTROL);
    var m_displayBadgeButton = nativeBridge.getIntLipcProperty(DPM_SERVICE, GET_CONTROL_STATUS) === FREE_TIME_CONTROL;
    var m_displayCharacterButton = nativeBridge.getIntLipcProperty(DPM_SERVICE, GET_CONTROL_STATUS) === FREE_TIME_CONTROL;

    var m_appStateCache = null;

    var m_isSearchDomainWindowInfocus = false;

    var m_isLowMemory = false;

    var m_searchHistory = new RecentSearches();

    var m_keyboard = function(){
        const KB_CLOSED = 0;
        const KB_PENDING = 1;
        const KB_OPEN = 2;
        var m_kbState = KB_CLOSED;

        var showKb = function(type){
            // expect a KB to draw before flash
            nativeBridge.createFlashTrigger(FLASH_TRIGGER_TYPE_WAIT_FOR_KB_SHOW, FLASH_TRIGGER_FIDELITY_FAST_FULL, 
                    2000, 0);
            nativeBridge.showKb(type || 'abc');
        };

        var hideKb = function(){
            // expect KB to go away before flash
            nativeBridge.createFlashTrigger(FLASH_TRIGGER_TYPE_WAIT_FOR_KB_HIDE, FLASH_TRIGGER_FIDELITY_FAST_FULL, 
                    2000, 0);
            nativeBridge.hideKb();
        };

        return {
            open : function(){
                // open if not opened
                if (m_kbState !== KB_OPEN){
                    showKb(m_activeSearchDomain.keyboard);
                    m_kbState = KB_OPEN;
                }
            },
            close : function(){
                // close if not already closed
                if (m_kbState !== KB_CLOSED){
                    hideKb();
                    m_kbState = KB_CLOSED;
                }
            },
            refresh : function(){
                // refresh kb if it is already opened
                if (m_kbState === KB_OPEN){
                    showKb(m_activeSearchDomain.keyboard);
                 }
            },
            delayedOpen : function(){
                // set a delayed open into place if
                // closed
                if (m_kbState === KB_CLOSED){
                    m_kbState = KB_PENDING;
                    setTimeout(function() {
                        // validate we are still pending
                        if (m_kbState === KB_PENDING){
                            showKb(m_activeSearchDomain.keyboard);
                            m_kbState = KB_OPEN;
                        }
                    }, 20);
                }
            }
        }
    }();

    
    var clearPlaceholder = function() {
        var placeholder = document.getElementById("searchPlaceholder");
        placeholder.style.display = "none";
        var updateSearchControls = false;
        if (m_display.goButton.search !== "") {
            updateSearchControls = true;
        }
        m_display.goButton.search = "";
        if (updateSearchControls) {
            updateControls("search");
        }
    }

    var showPlaceholder = function() {
        if (m_dom.searchInput.value.trim() !== "" || m_activeSearchDomain.id === URL_DOMAIN_ID) {
            return;
        }
        m_display.goButton.search = "none";
        updateControls("search");
        var placeholderText = PlaceHolderTextStringTable[m_activeSearchDomain.id] || m_activeSearchDomain.label;
        var placeholder = document.getElementById("searchPlaceholder");
        placeholder.innerText = placeholderText;
        placeholder.style.display = "block";
    }
    /**
     * Fill in the search input field from the sticky text, and make that text
     * be selected.
     */
    var fillAndSelectInputFromSticky = function() {
        //TODO: Since this does not serve any purpose anymore, remove all references to getting and setting stickys
        //m_dom.searchInput.value = getSticky();
        //if (m_dom.searchInput.value) {
        //    m_dom.searchInput.select();
        //    m_textAutoSelected = true;
        //}
    };

    var getDropDownPositionForQuickActions = function() {
        var pos = Pillow.getPositionOnScreen(m_dom.customButtons['quickActions']);
        pos.x = 0;
        return pos;
    };

    var getDropDownPositionFromButton = function(button) {
        var pos = Pillow.getPositionOnScreen(button);
        pos.x += button.offsetWidth / 2;
        pos.y += button.offsetHeight;
        return pos;
    };

    /**
     * This structure defines what should be displayed in each state.
     *
     * The states are normal, search, and progress.
     *
     * Search: the search input has focus.
     * Progress: the search input is overlayed with a progress bar.
     * Normal: none of the above.
     *
     * The normal state values are the defaults, and are mutated at run-time
     * based on the client's profile.
     *
     * The values for other states cannot be changed by the client.
     */
    var m_display = {
        customButtons: {
            'back': { search: 'none' },
            'home': { search: 'none' },
            'periodical-home': { search: 'none', count: true },
            'periodical-contents': { search: 'none', count: true },
            'blog-home': { search: 'none', count: true },
            'forward': { search: 'none', count: true },
            'store': { search: 'none', count: true },
            'font': { search: 'none', count: true },
            'refresh': { search: 'none', progress: 'none', noFlashOnChange: true },
            'cancel': { search: 'none', progress: '', noFlashOnChange: true },
            'menu': { search: 'none' },
            'quickActions': { search: 'none', count: true },
            'discovery': { search: 'none', count: true },
            'badge': { search: 'none', count: true },
            'character': { search: 'none', count: true }
        },
        searchButton: { search: 'none' },
        wideSearchButton: { search: 'none' },
        exitButton: { search: '' },
        inputContainer: { search: '', progress: '' },
        searchIcon: {},
        iconButton: {},
        searchInput: { search: '' },
        domainSelect: {search: 'none'},
        goButton: { search: '' },
        spacer1: { search: 'none' },
        spacer1w: { search: 'none' },
        spacerMid: { search: 'none' },
        spacer2: { search: 'none' },
        spacer2w: { search: 'none' }
    };

    var m_dom = { customButtons: {} };
    var m_dropDownButtons = {};
    var m_profiles = {
        'browser': function() {
            m_display.customButtons['quickActions'].normal = '';
            m_display.customButtons['store'].normal = 'none';
            // Dont show discovery entry point in browser.
            m_display.customButtons['discovery'].normal = 'none';
            m_display.customButtons['badge'].normal = 'none';
            m_display.customButtons['character'].normal = m_displayCharacterButton ? '' : 'none';
            m_display.searchButton.normal = 'none';
            m_display.wideSearchButton.normal = 'none';
            m_display.inputContainer.normal = '';
            m_display.searchIcon.normal = 'none';
            m_display.searchIcon.search = 'none';
            m_display.iconButton.normal = '';
            m_display.domainSelect.search = 'none';
            m_display.domainSelect.normal = 'none';
            m_display.searchInput.normal = '';
            m_display.spacer1.normal = 'none';
            m_display.spacer2.normal = '';
            m_showUrlOnBlur = true;
        },
        'default': function() {
            for (var c = 0; c < STANDARD_BUTTONS.length; ++c) {
                m_display.customButtons[STANDARD_BUTTONS[c]].normal = 'none';
                var button_dom = m_dom.customButtons[STANDARD_BUTTONS[c]];
                if (!button_dom[DISABLED_OVERRIDE_FLAG]) {
                    button_dom.disabled = false;
                }
            }

            var whitneyOnly = HAS_PHYSICAL_HOME ? '' :  'none';
            var celesteOnly = HAS_PHYSICAL_HOME ? 'none' : '';

            m_display.customButtons['back'].normal = '';
            m_display.customButtons['menu'].normal = '';
            m_display.customButtons['home'].normal = celesteOnly;
            m_display.customButtons['store'].normal = m_displayCharacterButton ? 'none' : '';
            m_display.customButtons['quickActions'].normal = '';
            m_display.customButtons['discovery'].normal = m_displayGrokButton ? '' : 'none';
            m_display.customButtons['character'].normal = m_displayCharacterButton ? '' : 'none';
            m_display.customButtons['badge'].normal = m_displayBadgeButton ? '' : 'none';
            m_display.searchButton.normal = 'none';
	    m_display.searchButton.state = '';
            m_display.wideSearchButton.normal = '';
            m_display.exitButton.normal = 'none';
            m_display.inputContainer.normal = 'none';
            m_display.searchIcon.normal = '';
            m_display.searchIcon.search = '';
            m_display.iconButton.normal = 'none';
            m_display.searchInput.normal = 'none';
            m_display.domainSelect.normal = 'none';
            m_display.domainSelect.search = 'none';
            m_display.goButton.normal = 'none';

            m_display.spacer1.normal = 'none';
            m_display.spacer2.normal = celesteOnly;
            m_display.spacer1w.normal = whitneyOnly;
            m_display.spacerMid.normal = whitneyOnly;
            m_display.spacer2w.normal = whitneyOnly;

            m_showUrlOnBlur = false;
        },
	'tutorial' : function() {
		// profile for OOBE tutorial
	},
        'hidden': function() {
            /**
             * This profile is used by KDK applications, and anyone else who
             * doesn't want search to be accessible. We always use the flexible
             * spacer on the right. On Celeste, the buttons are centered
             * between the two flexible spacers. On Whitney, the buttons are
             * pushed up against the fixed spacer on the left.
             */
            m_display.searchButton.normal = 'none';
            m_display.wideSearchButton.normal = 'none';
            m_display.spacerMid.normal = 'none';
            m_display.spacer2.normal = '';
            m_display.spacer2w.normal = 'none';
        },
        'storeProfile': function() {
            /**
             * This profile is used by the store during normal operation. It
             * has a wide search button that looks like a search field, which
             * on Celeste is different from the normal search button.
             */
            m_display.searchButton.normal = 'none';
            m_display.wideSearchButton.normal = '';
            // Dont show discovery entry point in store.
            m_display.customButtons['discovery'].normal = 'none';
            m_display.customButtons['badge'].normal = 'none';
            m_display.customButtons['character'].normal = m_displayCharacterButton ? '' : 'none';
            if (!HAS_PHYSICAL_HOME) {
                /**
                 * On Celeste, we hide the flexible spacers to allow the wide
                 * search button to take up the extra space.
                 */
                m_display.spacer1.normal = 'none';
                m_display.spacer2.normal = '';
            }
        },
        'storeInit': function() {
            /**
             * This profile is used during store initialization.  It has no
             * search button because the store isn't ready for search at this
             * point.
             *
             * However, we want the other buttons to be in the same positions
             * they will occupy once the store applies the storeProfile and the
             * search field appears.
             */
            m_display.searchButton.normal = 'none';
            m_display.wideSearchButton.normal = 'none';
            // Dont show discovery entry point in store.
            m_display.customButtons['discovery'].normal = 'none';
            m_display.customButtons['badge'].normal = 'none';
            m_display.customButtons['character'].normal = m_displayCharacterButton ? '' : 'none';
            if (HAS_PHYSICAL_HOME) {
                /**
                 * On Whitney, this means using the flexible spacer on the
                 * right, to keep the other buttons pushed up against the fixed
                 * spacer on the left.
                 */
                m_display.spacer2.normal = '';
                m_display.spacer2w.normal = 'none';
            } else {
                /**
                 * On Celeste, this means hiding the flexible spacer on the
                 * left, so that the flexible spacer on the right will keep the
                 * other buttons pushed up against Home.
                 */
                m_display.spacer1.normal = 'none';
            }
        }
    };

    var m_readingstreamsActionIDs = {
        store: 'Store',
        back: 'Back',
        home: 'Home',
        menu: 'Menu',
        quickActions: 'QuickActions',
        search: 'Search',
        discovery: 'Grok'
    };
    
    // The callbackProperties are deprecated and need to be removed once apps
    // have switched over to the new searchBarButtonSelected property.
    var m_callbackProperties = {
        back: null,
        menu: null,
    };
    var m_systemCallbacks = {
        back: function () {
            nativeBridge.setIntLipcProperty(APP_MANAGER_ID, 'backward', 0);
            nativeBridge.dismissChrome();
            nativeBridge.recordDeviceMetric("Pillow","Pillow" + getCurrentApp(),"back", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        },
        home: function() {
            nativeBridge.setLipcProperty(APP_MANAGER_ID, 'start', HOME_ID + '/?context=0');
            nativeBridge.dismissChrome();
            nativeBridge.recordDeviceMetric("Pillow","Pillow" + getCurrentApp(),"home", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        },
        discovery: function() {
            nativeBridge.setLipcProperty(APP_MANAGER_ID, 'start', DISCOVERY_ID);
            nativeBridge.dismissChrome();
            nativeBridge.recordDeviceMetric("Pillow","Pillow" + getCurrentApp(),"grok", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        },
        badge: function() {
            nativeBridge.setLipcProperty(APP_MANAGER_ID, 'start', BADGE_ID);
            nativeBridge.dismissChrome();
        },
        character: function() {
            nativeBridge.setLipcProperty(APP_MANAGER_ID, 'start', HOME_ID + '/?viewRequest=Character');
            nativeBridge.dismissChrome();
        },
        store: function() {
            nativeBridge.setLipcProperty(APP_MANAGER_ID, 'start', STORE_ID);
            nativeBridge.dismissChrome();
            nativeBridge.recordDeviceMetric("Pillow","Pillow" + getCurrentApp(),"store", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        },
        quickActions: function() {
            nativeBridge.messagePillowCase(
                    QUICK_ACTIONS_PILLOW_CASE,
                    JSON.stringify({
                        show: true,
                        position: getDropDownPositionForQuickActions(),
			width: document.body.offsetWidth
                    }));
            nativeBridge.recordDeviceMetric("Pillow","Pillow" + getCurrentApp(), "quickActions", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        },
        menu: function() {
            nativeBridge.messagePillowCase(
                    SYSTEM_MENU_PILLOW_CASE,
                    JSON.stringify({
                        show: true,
                        position: getDropDownPositionFromButton(m_dom.customButtons['menu'])
                    }));
            nativeBridge.recordDeviceMetric("Pillow","Pillow" + getCurrentApp(),"menu", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        }
    };

    /**
     * Set display value for controls to value set in profile.
     * @inner
     * @param {String} [style] Style to use if not default
     */
    var updateControls = function(style) {
        style = style ? style : 'default';
        m_lastControlStyle = style;
        var controlDisplayStyleChanged = false;

        // Recursive update
        var numCustomButtons = 0;
        var f = function(display, dom) {
            for (var key in display) {
                if (!dom[key].style) {
                    // Handles customButtons
                    f(display[key], dom[key]);
                } else {
                    var lastDisplayStyle = dom[key].style.display;
                    if (typeof display[key][style] === 'string') {
                        dom[key].style.display = display[key][style];
                    } else {
                        dom[key].style.display = display[key].normal;
                    }

                    if (display[key].count && dom[key].style.display === '') {
                        ++numCustomButtons;
                    }
                    
                    // check to see if control changed display style
                    if ( (!display[key].noFlashOnChange) && (lastDisplayStyle !== dom[key].style.display) ){
                        controlDisplayStyleChanged = true;
                    }
                }
            }
        };
        f(m_display, m_dom);

        if (HAS_PHYSICAL_HOME) {
            if (numCustomButtons < 2) {
                Pillow.addClass(m_dom.spacerMid, 'wide');
            } else {
                Pillow.removeClass(m_dom.spacerMid, 'wide');
            }
        }
        
        // force flash whenever a control changes
        if (controlDisplayStyleChanged){
            Pillow.logDbgHigh("flashing on update controls");
            // 200ms wait for damage, 0ms after damage
            nativeBridge.createFlashTrigger(FLASH_TRIGGER_TYPE_CLIENT_NEXT_DRAW, FLASH_TRIGGER_FIDELITY_FAST_FULL, 
                    2000, 0);
            nativeBridge.redraw();
        }
    };
    updateControls = Pillow.logWrapInner(NAME, 'updateControls',
                                         updateControls);

    var updateSearchDomainDisplay = function() {
        var labels = SearchDomainStringTable.domainLabels;
        var text = m_activeSearchDomain.label || labels[m_activeSearchDomain.id];
        text = text.replace(" ", "\u00a0", "g") + "\u00a0\u25be";
        setButtonText(m_dom.domainSelect, text, true);
    };
    updateSearchDomainDisplay = Pillow.logWrapInner(NAME, 'updateSearchDomainDisplay',
                                         updateSearchDomainDisplay);

    /**
     * Obtain a new object with the default preferences for button callbacks.
     * The result of this function can be used to directly replace the existing
     * preferences when it is necessary to reset them.
     * @inner
     * @returns {Object} New object containing the default preferences.r
     */
    var getDefaultCallbackPreferences = function() {
        return { back: 'system', home: 'system', store: 'system', quickActions: 'system', discovery: 'system' , badge: 'system', character: 'system'};
    };
    var m_callbackPreferences = getDefaultCallbackPreferences();

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
     * Call to dispatch a callback and dismiss the chrome.  If a legacy
     * callback property is set, that property will be used.  Otherwise it uses
     * the profiles preference for the callback.
     * @inner
     * @param {String} name Title of the callback to execute
     */
    var makeCallback = function(name) {
        var property = m_callbackProperties[name];
        if(name === "discovery" && m_isDemoMode) {
            nativeBridge.sendLipcEvent(LIPC_PILLOW_SOURCE,"pageflipperStartGRoK", "");
        }
        else if (property) {
            nativeBridge.setLipcProperty(nativeBridge.getAppId(), property, '{}');
        }
        else if ((m_callbackPreferences[name] === undefined) ||
                 (m_callbackPreferences[name] == 'notifyapp')) {
            nativeBridge.recordDeviceMetric("Pillow","Pillow" + getCurrentApp(),name, 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
            Pillow.logDbgHigh("searchbar notifyApp button pressed : ", name);
            nativeBridge.setLipcProperty(nativeBridge.getAppId(),
                                         BUTTON_CLICKED_PROPERTY, name);
        }
        else if (typeof m_systemCallbacks[name] === 'function') {
            m_systemCallbacks[name]();
        }

        // log user actions in reader
        if (nativeBridge.getAppId() == "com.lab126.booklet.reader") {
            if (name == "back") {
                Pillow.logUserAction("ChromeReaderBackButtonPressed");
            } else if (name == "store") {
                Pillow.logUserAction("ChromeReaderKindleStoreButtonPressed");
            }
        }
        
        // if name is store, log the time.
        if (name == "store")
        {
            // Hack for store performance use case (JTWO-5505)
            nativeBridge.setLipcProperty("com.lab126.cmd","ensureConnection", "");

            var storeButtonPressedTime = new Date();
            var milisec = storeButtonPressedTime.getTime();
            Pillow.logInfo("store_button_pressed", {time: milisec});
        }

        //Record Reading Streams performAction property on global buttons
        if (m_readingstreamsActionIDs[name] !== undefined) {
            Pillow.recordReadingStreamsPerformAction(m_readingstreamsActionIDs[name]);
        }
    };
    makeCallback = Pillow.logWrapInner(NAME, 'makeCallback', makeCallback);

    var that = this;
	
    /**
     * This updates the count of maximum number of results to be displayed 
     * in the search results popup based on the screen orientation.
     */
    var updatePageSize = function() {
        var orientation = nativeBridge.getOrientation();	
        if( orientation === 'L' || orientation === 'R' ) {
            m_numberOfResultsInPopUp = NO_OF_ROWS_IN_LANDSCAPE;
        } else {
            m_numberOfResultsInPopUp = NO_OF_ROWS_IN_PORTRAIT; 
	}
    };
	
    var updateBodyClass = function() {
        var icClass = '';
        if (m_searchIsActive) {
            if (m_noPopupList.indexOf(m_activeSearchDomain.id) >= 0) {
                icClass = 'search-active-with-domains';
                m_display.domainSelect.search = '';
            } else {
                icClass = 'search-active';
            }
        }
        if (m_searchDomains && m_searchDomains.length == 1) {
            icClass += ' one-domain';
        }
        if (m_domainDialogState === DIALOG_ACTIVE) {
            icClass += ' with-domain-dialog';
        }
        if (m_resultsDialogState === DIALOG_ACTIVE) {
            icClass += ' with-results-popup';
        }
        document.body.setAttribute('class', icClass);
    };

    /**
     * Returns the name of current app in use.
     */
    var getCurrentApp = function() {
        var currentApp = 'default';
        switch('app://' + nativeBridge.getAppId()) {
            case HOME_ID:
                currentApp = 'Home';
                break;
            case STORE_ID:
                currentApp = 'Store';
                break;
            case BROWSER_ID:
                currentApp = 'Browser';
                break;
            case PAYMENT_ID:
                currentApp = 'Payment';
                break;
            case DISCOVERY_ID:
                currentApp = 'Goodreads';
                break;
            case READER_ID:
                currentApp = 'Reader';
                break;  
            case SETTINGS_ID:
                currentApp = 'Settings';
                break;
        }
        return currentApp;
    };

    var sendSearch = function(searchValue) {
        var currentApp = getCurrentApp();
        var labels = SearchDomainStringTable.domainLabels;
        var text = m_activeSearchDomain.label || labels[m_activeSearchDomain.id];
        text = text.replace(" ", "");
        nativeBridge.recordDeviceMetric("Pillow","Search"+ text,"SearchIn" + currentApp, 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        nativeBridge.recordDeviceMetric( "Pillow", "Search", "TotalSearchMetric", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        var launcher = m_activeSearchDomain.launcher;
        if (typeof launcher === 'function') {
            // launcher function handles complex escaping
            nativeBridge.setLipcProperty(APP_MANAGER_ID, 'start',
                                         launcher(searchValue));
        }
        else if (launcher) {
            launcher += encodeURIComponent(searchValue);
            nativeBridge.setLipcProperty(APP_MANAGER_ID, 'start', launcher);
            if(m_activeSearchDomain.id === STORE_DOMAIN_ID && nativeBridge.getAppId() != "com.lab126.store") {
                // Enhancement for store.  Calling ensureConnection at store search entry point to speed up connection process (JTHREE-1454)
                nativeBridge.setLipcProperty("com.lab126.cmd","ensureConnection", "");
            }
        }
        else {
            // Use the old API for custom domains without a launcher
            var message = {
                label: searchValue,
                domain: m_activeSearchDomain.id,
            };
            nativeBridge.setLipcProperty(nativeBridge.getAppId(),
                                         SEARCH_SUBMIT_PROPERTY,
                                         JSON.stringify(message));
        }

        nativeBridge.dismissChrome();
        that.deactivateSearch();
    };

    /**
     * Run the debug command or search provided in the search input.  Prevents
     * the default event action so the page is not navigated.  Note that this
     * function must be called as a member of the active instance.
     * @inner
     * @methodOf Pillow.SearchBar#
     */
    var submitSearch = function(event) {
        if (event){
            event.preventDefault();
        }

        var searchValue = m_dom.searchInput.value.trim();

        if (!searchValue){
            return;
        }


        var debugCommand = searchValue.split(" ")[0];
        var debugParameter = searchValue.substr(searchValue.split(" ")[0].length+1);

        // if not a debug cmd then push to normal search path
		if (false == nativeBridge.dbgCmd(debugCommand, debugParameter)){
            if (m_noSaveHistoryList.indexOf(m_activeSearchDomain.id) == -1) {
                m_searchHistory.add(searchValue);
            }
			if (m_activeSearchDomain.id == 'title_author') {
				sendSearch(searchValue);
			} else {
				sendSearch(m_activeSearchDomain.showResultsPopup ? JSON.stringify({label: searchValue}) : searchValue);
			}

			// set sticky text on submit
			//setSticky(searchValue);
		} else {
			//If this is a debug command, we clear the sticky so that this is not retained the next time search is activated
			//setSticky("");
		}
        
        // deactivate search to close KB
        if (m_activeSearchDomain.id === URL_DOMAIN_ID) {
            m_stickyUrl = searchValue;
        }

        that.deactivateSearch();
    };
    submitSearch = Pillow.logWrapInner(NAME, 'submitSearch', submitSearch);

    /**
     * Called when the contents of the search field change.
     * @inner
     */
    var searchChanged = function() {
        if (m_dom.searchInput.value === "") {
            showPlaceholder();
            nativeBridge.messagePillowCase(SEARCH_RESULTS_PILLOW_CASE, JSON.stringify({ searchString: ""}));
            return;
        } else {
            clearPlaceholder();
        }
        if (m_activeSearchDomain.sendTextOnType) {
            var message = {
                label: m_dom.searchInput.value.trim(),
                domain: m_activeSearchDomain.id,
                textOnType: true,
            };
            nativeBridge.setLipcProperty(nativeBridge.getAppId(),
                                         SEARCH_SUBMIT_PROPERTY,
                                         JSON.stringify(message));

        }

        if (m_activeSearchDomain.id !== URL_DOMAIN_ID) {
            // stickyText is set on every char, except for URLs
            m_stickyText = m_dom.searchInput.value;
        }

        if (m_noPopupList.indexOf(m_activeSearchDomain.id) === -1) {
	    nativeBridge.messagePillowCase(SEARCH_RESULTS_PILLOW_CASE, JSON.stringify({
                    searchString: m_dom.searchInput.value
	    }));


	    if (m_activeSearchDomain.resultsSrc && m_activeSearchDomain.resultsProp) {
                nativeBridge.setLipcProperty(
	            m_activeSearchDomain.resultsSrc,
	            m_activeSearchDomain.resultsProp,
	            JSON.stringify({
	                searchString: m_dom.searchInput.value,
	                replyLipcSrc: 'com.lab126.pillow',
	                replyProp: m_activeSearchDomain.secondarySuggestionsDomain? 'primarySearchResults' : 'searchResults',
	                pageSize: m_numberOfResultsInPopUp,
	                searchContext: m_activeSearchDomain.searchContext || {}}));
	    }

        // Check for secondary suggestions domains. 
        if (m_activeSearchDomain.secondarySuggestionsDomain) {
                secondarySearchDomain = m_activeSearchDomain.secondarySuggestionsDomain;
                if(!(secondarySearchDomain.isSearchRestricted()) && secondarySearchDomain.resultsSrc && secondarySearchDomain.resultsProp) {
                    nativeBridge.setLipcProperty(
                    secondarySearchDomain.resultsSrc,
                    secondarySearchDomain.resultsProp,
                    JSON.stringify({
                        searchString: m_dom.searchInput.value,
                        replyLipcSrc: 'com.lab126.pillow',
                        replyProp: 'secondarySearchResults',
                        pageSize: m_numberOfResultsInPopUp,
                        searchContext: m_activeSearchDomain.searchContext || {}}));
                }
        }
	}

        m_textAutoSelected = false;
    };
    searchChanged = Pillow.logWrapInner(NAME, 'searchChanged', searchChanged);

    /**
     * Called when the user mousedowns on the search field. If the Field is in auto
     * select mode (set when the user first enters search field) make sure insertion
     * point moves to the end of the input
     * @params {Event} event
     *      mousedown event
     * @inner
     */
    var searchTap = function(event){

        if (m_searchIsActive && m_textAutoSelected){
            m_textAutoSelected = false;
            m_dom.searchInput.setSelectionRange(m_dom.searchInput.value.length, m_dom.searchInput.value.length);
            event.preventDefault();
        }
    };
    searchTap = Pillow.logWrapInner(NAME, 'searchTap', searchTap);

    /**
     * Called when search mode is activated.  It ensures that the search domain
     * dialog is open in the background and configured correctly.
     *
     * @inner
     */
    var prepareSearchDomainsDialog = function() {
        if (!m_domainDialogIsPrepared && m_dom.domainSelect.style.display !== "none") {
            //JSIXONE-1634 : We need to omit showing "Index Items" in the search domain dropdown 
            //if it is currently the active domain as per the latest UX for Kindle Smart Search
            //.slice(0) does a deep-copy instead of assigning a reference
            var domainsList;
            if (m_activeSearchDomain.id === "Index") {
                var domainsList = m_searchDomains.slice(0);
                for (var i in domainsList) {
                    if (domainsList[i].id === "Index") {
                        domainsList.splice(i, 1);
                    }
                }
            }  else {
                domainsList = m_searchDomains;
            }

            var message = {
                activeId: m_activeSearchDomain.id,
                domains: domainsList,
                position: getDropDownPositionFromButton(m_dom.domainSelect)
            };

            var method = m_domainDialogIsPrepared ?
                nativeBridge.messagePillowCase : nativeBridge.showDialog;

            method(SEARCH_DOMAIN_PILLOW_CASE, JSON.stringify(message));
            if (m_domainDialogState === DIALOG_CLOSED) {
                m_domainDialogState = DIALOG_HIDDEN;
            }
            m_domainDialogIsPrepared = true;
        }
    };
    prepareSearchDomainsDialog =
        Pillow.logWrapInner(NAME, 'prepareSearchDomainsDialog', prepareSearchDomainsDialog);

    /**
     * call to search domain dialog and close it if it is open
     * @inner
     */
    var closeSearchDomainsDialog = function(){
        if (m_domainDialogState !== DIALOG_CLOSED){
            nativeBridge.messagePillowCase(SEARCH_DOMAIN_PILLOW_CASE,
                                       '{"close": true}');
            m_domainDialogState = DIALOG_CLOSED;
            m_domainDialogIsPrepared = false;
            updateBodyClass();
        }
    };

    /**
     * Called when the user clicks the search domain button.  Raises the search
     * domain selection dialog and waits for the selection result.
     * @inner
     */
    var selectDomain = function() {
        // We prepare the dialog on activateSearch, but make sure it is prepared
        // if the user presses the domain button really quickly.
        prepareSearchDomainsDialog();

        if(m_activeSearchDomain.id === 'title_author' || m_activeSearchDomain.id === "Index"){
            dismissResultsPopup();
        }
 
        // Raise the dialog
        m_domainDialogState = DIALOG_ACTIVE;
        nativeBridge.messagePillowCase(SEARCH_DOMAIN_PILLOW_CASE, JSON.stringify({show: true}));
        updateBodyClass();
    };
    selectDomain = Pillow.logWrapInner(NAME, 'selectDomain', selectDomain);

    /**
     * Called when the user selects a search domain.
     * Lowers the search domain selection dialog.
     */
    var hideSearchDomainsDialog = function() {
        if (m_domainDialogState === DIALOG_ACTIVE) {
            nativeBridge.messagePillowCase(SEARCH_DOMAIN_PILLOW_CASE, JSON.stringify({show: false}));
            m_domainDialogState = DIALOG_HIDDEN;
            updateBodyClass();
        }
    };
    hideSearchDomainsDialog =
        Pillow.logWrapInner(NAME, 'hideSearchDomainsDialog', hideSearchDomainsDialog);

    /*
     * Create the results popup dialog in background.
     * This is done on startup and while we enter normal memory
     * from low memory.
     */
    var createResultsPopup = function() {
        Pillow.logInfo("Search Bar: creating search_results pillow case");
        nativeBridge.showDialog(SEARCH_RESULTS_PILLOW_CASE, "{}");
        m_resultsDialogState = DIALOG_HIDDEN;
    }
    
    /*
     * Destroy results popup.
     * This is done while entering low memory situation.
     */
    var destroyResultsPopup = function() {
        Pillow.logInfo("Search Bar: Dropping search results pillow case");
	    nativeBridge.messagePillowCase( SEARCH_RESULTS_PILLOW_CASE, JSON.stringify({dismiss: true}));
        m_resultsDialogState = DIALOG_CLOSED;
    }

    /**
     * Set the size and position of the results popup
     */
    var prepareResultsPopup = function(expectResults) {
        if (m_resultsDialogState !== DIALOG_ACTIVE) {
            var elem = m_dom.inputContainer;
            m_resultsDialogState = DIALOG_ACTIVE;
	
            var domainLabel = m_activeSearchDomain.label || SearchDomainStringTable.domainLabels[m_activeSearchDomain.id];
            var pos = Pillow.addPositions(Pillow.getPositionOnScreen(elem), {x: 0, y: elem.offsetHeight - 2});

            var messageFunction = m_isLowMemory ? nativeBridge.showDialog : nativeBridge.messagePillowCase;

            // TODO: 'Search EveryWhere' suggestions is being set in default. In general, APIs has to be exposed for apps,
            // so that this flag can be configured from apps directly. 
            nativeBridge.createFlashTrigger(FLASH_TRIGGER_TYPE_WAIT_FOR_RESHOW , FLASH_TRIGGER_FIDELITY_FAST_FULL, 2000, 0);
            messageFunction(SEARCH_RESULTS_PILLOW_CASE, JSON.stringify({
               init: true,
               position: pos,
               history: m_searchHistory.getItems(),
               domainLabel: domainLabel,
               primaryImageStyle: m_activeSearchDomain.searchSuggestions ? m_activeSearchDomain.searchSuggestions.imageStyle : '',
               secondaryImageStyle:  m_activeSearchDomain.secondarySuggestionsDomain? m_activeSearchDomain.secondarySuggestionsDomain.imageStyle : '', 
               showEveryWhereSuggestions : true,
               width: elem.offsetWidth - 4,
               expectResults: expectResults
            }));

            //Notify search providers so that they can do their initialization(like ensuring connectivity)
            if (m_activeSearchDomain.resultsSrc && m_activeSearchDomain.initializeProp) {
                nativeBridge.setIntLipcProperty(
                        m_activeSearchDomain.resultsSrc,
                        m_activeSearchDomain.initializeProp,
                        1 );
            }

            // Check for secondary suggestions domains. 
            if (m_activeSearchDomain.secondarySuggestionsDomain) {
                secondarySearchDomain = m_activeSearchDomain.secondarySuggestionsDomain;
                if(!(secondarySearchDomain.isSearchRestricted()) && secondarySearchDomain.resultsSrc && secondarySearchDomain.initializeProp) {
                    nativeBridge.setIntLipcProperty(
                            secondarySearchDomain.resultsSrc,
                            secondarySearchDomain.initializeProp,
                            1 );
                }
            }
        }

    };

    /**
     * Dismiss the results popup
     */
    var dismissResultsPopup = function() {
        if (m_resultsDialogState === DIALOG_ACTIVE) {
            if (m_isLowMemory) {
                nativeBridge.messagePillowCase( SEARCH_RESULTS_PILLOW_CASE, JSON.stringify({dismiss: true}));
                m_resultsDialogState = DIALOG_CLOSED;
            } else {
                nativeBridge.messagePillowCase( SEARCH_RESULTS_PILLOW_CASE, JSON.stringify({hide: true}));
                m_resultsDialogState = DIALOG_HIDDEN;
            }
            if (m_searchViewSetDirectly) {
                updateBodyClass();
                clearPlaceholder();
                m_dom.searchInput.value = m_searchStringSetDirectly;
                m_keyboard.close();
                m_dom.searchInput.blur();
            }
        }
    };

    /**
     * Reset the search state as long as we are not selecting a search domain.
     * The state will change after a delay to allow time for the search domain
     * dialog state to change.
     * @inner
     * @methodOf Pillow.SearchBar#
     * @param {Event} event
     */
    var blurIfInactive = function(event) {
        var placeholder = document.getElementById("searchPlaceholder");
        if (event.target === placeholder || event.target === m_dom.searchInput) {
            m_dom.searchInput.focus();
            return;
        }

        if (!m_searchIsActive || m_searchViewSetDirectly) {
            return;
        }

        var self = this;
        setTimeout(function() {
            if (m_domainDialogState !== DIALOG_ACTIVE) {
                self.deactivateSearch();
            }
        }, 50);
    };

    /**
     * handle blur event for search bar window
     * @inner
     * @methodOf Pillow.SearchBar#
     * @param {Event} event
     */
    var onWindowBlur = function(event){
        m_windowHasFocus = false;

        if (!m_searchIsActive) {
            return;
        }

        if (m_searchViewSetDirectly) {
            if (m_resultsDialogState === DIALOG_ACTIVE) {
                dismissResultsPopup();
            }
            return;
        }

        var self = this;
        setTimeout(function() {
            if (m_domainDialogState !== DIALOG_ACTIVE) {
                self.deactivateSearch();
            }
        }, 50);

    };

    /**
    * handle focus event for search bar window
     * @inner
     * @methodOf Pillow.SearchBar#
     * @param {Event} event
    */
    var onWindowFocus = function(event){
        m_windowHasFocus = true;

        // if search should be active reactivate
        if ((m_searchIsActive || m_activateOnNextFocus) &&
                (m_domainDialogState !== DIALOG_ACTIVE) && (!m_searchViewSetDirectly)){
            m_activateOnNextFocus = false;
            this.activateSearch();
        }
    };
    /**
    * Set the profile for the recent search history
    */
    this.setHistoryProfile = function(profile) {
        Pillow.logInfo("Switching profile to " + profile);
        m_searchHistory.switchProfile(profile);
    }
    
    /**
     * Reset the icon image to the default icon image.
     * @inner
     */
    var useDefaultIcon = function() {
        /**
         * This function gets called when the requested icon fails to load.  If
         * the default icon is unavailable, setting the src without a guard
         * results in an infinite loop in which the error continually recurs.
         */
        if (!m_dom.iconImage.failedToLoad) {
            m_dom.iconImage.failedToLoad = true;
            // Removed to avoid a memory leak. See CEL-10989.
            // m_dom.iconImage.src = DEFAULT_ICON;
        }
    };

    /**
     * cache the state assosiated with current app
     */
    this.cacheCurrentAppState = function(){
        m_appStateCache = {
                profileDetails      	: m_profileDetails,
                searchDomainDetails     : {
                	searchDomains      : m_searchDomains,
                	activeSearchDomain : m_activeSearchDomain,
                },
                stickyText          	: m_stickyText,
                stickyUrl           	: m_stickyUrl,
                searchViewSetDirectly   : m_searchViewSetDirectly,
                searchStringSetDirectly : m_searchStringSetDirectly
        };

        Pillow.logDbgLow("cached app state ", JSON.stringify(m_appStateCache));

    };

    /**
     * set app state back to cached values
     */
    this.loadCachedAppState = function(){
        Pillow.logDbgLow("loadCachedAppState");

        this.resetApplicationState();
        if (m_appStateCache){
            this.setProfile(m_appStateCache.profileDetails);
            m_stickyText = m_appStateCache.stickyText;
            m_stickyUrl = m_appStateCache.stickyUrl;
            m_searchViewSetDirectly = m_appStateCache.searchViewSetDirectly;
            m_searchStringSetDirectly = m_appStateCache.searchStringSetDirectly;
            if (m_searchViewSetDirectly) {
                var searchViewParams = {showSearchView: true, searchString: m_searchStringSetDirectly};
                this.showSearchView(searchViewParams);
            }
            this.loadCachedSearchDomainDetails(m_appStateCache.searchDomainDetails);
        }

        m_appStateCache = null;
    };

    /**
     * Drop pillow cases that are cached for performance
     */
    this.handleLowMemory = function() {
        Pillow.logInfo("Search Bar: Received Low Memory event");
        if (m_isLowMemory === false) {
            m_isLowMemory = true;
            //Drop pillow cases
            destroyResultsPopup();
        }
    }

    /**
     * Recreate pillow cases and cache them for performance
     */
    this.handleNormalMemory = function() {
        Pillow.logInfo("Search Bar: Received Normal Memory event");
        if (m_isLowMemory) {
            m_isLowMemory = false;
            //Create pillow cases in the background
            createResultsPopup();
        }
    }

    this.showSearchView = function(clientParams) {
    	if(typeof(clientParams.showSearchView) === 'boolean' && clientParams.showSearchView === true) {
            // Sample LIPC
            //lipc-set-prop com.lab126.pillow configureChrome '{"appId": "com.lab126.booklet.home", "searchBar":{"clientParams":{"showSearchView":"true", "searc
            //hString": "bhbhbbv"}}}'
            m_dom.searchInput.value = clientParams.searchString;

            m_searchIsActive = true;
            m_searchViewSetDirectly = true;
            m_searchStringSetDirectly = clientParams.searchString;
            updateBodyClass();
            updateControls("search");
            m_dom.goButton.style.display = "none";
    	} else {
            if (m_searchViewSetDirectly) {
                m_dom.searchInput.value = "";
                m_searchIsActive = false;
                m_searchViewSetDirectly = false;
                updateBodyClass();
                updateControls();
            }
        }
    }

    /**
     * set seach domain details to cached values
     */
    this.loadCachedSearchDomainDetails = function(searchDomainDetails) {
        if(searchDomainDetails) {
       	    Pillow.logDbgLow("loadCachedSearchDomainDetails");
	    m_searchDomains = searchDomainDetails.searchDomains;
	    m_activeSearchDomain = searchDomainDetails.activeSearchDomain;
	}
    }
	
    /**
     * Call a function on each XorButton object we have created.
     */
    this.forEachXorButton = function(f) {
        for (var i in m_xorButtons) {
            f(m_xorButtons[i]);
        }
    };

    var makeCheckEnabledCallback = function(id) {
        return function() {
            return !m_dom.customButtons[id].disabled;
        };
    };

    /** 
     * add domain to the list of default search domains if it
     * is not already present.
     * @param newDomain The search domain object to be added.
     */ 
    var addDefaultSearchDomain = function(newDomain) {
        if (newDomain) {
            var alreadyExists = false;
            var storeIndex = 0;
            for (var d in m_defaultSearchDomains) {
                var existingDomain = m_defaultSearchDomains[d];
                if (existingDomain.id === STORE_DOMAIN_ID) {
                    storeIndex = d;
                }
                if (newDomain.id === existingDomain.id) {
                    alreadyExists = true;
                    break;
                }
            }
            if (!alreadyExists) {
                if (newDomain.id === DISCOVERY_DOMAIN_ID) { //[JFIVE-3971] Goodreads Domain should always appear under Kindle Store
                    m_defaultSearchDomains.splice(parseInt(storeIndex) + 1, 0, newDomain);
                } else if (m_isDemoMode && newDomain.id === WIKIPEDIA_DOMAIN.id) {
                    Pillow.logInfo("In demo mode: omitting wikipedia entry.");
                } else {
                    m_defaultSearchDomains.push(newDomain);
                }
            }
        }
    }
    
    /** 
     * add domain to the list of search domains m_searchDomains if it
     * is not already present.
     * @param newDomain The search domain object to be added.
     */ 
    var addSearchDomain = function(newDomain) {
        if (m_searchDomains && newDomain) {
            var alreadyExists = false;
            var storeIndex = 0;
            for (var d in m_searchDomains) {
                var existingDomain = m_searchDomains[d];
                if (existingDomain.id === STORE_DOMAIN_ID) {
                    storeIndex = d;
                }
                if (newDomain.id === existingDomain.id) {
                    alreadyExists = true;
                    break;
                }
            }
            if (!alreadyExists) {
                if (newDomain.id === DISCOVERY_DOMAIN_ID) { //[JFIVE-3971] Goodreads Domain should always appear under Kindle Store
                    m_searchDomains.splice(parseInt(storeIndex) + 1, 0, newDomain);
                } else {
                    m_searchDomains.push(newDomain);
                }
            }
        }
    }


    /** 
     * remove domains from the list of default search domains if
     * they have the ID of domain.
     * @param newDomain The search domain object to be removed.
     */ 
    var removeDefaultSearchDomain = function(newDomain) {
        if (newDomain) {
            for (var d in m_defaultSearchDomains) {
                var existingDomain = m_defaultSearchDomains[d];
                if (existingDomain.id === newDomain.id) {
                    m_defaultSearchDomains.splice(d, 1);
                }
            }
        }
    }

    /** 
     * remove domains from the list of search domains m_searchDomains if
     * they have the ID of domain.
     * @param newDomain The search domain object to be removed.
     */ 
    var removeSearchDomain = function(newDomain) {
        if (m_searchDomains && newDomain) {
            for (var d in m_searchDomains) {
                var existingDomain = m_searchDomains[d];
                if (existingDomain.id === newDomain.id) {
                    // If the current m_activeSearchDomain is the domain to be removed, then we set the it to the previous/next search domain to avoid inconsistency
                    if (m_activeSearchDomain.id === existingDomain.id) {
                        if (d != 0) {
                            m_activeSearchDomain = m_searchDomains[d - 1];
                        } else {
                            m_activeSearchDomain = m_searchDomains[d + 1];
                        }
                    }
                    m_searchDomains.splice(d, 1);
                }
            }
        }
    }

    this.updateDiscoverySearchDomain = function() {
        if(m_isDemoMode) {
            //Discovery search domain should not be present in demo mode. So, this function is basically no-op in demo mode.
            Pillow.logInfo("updateDiscoverySearchDomain() : No-op as we are in demo mode");
            return;
        }

        if(m_displayGrokButton) {
            addSearchDomain(DISCOVERY_SEARCH_DOMAIN);
            addDefaultSearchDomain(DISCOVERY_SEARCH_DOMAIN);
        }
        else {
            removeSearchDomain(DISCOVERY_SEARCH_DOMAIN);
            removeDefaultSearchDomain(DISCOVERY_SEARCH_DOMAIN);
        }
    }

    this.onDiscoveryActivityChange = function(activityAvailable) {
        if(activityAvailable == 1) {
            m_xorButtons['discovery'].setImageClasses("discovery-notification", "discovery-notification xor");
        } else {
            m_xorButtons['discovery'].setImageClasses("discovery-normal", "discovery-normal xor");
        }
    }

    /**
     * Updates the discovery icon visibility on search bar.
     */
    this.updateDisplayGrokButton = function(enabledStatus) {
		if(m_isDemoMode) {
            //"g" button should not be updated on grokStateChanged event and is set on startup
            Pillow.logInfo("updateDisplayGrokButton() : No-op as we are in demo mode");
            return;
        }

        var controlStatus = nativeBridge.getIntLipcProperty(DPM_SERVICE, GET_CONTROL_STATUS);
        Pillow.logInfo("updateDisplayGrokButton() ", {enabledStatus: enabledStatus[0],controlStatus: controlStatus });
        if(enabledStatus[0] !== GROK_STATUS_BLOCKED_PARENTAL && controlStatus !== FREE_TIME_CONTROL) {
            m_displayGrokButton = enabledStatus[0] === GROK_STATUS_ENABLED;
            this.updateDiscoverySearchDomain();
            this.setProfile(m_profileDetails);
        }
    }

    /**
     * Updates the discovery icon visibility on search bar in demo mode.
     */
    this.updateDisplayGrokButtonInDemoMode = function(enabledStatus) {
        if(!m_isDemoMode) {
            Pillow.logInfo("updateDisplayGrokButtonInDemoMode() : No-op as we are not in demo mode");
            return;
        }

        Pillow.logInfo("updateDisplayGrokButtonInDemoMode() ", {enabledStatus: enabledStatus[0]});
        m_displayGrokButton = enabledStatus[0] === GROK_STATUS_ENABLED;
        this.setProfile(m_profileDetails);
    }

    
    this.onDeviceControlStateChange = function() {
        if(m_isDemoMode) {
            //GRoK button should always be present in demo mode and we need not change to badge button. So, this function is basically no-op in demo mode.
            Pillow.logInfo("onDeviceControlStateChange() : No-op as we are in demo mode");
            return;
        }

        var controlStatus = nativeBridge.getIntLipcProperty(DPM_SERVICE, GET_CONTROL_STATUS);
        if (controlStatus === FREE_TIME_CONTROL) {
            m_displayBadgeButton = true;
            m_displayCharacterButton = true;
            m_displayGrokButton = false;
        } else {
            m_displayBadgeButton = false;
            m_displayCharacterButton = false;
            m_displayGrokButton = nativeBridge.getDynamicConfigValue(DYNCONFIG_GROK_STATE) === GROK_SUPPORTED_STATE;
        }
        this.updateDiscoverySearchDomain();
        this.setProfile(m_profileDetails);
    }
    
    this.setUpCharacterIcon = function() {
        m_xorButtons['character'].setImageClasses("kftu", "kftu-active xor");
    }
    
    this.onBadgeActivityChange = function(badgeAvailable) {
        if(badgeAvailable == 1) {
            m_xorButtons['badge'].setImageClasses("badge-notification", "badge-notification xor");
        } else {
            m_xorButtons['badge'].setImageClasses("badge-normal", "badge-normal xor");
        }
    }

    /**
     * Updates the set of default search domains that clients can use.
     */
    this.updateDefaultSearchDomains = function(updateNow) {
        var marketplace = nativeBridge.getDynamicConfigValue(DYNCONFIG_OBFUSCATED_MARKETPLACE_KEY);
        
        var dynUrlBaiduSearch = nativeBridge.getDynamicConfigValue(DYNCONFIG_URL_BAIDU_SEARCH);
        baiduSearchUrl = dynUrlBaiduSearch ? dynUrlBaiduSearch : SearchBarStringTable.baiduSearch;
        
        if (!marketplace) {
            Pillow.logWarn("getMarketplaceFailed");
            return;
        }

	m_addBaidu = (marketplace === CHINESE_OBFUSCATED_MARKETPLACE);

        this.updateDiscoverySearchDomain();
        
        if (updateNow){
            this.setCustomSearchDomains();
        }
    }
    
    /**
     * This method is called by Pillow.Case#register when the DOM is ready.
     * This is used to obtain references to the DOM, attach events, set initial
     * state and call the parent to register the client params handler.
     * @private
     */
    this.onLoad = function() {
        Pillow.setOption(OPTION_SEND_DELETE_EVENTS, true);
        var topLevelButtonContainer = document.body;

        //Initialize pillow cases to background cache for performance
        createResultsPopup();

        for (var c = 0; c < STANDARD_BUTTONS.length; ++c) {
            var id = STANDARD_BUTTONS[c];
            // find the button element and wrap it with a hit target
            m_dom.customButtons[id] = document.getElementById(id);
            if (m_dom.customButtons[id].parentNode == topLevelButtonContainer) {
                // create a XorButton object to manage inversion
                var opts = {
                    checkEnabledCallback: makeCheckEnabledCallback(id),
                    incrementalUpdate: true
                };
                m_xorButtons[id] = new XorButton(
                        m_dom.customButtons[id],
                        Pillow.bind(null, makeCallback, id),
                        m_dom.customButtons[id],
                        null,
                        'xor',
                        opts);
            } else {
                addEvent(m_dom.customButtons[id], 'click', Pillow.bind(null, makeCallback, id));
            }
        }

        Pillow.addClass(m_dom.customButtons[HAS_PHYSICAL_HOME ? 'back' : 'home'], 'leftmost');

        addEvent(window, 'blur', Pillow.bind(this, onWindowBlur));
        addEvent(window, 'focus', Pillow.bind(this, onWindowFocus));
        addEvent(window, 'mouseup', Pillow.bind(this, blurIfInactive));

        this.onDiscoveryActivityChange(nativeBridge.getIntLipcProperty(DISCOVERY_SERVICE, DISCOVERY_ACTIVITY_PROPERTY));

        this.onBadgeActivityChange(nativeBridge.getIntLipcProperty(BADGE_SERVICE, BADGE_ACTIVITY_PROPERTY));
        
        this.setUpCharacterIcon();
        
        m_dom.inputContainer = document.getElementById('input-container');

        var activateSearch = function() {
            that.activateSearch();
            //Record Reading Streams performAction property on search buttons
            Pillow.recordReadingStreamsPerformAction('Search');
            if (nativeBridge.getAppId() == "com.lab126.booklet.reader") {
                Pillow.logUserAction("ChromeReaderSearchButtonPressed");
            }
        };

        m_dom.searchButton = document.getElementById('search');
        m_xorButtons['searchButton'] = new XorButton(
                m_dom.searchButton,
                activateSearch,
                m_dom.searchButton,
                null,
                'xor',
                {delayAction: true, actionDelay: 10, incrementalUpdate: true});

        m_dom.wideSearchButton = document.getElementById('wide-search');
        addEvent(m_dom.wideSearchButton, 'click', activateSearch);

        m_dom.exitButton = document.getElementById('exit');
        m_xorButtons['exitButton'] = new XorButton(
                m_dom.exitButton,
                function() {
                    if (m_searchIsActive) {
                        if (m_searchViewSetDirectly) {
                            if (m_resultsDialogState === DIALOG_ACTIVE) {
                                dismissResultsPopup();
                            } else {
                    	        nativeBridge.recordDeviceMetric("UnifiedSearchEInk","CloseView", "Xpressed",1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
                                Pillow.logInfo("Going back because 'x' button was pressed from Search View");
                                m_searchIsActive = false;
                                m_systemCallbacks['back']();

                            }
                        } else {
                            that.deactivateSearch();
                        }
                    }
                },
                m_dom.exitButton,
                null,
                'xor',
                {delayAction: true, actionDelay: 10, incrementalUpdate: true});


        m_dom.searchIcon = document.getElementById('search-icon');

        // iconButton and iconImage used to be different elements,
        // and changing that would break API compatibility.
        m_dom.iconButton = document.getElementById('custom-icon');
        m_dom.iconImage = m_dom.iconButton;
        m_dom.iconImage.addEventListener('error', useDefaultIcon);

        m_dom.searchForm = document.getElementById('form');
        addEvent(m_dom.searchForm, 'submit', Pillow.bind(this, submitSearch));

        m_dom.searchInput = document.getElementById('input');
        addEvent(m_dom.searchInput, 'click', function(event) {
                if (!m_searchIsActive || m_searchViewSetDirectly) {
                    that.activateSearch();
                    event.preventDefault();
                }
            });
        addEvent(m_dom.searchInput, 'input', searchChanged);
        addEvent(m_dom.searchInput, 'mousedown', searchTap);

        /**
         * The search hint is an <input type="text"> because it's easier to get
         * the text positioned exactly as if it were actually the value of the
         * search input.
         */
        document.getElementById('search-hint').value = SearchBarStringTable.enterText;

        m_dom.domainSelect = document.getElementById('domain');
        m_xorButtons['domainSelect'] = new XorButton(
                m_dom.domainSelect,
                selectDomain,
                m_dom.domainSelect,
                null,
                'xor',
                {incrementalUpdate: true});

        m_dom.goButton = document.getElementById('go');
        m_xorButtons['goButton'] = new XorButton(
                m_dom.goButton,
                Pillow.bind(this, submitSearch),
                m_dom.goButton,
                null,
                'xor',
                {delayAction: true, actionDelay: 10, incrementalUpdate: true});

        m_dom.spacer1 = document.getElementById('spacer1');
        m_dom.spacer1w = document.getElementById('spacer1w');
        m_dom.spacerMid = document.getElementById('spacer-mid');
        m_dom.spacer2 = document.getElementById('spacer2');
        m_dom.spacer2w = document.getElementById('spacer2w');

        m_dropDownButtons['quickActions'] = m_dom.customButtons['quickActions'];
        m_dropDownButtons['menu'] = m_dom.customButtons['menu'];
        m_dropDownButtons['domain'] = m_dom.domainSelect;
        this.devicePolicyManager = new DevicePolicyManager();
        this.devicePolicyManager.onStoreDisabled = function(disabled) {
            var button = m_dom.customButtons.store;
            button[DISABLED_OVERRIDE_FLAG] = disabled;
            m_dom.customButtons.store.disabled = disabled;
        };
        this.devicePolicyManager.onDiscoveryDisabled = function(disabled) {
            var button = m_dom.customButtons.discovery;
            button[DISABLED_OVERRIDE_FLAG] = disabled;
            m_dom.customButtons.discovery.disabled = disabled;
        };
        this.devicePolicyManager.refresh();

        this.updateDefaultSearchDomains(true);
        
        this.setProfile();

        parent(this).onLoad();
        
        m_windowTitle = new WindowTitle(WINMGR.LAYER.CHROME, WINMGR.ROLE.SEARCHBAR);
        m_windowTitle.withChanges(function() {
            this.addParam(WINMGR.KEY.CUSTOM.TRANSIENT_HEIGHT, document.body.offsetHeight);
            this.addParam(WINMGR.KEY.CUSTOM.PERSISTENT_HEIGHT, document.body.offsetHeight);
            this.addParam(WINMGR.KEY.SHOWEVENT, "resultsPopupShow");
            this.addParam(WINMGR.KEY.TAP_AWAY_PARENT, 'search_bar');
            this.addParam(WINMGR.KEY.SUBSCRIPTIONS, [
                    WINMGR.SUBSCRIPTION.SCREEN_SAVER,
                    WINMGR.SUBSCRIPTION.CHROME_RESET
                ]);
        });

        nativeBridge.showMe();
    };

    /**
     * resets the application defined state to defaults
     */
    this.resetApplicationState = function(){
        Pillow.logDbgLow("resetApplicationState");
        m_callbackProperties = {};
        m_callbackPreferences = getDefaultCallbackPreferences();
        m_progress = null;
        m_stickyText = "";
        m_stickyUrl = "";
        m_dom.searchInput.value = "";
        m_searchViewSetDirectly = false;
        m_searchStringSetDirectly = "";
        m_searchIsActive = false;
        // Removed to avoid a memory leak. See CEL-10989.
        // m_dom.iconImage.src = DEFAULT_ICON;

        this.setCustomSearchDomains();
        
        this.deactivateSearch();
        
        this.setProfile();
    };
    
    /*
    * The user has opted to clear the search history from the search resuls drop down.
    *
    */
    this.clearSearchHistory = function() {
        nativeBridge.recordDeviceMetric( "Pillow", "Search", "ClearHistory", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        m_searchHistory.clear();
    }
    
    /**
     * The user selected a search result from the popup.
     * @result The selected result
     */
    this.searchResultSelected = function(result) {
        dismissResultsPopup();
        var currentApp = getCurrentApp();

        var historyString = result['label'];

        //Add to history(bring to recent) if the search is selected from recent searches drop down
        m_searchHistory.add(historyString);

    	if(result.source === "secondary") {
	    	secondarySuggestionDomain = m_activeSearchDomain.secondarySuggestionsDomain;
    		if(secondarySuggestionDomain.launcherDomain) {
    	    	m_activeSearchDomain = secondarySuggestionDomain.launcherDomain;
	    	}
    	}


        if (result.searchDomain === "Store") {
            m_activeSearchDomain = STORE_DOMAIN;
            nativeBridge.recordDeviceMetric( "Pillow", "Search", "SearchStoreFrom" + getCurrentApp(), 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        } else if (result.searchDomain === "Goodreads") {
            m_activeSearchDomain = DISCOVERY_SEARCH_DOMAIN;
            nativeBridge.recordDeviceMetric( "Pillow", "Search", "SearchGoodreadsFrom" + getCurrentApp(), 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        } else if (result.searchDomain === "Unified") {
            m_activeSearchDomain = TITLE_AUTHOR_DOMAIN;
            nativeBridge.recordDeviceMetric( "Pillow", "Search", "SearchEverywhereFrom" + getCurrentApp(), 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        } else if (result.history) {
            nativeBridge.recordDeviceMetric( "Pillow", "Search", "RecentSearchesFrom" + getCurrentApp(), 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        } else {
            nativeBridge.recordDeviceMetric( "Pillow", "SearchSuggestions", "SuggestionClickFrom" + getCurrentApp() + (result.source === "secondary" ? "StoreSuggestion" : "") , 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
        }
        
        if(m_activeSearchDomain.id === 'title_author'){
            if(result.history || result.searchDomain) {
                sendSearch(result.label);
            } else {
                nativeBridge.recordDeviceMetric( "Pillow", "Search", "TotalSearchMetric", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
                Pillow.logDbgLow("decodedLocation" + encodeURIComponent(result.location));
                var propVal = JSON.stringify(result);
                nativeBridge.setLipcProperty(m_activeSearchDomain.resultsSrc, 'handleSearchItem', propVal);
                nativeBridge.dismissChrome();
                that.deactivateSearch();
            }
        } else if(!m_activeSearchDomain.launcher) {
            //Old-style search domains(eg. book). Send only result.label
            sendSearch(result.label);
        } else {
       	    sendSearch(JSON.stringify(result));
        }
    };

    /**
     * Change the current profile and update the search bar based on the
     * profile definition.
     * @param {String} name Profile name
     */
    this.setProfile = function(details) {

        if (m_searchViewSetDirectly) {
            //Do not change profile settings in search view
            return;
        }
        
        details = details || {};
        details.name = details.name || 'default';
        details.buttons = details.buttons || [];

        
        m_profileDetails = details;
        m_profileName = details.name;


        this.deactivateSearch();

        m_profiles['default']();

        if ((details.name != 'default') && (m_profiles[details.name])) {
            m_profiles[details.name]();
        }

        for (var c = 0; c < details.buttons.length; ++c) {
            var button = details.buttons[c];
            var buttonOption = m_display.customButtons[button.id];
            if (buttonOption === undefined ) {
                Pillow.logWarn("undefined button :" + button.id);
                continue;
            }
            var handling = button.handling;
            handling = handling ? handling.toLowerCase() : handling;
            m_callbackPreferences[button.id] = handling;

            if (button.state == 'disabled') {
            	// Disable the button
                m_dom.customButtons[button.id].disabled = true;
            	buttonOption.normal = '';
            } else if (button.state == 'retainState') {
                // dont change the visibility of the button
            } else if ((button.state != 'enabled') &&
                     (button.state !== undefined)) {
            	// Hide the button
                buttonOption.normal = 'none';
            } else {
            	// Show the button
            	buttonOption.normal = '';
            }
        }


        if (m_display.searchButton !== undefined && m_display.searchButton.state === 'disabled') {
            m_dom.searchButton.disabled = true;
        } else {
	    m_dom.searchButton.disabled = false;
	}

        updateControls();
        
        
    };

    /**
     * sets the search state
     *
     * @param {Object} searchState
     * @param {String} [searchState.text]
     * @param {String} [searchState.icon]
     * @param {Boolean} [searchState.focused]
     */
    this.setSearchState = function(searchState){

        if (searchState.text !== undefined && (getCurrentApp() === "Browser" || getCurrentApp() === "Payment")) {
            m_stickyUrl = searchState.text;
            m_dom.searchInput.value = m_stickyUrl;
        }


        //set search icon
        m_dom.iconImage.failedToLoad = false;
        // Removed to avoid a memory leak. See CEL-10989.
        // m_dom.iconImage.src = searchState.icon || DEFAULT_ICON;

        // only activate the text entry if the window has focus
        if (searchState.focused){
            if (m_visible && m_windowHasFocus) {
                // We are focused, so activating search works just fine.
                this.activateSearch();
            } else {
                // We aren't focused yet, so don't activate the search entry
                // immediately. Instead, activate it the next time we become
                // focused.
                //
                // There are two cases here:
                //
                // If we are already visible, we can forcibly steal the focus
                // via the window manager's focusChrome property.
                //
                // If we are not already visible, we will become focused when
                // the application raises the transient chrome.
                m_activateOnNextFocus = true;
                if (m_visible && !m_windowHasFocus) {
                    // Steal focus for the search bar.
                    nativeBridge.setLipcProperty("com.lab126.winmgr", "focusChrome", "searchBar");
                }
            }
        } else {
            // activate/deactivate search calls updateControls
            // but if we are not modifying focus call it here
            updateControls();
        }

    };

    /**
     * Set the progress bar to the specified percentage or disable.
     * @param {Number} [progress] Percentage (0-100)
     */
    this.setProgress = function(progress) {
        m_progress = progress;

        if (m_searchIsActive) {
            // Do not show progress while searching.
            progress = 0;
        }
        else if (!progress && progress !== 0) {
            // Disable
            progress = 0;
            updateControls();
        }
        else {
            // Enable
            updateControls('progress');
        }

        var percentage = progress.toFixed() + '';
        percentage = progress > 100 ? '100' : percentage;
        percentage = progress < 0 ? '0' : percentage;

        // Only update the progress bar if there's been a change to the progress
        // level we are actually showing.
        //
        // We store the old visible progress in m_visibleProgress rather than comparing
        // the new background style against the old because WebKit returns the style in
        // a different representation than the one we give it.
        //
        // (Specifically, positions 0% and 100% become left/top and right/bottom, and
        //  RGB hex triples are also changed to something else.)
        if (progress !== m_visibleProgress)
        {
            m_visibleProgress = progress;
            var style = PROGRESS_STYLE.replace(/%/g, percentage + '%');
            m_dom.inputContainer.style.background = style;
        }
    };

    /**
     * Set the property to send when the named callback is triggered.
     * @param {String} callback Name of callback to change
     * @param {String} property Name of property to send for given callback
     */
    this.setCallbackProperty = function(callback, property) {
        m_callbackProperties[callback] = property;
    };

    /**
     * Each app can optionally set one or more custom search domains.
     * @param {Object[]} [customDomains] Each custom domain may contain id,
     *                                   label, description, launcher,
     *                                   keyboard, and sendTextOnType keys.
     * @param {Boolean}  [addDefaults]   Add built-in default domains.
     */
    this.setCustomSearchDomains = function(customDomains, addDefaults) {
        
        m_searchDomains = customDomains || [];

        var idMap = {};
        if (m_searchDomains.length > 0){
        
            // reverse loop to cover the splice out google case
            for (var c = (m_searchDomains.length-1); c >=0; --c) {
                // Cache custom domain so we can coalesce
 
                // google comes in as a custom domain, but we still
                // need to consider marketplace and language
                if (m_searchDomains[c].id == "google"){

                    // handle google/baidu swapping
                    if (!m_addBaidu){
                        // add google to list
                        idMap[m_searchDomains[c].id] = m_searchDomains[c];
                    } else {
                        //splice out of list
                        m_searchDomains.splice(c, 1);
                    }
                    
                    if (m_addBaidu){
                        // add baidu search
                        m_searchDomains.push(BAIDU_SEARCH_DOMAIN);
                        idMap[BAIDU_SEARCH_DOMAIN.id] = BAIDU_SEARCH_DOMAIN;
                    }
                } else {
                    idMap[m_searchDomains[c].id] = m_searchDomains[c];
                }
            }
        } else {
            //In case of no search providers specified like Comic/Manga books
            //we use the TITLE_AUTHOR_DOMAIN as default which is the Search Everywhere option
            m_searchDomains.push(TITLE_AUTHOR_DOMAIN);
        }

        if (addDefaults !== false) {
            for (var d in m_defaultSearchDomains) {
                var searchDomain = m_defaultSearchDomains[d];
                if (!idMap[searchDomain.id]) {
                    m_searchDomains.push(searchDomain);
                }
            }
        } else { //Add DEVICE_SEARCH_DOMAIN
            m_searchDomains.push(DEVICE_SEARCH_DOMAIN);
        }

        this.setActiveSearchDomainId();
    };

    /**
     * Call to set the current search domain in the search bar.
     * @param {String}  [id] If not specified, the first domain is used
     * @param {Boolean} [dialogDestroyed] True if the dialog was destroyed
     */
    this.setActiveSearchDomainId = function(id, kbType, dialogDestroyed) {
    	
        if (dialogDestroyed) {
            m_domainDialogState = DIALOG_CLOSED;
        } else {
            hideSearchDomainsDialog();
        }
        m_domainDialogIsPrepared = false;

        m_oldDomain = m_activeSearchDomain;

        if (m_oldDomain && m_oldDomain.id === URL_DOMAIN_ID && m_oldDomain.id !== id) {
            m_dom.searchInput.value = "";
        }

        if (id === DEVICE_SEARCH_DOMAIN.id) {
            m_activeSearchDomain = TITLE_AUTHOR_DOMAIN; //title_author
        } else {
            //m_dom.searchInput.value = "";
            m_activeSearchDomain = m_searchDomains[0];
            for (var c = 0; id && c < m_searchDomains.length; ++c) {
                if (m_searchDomains[c].id == id) {
                    m_activeSearchDomain = m_searchDomains[c];
                    break;
                }
            }
        }

        if (m_activeSearchDomain.id === TITLE_AUTHOR_DOMAIN.id) {
            //Always show search icon and hide paper icon and search domains in Unified search mode
            m_display.domainSelect.search = "none";
            m_display.searchIcon.search = "";
            m_display.iconButton.normal = "none";
        }

        if (m_searchIsActive) {

            if (m_oldDomain.showResultsPopup && !m_activeSearchDomain.showResultsPopup) {
                dismissResultsPopup();
            }

            if ((m_oldDomain.id === URL_DOMAIN_ID || m_activeSearchDomain.id === URL_DOMAIN_ID)
                    && m_oldDomain !== m_activeSearchDomain) {
                fillAndSelectInputFromSticky();
            }

            // set appropriate kb type for the search domain
            m_activeSearchDomain.keyboard = kbType;
            m_keyboard.refresh();
            
            this.activateSearch();

            // when the domain changes back to sendTextOnType domain we need to
            // update the text to whatever it is now
            //searchChanged();
        }
    };
	
    this.setResultsPopupShowing = function(showing) {
        if (showing) {
            m_resultsDialogState = DIALOG_ACTIVE;
        } else if (m_resultsDialogState === DIALOG_ACTIVE) {
            m_resultsDialogState = DIALOG_HIDDEN;
        }
        updateBodyClass();
    };

    /**
     * Focus and resize the search bar, show the keyboard, and make any style
     * adjustments.
     */
    this.activateSearch = function() {
        var previouslyActive = m_searchIsActive;
        m_searchIsActive = true;

        if (!m_windowHasFocus){
            return;
        }
        if (getCurrentApp() === "Payment") {
            return;
        }
		
        updateBodyClass();
        
        updateControls('search');
        updateSearchDomainDisplay();
        this.setProgress(m_progress);

        m_dom.searchInput.focus();

        if (getCurrentApp() === "Browser") {
            if (m_activeSearchDomain.id === URL_DOMAIN_ID) {
                clearPlaceholder();
                m_dom.searchInput.value = m_stickyUrl;
                if (m_dom.searchInput.value) {
                    m_dom.searchInput.select();
                    m_textAutoSelected = true;
                }
            } else {
                //Clear text while switching to other domains
                m_dom.searchInput.value = "";
            }
        }

        m_keyboard.open();

        // Delaying preparing search domain dialog to improve performance.
        setTimeout(prepareSearchDomainsDialog, 200);


        showPlaceholder();

        if (m_noPopupList.indexOf(m_activeSearchDomain.id) == -1) {
            if (m_dom.searchInput.value !== "") {
                prepareResultsPopup(true);
                searchChanged();
                m_dom.searchInput.select();
            } else {
                prepareResultsPopup();
            }
        }

        updatePageSize();
        nativeBridge.recordDeviceMetric("Pillow","Pillow" + getCurrentApp(),"search", 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
    };

    /**
     * Set search input back to its initial state with label text and the menu
     * button showing.  Also hide the keyboard.
     */
    this.deactivateSearch = function() {
        closeSearchDomainsDialog();
        dismissResultsPopup();
        clearPlaceholder();
        
        m_searchIsActive = false;
        m_activateOnNextFocus = false;

        if (getCurrentApp() === "Browser") { 
            that.setActiveSearchDomainId(m_activeSearchDomain.id);
            m_display.domainSelect.search = "";
            m_display.iconButton.normal = "";
            m_display.searchIcon.search = "none";
            m_display.searchIcon.normal = "none";
        } 
        else if (m_oldDomain && m_oldDomain.id === "Index") { //Dictionary case 
            that.setActiveSearchDomainId(m_oldDomain);
            m_display.domainSelect.search = "";
            m_display.searchIcon.search = "";
        }

		
        m_keyboard.close();

        m_dom.searchInput.blur();

        if (m_showUrlOnBlur){
            m_dom.searchInput.value = m_stickyUrl;
        } else {
            m_dom.searchInput.value = "";
        }

        updateBodyClass();

        updateControls();

        this.setProgress(m_progress);
    };
	
    /**
     * Provides internal state information about this instance.  Intended to be
     * used for testing/debugging.
     * @returns {Object}
     */
    this.getState = function() {
        return {
            profile: m_profileName,
            searchDomains: m_searchDomains,
            activeSearchDomain: m_activeSearchDomain,
            searchIsActive: m_searchIsActive,
            domainDialogIsActive: m_domainDialogState === DIALOG_ACTIVE,
            callbackProperties: m_callbackProperties,
            callbackPreferences: m_callbackPreferences,
        };
    };

    this.setVisibleState = function(v) {
        Pillow.logDbgLow("search bar visible state set to " + v);
        m_visible = v;
    };

    this.setScreenSaverUp = function(up) {
        if (up && !m_searchViewSetDirectly) {
            this.deactivateSearch();
        }
    };

    this.reset = function() {
        this.deactivateSearch();
    };

    this.dropDownVisible = function(id) {
        var button = m_dropDownButtons[id];
        if (button) {
            Pillow.addClass(button, DROP_DOWN_VISIBLE_CLASS);
            button.disabled = true;
        }
    };

    this.dropDownHidden = function(id) {
        var button = m_dropDownButtons[id];
        if (button) {
            Pillow.removeClass(button, DROP_DOWN_VISIBLE_CLASS);
            button.disabled = false;
            if (id === 'domain' && m_searchIsActive) {
                m_dom.searchInput.focus();
            }
        }
    };
    
    /**
     * Search domain window focus information
     * @param
     *       true if the search domain window has focus, false otherwise
     */
    this.searchDomainFocusInfo = function(hasFocus) {
       	m_isSearchDomainWindowInfocus = hasFocus;
        var self = this;
        setTimeout(function() {
            if (m_searchIsActive && !m_windowHasFocus && !m_isSearchDomainWindowInfocus) {
                self.deactivateSearch();
            }
        }, 100);
    }

    nativeBridge.getVisibilityEvents();

    Pillow.logWrapObject(NAME, this);
};

window.searchBar = new Pillow.SearchBar();
searchBar.register();

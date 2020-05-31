/*
 * search_bar_client_params_handler.js
 *
 * Copyright 2012-2013 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */


/**
 * Constructs a clientParams handler for the SearchBar.
 * @class Handles all the incoming clientParams information.  Each method
 *        handles a different incoming parameter.
 * @extends Pillow.ClientParamsHandler
 * @param {Pillow.Case} pillowCase Pass in the Pillow.Case we should dispatch to
 */
Pillow.SearchBar.ClientParamsHandler = function(pillowCase) {
    var parent = Pillow.extend(this, new Pillow.ClientParamsHandler());

    /**
     * Handles changes to the application profile.
     */
    this.profile = function(clientParams) {
        
        if (typeof clientParams.profile === 'string') {
            pillowCase.setProfile();
        }
        else {
            pillowCase.setProfile(clientParams.profile);
        }

        pillowCase.forEachXorButton(function (xb) { xb.appSwitchEnded(); });
    };

    /**
     * Updates the progress display.
     */
    this.progress = function(clientParams) {
        
        pillowCase.setProgress(clientParams.progress);
    };

    /**
     * Accept optional custom search domains.
     */
    this.searchProviders = function(clientParams) {
        var sp = clientParams.searchProviders;

        // Ignore calls with only old API information.
        if (sp && sp[0] && !sp[0].id) {
            return;
        }

        var addDefaults = clientParams.hasOwnProperty('addDefaultSearchProviders') ?
            clientParams.addDefaultSearchProviders : false;
        pillowCase.setCustomSearchDomains(sp, addDefaults);
    };

    /**
     * Updates the selected domain, and notifies the callback handler if exists.
     */
    this.activeSearchDomainId = function(clientParams) {
        
        pillowCase.setActiveSearchDomainId(
                clientParams.activeSearchDomainId,
                clientParams.kbType,
                clientParams.searchDomainsDialogDestroyed);
    };
	
    this.resultsPopupShowing = function(clientParams) {
        pillowCase.setResultsPopupShowing(clientParams.resultsPopupShowing);
    };

    /**
     * Updates the search state
     */
    this.searchState = function(clientParams) {

        pillowCase.setSearchState(clientParams.searchState);
    };

    /**
     * Indicates that a search result has been selected from the drop-down
     */
    this.searchResultSelected = function(clientParams) {
        pillowCase.searchResultSelected(clientParams.searchResultSelected);
    };
    /**
     * Indicates that the search history (for the current profile) needs to be cleared
     */
    this.clearHistory = function(clientParams) {
        pillowCase.clearSearchHistory();
    };


    /**
     * Sets a handler for the back button callback.
     * @deprecated Please use the single searchBarButtonSelected property to
     *             handle this callback.
     */
    this.backCallbackProp = function(clientParams) {

        pillowCase.setCallbackProperty('back', clientParams.backCallbackProp);
    };

    /**
     * Sets a handler for the menu button callback.
     * @deprecated Please use the single searchBarButtonSelected property to
     *             handle this callback.
     */
    this.menuCallbackProp = function(clientParams) {

        pillowCase.setCallbackProperty('menu', clientParams.menuCallbackProp);
    };

    /**
     * Sends the state out to the log and optionally over LIPC.  Useful for
     * debugging and testing.
     */
    this.getState = function(clientParams) {
        var state = JSON.stringify(pillowCase.getState());
        Pillow.logInfo("search-cp", {state: state});

        if (clientParams.replyLipcSrc && clientParams.replyProp) {
            nativeBridge.setLipcProperty(clientParams.replyLipcSrc,
                                         clientParams.replyProp, state);
        }
    };

    this.visObscure = function(clientParams) {
        if (clientParams.visObscure) {
            if (clientParams.visObscure === "full") {
                pillowCase.setVisibleState(false);
            } else {
                pillowCase.setVisibleState(true);
            }
        }
    };

    this.screenSaverUp = function(clientParams) {
        if (typeof(clientParams.screenSaverUp) === 'boolean') {
            pillowCase.setScreenSaverUp(clientParams.screenSaverUp);
        }
    };

    this.chromeReset = function(clientParams) {
        pillowCase.reset();
    };

    this.deleteWindowEvent = function(clientParams) {
        if (clientParams.deleteWindowEvent) {
            pillowCase.onWindowBlur();
        }
    };

    this.searchDomainFocusInfo = function(clientParams) {
        pillowCase.searchDomainFocusInfo(clientParams.searchDomainFocusInfo);
    };

    this.showSearchView = function(clientParams) {
        pillowCase.showSearchView(clientParams);
    }
    
    this.tapAwayChild = function(clientParams) {
        var tac = clientParams.tapAwayChild;
        if (tac && tac.hasOwnProperty('visible') && tac.button) {
            if (tac.visible) {
                pillowCase.dropDownVisible(tac.button);
            } else {
                pillowCase.dropDownHidden(tac.button);
            }
        }
    };
    
    Pillow.logWrapObject('Pillow.SearchBar.ClientParamsHandler', this);
};

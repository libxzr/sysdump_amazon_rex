/*
 * search_results.js
 *
 * Copyright (c) 2012-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

Pillow.SearchResults = function() {
    var parent = Pillow.extend(this, new Pillow.Case('SearchResults'));

    Pillow.logInfo('Pillow.SearchResults pillow-search-results-init');

    const SEARCH_BAR_PILLOW_CASE = 'search_bar';
    const MY_ITEMS_SEARCH_DOMAIN_ID = 'title_author';
    const STORE_SEARCH_DOMAIN_ID = 'store';
    const GOODREADS_SEARCH_DOMAIN_ID = 'discovery';
    const ROW_HEIGHT = 37;          
    const NO_OF_ROWS_IN_PORTRAIT  = 6;
    const NO_OF_ROWS_IN_LANDSCAPE = 3;
    const MINIMUM_STORE_RESULTS_TO_SHOW = 1;
    // Timeout in milliseconds to wait for secondary results for a given search term when primary is available.
    const CLUB_RESULTS_TIMEOUT = 500; 
    // CSS style name for image icons in search results. To display a different image for a results, the URL should be defined in a style inheriting below style.
    const IMAGE_ICON_STYLE = 'image';

    var listWidget;
    var moreResultsListWidget;
    var windowTitle;
    var m_searchEveryWhereSuggestionsEnabled = false;
    var mMaxResultsToShow = NO_OF_ROWS_IN_PORTRAIT;

    var lastSearchString;
    var primaryResults = { id : 'primary' };
    var secondaryResults = { id : 'secondary' };
    var domainLabel;
    var m_history;

    var enabled = false;
    var empty = true;
    var SPECIAL_FEATURE_LIST = ["Entry:Item:FreeTime", "Entry:Item:VocabBuilder"];
    var that = this;

    var clearHistory = function() {
        if ( ! Pillow.hasClass(document.getElementById('clear'), "disabledClear") ) {
            nativeBridge.messagePillowCase(
                    SEARCH_BAR_PILLOW_CASE, JSON.stringify({'clearHistory': true}));
            that.m_history = [];
            nativeBridge.createFlashTrigger(FLASH_TRIGGER_TYPE_CLIENT, FLASH_TRIGGER_FIDELITY_FAST_FULL, 
                    1000, 200);
            that.setSearchHistory();
        }
    }

    var handleItemSelected = function(item) {
        if (item.xor === false) {
            //No-op as this is either a padding item or a No results/history item
            return;
        }

        if (item.searchDomain) {
            item.label = item.searchString;
        }


        nativeBridge.messagePillowCase(
                SEARCH_BAR_PILLOW_CASE, JSON.stringify({'searchResultSelected': item}));
    };

    this.show = function() {
        enabled = true;
        windowTitle.removeParam(WINMGR.KEY.HIDE_DIALOG);
        nativeBridge.messagePillowCase(
                SEARCH_BAR_PILLOW_CASE,
                JSON.stringify({resultsPopupShowing: true}));
    };

    this.hide = function() {
        enabled = false;
        windowTitle.addParam(WINMGR.KEY.HIDE_DIALOG, WINMGR.DIALOG_HIDE.BACKGROUND);
        nativeBridge.messagePillowCase(
                SEARCH_BAR_PILLOW_CASE,
                JSON.stringify({resultsPopupShowing: false}));
    };

    this.setSearchString = function(searchString, expectResults) {
        lastSearchString = searchString;
        if(searchString == undefined || searchString.trim() === "") {
            this.setSearchHistory(undefined, expectResults);
        } else { 
            this.setMoreResultsWidget(lastSearchString);
        }
    };

    this.chooseNoResultText = function() {
        if (this.domainLabel === SearchDomainStringTable.domainLabels[MY_ITEMS_SEARCH_DOMAIN_ID]) {
            if (isResultsAvailable(secondaryResults)) {
                return SearchResultsStringTable.noLibraryStoreResultsText;
            } else {
                return SearchResultsStringTable.noLibraryResultsText;
            }
        } else if (this.domainLabel === SearchDomainStringTable.domainLabels[STORE_SEARCH_DOMAIN_ID]) {
            return SearchResultsStringTable.noStoreResultsText;
        } else if (this.domainLabel === SearchDomainStringTable.domainLabels[GOODREADS_SEARCH_DOMAIN_ID]) {
            return SearchResultsStringTable.noGoodreadsResultsText;
        }
    }

    this.setSearchHistory = function(historyList, expectResults) {
        if (historyList === undefined) {
            //Restoring from stored history list. This path is hit when we switch to quick results mode and we get an empty search where we again show the cached history list
            //.slice(0) is used to do a deep copy instead of creating a reference
            if(this.m_history) {
                historyList = this.m_history.slice(0);
            } else {
                historyList = [];
            }
        } else {
            //Storing history list obtained from clientParams.
            //.slice(0) is used to do a deep copy instead of creating a reference
            this.m_history = historyList.slice(0);
        }

        if (expectResults) {
            //This case will be hit when we switch to Kindle Search
            //from another search domain with searchString already entered.
            //In this case, we can skip showing history as we will be
            //expecting search results anyway.
            return;
        }
        that.setMoreResultsWidget(lastSearchString);

        document.getElementById('resultsHeader').style.display = '';
        document.getElementById('noResultsTextDiv').style.display = "none";
        document.getElementById('spacing').style.display = 'none';
        var updatedList = [];
        if (historyList.length === 0) {
            document.getElementById('noResultsTextDiv').innerHTML = SearchResultsStringTable.emptyHistoryText;
            document.getElementById('noResultsTextDiv').style.display = "inline-block";
            Pillow.addClass(document.getElementById('clear'), "disabledClear");
        } else {
            Pillow.removeClass(document.getElementById('clear'), "disabledClear");
            while (historyList.length > 0) {
                var item = historyList.pop();
                var updatedItem = {label: item, history: true};
                updatedList.push(updatedItem);
            }
        }
        if (updatedList.length < mMaxResultsToShow) {
            //Fill in padding for now. TODO see if this can be done any other way :)
            var diff = mMaxResultsToShow - updatedList.length;
            if (this.m_history === undefined || this.m_history.length === 0) {
                diff -= 1;
            }
            for(i=1; i<=diff; i++) {
                updatedList.push({label: "", xor: false});
            }
        } 
        setTimeout(function() {
                listWidget.setMaxVisibleItems(mMaxResultsToShow);
                listWidget.setItems([]);
                listWidget.setItems(updatedList);
       }, 0);
};

    var isResultsAvailable = function(results) {
        return results && results.searchString === lastSearchString;
    };

    var isResultsValid = function(results) {
        return results && lastSearchString.indexOf(results.searchString) == 0;
    };

    var isResultsUpdated = function(results) {
        return isResultsAvailable(results) && results.done;
    }

    var shouldShowMinAvailSecondaryResults = function() {
        if(primaryResults.results && primaryResults.results.length &&
            secondaryResults.results && secondaryResults.results.length && 
            primaryResults.results.length > (mMaxResultsToShow - MINIMUM_STORE_RESULTS_TO_SHOW) &&
            secondaryResults.results.length >= MINIMUM_STORE_RESULTS_TO_SHOW) {
                return true;
        }
        return false;
    }
    
    var shouldSkipClubbing = function() {
        return isResultsAvailable(primaryResults) && primaryResults.results && (!shouldShowMinAvailSecondaryResults() && primaryResults.results.length >= mMaxResultsToShow);
    };

    var pushResults = function(resultsSource) {
         // Results are already updated, do nothing. This is invoked by the timeout callback when one result arrived before other.
         if(resultsSource.done) {
            Pillow.logInfo('Pillow.SearchResults Ignoring pushResults, update is already done');
            return;
         }

         var resultsList = [];
         if(resultsSource.results) {
             resultsList = resultsSource.results.slice(0);
         }
         that.setSearchResults(resultsSource.searchString, resultsList);
         resultsSource.done = true;
    };

    var pushCombinedResults = function(isResultsComplete) {
        // Results are already updated, do nothing. This is invoked by the timeout callback when one result arrived before other.
        if(primaryResults.done && secondaryResults.done) {
            Pillow.logInfo('Pillow.SearchResults Pillow.SearchResults Ignoring pushCombinedResults, update is already done');
            return;
        }

        var clubbedResults = [];
        if(primaryResults && primaryResults.results) {
            if (secondaryResults.results) {
                clubbedResults = primaryResults.results.concat(secondaryResults.results);
            }
            that.setSearchResults(primaryResults.searchString, clubbedResults.slice(0));
        }
        primaryResults.done = true;
        secondaryResults.done = isResultsComplete;
    };

    var updateSecondaryResults = function() {
        if(isResultsUpdated(primaryResults) && !shouldSkipClubbing()) {
            // If primary results are already flushed to screen, update secondary results immediately.
            if(shouldShowMinAvailSecondaryResults()) {
                var numSecondaryResultsToDisplay = (secondaryResults.results.length >= MINIMUM_STORE_RESULTS_TO_SHOW) ? MINIMUM_STORE_RESULTS_TO_SHOW  : secondaryResults.results.length;
                primaryResults.results = primaryResults.results.slice(0, mMaxResultsToShow - numSecondaryResultsToDisplay );
            }
            Pillow.logDbgHigh('Pillow.SearchResults Primary was updated, pushing secondary results');
            pushCombinedResults(true);
            return;
        }
        //NO-OP. When primary results arrive later, it will take care of clubbing these secondary results.
   }

   var updatePrimaryResults = function() {
        if(shouldSkipClubbing()) {
            // If there are enough primary results, update only primary immediately.
            Pillow.logDbgHigh('Pillow.SearchResults No need to club results, pushing primary results');
            pushResults(primaryResults);
            return;
        } else if(isResultsAvailable(secondaryResults)) {
            // If secondary results are available, club and update immediately.
            if(shouldShowMinAvailSecondaryResults()) {
                var numSecondaryResultsToDisplay = (secondaryResults.results.length >= MINIMUM_STORE_RESULTS_TO_SHOW) ? MINIMUM_STORE_RESULTS_TO_SHOW  : secondaryResults.results.length;
                primaryResults.results = primaryResults.results.slice(0, mMaxResultsToShow - numSecondaryResultsToDisplay );
            }
            
            Pillow.logDbgHigh('Pillow.SearchResults Both results are available, clubbing primary and secondary');
            pushCombinedResults(true);
            return;
        } else if (isResultsValid(secondaryResults)) {
            // If previous secondary results are still valid, club and update immediately.
            Pillow.logDbgHigh('Pillow.SearchResults Secondary results are not yet available, but valid, clubbing primary and previous secondary');
            pushCombinedResults(false);
            return;    
        } else {
            // If there are no secondary results, update only primary results.
            Pillow.logDbgHigh('Pillow.SearchResults Secondary results are not yet available, pushing primary results');
            pushResults(primaryResults);
            return;                    
        }
   }

   this.initResultSourcesAndWidgets = function() {
       primaryResults.results = [];
       secondaryResults.results = [];
       document.getElementById('resultsHeader').style.display = 'none';
       document.getElementById('noResultsTextDiv').style.display = "none";
       document.getElementById('spacing').style.display = 'none';
       if (listWidget && listWidget.setItems) {
           listWidget.setItems([]);
       }
   }

   this.setResultsForSource = function(searchString, newResults, resultsSource, sourceIcon) {
        // Ignore empty search term
       if (searchString === "") {
            that.setSearchHistory();
            return false;
        }

        // Ignore results if the user has already typed more
        if (!enabled || searchString != lastSearchString) {
            Pillow.logDbgHigh('Pillow.SearchResults Ignoring results, user typed different string');
            return false;
        }

	    for(var i in newResults) {
            newResults[i].source = resultsSource.id;

            //Set the searchString to identify and make bold
            newResults[i].searchString = searchString;

            if(resultsSource.imageStyle !== undefined) {
                newResults[i].icon = resultsSource.imageStyle;
            }
        }

        resultsSource.searchString = searchString;
        resultsSource.results = newResults;
        resultsSource.done = false;
        return true;
    };

    this.setPrimaryResults = function(searchString, results) {
        var shouldUpdate = this.setResultsForSource(searchString,results, primaryResults);
      
        if(!shouldUpdate) {
            return;
        }
        
        if(primaryResults.imageStyle && 
                this.domainLabel === SearchDomainStringTable.domainLabels[MY_ITEMS_SEARCH_DOMAIN_ID]) {
            for (var i in results) {
                if(this.isSpecialFeatureItem(results[i])) {
                    // TODO: point it to a src containing a blank image for a better implementation
                    results[i].icon = IMAGE_ICON_STYLE + ' ' + 'blank';
                }
            }
        }
        updatePrimaryResults();
    };

    this.isSpecialFeatureItem = function(item) {
        if(item.type) {
            if(SPECIAL_FEATURE_LIST.indexOf(item.type) != -1) { 
                return true;
            }
        }
        return false;
    }

    this.setSecondaryResults = function(searchString, results) {
        var shouldUpdate = this.setResultsForSource(searchString,results, secondaryResults);
        if (!shouldUpdate) {
            return;
        }
        updateSecondaryResults();
    };

    this.setPrimaryImageStyle = function(primaryImageStyle) {
        primaryResults.imageStyle = IMAGE_ICON_STYLE + ' ' + primaryImageStyle;
    }

    this.setSecondaryImageStyle = function(secondaryImageStyle) {
        secondaryResults.imageStyle = IMAGE_ICON_STYLE + ' ' + secondaryImageStyle;
    };

this.setMoreResultsWidget = function(searchString) {
    var suggestionsList = [];
   
    //TODO: Refactor to reuse
    if (searchString !== undefined && searchString.trim() !== "") {
        if (this.m_searchEveryWhereSuggestionsEnabled) {
	        suggestionsList.push({singlelabel:  SearchResultsStringTable.searchEverywhereForLabel,
                                    searchDomain: "Unified", 
                                    searchPattern: '{searchString}',
                                    searchString : searchString,
                                    replaceString: searchString});
        }	
    } 
   
	//Calculate the number of instant search results that needs to be shown
    var orientation = nativeBridge.getOrientation();
    var maxResultsToShow;
    if( orientation === 'L' || orientation === 'R' ) {
        maxResultsToShow = NO_OF_ROWS_IN_LANDSCAPE - suggestionsList.length;
    } else {
        maxResultsToShow = NO_OF_ROWS_IN_PORTRAIT - suggestionsList.length;
    }
    if(maxResultsToShow != mMaxResultsToShow) {
        mMaxResultsToShow = maxResultsToShow;
        var moreResultsHeight = (suggestionsList.length * ROW_HEIGHT) * Pillow.pixelPointRatio;
        var mainDivHeight = Math.round(document.body.offsetHeight - moreResultsHeight);
        var mainDivHeightStr = "height:" + mainDivHeight + "px";
        document.getElementById('mainResultsDiv').setAttribute("style",mainDivHeightStr); 
    }

    if (searchString !== undefined && searchString.trim() !== "") {
        document.getElementById('moreResults').style.display = 'block';
        setTimeout(function() {
                moreResultsListWidget.setItems([]);
                moreResultsListWidget.setItems(suggestionsList);
                }, 0);
    } else {
        document.getElementById('moreResults').style.display = 'none';
    }
}

this.setSearchResults = function(searchString, results) {
    if (searchString === undefined || searchString === "") {
        that.setSearchHistory();
        return;
    }
    if (enabled && searchString === lastSearchString) {
        
        // ignore results if the user has already typed more
        document.getElementById('resultsHeader').style.display = 'none';
        document.getElementById('spacing').style.display = 'inline-block';

        empty = results.length == 0;

        if (empty) {
            document.getElementById('noResultsTextDiv').innerHTML = that.chooseNoResultText();
            document.getElementById('noResultsTextDiv').style.display = "inline-block";
        } else {
            document.getElementById('noResultsTextDiv').style.display = "none";
        }
        
        that.setMoreResultsWidget(searchString);
        if(results.length < mMaxResultsToShow) {
            //Fill in padding for now. TODO see if this can be done any other way :)
            var diff = empty ? mMaxResultsToShow - results.length -1 : mMaxResultsToShow - results.length;
            for(i=1; i<=diff; i++) {
                results.push({label: "", xor: false});
            }
        } 

        for(var i in results) {
            if(results[i].searchString === undefined) {
                results[i].searchString = searchString;
            }
        }
        //We first set empty results so that the existing XOR buttons that were created are purged as we sometimes have to insert elements such as the padding empty element or the Empty Results/History 
        listWidget.setMaxVisibleItems(mMaxResultsToShow);
        listWidget.setItems([]);
        listWidget.setItems(results);
    }
};

this.enable = function() {
    enabled = true;
};

this.dismiss = function() {
    enabled = false;
    nativeBridge.dismissMe();
}

    this.onLoad = function() {
        //We register to WINDOW_DELETE_EVENT from pillow, but we do not take any
        //action as this is done by search_bar pillow case for us depending on the
        //memory situation on the device.
        Pillow.setOption(OPTION_SEND_DELETE_EVENTS, true);
        windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, 'searchResults');
        windowTitle.withChanges(function() {
            this.addParam(WINMGR.KEY.ROUNDED_CORNERS, WINMGR.ROUNDED_CORNERS.CUSTOM);
            this.addParam(WINMGR.KEY.ROUNDED_CORNERS_TOP_LEFT, 0);
            this.addParam(WINMGR.KEY.ROUNDED_CORNERS_TOP_RIGHT, 0);
            this.addParam(WINMGR.KEY.ROUNDED_CORNERS_BOTTOM_LEFT, 0);
            this.addParam(WINMGR.KEY.ROUNDED_CORNERS_BOTTOM_RIGHT, 0);
            this.addParam(WINMGR.KEY.BORDER_WIDTH, 2);
            this.addParam(WINMGR.KEY.FLASH_ON_HIDE, WINMGR.FLASH_ON_HIDE.SUPPRESS);
            this.addParam(WINMGR.KEY.FLASH_ON_SHOW, WINMGR.FLASH_ON_SHOW.SUPPRESS);
            this.addParam(WINMGR.KEY.CHROME_DIALOG, true);
            this.addParam(WINMGR.KEY.HIDE_DIALOG, WINMGR.DIALOG_HIDE.BACKGROUND);
            this.addParam(WINMGR.KEY.SHOWEVENT, "resultsPopupShow");
        });
        nativeBridge.setAcceptFocus(false);
        nativeBridge.showMe();
        parent(this).onLoad();
        
        
        document.getElementById('clear').onclick = clearHistory;
        document.getElementById('clear').innerHTML = SearchResultsStringTable.clearHistoryLabel;
        document.getElementById('title').innerHTML = SearchResultsStringTable.recentSearchesLabel;
        listWidget = new ListWidget('results', {fields: ['label', 'secondary-label', 'icon'], handler: handleItemSelected, showSeparator: false, replaceClass: 'boldSpan', matchStr : 'searchString', skipMatchFields : 'skip-hightlight-label'});
        moreResultsListWidget = new ListWidget('moreResults', {fields: ['singlelabel'], handler: handleItemSelected, showSeparator: false, replaceClass: 'boldSpan', matchStr : 'searchPattern', replaceStr : 'replaceString', truncateMatchStr: true});
    };
};

Pillow.SearchResults.ClientParamsHandler = function(pillowCase) {
    var parent = Pillow.extend(this, new Pillow.ClientParamsHandler());

    this.init = function(clientParams) {
        //These numbers 184pt(431px for Bourbon in portrait) and 97pt(227px for Bourbon in landscape) have been arrived by subtracting the heights of other windows from 800px(and 600px in landscape) and converting to points.
        var orientation = nativeBridge.getOrientation();
        if( orientation === 'L' || orientation === 'R' ) {
            document.body.style.height = "97.80pt";
        } else {
            document.body.style.height = "184pt";
        }
       
        pillowCase.setSearchString(undefined, clientParams.expectResults);
        
        pillowCase.initResultSourcesAndWidgets(); 
        
        if (clientParams.init === true) {
            pillowCase.enable();
        }

        if (clientParams.domainLabel) {
            pillowCase.domainLabel = clientParams.domainLabel;
        }

        if(clientParams.primaryImageStyle) {
            pillowCase.setPrimaryImageStyle(clientParams.primaryImageStyle);
        }

		if(clientParams.secondaryImageStyle) {
            pillowCase.setSecondaryImageStyle(clientParams.secondaryImageStyle);
        }

        if (clientParams.showEveryWhereSuggestions !== undefined) {
            pillowCase.m_searchEveryWhereSuggestionsEnabled = clientParams.showEveryWhereSuggestions;
        }
    
        if (clientParams.history) {
            pillowCase.setSearchHistory(clientParams.history, clientParams.expectResults);
        }
        
        window.setTimeout(function() {
            nativeBridge.setWindowSize(clientParams.width, document.body.offsetHeight);

            // JFOUR-4736 after we set the size, signal the pillow case that we are ready to show
            // by flipping the window manager flag to raise the window. For some reason still to
            // be investigated the hide flag is being flipped before the preceding setWindowSize takes
            // effect at the window manager. Adding a second push to end of gtk event Queue here to 
            // enforce the correct order of events.
            window.setTimeout(function() { pillowCase.show();},0);
        }, 0);

    };

    this.secondaryResults = function(clientParams) {
        if (clientParams.userData) {
            Pillow.logDbgLow('Pillow.SearchResults setSecondaryResults');
            pillowCase.setSecondaryResults(clientParams.userData.searchString, clientParams.userData.results);
        }
    }

    this.primaryResults = function(clientParams) {
        if (clientParams.userData) {
            Pillow.logDbgLow('Pillow.SearchResults setPrimaryResults');
            pillowCase.setPrimaryResults(clientParams.userData.searchString, clientParams.userData.results);
        }
    }


    this.searchString = function(clientParams) {
        if (clientParams.results) {
            // search results coming in from app
            pillowCase.setSearchResults(clientParams.searchString, clientParams.results);
        } else {
            // search string coming in from search bar
            pillowCase.setSearchString(clientParams.searchString);
        }
    };

    this.position = function(clientParams) {
        nativeBridge.setWindowPosition(clientParams.position.x, clientParams.position.y);
    };

    this.hide = function(clientParams) {
        if (clientParams.hide === true) {
            pillowCase.hide();
        }
    };

    this.dismiss = function(clientParams) {
        if (clientParams.dismiss === true) {
            pillowCase.dismiss();
        }
    };
};

Pillow.SearchResults.LipcEventHandler = function(pillowCase) {
    var parent = Pillow.extend(this, new Pillow.LipcEventHandler());

    this.subscribedEvents = {sources: []};
};

window.searchResults = new Pillow.SearchResults();
window.searchResults.register();


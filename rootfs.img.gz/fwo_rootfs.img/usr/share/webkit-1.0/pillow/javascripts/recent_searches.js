/*
 * recent_searches.js
 *
 * Copyright (c) 2014-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

var RecentSearches = function() {
    var that = this;

    const MAX_LIST_SIZE = 6;

    var m_list = [];
    var m_profile = "default";


    this.add = function(item) {
        //Remove leading/trailing spaces, and more than one space between words
        item = item.replace(/^\s+|\s+$/g,'').replace(/\s\s+/g, ' ');

        var found = false;
        for(var i in m_list) {
            if(m_list[i] === item) {
                found = true;
                break;
            }
        }

        if(found) {
            m_list.splice(i, 1);
        } else {
            if(m_list.length == MAX_LIST_SIZE) {
                m_list.shift();
            }
        }
        m_list.push(item);
        
        //TODO: Currently, we are persisting to disk on every add. We should look at doing this only on pillow dying or profile switch. This is a P1 scneario and will be implemented in the next iteration. 
        //For now, we delay the saveToDisk as this disk I/O could potentially cause performance issue on the
        //next operation, like displaying the search summary page or opening a book from instant search.
        setTimeout(function() {
            that.saveToDisk();
        }, 10000);
    };

    this.clear = function() {
        while (m_list.length > 0) {
            m_list.pop();
        }
        that.saveToDisk();
    };

    this.switchProfile = function(newProfile) {
        //TODO: Need to make sure we are handling profile delete events as well no avoid keeping stale data.
        //TODO: There is a very very minor security hole here, in the sense that one could go on creating accounts and we would be storing 5*5=25 history items for this account. Need to have a truncation factor and purge this file. 
        that.saveToDisk();
        m_profile = newProfile;
        that.loadFromDisk();
    };

    this.getItems = function() {
        return m_list;
    };

    this.loadFromDisk = function() {
        var csvString = nativeBridge.getRecentSearches(m_profile);
        if(csvString === "") {
            m_list = [];
        } else {
            m_list = csvString.split(',');
        }
    };

    this.saveToDisk = function() {
        nativeBridge.saveRecentSearches(m_profile, m_list.join(','));
    };
    this.loadFromDisk();
};

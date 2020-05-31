/*
 * wifi_wizard_widget_list.js
 *
 * Copyright 2012-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/*************************************************
WifiList
**************************************************/
function WifiList(m_listMaxHeight, m_dialogCallback, m_xor) {

    const LIST_ELEM_CONNECTING_CLASS = 'connecting';

    var m_firstItem;
    var m_items;
    var m_hiddenItem;
    var m_listElem;
    var m_list;
    var m_isDisabled;
    var m_noNetworks;

    var that = this;

    var listItemSelect = function(item){
        Pillow.logDbgHigh("WifiWizardDialog.actionButtonSelect");

        if (m_isDisabled){
            Pillow.logDbgHigh("main area is disabled, do nothing");
            return;
        }

        //if the row is already connected, the select should
        //kick off a disconnect/forget action
        if (item.connected){
            m_dialogCallback("delete", item);
        } else {
            that.moveNetworkToTop(item.essid, item.secureIcon);
            m_dialogCallback("connect", item);
        }
    };

    var findItemByEssid = function(essid){
        for (var i = 0; i < m_items.length; ++i){
            if (m_items[i].essid === essid){
                return m_items[i];
            }
        }
        return null;
    };

    var init = function(){
	var item   = document.getElementById('availableNetworkItem');
        var itemStyle = window.getComputedStyle(item, null);
        var itemHeight = itemStyle.getPropertyValue('height');
        // Expose this because it lets tests figure out if we are scrolling correctly.
        that.maxVisibleItems = Math.floor(m_listMaxHeight / parseInt(itemHeight));

        if (m_xor !== false){
            m_xor = true;
        }

        m_items = [m_firstItem];
        m_firstItem = null;
        m_hiddenItem = null;
        m_listElem = document.getElementById('availableNetworks');
        m_list = new ListWidget('availableNetworks', {
                    handler: listItemSelect,
                    fields: ['emptyFlag', 'selectedIcon', 'label', 'secureIcon', 'signalIcon'],
                    initialMaxVisibleItems: that.maxVisibleItems,
                    xor: m_xor,
                    showScrollBar: true,
                    identifierKey: 'essid'
                });
        m_isDisabled = false;
	
        m_noNetworks = document.getElementById('noNetworks');	
        m_noNetworks.style.display = "none";
        document.getElementById('availableNetworks').style.height = m_listMaxHeight;
    };

    var setItems = function() {
        if (m_items.length === 0){
            m_noNetworks.style.display = "inline";
            m_noNetworks.innerHTML = WifiWizardDialogStringTable.noWifiFound;
            logErrorDialogMetric(EM_NO_WIFI_FOUND_ERROR, null);
        }
        else {
            m_noNetworks.style.display = "none";
        }


        m_list.setItems(m_items);
    };
    
    /**
    * fill in list with listContent array items
    */
    this.applyListContent = function(incoming){
        m_items = [];

        for (var i in incoming){
            var item = incoming[i];
            item.position = i;
            item.disabled = false;
            item.emptyFlag = null;
            item.selectedIcon = item.connected ? 'selectedWifi' : null;
            item.label = item.essid.replace(/ /g, '\u00a0');
            m_items.push(item);
        }

        setItems();
    };

    /**
     * @method moveNetworkToTop  Put a network at the top of the list
     * @param  essid             The essid
     * @param  secureIcon    The CSS class for the security icon, if any
     *
     * Note: if there is a network in the list with the same essid, it will be hidden.
     */
    this.moveNetworkToTop = function(essid, secureIcon){
        // if there's already a network at the top, move it down
        this.moveTopNetworkBackDown(true);

        // if there's a network in the list with the same essid, hide it
        var item = findItemByEssid(essid);
        if (item){
            m_hiddenItem = item;
            m_items.splice(m_hiddenItem.position, 1);
        }

        // hide all other checkmarks
        if (m_listElem) {
            Pillow.addClass(m_listElem, LIST_ELEM_CONNECTING_CLASS);
        }

        // fill in the first item with the given details
        m_firstItem = {
            disabled: false,
            emptyFlag: null,
            selectedIcon: 'selectedWifi',
            label: essid, // TODO fix spaces
            secureIcon: secureIcon,
            signalIcon: null,
            essid: essid
        };
        m_items.splice(0, 0, m_firstItem);
        setItems();
    };

    /**
     * @method moveTopNetworkBackDown  Move the top item back to its normal place
     * @param  noRefresh               (Optional) If true, don't refresh the display (default false)
     */
    this.moveTopNetworkBackDown = function(noRefresh){
        if (m_firstItem){
            m_items.splice(0, 1);
            m_firstItem = null;
            if (m_hiddenItem){
                m_items.splice(m_hiddenItem.position, 0, m_hiddenItem);
                m_hiddenItem = null;
                if (noRefresh !== true){
                    setItems();
                }
            }
            if (m_listElem) {
                Pillow.removeClass(m_listElem, LIST_ELEM_CONNECTING_CLASS);
            }
        }
    };

    /**
    * scrolls the list to previous page of data
    */
    this.previous = function() {
        //do nothing if main area is disabled
        if (m_isDisabled){
            Pillow.logDbgHigh("main area is disabled, do nothing");
            return;
        }
        m_list.scrollUp();
    };

    /**
    * scrolls the list to the next page of data
    */
    this.next = function() {
        //do nothing if main area is disabled
        if (m_isDisabled){
            Pillow.logDbgHigh("main area is disabled, do nothing");
            return;
        }
        m_list.scrollDown();
    }
    
    /**
     * disables list from user interaction
     * 
     * @param true is disabled
     */
    this.setDisableList = function(isDisabled){
        m_list.setDisabled(isDisabled);
    }

    init();
    window.CL = this; // debug

};


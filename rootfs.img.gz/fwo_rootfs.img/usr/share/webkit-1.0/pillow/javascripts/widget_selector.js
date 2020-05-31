/*************************************************
Selector Widget
**************************************************/
function Selector(m_containerDiv, m_items, m_selectedIdx, m_callback, m_enabled) {

    var that = this;

    var m_selectorContainer;

    if (m_enabled === null || m_enabled === undefined) {
        m_enabled = true;
    }

    this.isEnabled = function() {
        return m_enabled;
    };

    var updateContainerClass = function() {
        if (m_enabled) {
            m_selectorContainer.setAttribute('class', 'lab126SelectorContainer');
        } else {
            m_selectorContainer.setAttribute('class', 'lab126SelectorContainer lab126SelectorDisabled');
        }
    };

    this.setEnabled = function(e) {
        if (e != m_enabled) {
            m_enabled = e;
            updateContainerClass();
        }
    };
    
    /*
    returns idx for a given div. used in tap handling
    */
    var getIdx = function(div){
        if (div.selectorIdx != undefined){
            return div.selectorIdx;
        } else if (div.parentElement){
            return getIdx(div.parentElement);
        } else {
            return -1;
        }
    };
    
    /*
    gets currently selected index
    */
    this.getSelectedIdx = function(){
        return m_selectedIdx;
    };

    /*
    gets currently selected value
    */
    this.getSelectedValue = function(){
        var returnVal = null;
        if (m_items){
            returnVal = m_items[m_selectedIdx].value;
        }

        return returnVal;
    };

    
    /**
    * sets currently selected index
    * @ idx
    *       idx of selector which is to be in selected state
    */
    this.setSelectedIdx = function(idx){
        
        if (idx === m_selectedIdx){
            return;
        }
        
        var cssClass = m_items[m_selectedIdx].div.getAttribute("class");
        cssClass = cssClass.replace("lab126SelectorSelected", "lab126SelectorUnselected");
        m_items[m_selectedIdx].div.setAttribute("class", cssClass);
        
        var cssClass = m_items[idx].div.getAttribute("class");
        cssClass = cssClass.replace("lab126SelectorUnselected", "lab126SelectorSelected");
        m_items[idx].div.setAttribute("class", cssClass);

        m_selectedIdx = idx;

    };

    /*
    * sets currently selected value
    * @value  the value (must be in the list of possible values or the call will be ignored)
    */
    this.setSelectedValue = function(value){
        for (var i in m_items){
            if (m_items[i].value === value){
                that.setSelectedIdx(i);
                return;
            }
        }
    };

    /*
    click handler for selector
    */
    var selectorClicked = function(event){
        nativeBridge.logDbg("+++++Selector.selectorClicked");

        if (!m_enabled){
            nativeBridge.logDbg("selector is disabled; ignoring click");
            return;
        }

        // get the index clicked
        var idx = getIdx(event.target);

        if (idx === -1){
            nativeBridge.logDbg("unable to determine which item was selected");
            return;
        }

        nativeBridge.logDbg("selected idx ", idx);

        // check to see if its a click on already selected item
        if (idx !== m_selectedIdx){

            nativeBridge.logDbg("selection changed");

            nativeBridge.logDbg("selector id is : ", m_containerDiv);

            // change idx to selected
            var replacementCssClass = m_items[idx].div.getAttribute("class");
            replacementCssClass = replacementCssClass.replace("lab126SelectorUnselected", "lab126SelectorSelected");
            m_items[idx].div.setAttribute("class", replacementCssClass);

            //change old this.selectedIdx to unselected
            replacementCssClass = m_items[m_selectedIdx].div.getAttribute("class");
            replacementCssClass = replacementCssClass.replace("lab126SelectorSelected", "lab126SelectorUnselected");
            m_items[m_selectedIdx].div.setAttribute("class", replacementCssClass);

            //change this.selectedIdx to idx
            m_selectedIdx = idx;

            // call the callback
            if (m_callback){
                m_callback(that.getSelectedValue());
            }
        }

    };
    
    var init = function(){
        //create the divs on the first time apply is called

        nativeBridge.logDbg("first time setting up selector");

        m_selectorContainer = document.getElementById(m_containerDiv);
        
        updateContainerClass();

        nativeBridge.logDbg("selectorWidth : ", m_selectorContainer.offsetWidth);

        //calculate width of each selector div
        //account for border width
        var widthOfDiv = ((m_selectorContainer.offsetWidth - 1)/m_items.length - 1)+ "px";

        nativeBridge.logDbg("divWidth  : ", widthOfDiv);

        //loop through and create
        var i;
        for (i=0; i< m_items.length; i++){
            nativeBridge.logDbg("Selector handling item ", i);

            var cssClass = "lab126SelectorSection";

            m_items[i].div = document.createElement('DIV');
            m_items[i].div.style.width = widthOfDiv;
            m_items[i].div.id = m_containerDiv + "_item_" + i;
            m_items[i].div.meaning = m_items[i].value;

            m_items[i].div.textContent = m_items[i].label;
            
            m_selectorContainer.appendChild(m_items[i].div);

            if (i === m_selectedIdx){
                cssClass += " lab126SelectorSelected";
            } else {
                cssClass += " lab126SelectorUnselected";
            }

            nativeBridge.logDbg("setting class on div to ", cssClass);
            m_items[i].div.setAttribute("class", cssClass);

            m_items[i].div.onclick = selectorClicked;

            m_items[i].div.selectorIdx = i;
        }
    };
    
    init();
};

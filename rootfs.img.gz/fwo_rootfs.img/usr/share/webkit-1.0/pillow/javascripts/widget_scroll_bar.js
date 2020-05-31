/**
* Scroll Bar Widget
*/
function ScrollBar(scrollContainer) {

    if (!(scrollContainer instanceof HTMLElement)) {
        nativeBridge.logDbg('looking for scrollbar container with id ', scrollContainer);
        scrollContainer = document.getElementById(scrollContainer);
    }
    var scrollBar  = null;
    var scrollHandle = null;
    var scrollBarVertical = null;

    if (!scrollContainer){
        Pillow.logWarn("invalid-scrollcontainer", {id: scrollContainer});
        return;
    }

    // init bar
    scrollBar = document.createElement('DIV');
    scrollBar.setAttribute("class", "lab126ScrollBar");
    scrollContainer.appendChild(scrollBar);
  
    // init handle
    scrollHandle = document.createElement('DIV');
    scrollHandle.setAttribute("class", "lab126ScrollHandle");
    scrollBar.appendChild(scrollHandle);

    scrollBarVertical = document.createElement('DIV');
    scrollBarVertical.setAttribute("class", "lab126ScrollBarVertical");
    scrollBar.appendChild(scrollBarVertical);

   /**
    * Set Scrollbar
    *
    * @param {Number} len The length of the data set which give us the
    *                     total number of items in the list
    * @param {Number} per The number of items in the list per page
    * @param {Number} page Current page within scrolling
    */
    this.setScrollbar = function(len, per, page) {
        if (!scrollBar){
            return;
        }

        if (len > per){
            //find out how many pages we have
            var pages = Math.ceil(Number(len/per));
            
            var currentPage = page;

            var scrollPercent = 100 / pages; 
            var topPct = (currentPage * scrollPercent);
            var bottomPct = ((pages - currentPage - 1) * scrollPercent);
            scrollHandle.style.top = topPct + "%";
            scrollHandle.style.bottom = bottomPct + "%";
            scrollBar.style.display = '';
            scrollContainer.setAttribute('scroll-extent-top-pct', topPct);
            scrollContainer.setAttribute('scroll-extent-bottom-pct', bottomPct);
        } else {
            scrollBar.style.display = 'none';
            scrollContainer.setAttribute('scroll-extent-top-pct', 0);
            scrollContainer.setAttribute('scroll-extent-bottom-pct', 100);
        }
     };

    /**
     * Remove scrollbar from DOM
     */
    this.remove = function() {
        if (!scrollBar || !scrollContainer) {
            return;
        }
        scrollContainer.removeChild(scrollBar);
    };
};

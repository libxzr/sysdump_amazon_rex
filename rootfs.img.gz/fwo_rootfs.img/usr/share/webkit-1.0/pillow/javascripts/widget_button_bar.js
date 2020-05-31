/*************************************************
Button Bar Widget
**************************************************/

/**
* initialization function
* @param container
*       ID of div which will gold button bar
* @param buttons
*       button array of 1, 2 or 3 buttons
* @param callback 
*       function to call when a button is selected. The button
*       object from buttons array will be passed in to the callback
*       on click
* @param layoutMode
*       One of BUTTON_LAYOUT_NORMAL, BUTTON_LAYOUT_STACKED, or BUTTON_LAYOUT_AUTO.
*       Default is BUTTON_LAYOUT_NORMAL.
* @param xor (optional, defaults to true)
*       if true, buttons are XOR'd when pressed
*/
function ButtonBar(m_container, m_buttons, m_callback, m_layoutMode, m_xor) {

    const BAR_CLASS = 'button-bar';

    const BAR_CLASSES = {};
    BAR_CLASSES[BUTTON_LAYOUT_NORMAL]  = BAR_CLASS;
    BAR_CLASSES[BUTTON_LAYOUT_STACKED] = BAR_CLASS + ' ' + 'stacked';
    BAR_CLASSES[BUTTON_LAYOUT_AUTO]    = BAR_CLASS + ' '  + 'stacked-or-split';
    BAR_CLASSES[BUTTON_LAYOUT_LISTED]    = BAR_CLASS + ' '  + 'listed';
    
    nativeBridge.logDbg("construct ButtonBar");

    var m_initialized = false;
    var m_containerDiv = null;
    var m_xorButtons = [];
    var m_onReset = [];

    // m_xor defaults to true
    if (m_xor !== false) {
        m_xor = true;
    }
    
    /**
     * tell the button bar that it isn't visible anymore
     */
    this.notVisible = function(){
        m_xorButtons.forEach(function(xb) { xb.notVisible(); });
    };
    
    /**
     * initialize the cmd bar
     */
    this.init = function(){
        if (m_initialized){
            nativeBridge.logDbg("already initialized");
            return;
        }
            
        if (!m_container){
            Pillow.logWarn('pillow-bb-no-container-id');
            return;
        }

        if (!m_buttons){
            Pillow.logWarn('pillow-bb-no-buttons');
            return;
        }
        
        m_containerDiv = document.getElementById(m_container);
        if (!m_containerDiv) {
            Pillow.logWarn('pillow-bb-no-container');
            return;
        }

        // set default layout mode if we aren't given a valid value
        if (m_layoutMode !== BUTTON_LAYOUT_NORMAL &&
                m_layoutMode !== BUTTON_LAYOUT_STACKED &&
                m_layoutMode !== BUTTON_LAYOUT_AUTO &&
                m_layoutMode !== BUTTON_LAYOUT_LISTED ) {
            if (m_layoutMode != null) {
                // it's optional, so only warn if we got a garbage value
                Pillow.logWarn('pillow-bb-invalid-layout', {layoutMode: m_layoutMode});
            }
            m_layoutMode = BUTTON_LAYOUT_NORMAL;
        }

        // special layouts are only for 3 buttons
        if (m_layoutMode !== BUTTON_LAYOUT_NORMAL && m_buttons.length < 3) {
            m_layoutMode = BUTTON_LAYOUT_NORMAL;
        }
        
        m_containerDiv.setAttribute("class", BAR_CLASSES[m_layoutMode]);
        
        // create and add buttons
        for (var i = 0; i < m_buttons.length; ++i) {
            (function(i) {
                // create and add button
		var button = document.createElement('button');
		
		// Label will be spoken first, then the description
                button.setAttribute('aria-label', m_buttons[i].description ?
                                   (m_buttons[i].text).concat(", ", m_buttons[i].description) :
                                    m_buttons[i].text);

                button.meaning = m_buttons[i].id ? m_buttons[i].id : "button" + i;
		// Modify class name of the button if in large mode.
                modifyClassNameElement(button);
                var textDiv = document.createElement('div');
                textDiv.setAttribute("class", "button-text");
                textDiv.textContent = m_buttons[i].text;
                button.appendChild(textDiv);
                m_containerDiv.appendChild(button);

                if (m_buttons[i].disabled) {
                    button.disabled = true;
                }

                // create xor button and set click handler
                var callback = Pillow.bind(null, m_callback, m_buttons[i]);
                if (m_xor) {
                    m_xorButtons.push(new XorButton(
                                button,
                                callback,
                                button,
                                button.className,
                                button.className + " xor"));
                } else {
                    button.addEventListener('click', callback); 
                }
                
                m_buttons[i].button = button;

                // create separators for all buttons in the listed button layout except the first button.
	        if(m_layoutMode == BUTTON_LAYOUT_LISTED && i) {
                    var separator = document.createElement('div');
                    separator.setAttribute('class', 'liner');
                    m_containerDiv.appendChild(separator);
                }
            })(i);
        }

        // set init to true so it can't be done again
        m_initialized = true;
    };
    
    /**
     * change out the buttons in the button bar
     * @param buttons
     *      new button array
     * @param layoutMode
     *      new layout mode
     */
    this.resetButtons = function(buttons, layoutMode){
        // if already initialized, clear out old buttons first
        if (m_initialized && m_containerDiv) {
            while (m_containerDiv.hasChildNodes()) {
                m_containerDiv.removeChild(m_containerDiv.lastChild);
            }

            m_containerDiv = null;
            m_xorButtons = [];
        }

        // change out the buttons, etc
        m_buttons = buttons;
        m_initialized = false;
        m_layoutMode = layoutMode;
        
        // re-init
        this.init();

        // trigger callbacks
        if (m_containerDiv && m_containerDiv.onvisualchange) {
            m_containerDiv.onvisualchange();
        }
    };

    /**
     * Change the layout.
     */
    this.setLayout = function(layoutMode){
        this.resetButtons(m_buttons, layoutMode);
    };
    
    /**
     * disables/enables a button. Disabled buttons set 
     * to an non interactable visual state and marks it 
     * to ignore user taps
     * 
     * @param idx 
     *      idx of button to disable/enable
     * @param value
     *      true to disable, false to enable
     */
    this.setButtonDisabled = function(idx, value){
        if (idx >= m_buttons.length){
            Pillow.logWarn("invalid-button", {idx: idx, nbuttons: m_buttons.length},
                    "setButtonDisabled:: button out of range");
            return;
        } 
        
        m_buttons[idx].disabled = value;
        m_buttons[idx].button.disabled = value;
        if (m_xorButtons[idx]){
            m_xorButtons[idx].unarm();
        }
    };

    // initialize on instantiation
    this.init();
}

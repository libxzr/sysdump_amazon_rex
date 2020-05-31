var Dialog = {
    hintEnabled             : false,
    windowIsVisible         : false,
    state                   : "",
    infiniteAttemptsEnabled : false,
    isDeviceBricked         : "",
    triesUntilReset         : 1000,
};

/*
hides the window
*/
Dialog.hideWindow = function() {
    if (Dialog.windowIsVisible) {
        nativeBridge.hideMe();
        Dialog.windowIsVisible = false;
    }
};


/**
 * Flashes dialog title by showing and hiding it.
 * Every subsequent call either hides the title if is visible or shows it if it is invisible,
 * and then sets a timer to invoke flashTitle() again if n is greater then zero.
 * @param n How many times to invoke the function. If it is negative or zero, just show title.
 */
Dialog.flashTitle = function(n) {
    var styleVisible='visible';
    var styleHidden='hidden';

    if (n > 0) {
        if (Dialog.title.style.visibility == styleVisible) {
            Dialog.title.style.visibility = styleHidden;
        } else {
            Dialog.title.style.visibility = styleVisible;
        }
        setTimeout(function(){ Dialog.flashTitle(n - 1) }, 600);
    } else {
        Dialog.title.style.visibility = styleVisible;
    }
}

/*
shows the window
*/
Dialog.showWindow = function(retries) {
    if (!Dialog.windowIsVisible) {
        var w, h;
        if (Dialog.state == "contacts") {
            w = Dialog.forgotPasswordDialog.offsetWidth;
            h = Dialog.forgotPasswordDialog.offsetHeight;
            nativeBridge.logInfo("ForgotPasswordDialog clicked and display.");  
            nativeBridge.recordDeviceMetric("PasswordDialog","ForgotPassword","showWindow", 1, 0, 0, 0);
        } else {
            w = Dialog.passwordDialog.offsetWidth;
            h = Dialog.passwordDialog.offsetHeight;
        }
        if ((w > 0 && h > 0) || retries <= 0) {
            nativeBridge.setWindowSize((w > 0) ? w : 500 , (h > 0) ? h : 500);
            nativeBridge.showMe();
            Dialog.windowIsVisible = true;
            Dialog.input.focus(); 
        } else  {
            setTimeout(function(){ Dialog.showWindow(retries - 1) }, 0);
        }    
    }
};

Dialog.setErrorText = function() {
    Dialog.title.textContent = PasswordDialogStringTable.passwordErrorTitle;
    if(Dialog.triesUntilReset > 0 && Dialog.triesUntilReset <= 2 && !Dialog.infiniteAttemptsEnabled) { 
        Dialog.passwordDialogText.textContent = PasswordDialogStringTable.passwordErrorText[Dialog.triesUntilReset];
    } else {
        Dialog.passwordDialogText.textContent = PasswordDialogStringTable.passwordErrorText[0];
    }
};

Dialog.stateInitial = function() {
    if (Dialog.state != "initial") {
        Dialog.hideWindow();
        Dialog.title.textContent = PasswordDialogStringTable.passwordEntryTitle;
        Dialog.passwordDialogExtra.style.display = 'none';
        Dialog.forgotPasswordDialog.style.display = 'none';
        Dialog.passwordDialog.style.display = 'block';
        
        Dialog.state = "initial";
        setTimeout(function(){ Dialog.showWindow(10) }, 0);
    }
};

Dialog.stateBricked = function() {
    if (Dialog.state != "bricked") {
        Dialog.hideWindow();
        Dialog.title.textContent = PasswordDialogStringTable.brickPasswordEntryTitle;
        Dialog.passwordDialogText.textContent = PasswordDialogStringTable.brickPasswordInfoText;
        Dialog.passwordDialogExtra.style.display = 'block';
        Dialog.forgotPasswordDialog.style.display = 'none';
        Dialog.passwordDialog.style.display = 'block';
        Dialog.state = "bricked";
        setTimeout(function(){ Dialog.showWindow(10) }, 0);
    } else {
        Dialog.flashTitle(2);
    }
}

Dialog.stateError = function() {
    // Also displayed after user presses OK button on Forgot Passcode dialog.
    // If device is bricked, show bricked dialog.
    if (Dialog.isDeviceBricked) {
        Dialog.stateBricked();
        return;
    }

    Dialog.setErrorText();
    if (Dialog.state != "error") {
        Dialog.hideWindow();
        Dialog.passwordDialog.style.display = 'block';
        Dialog.passwordDialogExtra.style.display = 'block';
        Dialog.forgotPasswordDialog.style.display = 'none';
        Dialog.state = "error";
        setTimeout(function(){ Dialog.showWindow(10) }, 0);
    } else {
        Dialog.flashTitle(2);
    }
};

Dialog.stateContacts = function() {
    if (Dialog.state != "contacts") {
        Dialog.hideWindow();
        Dialog.passwordDialog.style.display = 'none';
        Dialog.forgotPasswordDialog.style.display = 'block';
        Dialog.state = "contacts";
        setTimeout(function(){ Dialog.showWindow(10) }, 0);
    }
};

Dialog.ok = function() {
    if (Dialog.input.value.length > 0) {
        var previousBrickState = Dialog.isDeviceBricked;
        nativeBridge.validatePassword(Dialog.input.value);
        
        // check if the device is unbricked
        Dialog.isDeviceBricked = nativeBridge.isBricked();

        // validatePassword returned
        Dialog.input.value = "";
        
        if (!Dialog.isDeviceBricked && !Dialog.infiniteAttemptsEnabled && Dialog.triesUntilReset > 0) {
            Dialog.triesUntilReset -= 1;
        }
        
        if (Dialog.isDeviceBricked) {
            Dialog.stateBricked();
        } else if (previousBrickState) {
            // Device was successfully unbricked, show the initial device
            // passcode dialog
            Dialog.stateInitial();
        } else {
            // Incorrect device passcode entered
            Dialog.stateError();
        }
    }
};

Dialog.cancel = function(event) {
    nativeBridge.validatePassword();
};

Dialog.buttonClick = function(event) {
    nativeBridge.logDbg("Dialog.buttonClick called event.target.id = " + event.target.id);

    switch (event.target.id) {
    case 'ok': 
        Dialog.ok();    
        break;
    case 'backspace':
        var startPos = Dialog.input.selectionStart;
        var endPos = Dialog.input.selectionEnd;

        if (startPos == endPos && startPos > 0) {
            startPos -= 1;
        }
        if (startPos < endPos) {
            Dialog.input.value = Dialog.input.value.substring(0, startPos) + Dialog.input.value.substring(endPos);
            Dialog.input.selectionStart = startPos;
            Dialog.input.selectionEnd = startPos;
        }
        break;

    default: 
        var startPos = Dialog.input.selectionStart;
        var endPos = Dialog.input.selectionEnd;
        var s1 = Dialog.input.value.substring(0, startPos);
        var s2 = Dialog.input.value.substring(endPos);

        Dialog.input.value = s1 + event.target.id + s2;
        Dialog.input.selectionStart = startPos + 1;
        Dialog.input.selectionEnd = startPos + 1;
        break;
    }
};


/**
 * Mousedown handler for topmost div. Prevents losing focus by input fields. 
 * @param {Event} event Event object
 */
Dialog.mouseDown = function(event) {
    event.preventDefault();
};

/**
 * Short-hand to add an event listener to the provided element.
 * @inner
 * @param {HTMLElement} element Element to attach listener to
 * @param {String} eventName Name of HTML event to listen for
 * @param {Function} callback Function to call when event triggers
 * @param {Boolean} [capture] Optionally capture instead of bubble
 */
Dialog.addEvent = function(element, eventName, callback, capture) {
    element.addEventListener(eventName, callback, capture || false);
};

Dialog.saveElements = function() {
    Dialog.passwordDialog = document.querySelector('.passwordDialog');
    Dialog.title = document.querySelector('.passwordDialog .dialog-title-text');
    Dialog.passwordDialogExtra = document.querySelector('.passwordDialog .passwordDialogExtra');
    Dialog.input = document.querySelector('.passwordDialog .passwordInput');
    Dialog.passwordDialogText = document.querySelector('.passwordDialog #text');
    Dialog.forgotPasswordDialog = document.querySelector('.forgotPasswordDialog');
};

Dialog.registerEvents = function() {
    var buttons = document.querySelectorAll('.keypadButton');
    for (var i = 0; i < buttons.length; ++i) {
        new XorButton(buttons[i], Dialog.buttonClick, buttons[i],
            "keypadButton",  "keypadButton passwordXOR", {delayAction:false, initialTimeoutLength : 50});
    }
    Dialog.addEvent(document.querySelector('.passwordDialog .close-button-hit-target'), 
        'click', Dialog.cancel);

    Dialog.addEvent(document.querySelector('.passwordDialog #forgotPassword'), 
        'click', Dialog.stateContacts);
    Dialog.addEvent(document.querySelector('.passwordDialog .buttonRight'), 
        'click', Dialog.stateContacts);

    var ok_button = document.querySelector('.forgotPasswordDialog button');
    modifyClassNameElement(ok_button);
    new XorButton(ok_button, Dialog.stateError, ok_button,
            ok_button.className, ok_button.className + " xor", {initialTimeoutLength : 50});

    Dialog.addEvent(document.querySelector('.passwordDialog'), 'mousedown', Dialog.mouseDown);
};

/*
  localize static labels, titles, etc.
*/
Dialog.localizeContent = function() {
    Dialog.title.textContent = PasswordDialogStringTable.passwordEntryTitle;
    document.querySelector('.passwordDialog #text').textContent = PasswordDialogStringTable.passwordErrorText;
    if (Dialog.hintEnabled) {
        var hint = nativeBridge.getHint();
        nativeBridge.logDbg("hint = " + hint);
        if (hint) {
            document.querySelector('.passwordDialog #hintPrompt').textContent = 
                PasswordDialogStringTable.passwordHint;
            document.querySelector('.passwordDialog #hint').textContent = hint;
        }
    } else {
        document.querySelector('.passwordDialog #hintPrompt').style.display = 'none';
        document.querySelector('.passwordDialog #hint').style.display = 'none';
    }
    document.querySelector('.passwordDialog #forgotPassword').textContent = PasswordDialogStringTable.forgotPassword;
    document.querySelector('.passwordDialog #ok').textContent = PasswordDialogStringTable.okay;

    document.querySelector('.forgotPasswordDialog .dialog-title-text').textContent = PasswordDialogStringTable.forgotPasswordTitle;
    document.querySelector('.forgotPasswordDialog .passwordText').textContent = PasswordDialogStringTable.forgotPasswordText;
    document.querySelector('.forgotPasswordDialog .button-text').textContent = PasswordDialogStringTable.okay;
};

Dialog.setDevicePasscodeCounter = function() {
    Dialog.infiniteAttemptsEnabled = !nativeBridge.isMaxPasswordAttemptPolicyEnabled();
    if (!Dialog.infiniteAttemptsEnabled) {
        Dialog.triesUntilReset = nativeBridge.getMaxPasswordAttempts();
    }
};


/************************************************************
Main entry point
*************************************************************/

Dialog.init = function(){
    nativeBridge.logDbg("custom dialog init function called");
    Dialog.saveElements();
    Dialog.registerEvents();
    Dialog.localizeContent();
    Dialog.setDevicePasscodeCounter();
    
    Dialog.isDeviceBricked = nativeBridge.isBricked();
    (Dialog.isDeviceBricked) ? Dialog.stateBricked() : Dialog.stateInitial();

    //API to check for larger display mode and parsing the DOM to pick large property values
    modifyClassNameDOM();
};

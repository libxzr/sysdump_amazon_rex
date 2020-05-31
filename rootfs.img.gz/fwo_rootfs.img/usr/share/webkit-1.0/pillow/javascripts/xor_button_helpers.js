/*
 * xor_button_helpers.js
 *
 * Copyright 2012 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * Set the text of a <button> in an XOR-safe way.
 * The text will be put into a <div class="button-text"> inside the <button>.
 *
 * Both the <button> and the <div> must have fixed widths and hidden overflow.
 *
 * If the button width must vary with the text width, pass true as the third
 * parameter and the button's width will be fixed by the code, based on the
 * text width.
 *
 * @param button   The button element
 * @param text     The button text
 * @param varWidth The button width should vary with the text width
 */
var setButtonText = function(button, text, varWidth) {
    if (button && text) {
        var div = button.querySelector('.button-text');
        if (!div) {
            div = document.createElement('div');
            div.setAttribute('class', 'button-text');
            button.appendChild(div);
        }
        if (varWidth) {
            div.style.width = 'auto';
            button.style.width = 'auto';
        }
        div.textContent = text;
        if (varWidth) {
            button.style.width = button.offsetWidth + 'px';
            div.style.width = div.offsetWidth + 'px';
        }
    }
};


/**
 * widget_toggle.js
 *
 * Copyright 2013 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * ToggleButton
 *
 * A toggle button to switch between 2 states.
 *
 * @param elem          The DOM container in which the slider should be created
 * @param on            The text to be displayed when the toggle button is ON.
 * @param off           The text to be displayed when the toggle button is OFF.
 * @param handler       A function to call when the user changes the toggle state.
 *                      The toggle button state will be the argument to this function.
 */
 var ToggleButton = function(elem, on, off, handler){
    var onText = on;
    var offText = off;

    var parent = elem;
    newChild = document.createElement('div');
    newChild.id= "sliderframe";
    newChild.className= newChild.className+" slider-frame";
    parent.appendChild(newChild);
	
    parent = document.getElementById('sliderframe');
    newChild = document.createElement('div');
    newChild.id= "slider-frame-text";
    parent.appendChild(newChild);
	
    newChild = document.createElement('div');
    newChild.id= "sliderbutton";
    newChild.className= newChild.className+" slider-button";
    parent.appendChild(newChild);
		
    var mousedown = function() {
        setToggleState(getSliderText() === offText);
        handler(getSliderText() === onText);
    };
		
    document.getElementById("sliderframe").addEventListener('mousedown',mousedown);
		
    this.setToggle = function(state) {
        setToggleState(state);
    }

    var setToggleState = function(state){
        if(state) {
            var element = document.getElementById("sliderbutton");
            element.className = element.className.replace(/(?:^|\s)slider-button-off(?!\S)/g,'');
            element.className = element.className + " slider-button-on";

            element = document.getElementById("sliderframe");
            element.className = element.className.replace(/(?:^|\s)slider-frame-white(?!\S)/g,'');
            element.className = element.className + " slider-frame-black";

            element=document.getElementById("slider-frame-text");
            element.textContent= onText;
            element.className = element.className.replace(/(?:^|\s)slider-frame-text-off(?!\S)/g,'');
            element.className = element.className + " slider-frame-text-on";
        } else {
            var element = document.getElementById("sliderbutton");
            element.className = element.className.replace(/(?:^|\s)slider-button-on(?!\S)/g,'');
            element.className = element.className + " slider-button-off";

            element = document.getElementById("sliderframe");
            element.className = element.className.replace(/(?:^|\s)slider-frame-black(?!\S)/g,'');
            element.className = element.className + " slider-frame-white";

            element = document.getElementById("slider-frame-text");
            element.textContent = offText;
            element.className = element.className.replace(/(?:^|\s)slider-frame-text-on(?!\S)/g,'');
            element.className = element.className + " slider-frame-text-off";				
        } 
    };
	
    function getSliderText(){
        element=document.getElementById("slider-frame-text");
        return element.textContent;
    };
	
};

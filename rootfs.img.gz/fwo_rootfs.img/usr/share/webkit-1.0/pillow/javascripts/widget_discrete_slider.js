/*
 * widget_discrete_slider.js
 *
 * Copyright 2012-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

/**
 * DiscreteSlider
 *
 * A horizontal array of squares which function as a "slider" but with a finite
 * set of discrete values that can be selected.
 *
 * @param elem          The DOM container in which the slider should be created
 * @param initialIndex  The initial position of the slider
 * @param maxIndex      The largest allowable position
 * @param handler       A function to call when the user changes the slider.
 *                      The new position will be the argument to this function.
 * @param userOptions   Overrides of the defaults in DEFAULT_OPTIONS (see below).
 */
var DiscreteSlider = function(elem, initialIndex, maxIndex, handler, userOptions) {

    const DEFAULT_OPTIONS = {
        interactive: true
    };

    var options = {};
    if (!userOptions) {
        userOptions = {};
    }
    for (var i in DEFAULT_OPTIONS) {
        if (userOptions.hasOwnProperty(i)) {
            options[i] = userOptions[i];
        } else {
            options[i] = DEFAULT_OPTIONS[i];
        }
    }

    var showNumbers = Pillow.hasClass(elem, 'show-numbers') || Pillow.hasClass(elem, 'show-numbers-after');
    // whether numbers should be shown before or after slider widget
    var numberAfter = Pillow.hasClass(elem, 'show-numbers-after');

    var curIndex = 0;

    var boxes = [];

    var setBoxClass = function(i, cls) {
        boxes[i - 1].setAttribute('class', cls);
    };

    /**
     * Return true if the given index is valid.
     */
    var validate = function(index) {
        if (!Pillow.isInteger(index)) {
            Pillow.logWarn('slider-index-not-an-integer', {index: index});
            return false;
        } else if (index < 0 || index > maxIndex) {
            Pillow.logWarn('slider-index-out-of-range', {index: index});
            return false;
        }
        return true;
    };

    /**
     * Update the display to show nextIndex as the selected position.
     */
    var updateDisplay = function(nextIndex) {
        if (nextIndex > curIndex) {
            if (curIndex > 0) {
                setBoxClass(curIndex, 'box full');
            }
            for (var i = curIndex + 1; i < nextIndex; ++i) {
                setBoxClass(i, 'box full');
            }
            setBoxClass(nextIndex, 'box full last');
        } else if (nextIndex < curIndex) {
            for (var i = curIndex; i > nextIndex; --i) {
                setBoxClass(i, 'box empty');
            }
            if (nextIndex > 0) {
                setBoxClass(nextIndex, 'box full last');
            }
        }
    };

    /**
     * Update the display and call the callback.
     */
    var update = function(nextIndex) {
        if (validate(nextIndex)) {
            var oldIndex = curIndex;
            updateDisplay(nextIndex);
            if (curIndex != nextIndex)
            {
              curIndex = nextIndex;
              handler(curIndex, oldIndex);
            }
        }
    };

    var addBox = function(boxIndex) {
        var box = document.createElement('div');
        box.setAttribute('class', 'box empty');
        if (showNumbers) {
            var tb = document.createElement('div');
            tb.setAttribute('class', 'tb');
            tb.textContent = boxIndex;
        }
        var vb = document.createElement('div');
        vb.setAttribute('class', 'vb');

        if (numberAfter) {
            box.appendChild(vb);
            box.appendChild(tb);
        } else {
            box.appendChild(tb);
            box.appendChild(vb);
        }

        var callback = Pillow.bind(null, update, boxIndex);
        if (options.interactive) {
            box.addEventListener('mousedown', callback);
            box.addEventListener('mouseover', callback);
        }
        boxes.push(box);
        elem.appendChild(box);
    };

    for (var i = 1; i <= maxIndex; ++i) {
        addBox(i);
    }

    if (!validate(initialIndex)) {
        initialIndex = 0;
    }
    updateDisplay(initialIndex);
    curIndex = initialIndex;

    /**
     * Increase the position by one, if possible.
     */
    this.increment = function() {
        if (curIndex < maxIndex) {
            update(curIndex + 1);
        }
    };

    /**
     * Decrease the position by one, if possible.
     */
    this.decrement = function() {
        if (curIndex > 0) {
            update(curIndex - 1);
        }
    };

    /**
     * Set the position to the maximum.
     */
    this.goToMax = function() {
        update(maxIndex);
    };

    /**
     * Set the position to zero.
     */
    this.goToMin = function() {
        update(0);
    };

    /**
     * Get the selected position.
     */
    this.getIndex = function() {
        return curIndex;
    };
    
    /**
     * Get the Maximum position.
     */
    this.getMax = function() {
        return maxIndex;
    };
    
    /**
     * Set the slider's value as if the user had tapped it.
     */
    this.setIndex = function(index) {
        update(index);
    };

    /**
     * Notify the slider that the real value the slider represents has been
     * changed by a mechanism outside the slider's control.
     *
     * This means that the slider should update its state without calling the
     * callback.
     */
    this.correctIndex = function(index) {
        if (validate(index)) {
            updateDisplay(index);
            curIndex = index;
        }
    };

    var isVertical = Pillow.hasClass(elem, 'vertical');
    var isInverted = Pillow.hasClass(elem, 'inverted');

    var convertRawIndex;
    if (isInverted) {
        convertRawIndex = function(rawIndex) {
            return maxIndex - rawIndex;
        };
    } else {
        convertRawIndex = function(rawIndex) {
            return rawIndex;
        };
    }

    /**
     * Notify the slider of a tap that should set the current value.  The
     * position of the tap is given in pixels. Based on whether slider is horizontal/vertical left/top edge is taken.
     */
    this.tapAtPosition = function(position) {
        this.tapAt(isVertical ? position.y : position.x);
    }


    /**
     * Notify the slider of a tap that should set the current value.  The
     * position of the tap is given in pixels from the relevant edge of the
     * body (left for horizontal sliders, right for vertical sliders).
     */
    this.tapAt = function(pos) {
        // TODO : Calculate the start and end pixel once
	// obtaining the position of the light slider with respect to its position on the screen
	var rect = elem.getBoundingClientRect();
        
        var startPixel = (isVertical ? rect.top : rect.left);
	var endPixel = (isVertical ? rect.bottom : rect.right);

	var numPixels = endPixel - startPixel + 1
        
	if (pos < startPixel) {
            return;
        } else if (pos > endPixel) {
            return;
        } else {
            this.setIndex(convertRawIndex(Math.round(maxIndex * (pos - startPixel) / numPixels)));
        }
    };

};


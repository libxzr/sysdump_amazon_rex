/*
 * light.js
 *
 * Copyright (c) 2012-2015 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

const POWERD_SRC = 'com.lab126.powerd';
const INTENSITY_PROP = 'flIntensity';
const MAX_INTENSITY_PROP = 'flMaxIntensity';
const TURBO_BRIGHTNESS_INTENSITY_PROP = 'flTurboBrightnessIntensity';
const TITLE_BAR_PILLOW_CASE = 'default_status_bar';
const SHOW_LIGHT_ICON_KEY = 'showLightIcon';
const LIGHT_DESCRIPTION_KEY = 'lightDescription';
const SHOW_LIGHT_DESCRIPTION_KEY = 'showLightDescription';
const AUTO_LIGHT_PROP = 'flAuto';
const ALS_MODE_ENABLED = 1;
const SIX_LED_LIGHT = "wario_6led";
/** Indicates whether device has Front Light capability */
const HAS_FRONTLIGHT = nativeBridge.devcapIsAvailable(DEVCAP_FRONTLIGHT);

Pillow.LightControls = function() {};

/**
 * Get the current light level from powerd.
 * This may be called even from a pillow case with no light controls.
 */
var getLightLevel = function() {
    return nativeBridge.getIntLipcProperty(POWERD_SRC, INTENSITY_PROP);
};

/** variable to store the ALS device capability */
var hasAlsDeviceCapability = nativeBridge.devcapIsAvailable(DEVCAP_ALS);
/** Time-out to read from powerd. */
const ALS_INTENSITY_READ_TIMEOUT = 1000;
/** Timer for the periodic read */
var alsIntensityReadTimer;

/** Variable to store the 6 LED front light capability*/
var hasSixLED = (nativeBridge.devcapGetString(DEVCAP_FRONTLIGHT, DEVCAP_PROPERTY_LED_TYPE) == SIX_LED_LIGHT);

var lightSlider = null;

var curRange = null;

var isDown = false;

/** light level when the dialog was opened */
var initialLightLevel = null;

/** variable to store the turbo brighness capability */
var hasTurboIntensity = false;

/** variable to store current ALS Mode */
var currentAlsMode = null;

var findLightRange = function(index) {
    for (var i in LightConfig) {
        var range = LightConfig[i];
        if (index >= range.min && index <= range.max) {
            return range;
        }
    }
    return null;
};

var updateTitleBar = function(newIndex, oldIndex) {
    if (newIndex != oldIndex) {
        var lastRange = curRange;
        if (!curRange || newIndex < curRange.min || newIndex > curRange.max) {
            curRange = findLightRange(newIndex);
        }
        if (curRange !== lastRange || newIndex === 0 || oldIndex === 0) {
            var msg = {};
            msg[SHOW_LIGHT_ICON_KEY] = newIndex != 0;
            if (curRange) {
                var desc = curRange.id;
                if (desc) {
                    msg[LIGHT_DESCRIPTION_KEY] = desc;
                }
            }
            nativeBridge.messagePillowCase(TITLE_BAR_PILLOW_CASE, JSON.stringify(msg));
        }
    }
};

/**
 * Configure the turbo brightness item visibility
 */
var configureLightBoostVisibility = function(show) {
    if (hasTurboIntensity) {
        var turboBrightnessElement = document.getElementById('TurboBrightnessSelector');
        var bracketTB = document.getElementById('bracketTB');
        if (bracketTB) {
            if (show) {
            turboBrightnessElement.style.visibility = "visible";
            bracketTB.style.visibility = "visible";
            } else {
            turboBrightnessElement.style.visibility = "hidden";
            bracketTB.style.visibility = "hidden";
            }
        }
    }
}

/**
 * Update turbo brightness settings
 */
var updateTurboBrightness = function() {
    var maxLevel = nativeBridge.getIntLipcProperty(POWERD_SRC, MAX_INTENSITY_PROP);
    var numberOfTurboLevels = nativeBridge.getIntLipcProperty(POWERD_SRC, TURBO_BRIGHTNESS_INTENSITY_PROP);
    var maxLevelForNormalIntensity = maxLevel - numberOfTurboLevels;
    var currentIntensityLevel = getLightLevel();
    
    if(currentIntensityLevel > maxLevelForNormalIntensity && lightSlider) {
        lightSlider.setIndex(lightSlider.getMax());
    }
}


/**
 * Toggle turbo brightness settings
 */
var toggleTurboBrightness = function(event) {
    var newIndex = 0;
    var oldIndex = 0;
    var turboBrightnessElement = document.getElementById('TurboBrightnessSelector');
   
    newIndex = lightSlider.getMax() + 1;
    oldIndex = lightSlider.getIndex();

    lightSlider.setIndex(lightSlider.getMax());
    nativeBridge.setIntLipcProperty(POWERD_SRC, INTENSITY_PROP, newIndex);
    updateTitleBar(newIndex, oldIndex);
}

var updateLightLevel = function() {
    if (lightSlider) {
        var newIndex = getLightLevel();
        var oldIndex = lightSlider.getIndex();
        lightSlider.correctIndex(newIndex);
        updateTitleBar(newIndex, oldIndex);
    }
};

var setLightDescriptionVisibility = function(v) {
    var msg = {};
    msg[SHOW_LIGHT_DESCRIPTION_KEY] = Boolean(v);
    if (curRange) {
        msg[LIGHT_DESCRIPTION_KEY] = curRange.id;
    }
    nativeBridge.messagePillowCase(TITLE_BAR_PILLOW_CASE, JSON.stringify(msg));
};

alsIntensityReadPeriodic = function() {
    if(currentAlsMode == ALS_MODE_ENABLED) {
        updateLightLevel();
    }
    alsIntensityReadTimer = setTimeout(alsIntensityReadPeriodic, ALS_INTENSITY_READ_TIMEOUT);
}

Pillow.LightControls.onShow = function() {
    if(HAS_FRONTLIGHT && hasAlsDeviceCapability) {
        updateLightLevel();
        clearTimeout(alsIntensityReadTimer);
        alsIntensityReadTimer = setTimeout(alsIntensityReadPeriodic, ALS_INTENSITY_READ_TIMEOUT);
    }
}

Pillow.LightControls.onHide = function() {
    if(!HAS_FRONTLIGHT) {
        return;
    }

    if(hasAlsDeviceCapability) {
        clearTimeout(alsIntensityReadTimer);
        recordMetricOnClose();
    }
}

var onWindowBlur = function() {              
    isDown = false;                                            
};

var mousedown = function(e) {
    lightSlider.tapAtPosition(e);
    isDown = true;
};

var mouseup = function() {
    isDown = false;
};

var mousemove = function(e) {
    if (isDown) {
        lightSlider.tapAtPosition(e);
    }
};

var checkBoxClicked = function(e) {
    setCheckBoxState(!currentAlsMode);
    setTimeout(function() { nativeBridge.setIntLipcProperty(POWERD_SRC, AUTO_LIGHT_PROP, currentAlsMode ? 1 : 0); }, 100);
};

Pillow.LightControls.updateAutoBrightnessMode = function() {
    if(HAS_FRONTLIGHT) {
        var autoVal = nativeBridge.getIntLipcProperty(POWERD_SRC, AUTO_LIGHT_PROP);
        setCheckBoxState(autoVal);
    }
}

var setCheckBoxState = function(state) {
    if(currentAlsMode == state) {
        return;
    }
    if(state) {
        var element = document.getElementById("check-box");
        element.className = element.className.replace(/(?:^|\s)alsOFF(?!\S)/g,'');
        element.className = element.className+" alsON";
    } else {
        var element = document.getElementById("check-box");
        element.className = element.className.replace(/(?:^|\s)alsON(?!\S)/g,'');
        element.className = element.className+" alsOFF";
    }
    currentAlsMode = state;
}

Pillow.LightControls.initLightControls = function() {
    //Hide light controls if device does not support front light
    if(!HAS_FRONTLIGHT) {
        Pillow.logInfo("Does not support frontlight, hiding light controls");
        var lightDialog = document.getElementById('light-popup');
        if(lightDialog) {
            lightDialog.style.display = "none";
        }
        return;
    }

    window.addEventListener('blur', onWindowBlur);

    initialLightLevel = getLightLevel();

    const HOLD_DURATION = 500;
    
    if(hasSixLED) {
       var element = document.getElementById("bracketTop");
       if(element) {       
           element.className = element.className.replace(/(?:^|\s)bracket(?!\S)/g,'');               
           element.className = element.className+" bracketForSixLED";                                  
       }
                                                                                                 
       element = document.getElementById("bracketBottom");                                   
       if(element) {
           element.className = element.className.replace(/(?:^|\s)bracket(?!\S)/g,'');               
           element.className = element.className+" bracketForSixLED";  
       }
    }

    var maxLevel = nativeBridge.getIntLipcProperty(POWERD_SRC, MAX_INTENSITY_PROP);
    var numberOfTurboLevels = nativeBridge.getIntLipcProperty(POWERD_SRC, TURBO_BRIGHTNESS_INTENSITY_PROP);
    var maxLevelForNormalIntensity = maxLevel - numberOfTurboLevels;

    var lightControlsText = document.getElementById('light-controls-text');
    if (lightControlsText) {
       lightControlsText.innerHTML = LightControlStringTable.lightControlsText;
    }

    // Check if turbo intensity is supported for non als devices
    hasTurboIntensity = numberOfTurboLevels ? true : false;
    if(!hasAlsDeviceCapability && 
       hasTurboIntensity) { 
        // Turbo intensity is supported, load css related to turbo intensity
        var turboBrightnessElement = document.getElementById('info-normalbrightness');
        if (turboBrightnessElement) {
       	    turboBrightnessElement.parentNode.removeChild(turboBrightnessElement);
        }
        
        turboBrightnessElement = document.getElementById('info-turbobrightness');
        if (turboBrightnessElement) {
            turboBrightnessElement.id = 'info';
        } 
        turboBrightnessElement = document.getElementById('TurboBrightnessSelector');
        if (turboBrightnessElement) {
            turboBrightnessElement.innerHTML = LightControlStringTable.lightBooster;
            updateTurboBrightness();
            new XorButton( turboBrightnessElement, toggleTurboBrightness, turboBrightnessElement, 'unselected', 'selected', {fast : true}); 
        } 
         
    } else {
       // Turbo intensity is not supported, load css related to normal intensity
       var turboBrightnessElement = document.getElementById('info-turbobrightness');
       if (turboBrightnessElement) {
           turboBrightnessElement.parentNode.removeChild(turboBrightnessElement);
       }
       
       var turboBrightnessElement = document.getElementById('info-normalbrightness');
       if (turboBrightnessElement) {
           turboBrightnessElement.id = 'info';
       }
   }


    if(hasAlsDeviceCapability) {
        var element = document.getElementById("light-incr");
        if (element) { 
            element.className = element.className.replace(/(?:^|\s)light-incr(?!\S)/g,'');
            element.className = element.className+" light-incr-als";
        }

        var element = document.getElementById("light-decr");
        if (element) { 
            element.className = element.className.replace(/(?:^|\s)light-decr(?!\S)/g,'');
            element.className = element.className+" light-decr-als";
        }

        var element = document.getElementById("body");
        if (element) {
            element.className = element.className.replace(/(?:^|\s)body(?!\S)/g,'');
            element.className = element.className+" body-als";
        }

        element = document.getElementById("popup");
        if (element) {
            element.className = element.className.replace(/(?:^|\s)popup(?!\S)/g,'');
            element.className = element.className+" popup-als";
        }
        
        element = document.getElementById("controls");
        if (element) {
            element.className = element.className.replace(/(?:^|\s)controls(?!\S)/g,'');
            element.className = element.className+" controls-als";
        }

        var oldChild = document.getElementById('dialog');
        if (oldChild) {
            oldChild.className = oldChild.className.replace(/(?:^|\s)drop-down-dialog(?!\S)/g,'');
            oldChild.className = oldChild.className.replace(/(?:^|\s)dialog(?!\S)/g,'');
            oldChild.className =oldChild.className + " dialog-als";
        }

        element = document.getElementById("light-slider");
        if (element) {
            element.className = element.className.replace(/(?:^|\s)light-slider(?!\S)/g,'');
            element.className = element.className+" light-slider-als";
        }

        element = document.getElementById("brackets");
        if(element) {
            element.className = element.className.replace(/(?:^|\s)brackets(?!\S)/g,'');
            element.className = element.className+" brackets-als";
        }

        element = document.getElementById("info");
        if(element) {
            element.className = element.className.replace(/(?:^|\s)info(?!\S)/g,'');
            element.className = element.className + " info-als";
        }

        document.getElementById("auto").textContent = LightControlStringTable.auto;

        document.getElementById("check-box").addEventListener('mouseup', checkBoxClicked);

    } else {

        element = document.getElementById("als-adjust");
        if(element) { 
            element.parentNode.removeChild(element);

            var child = document.getElementById("caron");
            var newparent = document.getElementById("dialog");
            newparent.appendChild(child);

            child = document.getElementById("dialog");
            var oldparent = document.getElementById("popup");
            newparent = document.body;
            newparent.appendChild(child);
            oldparent.parentNode.removeChild(oldparent);
    	}
    }

    var makeButton = function(id, tapCallbackName, holdCallbackName) {
        var elem = document.getElementById(id);

        if (elem) {
            var tapHandler = Pillow.bind(lightSlider, tapCallbackName);
            var holdHandler = Pillow.bind(lightSlider, holdCallbackName);
            new XorButton(elem, tapHandler, elem, 'als-button', 'xor', {onHold: holdHandler, delayAction: false, fast: true});
            elem.addEventListener('mousemove', function(event) {
            event.stopPropagation();
            event.preventDefault();
            });
        } else {
            Pillow.logError('light-control-no-button', {id: id});
        }
    };

    document.getElementById("dialog").addEventListener('mousedown',mousedown);
    document.getElementById("dialog").addEventListener('mouseup',mouseup);
    document.getElementById("dialog").addEventListener('mousemove',mousemove);

    var sliderElem = document.getElementById('light-slider');
    if (sliderElem) {
        curRange = findLightRange(initialLightLevel);
        lightSlider = new DiscreteSlider(sliderElem, initialLightLevel, maxLevelForNormalIntensity,
            function(newIndex, oldIndex) {
                updateTitleBar(newIndex, oldIndex);
                nativeBridge.setIntLipcProperty(POWERD_SRC, INTENSITY_PROP, newIndex);
            }, {
                interactive: false
            });
    } else {
        Pillow.logError('light-control-no-slider');
    }

    var highInfo = document.getElementById('high-info');
    var lowInfo = document.getElementById('low-info');
    if (highInfo) {
        highInfo.innerHTML = LightControlStringTable.explainHigh;
    }
    if (lowInfo) {
        lowInfo.innerHTML = LightControlStringTable.explainLow;
    }

    makeButton('light-decr', 'decrement', 'goToMin');
    makeButton('light-incr', 'increment', 'goToMax');

    if(hasAlsDeviceCapability) {
        Pillow.LightControls.updateAutoBrightnessMode();
    }
};

var recordMetricOnClose = function() {
    var currentLightLevel = lightSlider.getIndex();
    if(currentLightLevel == initialLightLevel){
        return;
    }
    initialLightLevel = currentLightLevel;
        
    var hour = new Date().getHours();
    var timeBucket = null;
    var lightIntensity = null;
    if(hour < 6) {
        timeBucket = "Night";
    } else if (hour < 18) {
        timeBucket = "Day";
    } else {
        timeBucket = "Evening";
    }
    
    if(currentLightLevel < 6) {
        lightIntensity = "LOW";
    } else if(currentLightLevel < 20) {
        lightIntensity = "MID";
    } else {
        lightIntensity = "HIGH";
    }
    nativeBridge.recordDeviceMetric( "Pillow", "LightDialog", "lightIntensityChanged."+ 
        lightIntensity, 1, 0, 0, 0);
        
    nativeBridge.recordDeviceMetric( "Pillow", "LightDialog", "lightIntensityChangeTime."+ 
        timeBucket, 1, 0, 0, 0);
        
    nativeBridge.recordDeviceMetric( "Pillow", "LightDialog", "lightIntensityValue", currentLightLevel, 0, 0, 1);
}

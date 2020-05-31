/*
 * language_picker.js
 *
 * Copyright (c) 2013-2018 Amazon.com, Inc. or its affiliates. All Rights Reserved. 
 *
 * PROPRIETARY/CONFIDENTIAL
 *
 * Use is subject to license terms.
 */

const SYSTEM_LIPC_SOURCE = "com.lab126.system";
Pillow.LanguagePicker = function() {
    var parent = Pillow.extend(this, new Pillow.Case('LanguagePicker'));
    
    const LIPC_PILLOW_SOURCE = "com.lab126.pillow";
    const WINMGR_LIPC_SOURCE = "com.lab126.winmgr";
    const AUDIOMGRD_LIPC_SOURCE = "com.lab126.audiomgrd";
    const AUDIO_SINK_BLUETOOTH = 1;
    const SPLASH_EVENT_TIME_OUT = 1000;
    const VOICEVIEW_LIPC_TIME_OUT = 10;
    // Elapsed time in Secs between ButtonPressed and ButtonReleased event 
    //required for factory OBA.
    const MIN_FACTORY_OBA_ELAPSED_TIME  = 10 * 1000

    const DEFAULT_LOCALES_CONFIG_DIR = "/opt/amazon/ebook/config/locales/";
    const DEMO_LOCALES_CONFIG_DIR = "/opt/amazon/ebook/config/demo_locales/";
    const DEMO_MODE_FILE_FLAG = "/var/local/system/DEMO_MODE";
    const DEMO_BOOT_FLAG = "/mnt/us/.demo/boot.flag";
    const LANGPICKER_IGNORE_ASR_EVENT_FLAG = "/var/local/system/asr_tutorial_launched";
    const LOCALE_FILE_PATH_TEMPLATE = "locales/LOCALE_TAG/strings/lang_picker_strings.js";
    const LOCALE_FILE = "/var/local/system/locale";
    const MAX_ITEMS_PER_COLUMN = 7;
    // ASR started event value
    const ASR_STARTED_EVENT = "started";
    const ASR_LIPC_SOURCE = "com.lab126.asr";
    const LANGPICKER_ASR_START_ALERT = "screenReaderStartedLangPickerAlert";
    const USB_AUDIO_UNPLUGGED_ALERT = "usbAudioUnpluggedAlert";
    // Progress bar initial percentage
    const BOOT_SPLASH_PROGRESS_VALUE = 5;
    
    var that = this;
    
    var actionsInactive = false;
    var isDemoMode = false;
    var isSecondMenu = false;
    
    var selectedLanguageWidget;
    var timerForOBA;
    var finalLanguageArray = [];
    
    /** Path for resources */
    var currentLocaleFilePath;
    /** OBA Flag */
    var specialFactoryFlag = false;
    
    
    /**
     * Function call back for selecting language.
     */
    this.languagebuttonSelect = function(){
        if (actionsInactive) {
            return;
        }
        // hilight selected button
        highlightElement(this, true);

        if(that.selectedLanguageWidget && that.selectedLanguageWidget != this) {
            // unselect previously selected button
            highlightElement(that.selectedLanguageWidget, false);
        }

        that.selectedLanguageWidget = this;

        if (!that.isSecondMenu) { // OBA Flow
            //We enable long press options only when we are not in demo country picker already.
            that.specialFactoryFlag = false;
            // To make sure the Oba Timer is cleared before it is assigned a new value
            // JFOUR-5226 - Timer was not getting cleared properly on fast tapping.
            clearOBATimer();
            timerForOBA = setTimeout( function() {
                  // If the specialFactoryFlag is triggered due to OBA condition, then
                  // display a special message so that the factory personnel will know
                  // that the OBA flag is triggered and that the dictionaries will not be
                  // deleted.
                  if(that.selectedLanguageWidget.id == "en-US") {
                      that.specialFactoryFlag = true;
                      var nextButton = document.getElementById('nextButton');
                      nextButton.innerHTML = nextButton.innerHTML + ".....";
                  }
              },MIN_FACTORY_OBA_ELAPSED_TIME);
           
        }
        var template = LOCALE_FILE_PATH_TEMPLATE;

        var relativePath = template.replace("LOCALE_TAG",this.getAttribute("lang"));
        
       /**
        * We dynamically load the resource file according to the user selection, 
        * This is because of the fact that we can't use the default resource loading system
        * without actually changing the device language or restaring the Pillow. 
        */
        if(that.currentLocaleFilePath != undefined){
            that.unloadJsFile(that.currentLocaleFilePath);
        }

        that.loadJsFile(relativePath, this.getAttribute("lang"));
          
        that.currentLocaleFilePath = relativePath;
    }
    
    var highlightElement = function(elt , highlight) {
        var bgColor = 'black';
        var fgColor = 'white';
        if (highlight === false) {
            bgColor = 'white';
            fgColor = 'black';
        }
        elt.style.backgroundColor = bgColor;
        elt.style.color = fgColor;
    }
    
    /**
     * Function call back for confirming language.
     */
    this.confirmButtonSelect = function() {
        if (actionsInactive) {
            return;
        }
        
        var nextButton = document.getElementById('nextButton');
        var changeLocaleParams = that.selectedLanguageWidget.id;
        
        highlightElement(nextButton, true);
        if(!that.specialFactoryFlag && !that.isSecondMenu && (that.isDemoMode || that.selectedLanguageWidget.hasSecondmenu)) {
            //Show the "second picker" page
            showSecondLangPicker();
            return;
        }
        
        actionsInactive = true;
        
        var isASRMode = nativeBridge.getIntLipcProperty(WINMGR_LIPC_SOURCE, "ASRMode");
        if(!isASRMode) {
            nativeBridge.setLipcProperty("com.lab126.system", "disableASR", "");
        }
        if (nativeBridge.checkFileFlag(LANGPICKER_IGNORE_ASR_EVENT_FLAG)) {
            nativeBridge.setLipcProperty("com.lab126.system", "deviceLocaleSelected", "");
        }

        if(that.specialFactoryFlag || (that.isSecondMenu == true && isDemoMode)) {
            changeLocaleParams = changeLocaleParams + "-x-true";
        }
        
        nativeBridge.setLipcProperty("com.lab126.blanket","load", "splash");
        nativeBridge.sendLipcEvent(LIPC_PILLOW_SOURCE,"bootSplashSetLocale", that.selectedLanguageWidget.posixId);
        nativeBridge.sendLipcEvent(LIPC_PILLOW_SOURCE,"bootSplashInit", "");
        nativeBridge.sendLipcEvent(LIPC_PILLOW_SOURCE,"bootSplashProgress", BOOT_SPLASH_PROGRESS_VALUE);
        // To tear down BT in case user did not confirm first device and selects 
        // the language while pairing with another device is in background
        var audioOutputConnected = nativeBridge.getIntLipcProperty(AUDIOMGRD_LIPC_SOURCE, "audioCurrentOutput");
        if (audioOutputConnected != AUDIO_SINK_BLUETOOTH) {
            Pillow.logInfo("Not connected to bluetooth device");
            setTimeout(function() {
                nativeBridge.setLipcProperty(SYSTEM_LIPC_SOURCE, "stopVoiceView", "");
            }, VOICEVIEW_LIPC_TIME_OUT);
        }
        setTimeout(function() {
            nativeBridge.sendLipcEvent(LIPC_PILLOW_SOURCE, "changeLocale", changeLocaleParams);
            actionsInactive = false;
        }, SPLASH_EVENT_TIME_OUT);
        nativeBridge.recordDeviceMetric("com.lab126.oobe", "changeLocale", that.selectedLanguageWidget.id, 1, 0, METRIC_PRIORITY_LOW, METRIC_TYPE_COUNTER);
     };
    
    /**
     * Loads the local JS file in the given path.
     */
    this.loadJsFile = function(localeFilePath, langtag){

        var localeJS_DOM=document.createElement('script');
    			
        localeJS_DOM.setAttribute("type","text/javascript");
		
        localeJS_DOM.setAttribute("src", localeFilePath);
    	 
        localeJS_DOM.onload = function() {
            var nextButtonWrapper = document.getElementById('nextButtonWrapper');
            nextButtonWrapper.style.display = "table";
            var nextButton = document.getElementById('nextButton');
            nextButton.style.display = "inline";
            if(!that.isSecondMenu && (that.isDemoMode || that.selectedLanguageWidget.hasSecondmenu)) {
                nextButton.innerHTML = nextButtonStringTable["firstPageName"];
            } else {
                nextButton.innerHTML = nextButtonStringTable["finalPageName"];
            }
            nextButton.setAttribute("lang", langtag);
        };

        if (typeof localeJS_DOM!="undefined"){
            document.getElementsByTagName("head")[0].appendChild(localeJS_DOM);
        }
    };

    /**
     * Un-Loads the JS file from JS context.
     */
    this.unloadJsFile = function(localeFilePath){
   	 
        var scriptElements=document.getElementsByTagName("script");
    	 
        for (var i=scriptElements.length; i>=0; i--){
    	 
        if (scriptElements[i] && scriptElements[i].getAttribute("src")!=null && 
                 scriptElements[i].getAttribute("src").indexOf(localeFilePath)!=-1)
    	   
            scriptElements[i].parentNode.removeChild(scriptElements[i]);
        }
    };

    /**
     * Shows the Screen Reader started in Lang picker alert.
     */
    this.showScreenReaderStartedLangPickerAlert = function(shouldShow) {
        Pillow.logDbgHigh("launching pillowAlert-screenReaderStartedLangPickerAlert");
        var message;
        if (shouldShow) {
            message = JSON.stringify({show: "true", alertId: LANGPICKER_ASR_START_ALERT, replySrc: ASR_LIPC_SOURCE});
        } else {
            message = JSON.stringify({hide: "true", alertId: LANGPICKER_ASR_START_ALERT, replySrc: ASR_LIPC_SOURCE});
        }
        nativeBridge.showDialog("simple_alert", message);
    };

    /**
    * Shows / Hides the USB Audio disconnected pillow alert
    */
    this.showUsbAudioDisconnectedAlert = function(shouldShow) {
        Pillow.logDbgHigh("USB audio disconnected alert");
        if (shouldShow) {
            message = JSON.stringify({show: "true", alertId: USB_AUDIO_UNPLUGGED_ALERT, replySrc: SYSTEM_LIPC_SOURCE});
        } else {
            message = JSON.stringify({hide: "true", alertId: USB_AUDIO_UNPLUGGED_ALERT, replySrc: SYSTEM_LIPC_SOURCE});
        }
        nativeBridge.showDialog("simple_alert", message);
    }

    /**
     * Cancel the scheduled timer for OBA.
     */
    clearOBATimer = function() {
        clearTimeout(timerForOBA);
        timerForOBA = null;        
    };
    
    var parseConfigAndFillDOM = function(localesDir) {
        //Empty the language divs in case they are already populated
        document.getElementById('lang_list1').innerHTML = '';
        document.getElementById('lang_list2').innerHTML = '';
        finalLanguageArray = [];
        
        //Get the languages from pillow.
        var locales_properties = nativeBridge.parsePropertyFilesFromDir(localesDir);
        
        for (var i = 0; i< locales_properties.length; i++) {
            if (that.isSecondMenu && locales_properties[i]["lang.regions." + that.selectedLangRoot] === undefined) {
                //This check is where we show only the list of locales 
                // from the same property file as the previously selected locale
                continue;
            }
            var supportedLocales = that.isSecondMenu ? locales_properties[i]["lang.regions." + that.selectedLangRoot] : locales_properties[i]["lang.roots"];
            if(supportedLocales){
                var supportedLocalesArray = supportedLocales.split(",");
                for (var j = 0; j< supportedLocalesArray.length; j++) {
                    if (supportedLocalesArray[j]){
                        // Create locale object which contains display name and sort name
                        var locale = new Object();
                        locale["display.name"] = locales_properties[i][(that.isSecondMenu ? "region." : "") + "display.name." + supportedLocalesArray[j]];
                        locale["posix.id"] = locales_properties[i]["posix.id." + supportedLocalesArray[j]];
                        locale["sort.name"] = locales_properties[i][(that.isSecondMenu ? "region.native." : "native.") + supportedLocalesArray[j]];
                        locale["locale.name"] = supportedLocalesArray[j];
                        locale["locale"] = locales_properties[i]["locale"];
                        if(locale["sort.name"] == null || locale["sort.name"] == undefined){
                            locale["sort.name"] = locale["display.name"];
                        }
                        locale["langRoot"] = supportedLocalesArray[j];
                        locale["has.second.menu"] = that.isSecondMenu ? false : (locales_properties[i]["lang.regions." + supportedLocalesArray[j]]).split(",").length > 1;
                        finalLanguageArray.push(locale);
                    }
                }
            }
        }
        
        //Sort the languages based on sort name.
        finalLanguageArray.sort(function(a, b){
                if(a["sort.name"] < b["sort.name"])
                return -1;
                else if(a["sort.name"] > b["sort.name"]){
                return 1;
                }
                return 0;
                });

        // Remove duplicates
        for(var j = 0; j< finalLanguageArray.length - 1; j++){
            if(finalLanguageArray[j]["display.name"] == finalLanguageArray[j + 1]["display.name"]){
                finalLanguageArray.splice(j,1);
            }
        }
        var len = parseInt((finalLanguageArray.length) /2);

        // Add the languages to the div.
        for(var j = 0; j<finalLanguageArray.length; j++){  		  

            var langList;
            
            var useOneColumnOnly = (that.isSecondMenu && len < MAX_ITEMS_PER_COLUMN);

            if(useOneColumnOnly || j <= len){
                langList = document.getElementById('lang_list1');
            }else{
                langList = document.getElementById('lang_list2');
            }
            

            var parentdiv = document.createElement('div' );
            parentdiv.className = useOneColumnOnly ? "languageSecondMenuParentDiv" : "languageParentDiv";
            parentdiv.id = finalLanguageArray[j]["locale.name"] + "parent";
            langList.appendChild(parentdiv);

            var newdiv = document.createElement('div' );
            newdiv.id = finalLanguageArray[j]["locale.name"];
            newdiv.posixId = finalLanguageArray[j]["posix.id"];
            newdiv.setAttribute("lang", finalLanguageArray[j]["locale"]);
            newdiv.setAttribute("langRoot", finalLanguageArray[j]["langRoot"]);
            newdiv.onmousedown = that.languagebuttonSelect;
            newdiv.onmouseup = clearOBATimer;
            newdiv.className = "languageDiv";
            newdiv.innerHTML = finalLanguageArray[j]["display.name"];
            newdiv.hasSecondmenu = finalLanguageArray[j]["has.second.menu"];

            parentdiv.appendChild(newdiv);

        }

        document.getElementById('nextButtonWrapper').onclick = that.confirmButtonSelect;
        setProfile();
    };
    
    
    /* This is a helper function to display the second picker                         */
    /* We check for the existence of valid demo contents and if present,              */
    /* we show the demo country picker; if not, we throw a content unavailable alert  */
    var showSecondLangPicker = function() {
        Pillow.logDbgHigh("+++showSecondLangPicker");
        if (that.isSecondMenu) {
            //We should not be here
            return;
        }
        
        if (that.isDemoMode) {
            nativeBridge.createDemoModeFlagFile();
            nativeBridge.sendLipcEvent(LIPC_PILLOW_SOURCE,"enterDemoMode", "");
            // We need to ensure that langpicker module in blanket is reloaded so that 
            // it reads its property files from demo_locales directory. It takes upto 
            // 500-1000ms for the demo mode file flag to get created as we do this after 
            // forking a different process
            setTimeout(function() {
                nativeBridge.setLipcProperty("com.lab126.blanket","unload", "langpicker");
                nativeBridge.setLipcProperty("com.lab126.blanket","load", "langpicker");
                }, 1000);
        }

        that.isSecondMenu = true;
        that.selectedLangTag = that.selectedLanguageWidget.getAttribute("lang");
        that.selectedLangRoot = that.selectedLanguageWidget.getAttribute("langRoot");
        that.selectedLanguageWidget = undefined;
        parseConfigAndFillDOM(that.isDemoMode ? DEMO_LOCALES_CONFIG_DIR : DEFAULT_LOCALES_CONFIG_DIR);
        highlightElement(nextButton, false);
    };
    
    
    /* This is a helper function to display the regular OOBE langpicker.       */
    /* This is invoked on hitting back button from the demo country picker.    */
    /* This is also invoked when we are in demo mode when langpicker comes up, */
    /* which is really an edge case.                                           */
    var showRegularLangPicker = function() {
        // NOT NEEDED AS THERE IS NO BACK BUTTON
    };
    
    /* This helper function is used to set the classes and views      */
    /* of various DOM elements to configure whether this is the       */
    /* regular OOBE langpicker or this is a Demo Mode country picker  */
    var setProfile = function() {
        //Styling for next button
        var nextButtonWrapper = document.getElementById('nextButtonWrapper');
        nextButtonWrapper.style.display = "none";
        var nextButton = document.getElementById('nextButton');
        nextButton.disabled = false;
        nextButton.className = "normalNextButton";
        var lang_picker_wrapper = document.getElementById('lang_picker_wrapper');
        var lang_picker = document.getElementById('lang_picker');
        var secondMenuHeaderTitle = document.getElementById('secondMenuHeaderTitle');
        var secondMenuHeaderBody = document.getElementById('secondMenuHeaderBody');
        //Classes for various wrappers and headers
        if (!that.isSecondMenu) {
            nextButtonWrapper.className = "nextButtonWrapper";
            lang_picker_wrapper.className = "lang_picker_wrapper";
            lang_picker.className = "lang_picker";
            secondMenuHeaderTitle.style.display = "none";
            secondMenuHeaderBody.style.display = "none";
        } else {
            lang_picker_wrapper.className = "demo_lang_picker_wrapper";
            lang_picker.className = "demo_lang_picker";
            secondMenuHeaderTitle.setAttribute("lang", that.selectedLangTag);
            secondMenuHeaderTitle.style.display = "block";

            if(that.isDemoMode) {
                secondMenuHeaderTitle.innerHTML = demoCountryPickerStringTable['headertext'];
                secondMenuHeaderTitle.className = "demoMenuHeaderTitle";
                secondMenuHeaderBody.style.display = "none";
            } else {
                secondMenuHeaderTitle.innerHTML = nextButtonStringTable['headertitle'];
                secondMenuHeaderTitle.className = "secondMenuHeaderTitle";
                secondMenuHeaderBody.innerHTML = nextButtonStringTable['headerbody'];
                secondMenuHeaderBody.setAttribute("lang", that.selectedLangTag);
                secondMenuHeaderBody.style.display = "block";
            }
            nextButtonWrapper.className = "nextButtonWrapper demoNextButtonWrapper";
        }
        
    };
    
    this.onLoad = function() {

        if(nativeBridge.checkFileFlag(DEMO_MODE_FILE_FLAG)) {
            //We create this file only on entering the country picker. If this exists when
            //we boot, powerd and blanket would have the wrong config and OBA would not work
            //as expected. This case will be hit only when there is a crash in the demo country 
            //picker and we reboot for some reason. But, this is still a nice case
            //to guard against.           

            Pillow.logWarn("Something bad has happened. DEMO_MODE file is already present");
            nativeBridge.deleteDemoModeFlagFile();
            nativeBridge.sendLipcEvent(LIPC_PILLOW_SOURCE,"exitDemoMode", "");
            //We need to ensure that langpicker module in blanket is reloaded so that it reads its property 
            //files from demo_locales directory. It takes upto 500-1000ms for the demo mode file flag to get 
            //deleted as we do this after forking a different process
            setTimeout(function() {
                    nativeBridge.setLipcProperty("com.lab126.blanket","unload", "langpicker");
                    nativeBridge.setLipcProperty("com.lab126.blanket","load", "langpicker");
                    }, 1000);

        }

        that.isDemoMode = nativeBridge.checkFileFlag(DEMO_BOOT_FLAG);
        parseConfigAndFillDOM(DEFAULT_LOCALES_CONFIG_DIR);
        parent(this).onLoad();
        var isASRMode = nativeBridge.getIntLipcProperty(WINMGR_LIPC_SOURCE, "ASRMode");
        if(isASRMode && !nativeBridge.checkFileFlag(LANGPICKER_IGNORE_ASR_EVENT_FLAG) && !nativeBridge.checkFileFlag(LOCALE_FILE)) {
            this.showScreenReaderStartedLangPickerAlert(true);
        }
        
    };
    
    this.showMe = function() {
        nativeBridge.showMe();
    };
    
    this.hideMe = function() {
        nativeBridge.dismissMe();
    };
};


Pillow.LanguagePicker.ClientParamsHandler = function(pillowCase) {
    var parent = Pillow.extend(this, new Pillow.ClientParamsHandler());
    this.show = function(clientParams) {
        if (clientParams.hasOwnProperty('show')) {
           if (clientParams.show) {
               pillowCase.showMe();
           } else {
               pillowCase.hideMe();
           }
        }
    };

    this.windowDeleteEvent = function(clientParams) {
        pillowCase.hideMe();
    };
    Pillow.logWrapObject('Pillow.LanguagePicker.ClientParamsCallback', this);
};

Pillow.LanguagePicker.LipcEventHandler = function(pillowCase){
    const VOICE_VIEW_ALERT = "voiceViewAlert";

    var parent = Pillow.extend(this, new Pillow.LipcEventHandler());
    var LANGPICKER_IGNORE_ASR_EVENT_FLAG = "/var/local/system/asr_tutorial_launched";
    this.subscribedEvents = {
                sources: [
                    {
                        name: "com.lab126.asr",
                        events: [
                            {
                                name:"ASRState"
                            }
                        ]
                    },
                    { name: "com.lab126.btfd",
                        events: [ 
                            { name:"btConfirmationEvent" },
                            { name:"btNotConfirmed" }
                        ] 
                    },
                    {
                        name: "com.lab126.hal",
                        events: [
                            {
                                name:"usbaudioDisconnected"
                            }
                        ]
                    },
                ]
            };
    this.ASRState = function(values) {
        if (values[0] === 'started') {
            pillowCase.showUsbAudioDisconnectedAlert(false);
            if(!nativeBridge.checkFileFlag(LANGPICKER_IGNORE_ASR_EVENT_FLAG)) {
                Pillow.logDbgHigh("launching pillowAlert-screenReaderStartedLangPickerAlert. ASR event:" + values[0]);
                pillowCase.showScreenReaderStartedLangPickerAlert(true);
            }
        } else if (values[0] === 'stopped') {
            pillowCase.showScreenReaderStartedLangPickerAlert(false);
        }
    };
    this.btConfirmationEvent = function(values) {
        Pillow.logInfo("Received btConfirmation event");
	var alert = JSON.stringify({show: "true", alertId: "btConfirmationAlert", replySrc: SYSTEM_LIPC_SOURCE, customStrings:[{matchStr:"device_name", replaceStr: values[0]}]});
        nativeBridge.showDialog("simple_alert", alert);
    };
    this.btNotConfirmed = function(values) {
        Pillow.logInfo("Dismiss btNotConfirmed event");
        var alert = JSON.stringify({hide: "true", alertId: "btConfirmationAlert"});
        nativeBridge.showDialog("simple_alert", alert);
    };
    this.usbaudioDisconnected = function(values) {
        pillowCase.showUsbAudioDisconnectedAlert(true);
    };
    Pillow.logWrapObject('Pillow.LanguagePicker.LipcEventHandler', this);
};


var LanguagePicker = new Pillow.LanguagePicker();
LanguagePicker.register();

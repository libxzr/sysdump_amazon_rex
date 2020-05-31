
window.LocalTest = {};

/**
 * Private context for LocalTest module
 */
(function() {

    /**
     * @class SpinnerWidget
     * @param element  The HTMLDiv representing the spinner widget in title bar
     * 
     * A spinner widget for the title bar
     */
    Test.SpinnerWidget = function(element) {
        element = Test.ensureElement(element, 'div');
        Test.Widget.call(this, element);

        this.isVisible = function() {
            var spinnerIcon = document.getElementById(element.id);
            return spinnerIcon.className == "spinnerIcon0" ||
                   spinnerIcon.className == "spinnerIcon1" ||
                   spinnerIcon.className == "spinnerIcon2" ||
                   spinnerIcon.className == "spinnerIcon3" ||
                   spinnerIcon.className == "spinnerIcon4" ||
                   spinnerIcon.className == "spinnerIcon5" ||
                   spinnerIcon.className == "spinnerIcon6" ||
                   spinnerIcon.className == "spinnerIcon7";
        };

        this.getAccessibilityData = function() {
            var a11yData = {"accessible": false, "ignore-damage": true};
            return a11yData;
        };
    };

    /**
     * @class TitleBarTextWidget
     * @param element  The HTMLDiv representing the textual elements in title bar
     * 
     * A textual element widget for the title bar
     */
    Test.TitleBarTextWidget = function(element) {
        element = Test.ensureElement(element, 'div');
        Test.Widget.call(this, element);

        this.getValue = function() {
            var rawText = element.textContent;
            /*This is to eliminate all the [\n *] that will be added
             *while obtaining the textContent of the div as the span
             *element containing the text is itself a child element
             */
            var value = rawText.replace(/\n */g, "");
            return value;
        };

        this.getAccessibilityData = function() {
            var a11yData;
            var rawText = element.textContent;
            var value = rawText.replace(/\n */g, "");
            if (value === "") {
                a11yData = {"accessible": false};
            } else {
                a11yData = {"accessible": true, "aria-role": "label"};
                a11yData['aria-label'] = value;
            }
            return a11yData;
        }
    };

    /**
     * @class ParentalControlsWidget
     * @param element  The HTMLDiv representing the parental icon
     * 
     * A parental controls widget for the title bar
     */
    Test.ParentalControlsWidget = function(element) {
        element = Test.ensureElement(element, 'div');
        Test.Widget.call(this, element);

        this.isVisible = function() {
            var parentalIcon = document.getElementById(element.id);
            return parentalIcon.style.display == "block";
        }

        this.getAccessibilityData = function() {
            //TODO: Localize label
            a11yData = {"accessible": true, "aria-role": "label", "aria-label": "Parental Controls Enabled"};
            return a11yData;
        }
    };

    /**
     * @class ScreenReaderWidget
     * @param element  The HTMLDiv representing the screen reader
     * 
     * A screen reader widget for the title bar
     */
    Test.ScreenReaderWidget = function(element) {
        element = Test.ensureElement(element, 'div');
        Test.Widget.call(this, element);

        this.getAccessibilityData = function() {
            a11yData = {"accessible": true, "aria-role": "label", "aria-label": "VoiceView On"};
            return a11yData;
        }
    };

    /**
     * @class ConnectionStatusWidget
     * @param element  The HTMLDiv representing the ConnectionStatus icon
     * 
     * A ConnectionStatus controls widget for the title bar
     */
    Test.ConnectionStatusWidget = function(element) {
        element = Test.ensureElement(element, 'div');
        Test.Widget.call(this, element);
        
        this.isVisible = function() {
            var connectionStatus = document.getElementById(element.id);
            return connectionStatus.className == "connectionAirplaneOnIcon" ||
                   connectionStatus.className == "connectionNoServiceIcon" ||
                   connectionStatus.className == "connectionWifiIcon" ||
                   connectionStatus.className == "connectionWanIcon threeG" ||
                   connectionStatus.className == "connectionWanIcon twoG" ||
                   connectionStatus.className == "connectionWanIcon edge";
        }
        
        this.getValue = function() {
            var connectionStatus = document.getElementById(element.id);
            return connectionStatus.className;
        }

        this.getAccessibilityData = function() {
            a11yData = {"accessible": true, "aria-role": "label"};
            var connectionStatus = document.getElementById(element.id);
            var label;
            //TODO: Localize label(s)
            switch (connectionStatus.className) {
                case "connectionAirplaneOnIcon":
                    label = "Airplane Mode on";
                    break;
                case "connectionNoServiceIcon":
                    label = "No Service";
                    break;
                case "connectionWifiIcon":
                    label = "Wifi Connected";
                    break;
                case "connectionWanIcon threeG":
                    label = "WAN Connected 3G";
                    break;
                case "connectionWanIcon twoG":
                    label = "WAN connected 2G";
                    break;
                case "connectionWanIcon edge":
                    label = "WAN connected Edge";
                    break;
                default:
                    label = "";
            }
            a11yData['aria-label'] = label;
            return a11yData;
        }
    };
    
    /**
     * @class ConnectionSignalStrengthWidget
     * @param element  The HTMLDiv representing the ConnectionSignalStrength widget in title bar
     * 
     * A ConnectionSignalStrength widget for the title bar
     */
    Test.ConnectionSignalStrengthWidget = function(element) {
        element = Test.ensureElement(element, 'div');
        Test.Widget.call(this, element);

        this.isVisible = function() {
            var connectionSignalStrength = document.getElementById(element.id);
            return connectionSignalStrength.className == "connectionWifiBars connectionWifi0Bars" ||
                   connectionSignalStrength.className == "connectionWifiBars connectionWifi1Bars" ||
                   connectionSignalStrength.className == "connectionWifiBars connectionWifi2Bars" ||
                   connectionSignalStrength.className == "connectionWifiBars connectionWifi3Bars" ||
                   connectionSignalStrength.className == "connectionWanBars connectionWan0Bars" ||
                   connectionSignalStrength.className == "connectionWanBars connectionWan1Bars" ||
                   connectionSignalStrength.className == "connectionWanBars connectionWan2Bars" ||
                   connectionSignalStrength.className == "connectionWanBars connectionWan3Bars" ||
                   connectionSignalStrength.className == "connectionWanBars connectionWan4Bars" ||
                   connectionSignalStrength.className == "connectionWanBars connectionWan5Bars";
        };

        this.getValue = function() {
            var connectionSignalStrength = document.getElementById(element.id);
            return connectionSignalStrength.className;
        }

        this.getAccessibilityData = function() {
            var a11yData = {"accessible": false};
            var connectionSignalStrength = document.getElementById(element.id);
            var className = connectionSignalStrength.className;
            var barsMatch = className.match(/connection(Wifi|Wan)(\d)Bars/);
            if (barsMatch) {
                a11yData = {"accessible": true, "aria-role": "label"};
                //TODO: Localize label
                var label = "Signal Strength " + barsMatch[2] + " Bars";
                a11yData['aria-label'] = label;
            } 
            return a11yData;
        }
    };

    /**
     * @class ConnectionSignalStrengthWidget
     * @param element  The HTMLDiv representing the ConnectionSignalStrength widget in title bar
     * 
     * A ConnectionSignalStrength widget for the title bar
     */
    Test.BatteryStatusWidget = function(batteryIconElement, batteryFillElement, BatteryState) {
        batteryIconElement = Test.ensureElement(batteryIconElement, 'div');
        batteryFillElement = Test.ensureElement(batteryFillElement, 'div');
        Test.Widget.call(this, batteryIconElement);

        this.getValue = function() {
            var batteryStatus = document.getElementById(batteryIconElement.id);
            var batteryFill = document.getElementById(batteryFillElement.id);
            var result = null;
            if (batteryStatus.className == "batteryChargingIcon" || batteryStatus.className == "sodaChargingIcon" || 
                    batteryStatus.className == "batteryCriticalIcon" || batteryStatus.className == "sodaCriticalIcon") {
                result = batteryStatus.className;
            } else if (batteryStatus.className == "batteryBaseIcon" || batteryStatus.className == "sodaBaseIcon") {
                result = batteryStatus.className + ' ' + batteryFill.style.width;
            } 
            return result;
        }

        this.getAccessibilityData = function () {
            a11yData = {"accessible": true, "aria-role": "label"};
            var label = "Battery " + BatteryState.percent + " percent ";
            if (BatteryState.charging) {
                label += "charging";
            } else if (BatteryState.percent <= BatteryState.lowBatteryCutoff) {
                label += "critical battery";
            }
            a11yData['aria-label'] = label;
            return a11yData;
        };

    };

    LocalTest.init = function() {
        Test.logger = Pillow;

        Test.addWidget('spinner', new Test.SpinnerWidget('spinner'));
        Test.addWidget('leftTextSpan', new Test.TitleBarTextWidget('leftTextDiv'));
        Test.addWidget('middleTextSpan', new Test.TitleBarTextWidget('middleTextDiv'));
        Test.addWidget('textualActivityText', new Test.TitleBarTextWidget('textualActivity'));
        Test.addWidget('statusBarParentalControlsIconDiv', new Test.ParentalControlsWidget('statusBarParentalControlsIconDiv'));
        Test.addWidget('connectionStatusIconDiv', new Test.ConnectionStatusWidget('connectionStatusIconDiv'));
        Test.addWidget('connectionSignalStrengthIconDiv', new Test.ConnectionSignalStrengthWidget('connectionSignalStrengthIconDiv'));
        Test.addWidget('batteryStatusIconDiv', new Test.BatteryStatusWidget('batteryStatusIconDiv', 'batteryFill', window.BatteryState));
	Test.addWidget('sodaStatusIconDiv', new Test.BatteryStatusWidget('sodaStatusIconDiv', 'sodaFill', window.BatteryState));
        Test.addWidget('timeSpan', new Test.TitleBarTextWidget('timeDiv'));
        Test.addWidget('statusBarAudioIconDiv', new Test.ScreenReaderWidget('statusBarAudioIconDiv'));
    };

    LocalTest.parseOkay = true;
    LocalTest.isParsed = function() {
        return LocalTest.parseOkay;
    };
})();

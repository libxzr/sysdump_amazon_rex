// constants
const BATTERY_STATE_STANDALONE = "STANDALONE";
const BATTERY_STATE_DOCKED = "DOCKED";

// Battery State keeps track of powerd LIPC events
// and maps that to the appropriate battery icon to show
// In the long run this gets externalized to seaprate JS file
var BatteryState = {
    lowBatteryCutoff            : 10,
    primaryBatt                 : {
        charging                : false,
        battLevelCrit           : false,
        percent                 : 0,
        iconClass               : null,
        batteryIconDiv          : "batteryStatusIconDiv",
        batteryFillDiv          : "batteryFill",
        batteryFillContainerDiv : "batteryFillContainer",
        divId                   : "batteryStatusIconDiv"
    },
    secondaryBatt               : {
        charging                : false,
        battLevelCrit           : false,
        isDocked                : false,
        percent                 : 0,
        iconClass               : null,
        batteryIconDiv          : "sodaStatusIconDiv",
        batteryFillDiv          : "sodaFill",
        batteryFillContainerDiv : "sodaFillContainer",
        divId                   : "sodaStatusIconDiv"
    },
    type                        : BATTERY_STATE_STANDALONE
};

/**
 * Returns true, if the battery level is critical
 */
BatteryState.isCriticalBattery = function(battInfo) {
    if(!battInfo.charging && 
        battInfo.percent <= BatteryState.lowBatteryCutoff) { 
        return true;
    } else {
        return false;
    }
}

// resolve which battery icon is to be shown based on
// current state
BatteryState.resolveLabel = function(){
    if(BatteryState.type === BATTERY_STATE_STANDALONE) {
        document.getElementById(BatteryState.secondaryBatt.divId).style.display = 'none';
    } else if (BatteryState.type === BATTERY_STATE_DOCKED) {
        document.getElementById(BatteryState.secondaryBatt.divId).style.display = 'block';
    }

    var fillWidth = 0;;
    var fillDisplayMode = 'block';
    if (BatteryState.primaryBatt.charging) {
        /**
         * If primary battery is charging using secondary battery and secondary battery level 
         * is critical, then do not show the charging icon for primary battery, instead show
         * only the battery level to avoid confusion.
         */
        if (BatteryState.type === BATTERY_STATE_DOCKED &&
            BatteryState.secondaryBatt.isDocked &&
            BatteryState.isCriticalBattery(BatteryState.secondaryBatt)) {
            BatteryState.primaryBatt.iconClass = 'batteryBaseIcon';
            fillWidth = BatteryState.primaryBatt.percent;
        } else {
            BatteryState.primaryBatt.iconClass = 'batteryChargingIcon';
            fillDisplayMode = 'none';
        }
    } else if (BatteryState.isCriticalBattery(BatteryState.primaryBatt)) {
        BatteryState.primaryBatt.iconClass = 'batteryCriticalIcon';
        fillDisplayMode = 'none';
    } else {
        //add the fill
        BatteryState.primaryBatt.iconClass = 'batteryBaseIcon';
        fillWidth = BatteryState.primaryBatt.percent;
    }
    
    if (BatteryState.primaryBatt.batteryIconDiv && BatteryState.primaryBatt.batteryFillDiv 
        && BatteryState.primaryBatt.batteryFillContainerDiv){
        document.getElementById(BatteryState.primaryBatt.batteryIconDiv).setAttribute("class", BatteryState.primaryBatt.iconClass);
        if (fillWidth < 0 || fillWidth > 100) {
            fillWidth = 0;
        }
        document.getElementById(BatteryState.primaryBatt.batteryFillDiv).style.width = fillWidth + '%';
        document.getElementById(BatteryState.primaryBatt.batteryFillContainerDiv).style.display = fillDisplayMode; 
    }
    
    // updating second battery
    fillDisplayMode = 'block';
    if (BatteryState.type === BATTERY_STATE_DOCKED) {
        if (BatteryState.secondaryBatt.charging){
            BatteryState.secondaryBatt.iconClass = 'sodaChargingIcon';
            fillDisplayMode = 'none';
        } else if (BatteryState.isCriticalBattery(BatteryState.secondaryBatt)) {
            BatteryState.secondaryBatt.iconClass = 'sodaCriticalIcon';
            fillDisplayMode = 'none';
        } else {
            //add the fill
            BatteryState.secondaryBatt.iconClass = 'sodaBaseIcon';
            fillWidth = BatteryState.secondaryBatt.percent;
        }
        
        if (BatteryState.secondaryBatt.batteryIconDiv && BatteryState.secondaryBatt.batteryFillDiv 
            && BatteryState.secondaryBatt.batteryFillContainerDiv){

            document.getElementById(BatteryState.secondaryBatt.batteryIconDiv).setAttribute("class", BatteryState.secondaryBatt.iconClass);
            if (fillWidth < 0 || fillWidth > 100) {
                fillWidth = 0;
            }
            document.getElementById(BatteryState.secondaryBatt.batteryFillDiv).style.width = fillWidth + '%';
            document.getElementById(BatteryState.secondaryBatt.batteryFillContainerDiv).style.display = fillDisplayMode; 
        }
        domElt = document.getElementById("textualActivity");
        if (BatteryState.secondaryBatt.isDocked) {
	    domElt.style.width = "124.0pt";
            document.getElementById(BatteryState.secondaryBatt.divId).style.display = "block";        
        } else {
            domElt.style.width = "130.20pt";
            document.getElementById(BatteryState.secondaryBatt.divId).style.display = "none";
        }
    }
    
};

BatteryState.battLevelChangedCallback = function(values){
      param = JSON.parse(values[0]);
      BatteryState.primaryBatt.percent =  parseInt(values[0]);
      if (BatteryState.type === BATTERY_STATE_DOCKED) {
          BatteryState.secondaryBatt.percent =  parseInt(values[1]);
      }
      BatteryState.resolveLabel();
};

BatteryState.battStateInfoChangedCallback = function(values){
  param = JSON.parse(values[0]);

  if (param.battInfo && param.battInfo.length > 0) {
    battArray = param.battInfo;
    for ( i = 0; i < battArray.length; i++) {
        battery = battArray[i];
        destination = undefined;
        if (battery.type === "PRIMARY") {
            destination = BatteryState.primaryBatt;
        } else if (battery.type === "SECONDARY") {
            destination = BatteryState.secondaryBatt;
            BatteryState.type = BATTERY_STATE_DOCKED;
            destination.isDocked = battery.docked;
        } else {
            Pillow.logError("Unknown battery entry!");
            continue;
        }
        
        destination.charging = battery.charging;
        destination.percent = parseInt(battery.cap);
    }
  }
  BatteryState.resolveLabel();
  
};

/*
* wifilocker_legal_dialog.js
*
* Copyright (c) 2016-2017 Amazon.com, Inc. or its affiliates. All Rights Reserved.
*
* PROPRIETARY/CONFIDENTIAL
*
* Use is subject to license terms.
*/

/**
* @class This Pillow.Case displays the legal text for wifilocker feature .
* @extends Pillow.Case
*/
Pillow.WLLegalDialog = function() {
  var that = this;
  var parent = Pillow.extend(this, new Pillow.Case('WLLegalDialog'));
  var windowTitle = null;
  var m_scrollDiv;
  const defaultPrivacyUrl = "www.amazon.com/privacy";
  const defaultDeviceSupportUrl = "www.amazon.com/devicesupport";
  var m_marketPlace = nativeBridge.getDynamicConfigValue(DYNCONFIG_OBFUSCATED_MARKETPLACE_KEY);
  var m_orientation = null;

  /**
  * set the orientation and update the class on the body
  */
  this.setOrientation = function() {
    Pillow.logInfo('pillow-Wi-Fi-locker-set-orientation', {prev: m_orientation, next: newOrientation});
    var newOrientation = nativeBridge.getOrientation();
    if (newOrientation !== m_orientation) {
      m_orientation = newOrientation;
      if (m_orientation === "L" || m_orientation === "R") {
        cls = 'dialog landscape';
      } else {
        cls = 'dialog portrait';
      }
      document.body.setAttribute('class', cls);
    }
  };

  /**
  * Sets up the dialog with Pillow and prepares the interface.
  */
  this.onLoad = function() {
    windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, WINMGR.ROLE.ALERT);
    windowTitle.withChanges(function() {
      this.addParam(WINMGR.KEY.WIN_IS_MODAL, WINMGR.MODALITY.DISMISSIBLE_MODAL);
    });
    this.setOrientation();
    var title = document.getElementById("WLFAQHeader").textContent = WLLegalStringTable.WLFAQHeader;
    this.createLegalText();
    m_scrollDiv = document.getElementById('wifilockerScrollContainer');
    var wlCloseCmdButtons = [
      {
        text: WLLegalStringTable.close,
        id: 'close'
      },
    ];
    var wlLegalButtonBar =  new ButtonBar('wifiLockerCmdBar', wlCloseCmdButtons, handler);
    this.show();
    parent(this).onLoad();
    var dialogElem = document.getElementById('dialog');
    nativeBridge.setWindowSize(dialogElem.offsetWidth, dialogElem.offsetHeight);

    //API to check for larger display mode and parsing the DOM to pick large property values
    modifyClassNameDOM();
  };

  this.createLegalText = function() {
    var privacyUrlkey = WLLegalStringTable.WLPrivacyUrlMessageFormat.format({MarketPlace: m_marketPlace});
    var privacyUrl = nativeBridge.getDynamicConfigValue(privacyUrlkey);
    if(!privacyUrl) {
      privacyUrl = defaultPrivacyUrl;
      Pillow.logError("Wifi-Locker, dynconfig- could not fetch privacy URL based on marketplace putting default")
    }
    var deviceSupportUrlKey = WLLegalStringTable.WLDeviceSupportMessageFormat.format({MarketPlace: m_marketPlace});
    var deviceSupportUrl = nativeBridge.getDynamicConfigValue(deviceSupportUrlKey);
    if(!deviceSupportUrl) {
      deviceSupportUrl = defaultDeviceSupportUrl;
      Pillow.logError("Wifi-Locker, dynconfig- could not fetch device support URL based on marketplace putting default")
    }
    var WLFAQs = WLLegalStringTable.WLFAQMessageFormat.format({privacyUrlString: privacyUrl, deviceSupporUrlString: deviceSupportUrl});
    document.getElementById("WLFAQs").innerHTML = WLFAQs;
  }

  var handler = function(button) {
    if(button.id === "close") {
      that.close();
    }
  };

  this.scrollUp = function() {
    m_scrollDiv.scrollTop -= 0.7 * m_scrollDiv.offsetHeight ;
  };

  this.scrollDown = function() {
    m_scrollDiv.scrollTop += 0.7 * m_scrollDiv.offsetHeight ;
  };

  this.show = function() {
    nativeBridge.showMe();
  };

  this.hide = function() {
    nativeBridge.hideMe();
  };

  this.close = function() {
    nativeBridge.dismissMe();
  };

  Pillow.logWrapObject('Pillow.WLLegalDialog', this);
};

/**
* Constructs a clientParams handler.
* @class Handles all the incoming clientParams information.  Each method
*        handles a different incoming parameter.
* @extends Pillow.ClientParamsHandler
* @param {Pillow.Case} pillowCase Pass in the Pillow.Case we should dispatch to
*/
Pillow.WLLegalDialog.ClientParamsHandler = function(pillowCase) {
  var parent = Pillow.extend(this, new Pillow.ClientParamsHandler());

  this.show = function(clientParams) {
    pillowCase.show();
  };

  this.hide = function(clientParams) {
    pillowCase.hide();
  };

  this.close = function(clientParams) {
    pillowCase.close();
  };

  this.gesture = function(clientParams) {
    if (clientParams.gesture === 'swipeUp') {
      pillowCase.scrollDown();
    } else if (clientParams.gesture === 'swipeDown') {
      pillowCase.scrollUp();
    }
  };

  Pillow.logWrapObject('Pillow.WLLegalDialog.ClientParamsHandler', this);
};


var wlLegalDialog = new Pillow.WLLegalDialog();
wlLegalDialog.register();

var SampleCustomDialog = {};

var State = {
    appId                   : null,
    width                   : Pillow.pointsToPixels(202.6),
    height                  : Pillow.pointsToPixels(300 /*129.3*/),
    alertIsShown            : false,
    windowTitle             : null
};

SampleCustomDialog.showAlert = function (){
    State.alertIsShown = true;
    nativeBridge.logDbg("=====showing custom dialog window");
    nativeBridge.showMe();
}

SampleCustomDialog.dismissAlert = function (){

    if (!State.alertIsShown){
        nativeBridge.logDbg("dialog not shown no need to dismiss alert");
        return;
    }

    State.alertIsShown = false;
    nativeBridge.dismissMe();
};

// clientParamsCallback is a single callback used for just about all communications
// up to the JS layer from the C Layer.
SampleCustomDialog.clientParamsCallback = function (clientParamsString){
    nativeBridge.logDbg("clientParams received by simple alert JS : ", clientParamsString);

    // parse clientParams
    var clientParams = JSON.parse(clientParamsString);

    //check for State check call
    if (clientParams.getState){
        nativeBridge.logDbg("getState call on titleBar");
        if (clientParams.replyLipcSrc && clientParams.replyProp){
            nativeBridge.setLipcProperty(clientParams.replyLipcSrc, clientParams.replyProp, JSON.stringify(State));
        }
        return;
    }

    // check to see if this is just a setup
    if (clientParams.setup){
        return;
    }

    if (clientParams.dismiss){
        SampleCustomDialog.dismissAlert ();
    }

};

SampleCustomDialog.buttonZeroSelect = function(){

    nativeBridge.logDbg("button zero select");

    SampleCustomDialog.dismissAlert();
};

// search text field onfocus callback
SampleCustomDialog.searchFieldFocused = function(){
    nativeBridge.logDbg("+++++SampleCustomDialog.searchFieldSelected");

    //open the keyboard
    //lipc-set-prop com.lab126.keyboard open "com.lab126.test:abc:0"
    nativeBridge.setLipcProperty("com.lab126.keyboard", "open", "com.lab126.SampleCustomDialog:abc:0");

    var searchEntry = document.getElementById('searchEntry');

    // clear default text and change to black
    searchEntry.value = "";

    //change to black text
    searchEntry.setAttribute("class", "blackSearchText");

    nativeBridge.logDbg("-----SampleCustomDialog.searchFieldSelected");

    State.searchHasFocus = true;
}

// search field blur callback
SampleCustomDialog.searchFieldBlured = function(){
    nativeBridge.logDbg("+++++SampleCustomDialog.searchFieldBlured");

    //close the keyboard
    //lipc-set-prop com.lab126.keyboard close "com.lab126.test:abc:0"
    nativeBridge.setLipcProperty("com.lab126.keyboard", "close", "com.lab126.SampleCustomDialog");

    // on blur go back to greyed out default text
    var searchEntry = document.getElementById('searchEntry');
    searchEntry.value = "";

    //change back to gray text and fill in default string
    searchEntry.setAttribute("class", "graySearchText");
    searchEntry.value = SampleCustomDialogStringTable.enterText;

    nativeBridge.logDbg("-----SampleCustomDialog.searchFieldBlured");

    State.searchHasFocus = false;
}

SampleCustomDialog.searchFieldKeyUp = function(){

    nativeBridge.logDbg("!!!!!!!text field change notify");

}

SampleCustomDialog.init = function(){
    nativeBridge.logDbg("custom dialog init function called");

    //register to be called back when clientParams are updated
    nativeBridge.registerClientParamsCallback(SampleCustomDialog.clientParamsCallback);

    //set the window size
    nativeBridge.setWindowSize(State.width, State.height);

    State.windowTitle = new WindowTitle(WINMGR.LAYER.DIALOG, WINMGR.ROLE.DIALOG);
    State.windowTitle.withChanges(function() {
        this.addParam(WINMGR.KEY.WIN_IS_MODAL, WINMGR.MODALITY.MODAL);
        // this.addParam(WINMGR.KEY.REQUIRES_KB, "abc");
    });

    document.getElementById('searchEntry').value = SampleCustomDialogStringTable.enterText;
    document.getElementById('title').textContent = SampleCustomDialogStringTable.sampleCustDialogTitle;
    document.getElementById('text').textContent = SampleCustomDialogStringTable.sampleCustDialogBody;
    document.getElementById('buttonZeroText').textContent = SampleCustomDialogStringTable.okay;

    SampleCustomDialog.showAlert();

};

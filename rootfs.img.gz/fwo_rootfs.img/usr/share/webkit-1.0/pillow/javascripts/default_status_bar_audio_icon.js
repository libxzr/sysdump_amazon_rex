var AudioIcon = {
    actualCount : 0
};

var AudioIconConst ={
    HIDE_TIMEOUT : 1200
};

AudioIconState = {
    setStatusBarTextPendingFunc : null,
    resolveTextFunc : null,
};

AudioIcon.show = function (show){
       document.getElementById("statusBarAudioIconDiv").style.display = show ? "block" : "none";
};

AudioIcon.audioPlaying = function(){
    AudioIcon.actualCount++;
    if(AudioIcon.actualCount > 1000) {
	AudioIcon.actualCount = 0;
    }
    AudioIcon.show(true);
    StatusBar.setStatusBarTextPending(true);
};

AudioIcon.audioStopped = function(){	
    setTimeout(hideIcon,AudioIconConst.HIDE_TIMEOUT,AudioIcon.actualCount);
};

function hideIcon(expCount){
    if(AudioIcon.actualCount == expCount){    
       AudioIcon.show(false);
    }
    if (AudioIconState.resolveTextFunc && AudioIconState.setStatusBarTextPendingFunc) {
        AudioIconState.setStatusBarTextPendingFunc(true);
        AudioIconState.resolveTextFunc();
    }
};

AudioIcon.init = function(setStatusBarTextPendingFunc, resolveTextFunc) {
    AudioIconState.setStatusBarTextPendingFunc = setStatusBarTextPendingFunc;
    AudioIconState.resolveTextFunc = resolveTextFunc;

}

AudioIcon.ASRStateChangeCallback = function(values) {
    param = values[0]
    if (!param) {
        Pillow.logError("No param returned");
        return;
    }

    if (param === "started") {
        AudioIcon.show(true);
    } else if (param === "stopped") {
        AudioIcon.show(false);
    }

}

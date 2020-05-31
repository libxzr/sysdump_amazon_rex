var MediaPlayerBar = {};

var State = {
   appId : null,
   isShown :false,
   currentVolume : 0
};

var VolumeMeterConst = {
   FILL_COLOR : "black",
   BLANK_COLOR : "white",
   WIDTH       : 255,
   HEIGHT      : 40,
   BLOCK_WIDTH : 12,
   BLOCK_HEIGHT : 12,
   BLOCK_YOFFSET : 14,
   BLOCK_GAP : 5
}

var Const = {
    SOURCE_NAME: "com.lab126.mediaplayer",
    PROP_CONTROL : "control",
    PROP_VOLUME : "volume",
    PROP_PLAYER_STATE : "playerState",
    PLAYER_STATE_STOPPED : 0,
    PLAYER_STATE_PLAYING : 1,
    PLAYER_STATE_PAUSED : 2,
    PLAYER_STATE_IDLE : 3,
    Control: {
        CLOSE:0,
        NEXT:1,
        PREVIOUS:2,
        PAUSE:3,
        RESUME:4
    },
    MAX_VOLUME : 15,
    MIN_VOLUME :0,
    CURR_VOLUME : 'volume',
    OFF_BUTTON_ID: "turnOffButton"
};

var volumeMeter = {};

var volumeOffImage;

var volumeOnImage;

//TODO: Get perf logs for timestamp PH-3366
// Get current time in milliseconds
function logForProfiling(pattern)
{
 var current_time = new Date();
 var time_value = current_time.getTime();
 time_value = time_value + '';
 nativeBridge.logDbg(pattern,time_value);
}

/*
destorys mediaplayer bar
*/
MediaPlayerBar.destroy = function() {
 nativeBridge.logString("MediaPlayerBar -  destroy function called");
    if(State.isShown){
        State.isShown = false;
        nativeBridge.dismissMe();        
    }
};

var SubscribedEvents = {
                sources: [
                    {
                        name: "com.lab126.kaf",
                        events: [
                            {
                                name:"FrameworkStarted",
                                callback: MediaPlayerBar.destroy
                            }
                        ]
                    }
               ]
            };



/**
* callback function for all LIPC events subscribed to
*/
MediaPlayerBar.eventsCallback = function(jsonString){

    if (!jsonString){
        return;
    }

    var eventIn = JSON.parse(jsonString);

    if (!eventIn){
        return;
    }

    for (srcKey in SubscribedEvents.sources){
        var src = SubscribedEvents.sources[srcKey];
        if (src.name === eventIn.eventSrc)
        {
            for (eventKey in src.events){
                var event = src.events[eventKey];
                if (event.name === eventIn.eventName){
                    event.callback(eventIn.eventValues); //eventIn.eventValues
                    break;
                }
            }
        }
    }
};


/*
callback when client params get updated
*/
MediaPlayerBar.clientParamsCallback = function(clientParamsString) {
    nativeBridge.logString("MediaPlayerBar - ClientParams received");

    // parse clientParams
    var clientParams = JSON.parse(clientParamsString);
    
    //check for State check call
    if (clientParams.getState){
        nativeBridge.logString("getState call on MediaPlayerBar");
        if (clientParams.replyLipcSrc && clientParams.replyProp){
            nativeBridge.setLipcProperty(clientParams.replyLipcSrc, clientParams.replyProp, JSON.stringify(State));
        }
        return;
    }
    
    if(clientParams.trackCount){
        nativeBridge.logString("MediaPlayerBar -- Track Count:" +  clientParams.trackCount);
        MediaPlayerBar.setTrackCount(clientParams.trackCount);
    }
    
    if(clientParams.volume != null){
        nativeBridge.logString("MediaPlayerBar -- Volume:" + clientParams.volume);
        MediaPlayerBar.setVolume(clientParams.volume);
    }
    
    if(clientParams.trackInfo){        
        MediaPlayerBar.setTrackInfo(clientParams.trackInfo);
    }

    if(clientParams.playerState != null){
        nativeBridge.logString("MediaPlayerBar -- Player State:" + clientParams.playerState);
        MediaPlayerBar.setPlayerState(clientParams.playerState);
    }
    
};

/*
initialize function 
*/
MediaPlayerBar.init = function() {
    
    volumeOffImage = document.getElementById('squareOff');
    volumeOnImage = document.getElementById('squareOn');
    
    nativeBridge.logString("MediaPlayerBar -  init function called");
    
    height = document.body.offsetHeight;    
    width  = document.body.offsetWidth;
    initVolumeMeter();
    
    //set the window size
    nativeBridge.setWindowSize(width,height);
    
    nativeBridge.showMe();   

    State.isShown = true;
    
    //register to be called back when clientParams are updated
    nativeBridge.registerClientParamsCallback(MediaPlayerBar.clientParamsCallback);     

    //register events callback
    nativeBridge.registerEventsWatchCallback(MediaPlayerBar.eventsCallback);

   //subscribe to events
    for (srcKey in SubscribedEvents.sources){
        var src = SubscribedEvents.sources[srcKey];
        for (eventKey in src.events){
            var event = src.events[eventKey];
            nativeBridge.subscribeToEvent(src.name, event.name);
        }
    }   
    createXORButtons();
    
};

/*
Method which initialises the XOR buttons
*/
function createXORButtons() {
    var prevButton = document.getElementById('previous');
    new XorButton(prevButton, MediaPlayerBar.playPreviousButtonClicked, prevButton, null, 'xor', {fast : true});
    var nextButton = document.getElementById('next');
    new XorButton(nextButton, MediaPlayerBar.playNextButtonClicked, nextButton, null, 'xor', {fast : true});
    var volumeDecreaseButton = document.getElementById('volumeDecreaseButton');
    new XorButton(volumeDecreaseButton, MediaPlayerBar.decreaseVolume, volumeDecreaseButton, null, 'xor', {fast : true});
    var volumeIncreaseButton = document.getElementById('volumeIncreaseButton');
    new XorButton(volumeIncreaseButton, MediaPlayerBar.increaseVolume, volumeIncreaseButton, null, 'xor', {fast : true});        
    var turnOffButton =  document.getElementById('turnOffButton');
    new XorButton(turnOffButton, MediaPlayerBar.turnOffButtonClicked, turnOffButton, null, 'xor', {fast : true});
    
    var playButton =  document.getElementById('playControl');
    new XorButton(playButton, MediaPlayerBar.playPauseButtonClicked, playButton, 'buttonHide', 'playPause playXOR', {fast : true});
    var pauseButton =  document.getElementById('pauseControl');
    new XorButton(pauseButton, MediaPlayerBar.playPauseButtonClicked, pauseButton, 'buttonHide', 'playPause pauseXOR', {fast : true});
    
}

/*
callback when play/pause button clicked
*/
MediaPlayerBar.playPauseButtonClicked = function() {
    if(State.playerState == Const.PLAYER_STATE_PLAYING){
        togglePlayPauseIcon(true);
        logForProfiling("Pause Button Clicked ");
        nativeBridge.setIntLipcProperty(Const.SOURCE_NAME,Const.PROP_CONTROL,Const.Control.PAUSE);
        State.playerState = Const.PLAYER_STATE_PAUSED;
    }
    else{
        togglePlayPauseIcon(false);
        logForProfiling("Resume Button Clicked ");
        nativeBridge.setIntLipcProperty(Const.SOURCE_NAME,Const.PROP_CONTROL,Const.Control.RESUME);
        State.playerState = Const.PLAYER_STATE_PLAYING;
    }
};

/*
callback when next track button clicked
*/
MediaPlayerBar.playNextButtonClicked = function() {
    logForProfiling("Next Button Clicked ");
    nativeBridge.setIntLipcProperty(Const.SOURCE_NAME,Const.PROP_CONTROL,Const.Control.NEXT);
};

/*
callback when previous track button clicked
*/
MediaPlayerBar.playPreviousButtonClicked = function() {
    logForProfiling("Previous Button Clicked ");
    nativeBridge.setIntLipcProperty(Const.SOURCE_NAME,Const.PROP_CONTROL,Const.Control.PREVIOUS);
};

/*
callback when volume input changed by clicking on volume meter
*/
MediaPlayerBar.volumeInputChanged = function(mousePoint){
    newVolume = Math.ceil(mousePoint.offsetX/(VolumeMeterConst.BLOCK_WIDTH +  VolumeMeterConst.BLOCK_GAP));
    MediaPlayerBar.changeVolume(newVolume);
};

/*
Method to increase volume by 1 unit
*/
MediaPlayerBar.increaseVolume = function(){
    MediaPlayerBar.adjustVolume(+1);
}

/*
Method to decrease volume by 1 unit
*/
MediaPlayerBar.decreaseVolume = function(){
    MediaPlayerBar.adjustVolume(-1);
}

/*
callback when volume decrese/increase button clicked
*/
MediaPlayerBar.adjustVolume = function(volumeDelta){
    MediaPlayerBar.changeVolume(State.currentVolume + volumeDelta);
};

/*
sets lipc prop on com.lab126.mediaplayer to change the volume
*/
MediaPlayerBar.changeVolume =function(newVolume){
    if(newVolume > Const.MAX_VOLUME){
        newVolume = Const.MAX_VOLUME;
    }
    else if (newVolume < Const.MIN_VOLUME){
        newVolume = Const.MIN_VOLUME;
    }    
    
    nativeBridge.logDbg("MediaPlayerBar - volumeControl Changed:"+ newVolume);
    if(State.currentVolume == newVolume){
        return;
    }
    State.currentVolume = newVolume;    
    logForProfiling("Volume Changed ");
    nativeBridge.setIntLipcProperty(Const.SOURCE_NAME,Const.PROP_VOLUME,parseInt(newVolume,10));
    drawVolumeMeter();    

};

/*
callback when turn off button clicked
*/
MediaPlayerBar.turnOffButtonClicked = function(){
    logForProfiling("Turnoff Button Clicked ");
    nativeBridge.setIntLipcProperty(Const.SOURCE_NAME,Const.PROP_CONTROL,Const.Control.CLOSE);
};

/*
toggles play/pause button based on state and destroys media player bar if state is stopped
*/
MediaPlayerBar.setPlayerState = function(newPlayerState){
    
    switch(newPlayerState){
    case Const.PLAYER_STATE_STOPPED :
         MediaPlayerBar.destroy();
         break;
    case Const.PLAYER_STATE_IDLE : 
        togglePlayPauseIcon(true);
        break;
    case Const.PLAYER_STATE_PLAYING :  
        togglePlayPauseIcon(false);
        break;
    case Const.PLAYER_STATE_PAUSED :
        togglePlayPauseIcon(true);
        break;
    default :
        return;
    }  

    State.playerState = newPlayerState;
};

/*
updates total track count
*/
MediaPlayerBar.setTrackCount = function(newTrackCount){                
    State.trackCount = newTrackCount;    
};

/*
updates volume on media player bar UI
*/
MediaPlayerBar.setVolume = function(newVolume){
    if(newVolume > Const.MAX_VOLUME){
        newVolume = Const.MAX_VOLUME;
    }else if (newVolume < Const.MIN_VOLUME){
        newVolume = Const.MIN_VOLUME;
    }
    if(State.currentVolume == newVolume){
        return;
    }
    State.currentVolume = newVolume;
    drawVolumeMeter();
};

/*
updates track info
*/
MediaPlayerBar.setTrackInfo = function(newTrackInfo){
    State.trackInfo = {};
    State.trackInfo.trackIndex = newTrackInfo.trackIndex;
    State.trackInfo.title  =  newTrackInfo.title;
    State.trackInfo.artist = newTrackInfo.artist;    
    
    trackIndex = State.trackInfo.trackIndex;
    track = MediaPlayerBarStringTable.trackCountMessageFormat.format({index: trackIndex, count: State.trackCount});    
    artist = State.trackInfo.artist ? State.trackInfo.artist: MediaPlayerBarStringTable.unknownArtists;    
    setTextContent("track",track);
    setTextContent("title",State.trackInfo.title);
    setTextContent("artist",artist);
};

/*
sets text content of an elment 
*/
function setTextContent(id,text){   
    document.getElementById(id).textContent  = text;
}
/*
 * sets inner HTML for element specified by id
*/
function setInnerHTML(id, value){    
    document.getElementById(id).innerHTML = value;
};

/*
toggles play/pause button
   true - show play icon
   false - show pause icon
*/
function togglePlayPauseIcon(playPause){
    if(playPause == true){
        document.getElementById("playControl").className = 'playPause play buttonVisible'; 
        document.getElementById("pauseControl").className = 'buttonHide';       
    }
    else{
        document.getElementById("pauseControl").className = 'playPause pause buttonVisible';
        document.getElementById("playControl").className = 'buttonHide';
    }    
};

/*
initialize volume meter
*/
function initVolumeMeter(){
    volumeMeter = document.getElementById("volumeMeterCanvas");
    volumeMeter.width = VolumeMeterConst.WIDTH;
    volumeMeter.height = VolumeMeterConst.HEIGHT;
    drawVolumeMeter();
};

/*
draws volume meter based on current volume level
*/
function drawVolumeMeter(){    
    context = volumeMeter.getContext("2d");	
    volumeMeter.setAttribute(Const.CURR_VOLUME,State.currentVolume);
    for(i=0;i<Const.MAX_VOLUME;i++){
        context.drawImage((State.currentVolume > i ? volumeOnImage : volumeOffImage), i*(VolumeMeterConst.BLOCK_WIDTH +  VolumeMeterConst.BLOCK_GAP), VolumeMeterConst.BLOCK_YOFFSET);
    }
};

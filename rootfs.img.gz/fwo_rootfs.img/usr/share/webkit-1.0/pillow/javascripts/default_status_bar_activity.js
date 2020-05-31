var ActivityIndicator = {
    activityRequests        : new Array(),
    delayedRequests         : {},
    indicatorRunning        : false,
    defaultTimeout          : 30000,
    defaultTextTimeout      : 10000,
    priorityCount           : 0
};

// clears out any state, mostly for unit testing
ActivityIndicator.resetState = function(){
    for (var idx=0; idx < this.activityRequests.length; idx++){
        if (this.activityRequests[idx].timer){
            clearTimeout(this.activityRequests[idx].timer)
        }
    }

    this.indicatorRunning = false;
    this.activityRequests = new Array();
};

//caller takes care of drawing/clearing the user visible indicator via
//callbacks
ActivityIndicator.setIndicatorCallbacks = function(startCb, stopCb, setTextCb, setPriorityCb){
    Pillow.logDbgLow("setting callbacks");
    this.startCallback = startCb;
    this.stopCallback = stopCb;
    this.setTextCb = setTextCb;
    this.setPriorityCb = setPriorityCb;
};

ActivityIndicator.addToPriorityCount = function(n){
    Pillow.logDbgMid("adding " + n + " to priority count");
    var oldCount = this.priorityCount;
    this.priorityCount += n;

    // fix invalid count
    if (this.priorityCount < 0) {
        Pillow.logWarn("spinner-priority-count");
        this.priorityCount = 0;
    }

    if (oldCount == 0 && this.priorityCount > 0) {
        // set priority
        this.setPriorityCb(true);
    } else if (oldCount > 0 && this.priorityCount == 0) {
        // unset priority
        this.setPriorityCb(false);
    }
};

//called to stop the indicator
ActivityIndicator.stopActivityIndicator = function(text){

    Pillow.logDbgMid("+++++ActivityIndicator.stopActivityIndicator");

    if (this.indicatorRunning === false){
        return;
    }

    this.indicatorRunning = false;

    if (this.stopCallback){
        // we tend to get a series of start/stop pairs which
        // makes the spinner look jittery. Put a delay in to
        // try and catch this 
        var self = this;
        setTimeout(function(){
            // check to see if we are still not running
            if (self.indicatorRunning === false){
                self.stopCallback(text);
            }
        });
    }
};

//called to start up the indicator
ActivityIndicator.startActivityIndicator = function(text, noSpinner){

    Pillow.logDbgMid("+++++ActivityIndicator.startActivityIndicator");

    this.indicatorRunning = true;

    if (noSpinner){
        // text but no spinner
        if (this.setTextCb){
            this.setTextCb(text);
        }    
    } else {
        //text and spinner
        if (this.startCallback){
            this.startCallback(text);
        }
    }
};

//looks up the idx of a given activity by unique ID
ActivityIndicator.idToIdx = function(id){
    for (var idx=0; idx < this.activityRequests.length; idx++){
        if (this.activityRequests[idx].clientId === id){
            Pillow.logDbgLow("idToIdx:: found id " + id);
            return idx;
        }
    }

    Pillow.logDbgLow("idToIdx:: not found " + id);
    return undefined;
};

//stop the activity with a given ID
ActivityIndicator.stopActivity = function(id, text){
    Pillow.logDbgMid("+++++ActivityIndicator.stopActivity");

    //get the idx
    var idx = this.idToIdx(id);

    if (idx === undefined){
        Pillow.logDbgLow("invalid idx, nothing to clear");
        
        // if we get a stop request for an 
        // activity that has already timed out 
        // send the text
        if ((text) && (this.setTextCb)){
            this.setTextCb(text)
        }
        return;
    }

    var requests = this.activityRequests;

    if (idx >= requests.length){
        Pillow.logDbgLow("idx larger than array, nothing to clear");
    }

    Pillow.logDbgLow("stopping an existing activity");
    if (requests[idx].timer){
        clearTimeout(requests[idx].timer);
    }

    if (requests[idx].priority){
        this.addToPriorityCount(-1);
    }

    requests.splice(idx, 1);

    if (requests.length === 0){
        //just removed last item in array, stop everything
        this.stopActivityIndicator (text);
    } else {
        // there are activities still running
        // so send text of stop request but leave the 
        // underlying spinner spinning
        if ((text) && (this.setTextCb)){
            this.setTextCb(text)
        }
    }
};

//start an activity with the given id and time it out after
//timeout
ActivityIndicator.startActivity = function(activity, timeout, noSpinner){

    
    Pillow.logDbgMid("+++++ActivityIndicator.startActivity");

    var requests = this.activityRequests;

    var idx = this.idToIdx(activity.clientId);

    var priority = activity.priority || false;

    if (idx !== undefined){
        if (requests[idx].timer){
            //clear the old timer
            clearTimeout(requests[idx].timer);
        }

        //set a new timer
        requests[idx].timer = setTimeout(function(){ActivityIndicator.stopActivity(activity.clientId)}, timeout);

        if (priority && !requests[idx].priority){
            this.addToPriorityCount(1);
        } else if (!priority && requests[idx].priority){
            this.addToPriorityCount(-1);
        }
        
        if (activity.text){
            this.startActivityIndicator (activity.text, noSpinner);
        }

    } else {

        var timer = setTimeout(function(){ActivityIndicator.stopActivity(activity.clientId)}, timeout)
        var newActivity = {
            clientId : activity.clientId,
            timer : timer,
            text : activity.text,
            priority : priority
        }
        requests[requests.length] = newActivity;
        
        if (priority){
            this.addToPriorityCount(1);
        }

        this.startActivityIndicator(activity.text, noSpinner);
    }
    
};

ActivityIndicator.clearDelayedRequest = function(clientId){
    var oldDelayedRequest = ActivityIndicator.delayedRequests[clientId];
    if (oldDelayedRequest){
        Pillow.logDbgHigh("clearing delayed request for client " + clientId);
        clearTimeout(oldDelayedRequest);
        delete ActivityIndicator.delayedRequests[clientId];
    }
};

// translate json clientParams request into a start or stop of
// a particular activity
ActivityIndicator.handleRequest = function(clientParams){
    Pillow.logDbgLow("+++++handleRequest");

    if ((!clientParams) || (!clientParams.activityIndicator) || (!clientParams.activityIndicator.clientId)){
        return;
    }

    if (!clientParams.activityIndicator.text && clientParams.activityIndicator.textId){
        clientParams.activityIndicator.text = StatusBarStringTable[clientParams.activityIndicator.textId];
    }

    if (clientParams.activityIndicator.action === "stop"){
        Pillow.logDbgLow("stop request");
        this.clearDelayedRequest(clientParams.activityIndicator.clientId);
        ActivityIndicator.stopActivity(clientParams.activityIndicator.clientId, clientParams.activityIndicator.text);
    } else if (clientParams.activityIndicator.action === "start"){
        Pillow.logDbgLow("start request");
        var timeout;
        if (clientParams.activityIndicator.timeout){
            timeout = clientParams.activityIndicator.timeout;
        } else {
            timeout = this.defaultTimeout;
        }

        this.clearDelayedRequest(clientParams.activityIndicator.clientId);

        if (clientParams.activityIndicator.delayedStart){
            this.delayedRequests[clientParams.activityIndicator.clientId] =
                setTimeout(function(){
                        delete ActivityIndicator.delayedRequests[clientParams.activityIndicator.clientId];
                        ActivityIndicator.startActivity(clientParams.activityIndicator, timeout, false);
                    }, clientParams.activityIndicator.delayedStart);
        } else {
            this.startActivity(clientParams.activityIndicator, timeout, false);
        }
    } else if (clientParams.activityIndicator.action === "text"){
        this.startActivity(clientParams.activityIndicator, this.defaultTextTimeout, true);
        
    } else {
        Pillow.logDbgHigh("unknown action");
    }
};

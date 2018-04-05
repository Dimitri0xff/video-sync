
var pop;
var media;
var connection;
var myName;
var users = [];
var isSyncing = false;
var syncCbk = null;
var SYNC_PROTECT_TIME = 3000;

var constructDivHtml = function(clazz, text) {
    if(clazz != null && clazz != '') {
        clazz = ' class="' + clazz + '"';
    } else {
        clazz = '';
    }
    return '<div ' + clazz + '>' + text + '</div>';
}

var onMessageJson = function(json) {
    console.log(json);
    if(json.type == 'entered') {
        users = users.concat(json.list); // TODO: check if player is already there?

        for(i=0; i<json.list.length; i++) {
            $('#users-cont').append(constructDivHtml('username', json.list[i]));
        }
    } else if(json.type == 'left') {
        var name = json.name;
        var userIndex = users.indexOf(name);
        console.log(users);
        if(userIndex > 0) {
            console.log('splice ' + userIndex);
            users.splice(userIndex, 1);
        }
        $('#users-cont > .username').each(function(index) {
            if($(this).text() == name) {
                console.log('remove');
                $(this).remove();
            }
        });
    } else if(json.type == 'chat') {
        var clazz = 'chat-text';
        if(json.name === myName) {
            clazz += ' me';
        }
        $('#chat-cont').append(constructDivHtml(clazz, json.name + ': ' + json.msg));
        $('#chat-cont').animate({ scrollTop: 99999999999999999 }, 'fast');
    } else if(json.type == 'video') {
        videoRemoteEvent(json);
    }
}

var videoRemoteEvent = function(json) {
    if(isSyncing) {
        clearTimeout(syncCbk);
    }
    isSyncing = true;
    media.controls(false);
    syncCbk = setTimeout(function() {
        isSyncing = false;
        media.controls(true);
    }, SYNC_PROTECT_TIME);

    console.log('remote: ' + json.event);
    if(json.event == 'play') {
        media.play();
    } else if(json.event == 'pause') {
        media.pause();
    } else if(json.event == 'timeupdate') {
        media.currentTime(json.time);
    }
}

var sendJson = function(msg) {
    connection.send(JSON.stringify(msg));
}

$(function () {
    
    var SERVER_ADDRESS = location.protocol.replace('http', 'ws') + "//" + location.host + '/';

    // if user is running mozilla then use it's built-in WebSocket
    window.WebSocket = window.WebSocket || window.MozWebSocket;

    connection = new WebSocket(SERVER_ADDRESS);

    connection.onopen = function () {
        // connection is opened and ready to use
        console.log('wsclient connected');

        myName = localStorage.getItem('username');
        sendJson({ type : 'username', data : myName});
    };

    connection.onerror = function (error) {
        // an error occurred when sending/receiving data
        console.log('wsclient error: ' + error);
    };

    connection.onmessage = function (message) {
        // try to decode json (I assume that each message from server is json)
        var json;
        try {
            json = JSON.parse(message.data);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message.data);
            return;
        }
        // handle incoming message
        onMessageJson(json);
    };
    
    connection.onclose = function(event) {
        console.log('wsclient close');
        if(event.code == 1000) {
            console.log('Closed socket cleanly.');
        } else {
            console.log('Closed socket with error: ' + event.code);
            localStorage.setItem('last_error', 'Connection error (' + event.code + ').');
        }
        window.location = '../';
    }

    var sendChat = function() {
        var chatInput = $('.chat-input');
        var msg = chatInput.val();
        msg = msg.replace(/\s+$/, '');
        if(msg != '') {
            chatInput.val('');
            sendJson({type: 'chat', msg: msg});
        }
    }

    $('.chat-send').click(function(){
        sendChat();
    });

    $('.chat-input').keyup(function(e){
        if(e.keyCode == 13)
        {
            sendChat();
        }
    });

    var resizeVideo = function() {
        var vidContWidth = $('#video-cont').width();
        // Set video width
        $('.video-entry').width(vidContWidth);
        $('.video-entry').resize(function() {
            var entryHeight = $('.video-entry').height();
            $('#video-cont').height(entryHeight);
            $('#chat-cont').height(entryHeight);
        });
    }

    $(window).ready(function() {
        resizeVideo();
    });

    $(window).resize(function() {
        resizeVideo();
    });

    var createPopcorn = function() {
        pop = Popcorn("#main-video"/*, {
           defaults: {
             subtitle: {
               target: "#video-cont"
             }
            }
        }*/
        );

        media = Popcorn("#main-video");
        var events = "play pause timeupdate seeking".split(/\s+/g);
        
        events.forEach(function(event) {
            media.on(event, function() {

                // Don't send an event if acting on a remote event
                if(isSyncing) {
                    return;
                }

                if (event === "timeupdate") {
                    console.log(this.currentTime());
                    if (!this.media.paused) {
                        return;
                    }

                    //console.log('time: '+this.currentTime());
                    sendJson({type: 'video', event: event, time: this.currentTime()});
                    return;
                }

                if (event === "seeking") {
                    // Not needed
                }

                if (event === "play" || event === "pause") {
                    //console.log(event);
                    sendJson({type: 'video', event: event});
                }
            });
        });
    
    }

    createPopcorn();

});
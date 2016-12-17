
var SERVER_ADDRESS = 'ws://localhost:3000/';

var connection;
var myName;
var users = [];

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
    }
}

var sendJson = function(msg) {
    connection.send(JSON.stringify(msg));
}

$(function () {
    
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
        chatInput.val('');
        sendJson({type: 'chat', msg: msg});
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
});
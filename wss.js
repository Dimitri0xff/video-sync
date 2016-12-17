var url = require('url')
  , WebSocketServer = require('ws').Server;

var wss;

var parseJson = function(msg) {
    try {
        var json = JSON.parse(msg);
        return json;
    } catch (e) {
        console.log('This doesn\'t look like a valid JSON: ', msg);
        return null;
    }
}

var users = [];

var getUser = function(ws) {
    for(i=0; i<users.length; i++) {
        if(users[i].ws === ws) {
            return users[i];
        }
    }
    return null;
}

var getUserNameList = function() {
    var userNames = [];
    for(i=0; i<users.length; i++) {
        userNames.push(users[i].name);
    }
    return userNames;
}

var sendBroadcast = function(msg, exceptWs) {
    for(i=0; i<users.length; i++) {
        if(users[i].ws !== exceptWs) {
            send(users[i].ws, msg);
        }
    }
}

var send = function(ws, msg) {
    ws.send(JSON.stringify(msg));
}

var received = function(ws, json) {
    if(json.type == 'username') {
        if('data' in json) {
            //TODO check if user already exists and send error
            var name = json.data;
            var newUser = { ws: ws, name: name};
            users.push(newUser);
            send(ws, {type: 'enter_room', room: 'global'});
            // Send user list
            send(ws, {type: 'entered', list: getUserNameList()});
            // Send user entered to existing users
            sendBroadcast({type: 'entered', list: [name]}, ws);
        }
    } else if(json.type == 'chat') {
        var user = getUser(ws);
        json.name = user.name;
        sendBroadcast(json, null);
    }
}

module.exports.init = function(server) {
    wss = new WebSocketServer({ server: server });

    wss.on('connection', function connection(ws) {
      // TODO: var location = url.parse(ws.upgradeReq.url, true);
      // you might use location.query.access_token to authenticate or share sessions
      // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)


      ws.on('message', function incoming(message) {
        try {
            var json = JSON.parse(message);
            received(ws, json);
        } catch (e) {
            console.log('This doesn\'t look like a valid JSON: ', message);
        }
      });


      ws.on('close', function close() {
          console.log('disconnected');
          var foundIndex = -1;
          for(i=0; i<users.length; i++) {
              if(users[i].ws === ws) {
                  foundIndex = i;
                  break;
              }
          }
          if(foundIndex >= 0) {
              var userLeft = users[foundIndex];
              users.splice(foundIndex, 1);
              sendBroadcast({type: 'left', name: userLeft.name}, null);
          }
      });

    });
};

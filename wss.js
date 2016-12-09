var url = require('url')
  , WebSocketServer = require('ws').Server;

var wss;

module.exports.init = function(server) {
    wss = new WebSocketServer({ server: server });

    wss.on('connection', function connection(ws) {
      // TODO: var location = url.parse(ws.upgradeReq.url, true);
      // you might use location.query.access_token to authenticate or share sessions
      // or ws.upgradeReq.headers.cookie (see http://stackoverflow.com/a/16395220/151312)
      
      

      ws.on('message', function incoming(message) {
        console.log('received: %s', message);
      });
      
      ws.on('close', function close() {
        console.log('disconnected');
      });

      ws.send('something');
    });
};

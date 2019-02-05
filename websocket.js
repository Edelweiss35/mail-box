
var WebSocketServer = require('ws').Server
var wss = null;
var websocket = null;

module.exports = (function(){
    const createServer = (server)=>{
        wss = new WebSocketServer({server});

        wss.on('connection', ws => {
            websocket = ws;
            console.log('Weboscket connected!');
            ws.on('close', function() {
            });
            ws.on('message', message => {
                console.log(`Received message => ${message}`);
            });
        });
    }

    const sendMsg = (msg) => {
        if(websocket != null)
            websocket.send(msg);
        else
            console.log('socket not connected');
    }

    return { createServer, sendMsg };
})();
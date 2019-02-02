var WebSocketServer = require('ws').Server

exports.createWebsocket =(server) => {
    console.log('create websocket');
    var wss = new WebSocketServer({server});
    wss.on('connection', function(ws) {
        var id = setInterval(function() {
            ws.send(JSON.stringify(process.memoryUsage()), 
                function() { /* ignore errors */ });
            }, 100);
        ws.on('close', function() {
            clearInterval(id);
        });
    });
}
var WebSocketServer = require('ws').Server

exports.createWebsocket =(server) => {

    var wss = new WebSocketServer({server});
    
    return new Promise((resolve)=>{
        wss.on('connection', function(ws) {
            console.log('websocket connected');
            resolve(ws);
        });
    });
    
    // wss.on('connection', function(ws) {
    //     var id = setInterval(function() {
    //         ws.send(JSON.stringify(process.memoryUsage()), 
    //             function() { /* ignore errors */ });
    //         }, 100);

    //     ws.on('close', function() {
    //         clearInterval(id);
    //     });
    // });
    
}
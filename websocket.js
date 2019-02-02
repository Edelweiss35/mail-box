
exports.createWebsocket =(server) => {
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
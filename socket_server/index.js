const https = require("https");
const fs = require('node:fs');
const WebSocket = require('ws'); 
const ProLog = 0;

let client_ips=[]; 
let client_sockets=[]; 
let websocketServer = null;
const WebSocketController={
    init:()=>{
        const keyPath = process.env.WS_TLS_KEY_PATH;
        const certificatePath = process.env.WS_TLS_CERT_PATH;

        if (!keyPath || !certificatePath) {
            console.warn('Primary WebSocket server disabled: TLS paths are not configured.');
            return null;
        }

        const server = https.createServer({
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certificatePath),
        });
        const wss = new WebSocket.Server({ server });
        websocketServer = wss;

        wss.on('connection', (socket) => {
            let ip= socket._socket.remoteAddress; 
            client_sockets.push({socket, ip});
            client_ips.push(ip);
            socket.send("echo");
            console.log(ip); 
            socket.on('close', () => {
                ProLog && console.log('Client disconnected', new Date());
                ip = socket._socket.remoteAddress; 
                client_sockets= client_sockets.filter( v => v.ip!==ip);
                client_ips = client_ips.filter(v=> v!==ip);
            });
        });

        const port = Number(process.env.WS_TLS_PORT || 8081);
        server.listen(port, function() {
            ProLog && console.log(`Secure WebSocket server listening on port ${port}.`);
        });

        return server;
    },
    sendNotificationWithWss: (data)=>{
        const clients = websocketServer ? websocketServer.clients : [];
        for(const socket of clients){
            socket.send(JSON.stringify(data));
        }
    }
}

module.exports = WebSocketController; 

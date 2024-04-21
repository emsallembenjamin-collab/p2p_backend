const https = require("https");
const fs = require('fs');
const WebSocket = require('ws'); 
const ProLog = 0;
const sslkey = fs.readFileSync(__dirname + '/../ssl/privkey1.pem');
const sslcert = fs.readFileSync(__dirname  + '/../ssl/fullchain1.pem');

const server = https.createServer({
    key: sslkey,
    cert: sslcert
});

const wss = new WebSocket.Server({server});

let client_ips=[]; 
let client_sockets=[]; 
const WebSocketController={
    init:()=>{
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
    },
    sendNotificationWithWss: (data)=>{
        for(socket of wss.clients ){
            socket.send(JSON.stringify(data));
        }
    }
}
server.listen(8081, function() {
    ProLog && console.log('Secure WebSocket server listening on port 8081.');
});

module.exports = WebSocketController; 

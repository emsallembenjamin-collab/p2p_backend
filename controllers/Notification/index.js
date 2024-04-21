const express = require('express');
const http = require('http');
const fs = require('fs');
const https = require('https');
const WebSocket = require('ws');
const app = express();
// const server = http.createServer(app);
// const wss = new WebSocket.Server({ server });
const jwt = require('jsonwebtoken'); 
const config=require('../../config/auth'); 
const uuid = require('uuid'); 
const WebSocketConfig = {
    sockets: []
}; 


const addSocket = (socket_id, ws, user_id)=>{
    let socket = {
        socket_id, ws, user_id
    }; 
    WebSocketConfig.sockets = [...WebSocketConfig.sockets, socket]; 
}

const deleteSocket = (socket_id)=>{
    let sockets = WebSocketConfig.sockets.filter(item=>item.socket_id !=socket_id); 
    WebSocketConfig.sockets = sockets;
}

const findSocketForUser = (user_id)=>{
    let userSockets = WebSocketConfig.sockets.filter(item=>item.user_id === user_id); 
    return userSockets; 
}

const initSecketServer = () =>{

    let server = null; 
    if(process.env.APP_MODE == 'Local'){
        server = http.createServer(app); 
    }else{
        server = https.createServer({
            key: fs.readFileSync('/etc/letsencrypt/live/fxstring.com/privkey.pem'),
            cert: fs.readFileSync('/etc/letsencrypt/live/fxstring.com/fullchain.pem')
          });
    }
    const wss = new WebSocket.Server({ server });

    wss.on('connection', (ws) => {
        let socket_id =  uuid.v4(); 
        ws.on('message', (message) => {
            try{
                let token = JSON.parse(message.toString()); 
                info = jwt.decode(token.token, config.secret); 
                addSocket(socket_id, ws, info.accountUuid); 
                console.log(info); 
                ws.send('Connected Successed'); 
            }catch(e){
                ws.send('Access is not allowed'); 
            }
        });
    
        ws.on('close', () => {
            deleteSocket(socket_id); 
            // Handle close
        });
    });
    
    server.listen(process.env.WS_PORT, () => {
        console.log('Socket Server is running on port ' + process.env.WS_PORT);
    });
}

const sendNotifyToUser = (user_id, message)=>{
    let ws_sockets = findSocketForUser(user_id); 
    ws_sockets.forEach((socket, index)=>{
        sendMessage(socket.ws, message); 
    })
}

const sendMessage = (ws, message) =>{
    let _msg = JSON.stringify(message); 
    console.log(message); 
    ws.send(_msg);
}

const broadCastMessage = (message)=>{
    WebSocketConfig.sockets.forEach((socket, index)=>{
        socket.ws.send(JSON.stringify(message)); 
    })
}

const SocketController = {
    initSecketServer, 
    sendMessage,
    broadCastMessage, 
    sendNotifyToUser
}

module.exports=SocketController;
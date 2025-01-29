const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');
const express = require('express');
const http = require('http');
const WebSocket = require('ws');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let client;
let isConnected = false;

const initializeClient = () => {
    client = new Client({
        webVersionCache: {
            type: "remote",
            remotePath:
                "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
        },
    });


const sourceGroupId = '120363337942591731@g.us'; // ID del grupo origen
const targetGroupId = '120363395604999760@g.us'; // ID del grupo destino

    client.on('qr', async (qr) => {
        await qrcode.toFile('public/qrcode.png', qr);
        isConnected = false;
        broadcast({ type: 'qr', qr: '/qrcode.png' });
    });

    client.on('ready', () => {
        console.log('✅ Cliente conectado a WhatsApp');
        isConnected = true;
        broadcast({ type: 'status', message: 'Conexión exitosa' });
    });

    client.on('message', async (message) => {
    try {
        if (message.from === sourceGroupId) {
            await client.sendMessage(targetGroupId, `_*${message._data.notifyName}*_ dice: ${message.body}`);   
            console.log(`_*${message._data.notifyName}*_ dice: ${message.body}`);
        } /*else if (message.from === targetGroupId){
            await client.sendMessage(sourceGroupId, message.body);
            console.log(`Mensaje enviado: ${message.body}`);
        }*/
    } catch (error) {
        console.error('Error al reenviar el mensaje:', error);
    }
});

    client.on('disconnected', () => {
        console.log('⚠ Cliente desconectado de WhatsApp');
        isConnected = false;
        client.destroy();
        initializeClient(); // Reiniciar cliente automáticamente
        broadcast({ type: 'qr', qr: '/qrcode.png' });
    });

    client.initialize();
};

wss.on('connection', (ws) => {
    ws.send(JSON.stringify({ type: isConnected ? 'status' : 'qr', qr: '/qrcode.png' }));

    ws.on('message', async (message) => {
        const data = JSON.parse(message);
        if (data.type === 'logout' && isConnected) {
            await client.logout();
            isConnected = false;
            broadcast({ type: 'qr', qr: '/qrcode.png' });
        }
    });
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

app.use(express.static('public'));

server.listen(3000, () => {
    console.log('🚀 Servidor en ejecución en https://kipi-whats.onrender.com');
    initializeClient(); // Inicializar WhatsApp Web al arrancar el servidor
});

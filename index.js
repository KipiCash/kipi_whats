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

// Función para inicializar el cliente de WhatsApp
const initializeClient = () => {
    client = new Client({
        webVersionCache: {
            type: "remote",
            remotePath:
                "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
        },
    });

    // Generar el QR y enviarlo a los clientes
    client.on('qr', async (qr) => {
        await qrcode.toFile('public/qrcode.png', qr);
        isConnected = false;
        broadcast({ type: 'qr', qr: '/qrcode.png' });
    });

    // Cliente listo
    client.on('ready', () => {
        console.log('✅ Cliente conectado a WhatsApp');
        isConnected = true;
        broadcast({ type: 'status', message: 'Conexión exitosa' });
    });

    // Manejo de cierre de sesión
    client.on('disconnected', () => {
        console.log('⚠ Cliente desconectado de WhatsApp');
        isConnected = false;
        client.destroy();
        initializeClient(); // Reiniciar cliente automáticamente
        broadcast({ type: 'qr', qr: '/qrcode.png' });
    });

    client.initialize();
};

// WebSocket para comunicación en tiempo real
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

// Función para enviar datos a todos los clientes
function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// Servir archivos estáticos
app.use(express.static('public'));

// Iniciar servidor en localhost
server.listen(3000, () => {
    console.log('🚀 Servidor en ejecución en http://localhost:3000');
    initializeClient(); // Inicializar WhatsApp Web al arrancar el servidor
});

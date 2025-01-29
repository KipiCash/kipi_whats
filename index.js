const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');

const client = new Client({
    webVersionCache: {
        type: "remote",
        remotePath:
            "https://raw.githubusercontent.com/wppconnect-team/wa-version/main/html/2.2412.54.html",
    },
});

const sourceGroupId = '120363337942591731@g.us'; // ID del grupo origen
const targetGroupId = '120363395604999760@g.us'; // ID del grupo destino

// Generar el QR y guardarlo como imagen
client.on('qr', (qr) => {
    qrcode.toFile('qrcode.png', qr, function (err) {
        if (err) {
            console.error('Error generando el QR:', err);
        } else {
            console.log('QR generado y guardado en qrcode.png');
        }
    });
});

// Cuando el cliente esté listo
client.on('ready', async () => {
    console.log('Cliente listo');

    // Modificar el archivo HTML para reemplazar el QR por el mensaje de "Conexión exitosa"
    const htmlFile = 'index.html';

    fs.readFile(htmlFile, 'utf8', (err, data) => {
        if (err) {
            console.error('Error al leer el archivo HTML:', err);
            return;
        }

        // Reemplazar el contenido para mostrar el mensaje
        const updatedHtml = data.replace(
            '<div id="status" class="alert alert-info mt-3" style="display:none;">Conexión exitosa</div>',
            '<div id="status" class="alert alert-success mt-3" style="display:block;">Conexión exitosa</div>'
        ).replace(
            '<img id="qrImage" src="qrcode.png" alt="QR Code" class="img-fluid">',
            '<img id="qrImage" src="qrcode.png" alt="QR Code" class="img-fluid" style="display:none;">'
        );

        // Guardar el archivo HTML actualizado
        fs.writeFile(htmlFile, updatedHtml, 'utf8', (err) => {
            if (err) {
                console.error('Error al actualizar el archivo HTML:', err);
            } else {
                console.log('Archivo HTML actualizado con el mensaje de conexión exitosa');
            }
        });
    });
});

// Manejar los mensajes
client.on('message', async (message) => {
    try {
        if (message.from === sourceGroupId) {
            await client.sendMessage(targetGroupId, `_*${message._data.notifyName}*_ dice: ${message.body}`);   
            console.log(`_*${message._data.notifyName}*_ dice: ${message.body}`);
        }
    } catch (error) {
        console.error('Error al reenviar el mensaje:', error);
    }
});

// Inicializar el cliente de WhatsApp Web
client.initialize();
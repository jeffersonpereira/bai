const express = require('express');
const axios = require('axios');
const qrcode = require('qrcode-terminal');
const { 
  default: makeWASocket, 
  DisconnectReason, 
  useMultiFileAuthState 
} = require('@whiskeysockets/baileys');
const pino = require('pino');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 40002;
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:40001';

let sock;
let qrCodeStr = "";

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState(path.join(__dirname, 'auth_info_baileys'));

    sock = makeWASocket({
        auth: state,
        printQRInTerminal: true,
        logger: pino({ level: "silent" })
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            qrCodeStr = qr;
        }

        if (connection === 'close') {
            const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('connection closed due to ', lastDisconnect.error, ', reconnecting ', shouldReconnect);
            if (shouldReconnect) {
                setTimeout(connectToWhatsApp, 5000);
            }
        } else if (connection === 'open') {
            console.log('opened connection to WhatsApp');
            qrCodeStr = "";
        }
    });

    sock.ev.on('messages.upsert', async (m) => {
        const msg = m.messages[0];
        if (!msg.message || msg.key.fromMe) return;

        const remoteJid = msg.key.remoteJid;
        
        // Extract text message
        let textMatch = msg.message.conversation || 
            msg.message.extendedTextMessage?.text || 
            "";

        if (!textMatch) return;

        // Limpeza simples do JID para ter apenas o telefone
        const phone = remoteJid.split('@')[0];

        try {
            await axios.post(`${PYTHON_BACKEND_URL}/api/v1/whatsapp/webhook`, {
                phone: phone,
                message: textMatch,
                timestamp: msg.messageTimestamp,
                messageId: msg.key.id
            });
            console.log(`Webhook enviado para o python: Cliente ${phone}`);
        } catch (error) {
            console.error('Erro ao enviar webhook para o backend Python:', error.message);
        }
    });
}

// Endpoint para exibir o QR Code em raw text (ou para gerar no frontend)
app.get('/qr', (req, res) => {
    if (qrCodeStr) {
        res.json({ status: 'pending', qr: qrCodeStr });
    } else if (sock && sock.user) {
        res.json({ status: 'connected', user: sock.user });
    } else {
        res.json({ status: 'connecting' });
    }
});

// Endpoint chamado pelo Python para enviar mensagem
app.post('/send-message', async (req, res) => {
    const { phone, message } = req.body;
    
    if (!phone || !message) {
        return res.status(400).json({ error: 'Telefone e mensagem são obrigatórios' });
    }

    try {
        const jid = phone.includes('@s.whatsapp.net') ? phone : `${phone}@s.whatsapp.net`;
        await sock.sendMessage(jid, { text: message });
        res.json({ success: true });
    } catch (error) {
        console.error('Erro ao enviar mensagem pelo baileys:', error);
        res.status(500).json({ error: 'Erro ao enviar mensagem' });
    }
});

// Inicia o serviço
app.listen(PORT, () => {
    console.log(`Serviço WhatsApp rolando na porta ${PORT}`);
    connectToWhatsApp();
});

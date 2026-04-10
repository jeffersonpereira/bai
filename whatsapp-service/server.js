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

// ---------------------------------------------------------------------------
// Logger estruturado (pino)
// ---------------------------------------------------------------------------
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 40002;
const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:40001';
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || '';

let sock;
let qrCodeStr = '';

// ---------------------------------------------------------------------------
// Middleware de autenticação para endpoints internos
// ---------------------------------------------------------------------------
function requireInternalKey(req, res, next) {
  if (!INTERNAL_API_KEY) {
    // Sem chave configurada, bloqueia por segurança
    return res.status(403).json({ error: 'INTERNAL_API_KEY não configurada no servidor' });
  }
  const provided = req.headers['x-api-key'];
  if (provided !== INTERNAL_API_KEY) {
    logger.warn({ ip: req.ip }, 'Tentativa não autorizada em endpoint interno');
    return res.status(401).json({ error: 'Não autorizado' });
  }
  next();
}

// ---------------------------------------------------------------------------
// Conexão com WhatsApp via Baileys
// ---------------------------------------------------------------------------
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(
    path.join(__dirname, 'auth_info_baileys')
  );

  sock = makeWASocket({
    auth: state,
    printQRInTerminal: true,
    logger: pino({ level: 'silent' }),
  });

  sock.ev.on('creds.update', saveCreds);

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCodeStr = qr;
      logger.info('QR Code gerado — escaneie com o WhatsApp.');
    }

    if (connection === 'close') {
      const shouldReconnect =
        lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
      logger.warn(
        { reason: lastDisconnect?.error?.message, willReconnect: shouldReconnect },
        'Conexão com WhatsApp fechada'
      );
      if (shouldReconnect) {
        setTimeout(connectToWhatsApp, 5000);
      }
    } else if (connection === 'open') {
      qrCodeStr = '';
      logger.info('Conexão com WhatsApp estabelecida.');
    }
  });

  sock.ev.on('messages.upsert', async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe) return;

    const remoteJid = msg.key.remoteJid;
    const phone = remoteJid.split('@')[0];
    const messageId = msg.key.id;

    // Extrai texto da mensagem
    const textContent =
      msg.message.conversation ||
      msg.message.extendedTextMessage?.text ||
      null;

    // Mensagem de mídia: avisa o cliente que só texto é suportado
    if (!textContent) {
      const mediaTypes = {
        imageMessage: 'imagens',
        videoMessage: 'vídeos',
        audioMessage: 'áudios',
        documentMessage: 'documentos',
        stickerMessage: 'figurinhas',
      };
      const mediaKey = Object.keys(mediaTypes).find((k) => msg.message[k]);
      if (mediaKey) {
        try {
          const jid = remoteJid.includes('@') ? remoteJid : `${phone}@s.whatsapp.net`;
          await sock.sendMessage(jid, {
            text: `Olá! No momento só consigo ler mensagens de texto. Por favor, descreva o que você precisa por escrito 😊`,
          });
          logger.info({ phone, mediaKey }, 'Resposta enviada para mensagem de mídia.');
        } catch (err) {
          logger.error({ phone, err: err.message }, 'Erro ao responder mensagem de mídia.');
        }
      }
      return;
    }

    logger.info({ phone, messageId }, 'Mensagem de texto recebida, enviando ao backend.');

    try {
      await axios.post(`${PYTHON_BACKEND_URL}/api/v1/whatsapp/webhook`, {
        phone,
        message: textContent,
        timestamp: msg.messageTimestamp,
        messageId,
      });
    } catch (error) {
      logger.error(
        { phone, messageId, err: error.message },
        'Erro ao enviar webhook para o backend Python.'
      );
    }
  });
}

// ---------------------------------------------------------------------------
// Endpoints HTTP
// ---------------------------------------------------------------------------

// QR Code / status de conexão (público — apenas para leitura)
app.get('/qr', (req, res) => {
  if (qrCodeStr) {
    res.json({ status: 'pending', qr: qrCodeStr });
  } else if (sock?.user) {
    res.json({ status: 'connected', user: sock.user });
  } else {
    res.json({ status: 'connecting' });
  }
});

// Envio de mensagem (apenas para o backend Python autenticado)
app.post('/send-message', requireInternalKey, async (req, res) => {
  const { phone, message } = req.body;

  if (!phone || !message) {
    return res.status(400).json({ error: 'phone e message são obrigatórios' });
  }

  if (!sock?.user) {
    logger.warn({ phone }, 'Tentativa de envio com WhatsApp desconectado.');
    return res.status(503).json({ error: 'WhatsApp não está conectado' });
  }

  try {
    const jid = phone.includes('@s.whatsapp.net') ? phone : `${phone}@s.whatsapp.net`;
    await sock.sendMessage(jid, { text: message });
    logger.info({ phone }, 'Mensagem enviada com sucesso.');
    res.json({ success: true });
  } catch (error) {
    logger.error({ phone, err: error.message }, 'Erro ao enviar mensagem via Baileys.');
    res.status(500).json({ error: 'Erro ao enviar mensagem' });
  }
});

// ---------------------------------------------------------------------------
// Start
// ---------------------------------------------------------------------------
app.listen(PORT, () => {
  logger.info({ port: PORT }, 'Serviço WhatsApp iniciado.');
  connectToWhatsApp();
});

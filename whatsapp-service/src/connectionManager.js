import makeWASocket, {
    useMultiFileAuthState,
    DisconnectReason,
    Browsers,
} from '@whiskeysockets/baileys'
import { Boom } from '@hapi/boom'
import axios from 'axios'
import { Mutex } from 'async-mutex'
import pino from 'pino'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const sessionsDir = path.join(__dirname, '..', 'sessions')
const silentLogger = pino({ level: 'silent' })

const PYTHON_BACKEND_URL = process.env.PYTHON_BACKEND_URL || 'http://127.0.0.1:40001'
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || ''

class ConnectionManager {
    constructor() {
        this.sessions = new Map()
    }

    _sessionPath(userId) {
        return path.join(sessionsDir, String(userId))
    }

    async connect(userId) {
        if (!fs.existsSync(sessionsDir)) fs.mkdirSync(sessionsDir, { recursive: true })

        let session = this.sessions.get(userId)
        if (!session) {
            session = { socket: null, status: 'disconnected', qr: null, mutex: new Mutex() }
            this.sessions.set(userId, session)
        }

        if (session.status === 'connected' || session.status === 'connecting') {
            return session.status
        }

        const release = await session.mutex.acquire()
        try {
            session.status = 'connecting'
            const { state, saveCreds } = await useMultiFileAuthState(this._sessionPath(userId))

            const sock = makeWASocket({
                auth: state,
                logger: silentLogger,
                browser: Browsers.ubuntu('Chrome'),
                printQRInTerminal: false,
            })

            session.socket = sock

            sock.ev.on('creds.update', saveCreds)

            sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update
                if (qr) {
                    session.qr = qr
                    session.status = 'qr_pending'
                }
                if (connection === 'open') {
                    session.status = 'connected'
                    session.qr = null
                    this._notifyStatus(userId, 'connected')
                } else if (connection === 'close') {
                    const code = lastDisconnect?.error instanceof Boom
                        ? lastDisconnect.error.output?.statusCode
                        : null
                    const shouldReconnect = code !== DisconnectReason.loggedOut
                    session.status = shouldReconnect ? 'connecting' : 'disconnected'
                    if (!shouldReconnect) {
                        this._notifyStatus(userId, 'disconnected')
                    } else {
                        setTimeout(() => this.connect(userId), 3000)
                    }
                }
            })

            sock.ev.on('messages.upsert', async ({ messages, type }) => {
                if (type !== 'notify') return
                for (const msg of messages) {
                    if (!msg.key.fromMe) {
                        this._forwardMessage(userId, msg)
                    }
                }
            })
        } finally {
            release()
        }

        return 'connecting'
    }

    async disconnect(userId) {
        const session = this.sessions.get(userId)
        if (!session) return
        try { await session.socket?.logout() } catch {}
        session.socket = null
        session.status = 'disconnected'
        session.qr = null
        const dir = this._sessionPath(userId)
        if (fs.existsSync(dir)) fs.rmSync(dir, { recursive: true })
        this.sessions.delete(userId)
    }

    async sendMessage(userId, to, text) {
        const session = this.sessions.get(userId)
        if (!session || session.status !== 'connected') {
            throw new Error('WhatsApp não conectado para este usuário')
        }
        const jid = to.includes('@') ? to : `${to.replace(/\D/g, '')}@s.whatsapp.net`
        await session.socket.sendMessage(jid, { text })
        return { jid, text }
    }

    getStatus(userId) {
        const session = this.sessions.get(userId)
        return {
            status: session?.status || 'disconnected',
            qr: session?.qr || null,
        }
    }

    _notifyStatus(userId, status) {
        axios
            .post(
                `${PYTHON_BACKEND_URL}/api/v1/whatsapp/webhook/status`,
                { user_id: userId, status },
                { headers: { 'X-Internal-Key': INTERNAL_API_KEY }, timeout: 5000 }
            )
            .catch(() => {})
    }

    _forwardMessage(userId, msg) {
        const body =
            msg.message?.conversation ||
            msg.message?.extendedTextMessage?.text ||
            '[mídia]'
        axios
            .post(
                `${PYTHON_BACKEND_URL}/api/v1/whatsapp/webhook/message`,
                {
                    user_id: userId,
                    from_jid: msg.key.remoteJid,
                    body,
                    timestamp: msg.messageTimestamp,
                    message_id: msg.key.id,
                },
                { headers: { 'X-Internal-Key': INTERNAL_API_KEY }, timeout: 5000 }
            )
            .catch(() => {})
    }
}

export default new ConnectionManager()

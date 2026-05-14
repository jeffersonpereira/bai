import 'dotenv/config'
import express from 'express'
import pino from 'pino'
import connectionManager from './connectionManager.js'

const app = express()
const logger = pino()
const PORT = parseInt(process.env.PORT || '40002', 10)
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY || ''

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Internal-Key')
    if (req.method === 'OPTIONS') return res.sendStatus(204)
    next()
})
app.use(express.json())

function requireAuth(req, res, next) {
    if (req.headers['x-internal-key'] !== INTERNAL_API_KEY) {
        return res.status(401).json({ error: 'Unauthorized' })
    }
    next()
}

app.get('/health', (_req, res) => res.json({ ok: true }))

app.post('/sessions/:userId/start', requireAuth, async (req, res) => {
    try {
        const status = await connectionManager.connect(req.params.userId)
        res.json({ status })
    } catch (err) {
        logger.error(err)
        res.status(500).json({ error: err.message })
    }
})

app.get('/sessions/:userId/status', requireAuth, (req, res) => {
    res.json(connectionManager.getStatus(req.params.userId))
})

app.delete('/sessions/:userId', requireAuth, async (req, res) => {
    await connectionManager.disconnect(req.params.userId)
    res.json({ ok: true })
})

app.post('/sessions/:userId/send', requireAuth, async (req, res) => {
    try {
        const { to, text } = req.body
        if (!to || !text) return res.status(400).json({ error: 'to e text são obrigatórios' })
        const result = await connectionManager.sendMessage(req.params.userId, to, text)
        res.json(result)
    } catch (err) {
        logger.error(err)
        res.status(400).json({ error: err.message })
    }
})

app.listen(PORT, () => {
    logger.info(`WhatsApp service rodando na porta ${PORT}`)
})

import 'dotenv/config'
import { randomUUID } from 'node:crypto'
import express from 'express'
import cors from 'cors'
import apiRouter from './routes/api.js'
import authRouter from './routes/auth.js'
import flashcardRouter from './routes/flashcard.js'
import gatewayApiRouter from './routes/gateway-api.js'
import adminRouter from './routes/admin.js'
import studentFeaturesRouter from './routes/studentFeatures.js'
import learningRouter from './routes/learning.js'
import { errorHandler, notFoundHandler } from './middleware/errors.js'
import { prisma } from './db/prisma.js'
import helmet from 'helmet'
import { validateEnv } from './config/env.js'
import { apiRateLimit } from './middleware/rateLimit.js'
import { ensureBootstrapAdmin } from './services/bootstrapService.js'
import { ensureDefaultPolicies } from './services/schoolPolicyService.js'

const app = express()

validateEnv()
app.disable('x-powered-by')
if ((process.env.NODE_ENV || 'development') === 'production') {
  app.set('trust proxy', 1)
}

const corsOrigins = (process.env.CORS_ORIGIN || 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean)

app.use(
  cors({
    origin(origin, cb) {
      if (!origin) return cb(null, true)
      if (corsOrigins.includes('*')) return cb(null, true)
      if (corsOrigins.includes(origin)) return cb(null, true)
      return cb(new Error('CORS blocked'))
    },
  }),
)

app.use(helmet())

app.use(express.json({ limit: '1mb' }))

app.use((req, res, next) => {
  const requestId = req.headers['x-request-id']?.toString().slice(0, 100) || randomUUID()
  const startedAt = Date.now()
  res.setHeader('x-request-id', requestId)
  res.on('finish', () => {
    const elapsedMs = Date.now() - startedAt
    console.log(`[http] ${requestId} ${req.method} ${req.originalUrl} ${res.statusCode} ${elapsedMs}ms`)
  })
  next()
})

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    data: { status: 'up', uptimeSeconds: Math.round(process.uptime()) },
  })
})

app.get('/api/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ ok: true, data: { status: 'ready', database: 'connected' } })
  } catch {
    res.status(503).json({ ok: false, error: 'Database is unavailable' })
  }
})

app.use('/api', apiRateLimit)

app.use('/api', apiRouter)
app.use('/api', authRouter)
app.use('/api', adminRouter)
app.use('/api', studentFeaturesRouter)
app.use('/api', learningRouter)
app.use('/api', flashcardRouter)
app.use('/api/legacy', (_req, res) => {
  res.status(410).json({
    ok: false,
    error: 'Legacy API has been retired. Use /api/gateway instead.',
  })
})
app.use('/api/gateway', gatewayApiRouter)

app.use(notFoundHandler)
app.use(errorHandler)

const port = process.env.PORT || 3000

await ensureBootstrapAdmin()
await ensureDefaultPolicies()

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})

async function shutdown(signal: string) {
  if (!server.listening) return
  try {
    console.log(`[shutdown] ${signal}`)
    await new Promise<void>((resolve, reject) => {
      const forceTimer = setTimeout(resolve, 10_000)
      forceTimer.unref()
      server.close((error) => {
        clearTimeout(forceTimer)
        if (error) reject(error)
        else resolve()
      })
    })
    await prisma.$disconnect()
  } finally {
    process.exit(0)
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

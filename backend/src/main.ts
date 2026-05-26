import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import apiRouter from './routes/api.js'
import authRouter from './routes/auth.js'
import flashcardRouter from './routes/flashcard.js'
import legacyApiRouter from './routes/legacy-api.js'
import gatewayApiRouter from './routes/gateway-api.js'
import { errorHandler, notFoundHandler } from './middleware/errors.js'
import { prisma } from './db/prisma.js'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import { validateEnv } from './config/env.js'

const app = express()

validateEnv()

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

// 全局 API 接口限流 — 抗压测试专用配置
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 分钟窗口
  max: 15,                  // 每个 IP 最多 15 次请求
  message: { ok: false, error: '请求过于频繁，请稍后再试' },
  standardHeaders: true,    // 返回 RateLimit-* 标准头
  legacyHeaders: false,     // 禁用 X-RateLimit-* 旧版头
})

app.use('/api', apiLimiter)

app.use('/api', apiRouter)
app.use('/api', authRouter)
app.use('/api', flashcardRouter)
app.use('/api/legacy', legacyApiRouter)
app.use('/api/gateway', gatewayApiRouter)

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, message: 'Backend is running!' })
})

app.use(notFoundHandler)
app.use(errorHandler)

const port = process.env.PORT || 3000

const server = app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`)
})

async function shutdown(signal: string) {
  try {
    console.log(`[shutdown] ${signal}`)
    server.close(() => {})
    await prisma.$disconnect()
  } finally {
    process.exit(0)
  }
}

process.on('SIGINT', () => void shutdown('SIGINT'))
process.on('SIGTERM', () => void shutdown('SIGTERM'))

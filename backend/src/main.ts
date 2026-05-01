import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import apiRouter from './routes/api.js'
import { errorHandler, notFoundHandler } from './middleware/errors.js'
import { prisma } from './db/prisma.js'
import helmet from 'helmet'
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

app.use('/api', apiRouter)

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

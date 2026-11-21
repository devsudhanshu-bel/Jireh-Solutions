import cors from 'cors'
import express, { type ErrorRequestHandler } from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import { prisma } from './db.js'
import { corsOrigins, env } from './env.js'
import { submissions } from './routes/submissions.js'

export const app = express()
app.disable('x-powered-by')
app.set('trust proxy', env.TRUST_PROXY)

app.use(helmet())
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || corsOrigins.includes(origin)),
    methods: ['GET', 'POST'],
    maxAge: 600,
  }),
)
app.use(rateLimit({ windowMs: 15 * 60_000, limit: 200, standardHeaders: 'draft-7', legacyHeaders: false }))
app.use(express.json({ limit: '20kb' }))

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok' })
  } catch (e) {
    console.error('[health] database check failed:', (e as Error).message)
    res.status(503).json({ status: 'unavailable' })
  }
})

// Only these two write endpoints exist. There are deliberately no read/list/admin routes.
app.use('/api', submissions)

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'not_found' })
})

const onError: ErrorRequestHandler = (err, _req, res, _next) => {
  const status = typeof err?.status === 'number' ? err.status : 500
  if (status === 413) return void res.status(413).json({ error: 'payload_too_large' })
  if (status >= 400 && status < 500) return void res.status(status).json({ error: 'bad_request' })
  console.error('[error]', err)
  res.status(500).json({ error: 'server_error', message: 'Something went wrong. Please try again later.' })
}
app.use(onError)

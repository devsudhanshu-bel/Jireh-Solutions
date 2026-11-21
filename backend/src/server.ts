import { app } from './app.js'
import { prisma } from './db.js'
import { env, smtpConfigured } from './env.js'

const server = app.listen(env.PORT, () => {
  console.log(`API listening on :${env.PORT} (${env.NODE_ENV})`)
  if (!smtpConfigured) console.warn('SMTP_USER/SMTP_PASS not set: submissions are saved but no emails will be sent.')
})

function shutdown() {
  server.close(async () => {
    await prisma.$disconnect()
    process.exit(0)
  })
  setTimeout(() => process.exit(1), 10_000).unref()
}
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

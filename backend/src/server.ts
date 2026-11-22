import { app } from './app.js'
import { closeDatabase } from './db.js'
import { describeEnv, env, isProduction } from './env.js'
import { logger, sanitizeError } from './lib/logger.js'

const server = app.listen(env.PORT, () => {
  logger.info('api.started', describeEnv())

  if (!isProduction && !process.env.SMTP_USER) {
    logger.warn('smtp.not_configured', { effect: 'submissions are saved but no emails are sent' })
  }
  if (isProduction && env.TRUST_PROXY === 0) {
    logger.warn('proxy.trust_disabled', {
      effect: 'rate limiting keys on the proxy IP; set TRUST_PROXY to the number of proxy hops',
    })
  }
})

/* Slowloris / resource-exhaustion guards. */
server.requestTimeout = Math.max(env.REQUEST_TIMEOUT_MS, 10_000)
server.headersTimeout = Math.max(5_000, Math.floor(server.requestTimeout / 2))
server.keepAliveTimeout = 5_000
server.maxHeadersCount = 100
server.maxRequestsPerSocket = 100

/* ------------------------------------------------------------------ */
/* Graceful shutdown                                                   */
/* ------------------------------------------------------------------ */

let shuttingDown = false

async function shutdown(signal: string) {
  if (shuttingDown) return
  shuttingDown = true
  logger.info('api.shutdown', { signal })

  // Hard deadline: never hang forever on a stuck connection.
  const force = setTimeout(() => {
    logger.error('api.shutdown_timeout')
    process.exit(1)
  }, 10_000)
  force.unref()

  server.close(async () => {
    await closeDatabase()
    clearTimeout(force)
    process.exit(0)
  })
}

process.on('SIGTERM', () => void shutdown('SIGTERM'))
process.on('SIGINT', () => void shutdown('SIGINT'))

/* Last-resort handlers: log redacted, then exit so the supervisor restarts a clean process. */
process.on('unhandledRejection', (reason) => {
  logger.error('process.unhandled_rejection', {
    error: sanitizeError(reason),
  })
})
process.on('uncaughtException', (error) => {
  logger.error('process.uncaught_exception', { error: sanitizeError(error) })
  void shutdown('uncaughtException')
})

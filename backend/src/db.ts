import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'
import { env, isProduction } from './env.js'
import { PrismaClient } from './generated/prisma/client.js'
import { logger, sanitizeError } from './lib/logger.js'

/**
 * Database connection hardening.
 *
 * - one bounded pool (never an unbounded connection storm);
 * - connect/statement/query timeouts so a stuck query cannot pin a request;
 * - TLS decided explicitly, and certificate verification is never silently disabled;
 * - Prisma logs errors only — `query` logging would write submitted PII to stdout;
 * - every value goes through Prisma's parameterised query builder, so the app never
 *   concatenates SQL. `$queryRaw` is used only for the constant `SELECT 1` health probe.
 */

const ssl =
  env.DB_SSL === 'require'
    ? { rejectUnauthorized: env.DB_SSL_VERIFY }
    : env.DB_SSL === 'disable'
      ? false
      : undefined // 'auto': let `sslmode` in DATABASE_URL decide

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  max: env.DB_POOL_MAX,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: env.DB_CONNECTION_TIMEOUT_MS,
  statement_timeout: env.DB_STATEMENT_TIMEOUT_MS,
  query_timeout: env.DB_STATEMENT_TIMEOUT_MS,
  application_name: 'jireh-api',
  allowExitOnIdle: false,
  ...(ssl === undefined ? {} : { ssl }),
})

pool.on('error', (err) => {
  // Idle-client errors must not crash the process (pg emits these on network loss).
  logger.error('db.idle_client_error', { error: sanitizeError(err) })
})

export const prisma = new PrismaClient({
  adapter: new PrismaPg(pool, {
    onPoolError: (err) => logger.error('db.pool_error', { error: sanitizeError(err) }),
    onConnectionError: (err) => logger.error('db.connection_error', { error: sanitizeError(err) }),
  }),
  // Never 'query': query logs contain the submitted values.
  log: isProduction ? ['error'] : ['warn', 'error'],
})

/** Health probe. Returns false instead of throwing so /api/health stays honest. */
export async function databaseIsHealthy(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`
    return true
  } catch (error) {
    logger.error('db.health_failed', { error: sanitizeError(error) })
    return false
  }
}

export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect().catch(() => undefined)
  await pool.end().catch(() => undefined)
}

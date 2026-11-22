import 'dotenv/config'
import { z } from 'zod'

/**
 * Environment + credential handling.
 *
 * Rules enforced here (fail closed, never fall back to a default secret):
 *  - every variable is parsed and range-checked once, at boot;
 *  - production refuses to start with a localhost CORS origin, a wildcard origin,
 *    a missing ADMIN_EMAIL/SMTP pair, or a non-TLS database connection;
 *  - nothing in this module ever logs a secret value (see `describeEnv`).
 */

const flag = (def: 'true' | 'false') =>
  z
    .enum(['true', 'false', '1', '0'])
    .default(def)
    .transform((v) => v === 'true' || v === '1')

const postgresUrl = z
  .string()
  .min(1, 'DATABASE_URL is required')
  .refine(
    (v) => /^postgres(ql)?:\/\/[^/\s]+/.test(v),
    'DATABASE_URL must be a postgresql:// connection string',
  )

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().min(1).max(65_535).default(4000),

  // Database
  DATABASE_URL: postgresUrl,
  DIRECT_URL: postgresUrl.optional(),
  DB_POOL_MAX: z.coerce.number().int().min(1).max(50).default(10),
  DB_CONNECTION_TIMEOUT_MS: z.coerce.number().int().min(500).max(60_000).default(10_000),
  DB_STATEMENT_TIMEOUT_MS: z.coerce.number().int().min(500).max(120_000).default(10_000),
  /** auto = honour `sslmode` in DATABASE_URL; require = force TLS; disable = plaintext (dev only). */
  DB_SSL: z.enum(['auto', 'require', 'disable']).default('auto'),
  DB_SSL_VERIFY: flag('true'),

  // Email. Every header-bearing value is checked here so the transport never
  // receives a host or address containing whitespace/control characters.
  SMTP_HOST: z
    .string()
    .min(1)
    .max(253)
    .regex(/^[A-Za-z0-9.:[\]-]+$/, 'SMTP_HOST must be a hostname with no spaces, paths or credentials')
    .default('smtp.gmail.com'),
  SMTP_PORT: z.coerce.number().int().min(1).max(65_535).default(587),
  SMTP_SECURE: flag('false'),
  SMTP_USER: z
    .string()
    .max(320)
    // oxlint-disable-next-line no-control-regex -- deliberately reject every ASCII control character in a header value
    .refine((v) => !/[\u0000-\u001F\u007F]/.test(v), 'SMTP_USER must not contain control characters')
    .optional(),
  SMTP_PASS: z.string().max(200).optional(),
  SMTP_FROM: z
    .string()
    .max(320)
    .refine((v) => {
      const address = v.match(/<([^<>]+)>/)?.[1] ?? v
      // oxlint-disable-next-line no-control-regex -- deliberately reject control characters in the header value
      return !/[\u0000-\u001F\u007F<>]/.test(v.replace(/<[^<>]*>$/, '')) && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)
    }, 'SMTP_FROM must be an address or "Name <address>" with no control characters')
    .optional(),
  ADMIN_EMAIL: z.string().email().default('the.masked.as@gmail.com'),

  // HTTP surface
  CORS_ORIGINS: z.string().default('http://localhost:5173'),
  TRUST_PROXY: z.coerce.number().int().min(0).max(10).default(0),
  MAX_BODY_KB: z.coerce.number().int().min(1).max(200).default(20),
  REQUEST_TIMEOUT_MS: z.coerce.number().int().min(1_000).max(120_000).default(15_000),
  /** Submissions faster than this (ms) are treated as bots. 0 disables the check. */
  HONEYPOT_MIN_MS: z.coerce.number().int().min(0).max(60_000).default(700),
  LOG_LEVEL: z.enum(['debug', 'info', 'warn', 'error', 'silent']).default('info'),
})

const parsed = schema.safeParse(process.env)
if (!parsed.success) {
  // Only field names + messages — never the offending values (they may be secrets).
  console.error('Invalid environment configuration:')
  for (const i of parsed.error.issues) console.error(`  ${i.path.join('.')}: ${i.message}`)
  process.exit(1)
}

export const env = parsed.data
export const isProduction = env.NODE_ENV === 'production'
export const isTest = env.NODE_ENV === 'test'

/* ------------------------------------------------------------------ */
/* CORS allow-list                                                     */
/* ------------------------------------------------------------------ */

function parseOrigins(raw: string): string[] {
  const out: string[] = []
  for (const part of raw.split(',')) {
    const value = part.trim().replace(/\/+$/, '')
    if (!value) continue

    if (value === '*') {
      console.error('CORS_ORIGINS must list explicit origins; "*" is not allowed.')
      process.exit(1)
    }

    let url: URL
    try {
      url = new URL(value)
    } catch {
      console.error(`CORS_ORIGINS entry is not a valid origin: ${value}`)
      process.exit(1)
    }

    if (url.protocol !== 'https:' && url.protocol !== 'http:') {
      console.error(`CORS_ORIGINS entry must be http(s): ${value}`)
      process.exit(1)
    }
    if (url.username || url.password) {
      console.error('CORS_ORIGINS entries must not embed credentials.')
      process.exit(1)
    }
    if (url.pathname !== '/' || url.search || url.hash) {
      console.error(`CORS_ORIGINS entry must be an origin only (no path/query): ${value}`)
      process.exit(1)
    }
    out.push(url.origin)
  }

  if (!out.length) {
    console.error('CORS_ORIGINS must contain at least one origin.')
    process.exit(1)
  }
  return out
}

export const corsOrigins = parseOrigins(env.CORS_ORIGINS)
export const corsOriginSet: ReadonlySet<string> = new Set(corsOrigins)
export const smtpConfigured = Boolean(env.SMTP_USER && env.SMTP_PASS)

/* ------------------------------------------------------------------ */
/* Production safety checks (fail closed)                              */
/* ------------------------------------------------------------------ */

const problems: string[] = []

// Implicit TLS (465) and STARTTLS (587) are mutually exclusive. Enforced in every
// environment: a mismatch would either fail at send time or, worse, be "fixed" by
// disabling TLS.
if (env.SMTP_SECURE && env.SMTP_PORT !== 465) {
  problems.push('SMTP_SECURE=true requires SMTP_PORT=465 (implicit TLS).')
}
if (!env.SMTP_SECURE && env.SMTP_PORT === 465) {
  problems.push('SMTP_PORT=465 requires SMTP_SECURE=true (implicit TLS).')
}

if (isProduction) {
  if (!smtpConfigured) problems.push('SMTP_USER and SMTP_PASS are required in production.')

  if (!process.env.ADMIN_EMAIL) {
    problems.push('ADMIN_EMAIL must be set explicitly in production (no default).')
  }

  const local = /^https?:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/i
  for (const origin of corsOrigins) {
    if (local.test(origin)) problems.push(`CORS_ORIGINS must not contain a local origin in production: ${origin}`)
    if (!origin.startsWith('https://')) problems.push(`CORS_ORIGINS must be https in production: ${origin}`)
  }

  const dbUrl = env.DATABASE_URL
  const isLocalDb = /@(localhost|127\.0\.0\.1|\[::1\])[:/]/.test(dbUrl)
  const hasTls = /[?&]sslmode=(require|verify-ca|verify-full)\b/.test(dbUrl) || env.DB_SSL === 'require'
  if (!isLocalDb && !hasTls) {
    problems.push('DATABASE_URL must use TLS in production (add sslmode=require or set DB_SSL=require).')
  }
  if (env.DB_SSL === 'require' && !env.DB_SSL_VERIFY) {
    problems.push('DB_SSL_VERIFY=false disables certificate checking; not allowed in production.')
  }
}

if (problems.length) {
  console.error('Unsafe configuration:')
  for (const p of problems) console.error(`  - ${p}`)
  process.exit(1)
}

/* ------------------------------------------------------------------ */
/* Safe, secret-free startup summary                                   */
/* ------------------------------------------------------------------ */

export function describeEnv(): Record<string, string | number | boolean> {
  return {
    nodeEnv: env.NODE_ENV,
    port: env.PORT,
    dbHost: safeDbHost(env.DATABASE_URL),
    dbSsl: env.DB_SSL,
    dbPoolMax: env.DB_POOL_MAX,
    corsOrigins: corsOrigins.join(','),
    trustProxy: env.TRUST_PROXY,
    smtpConfigured,
    smtpHost: env.SMTP_HOST,
    adminEmailConfigured: Boolean(env.ADMIN_EMAIL),
    logLevel: env.LOG_LEVEL,
  }
}

/** `postgresql://user:***@host:5432/db` -> `host:5432/db` (never the credentials). */
function safeDbHost(url: string): string {
  try {
    const u = new URL(url)
    return `${u.hostname}${u.port ? `:${u.port}` : ''}${u.pathname}`
  } catch {
    return 'invalid'
  }
}

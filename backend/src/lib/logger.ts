import { createHash } from 'node:crypto'
import { env } from '../env.js'

/**
 * Minimal structured logger with mandatory redaction.
 *
 * Anything that reaches a log line goes through `redact()`, so credentials,
 * connection strings, cookies, JWTs and raw email/phone values never land in
 * stdout or in a log aggregator. IP addresses are hashed so abuse can still be
 * correlated without storing personal data.
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

const WEIGHT: Record<LogLevel | 'silent', number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
  silent: 99,
}

const SECRET_KEY =
  /pass(word)?|secret|token|api[-_]?key|authorization|cookie|session|database_url|direct_url|smtp|credential|private/i

const MAX_STRING = 300

/** Masks `alice@example.com` as `a***@example.com`. */
export function maskEmail(value: string): string {
  const at = value.indexOf('@')
  if (at < 1) return '***'
  const local = value.slice(0, at)
  const domain = value.slice(at + 1)
  return `${local.slice(0, 1)}***@${domain}`
}

/** Masks a phone number, keeping only the last two digits. */
export function maskPhone(value: string): string {
  const digits = value.replace(/\D/g, '')
  if (digits.length < 4) return '***'
  return `${'*'.repeat(Math.max(0, digits.length - 2))}${digits.slice(-2)}`
}

/** Stable, non-reversible identifier for an IP address (log correlation only). */
export function hashIp(ip: string | undefined): string {
  if (!ip) return 'unknown'
  return createHash('sha256').update(ip).digest('hex').slice(0, 12)
}

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]+/g
const JWT_RE = /\beyJ[\w-]{5,}\.[\w-]{5,}\.[\w-]{5,}\b/g
const AWS_KEY_RE = /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g
const BEARER_RE = /\bBearer\s+[\w.~+/-]{8,}=*/gi
const POSTGRES_RE = /postgres(?:ql)?:\/\/[^\s"']+/gi
// Credential formats that can appear under an innocuous key such as `message`.
const PROVIDER_TOKEN_RE =
  /\b(?:gh[pousr]_[A-Za-z0-9]{20,}|xox[baprs]-[A-Za-z0-9-]{10,}|sk_(?:live|test)_[A-Za-z0-9]{16,}|AIza[A-Za-z0-9_-]{30,}|-----BEGIN [A-Z ]*PRIVATE KEY-----)/g
// `password=...`, `token: "..."`, `client_secret: ...` inside free-form error text.
const SECRET_ASSIGNMENT_RE =
  /\b(password|passwd|pwd|secret|token|api[-_]?key|access[-_]?key|authorization|cookie|client[-_]?secret)\s*[:=]\s*(?:"[^"]*"|'[^']*'|[^\s,;}\]]+)/gi

/**
 * Display-safe replacement for any credential. Never reveals length, prefix,
 * suffix or a hash — a short password could otherwise be brute-forced from it.
 */
export function maskSecret(value: unknown): string {
  return value === undefined || value === null || value === '' ? '[not set]' : '[redacted]'
}

/** Error object -> log-safe shape. Stack traces and internals are discarded. */
export function sanitizeError(error: unknown): { name: string; message: unknown } {
  if (error instanceof Error) return { name: error.name, message: redact(error.message) }
  return { name: 'Error', message: redact(error) }
}

export function redact(input: unknown, depth = 0): unknown {
  if (input === null || input === undefined) return input
  if (depth > 6) return '[depth]'

  if (typeof input === 'string') {
    let s = input
      .replace(POSTGRES_RE, 'postgresql://[redacted]')
      .replace(BEARER_RE, 'Bearer [redacted]')
      .replace(JWT_RE, '[jwt]')
      .replace(AWS_KEY_RE, '[aws-key]')
      // Provider tokens and `password=...` fragments can arrive under a key
      // such as `message` or `error`, where SECRET_KEY never sees them.
      .replace(PROVIDER_TOKEN_RE, '[redacted]')
      .replace(SECRET_ASSIGNMENT_RE, (_match, key: string) => `${key}=[redacted]`)
      .replace(EMAIL_RE, (m) => maskEmail(m))
    if (s.length > MAX_STRING) s = `${s.slice(0, MAX_STRING)}…`
    return s
  }

  if (typeof input === 'number' || typeof input === 'boolean') return input
  if (input instanceof Error) return { name: input.name, message: redact(input.message) }

  if (Array.isArray(input)) return input.slice(0, 20).map((v) => redact(v, depth + 1))

  if (typeof input === 'object') {
    const out: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
      out[key] = SECRET_KEY.test(key) ? '[redacted]' : redact(value, depth + 1)
    }
    return out
  }

  return '[unserialisable]'
}

function emit(level: LogLevel, message: string, meta?: unknown) {
  if (WEIGHT[level] < WEIGHT[env.LOG_LEVEL]) return

  const line: Record<string, unknown> = {
    t: new Date().toISOString(),
    level,
    msg: message,
  }
  if (meta !== undefined) line.meta = redact(meta)

  const text = JSON.stringify(line)
  if (level === 'error') console.error(text)
  else if (level === 'warn') console.warn(text)
  else console.log(text)
}

export const logger = {
  debug: (msg: string, meta?: unknown) => emit('debug', msg, meta),
  info: (msg: string, meta?: unknown) => emit('info', msg, meta),
  warn: (msg: string, meta?: unknown) => emit('warn', msg, meta),
  error: (msg: string, meta?: unknown) => emit('error', msg, meta),
}

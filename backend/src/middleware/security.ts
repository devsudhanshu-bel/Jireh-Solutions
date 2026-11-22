import { randomUUID } from 'node:crypto'
import type { ErrorRequestHandler, Request, RequestHandler, Response } from 'express'
import { env } from '../env.js'
import { HttpError } from '../lib/httpError.js'
import { hashIp, logger, sanitizeError } from '../lib/logger.js'

/* ------------------------------------------------------------------ */
/* Request identity + access log                                       */
/* ------------------------------------------------------------------ */

export const requestContext: RequestHandler = (req, res, next) => {
  const id = randomUUID()
  res.locals.requestId = id
  res.setHeader('X-Request-Id', id)

  if (env.NODE_ENV !== 'test') {
    const started = process.hrtime.bigint()
    res.on('finish', () => {
      const ms = Number(process.hrtime.bigint() - started) / 1e6
      // Path only: query strings can carry secrets and are never logged.
      logger.debug('http.request', {
        id,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        ms: Math.round(ms),
        ip: hashIp(req.ip),
      })
    })
  }
  next()
}

/** API responses are never cacheable (they are all dynamic). */
export const noStore: RequestHandler = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, max-age=0')
  res.setHeader('Pragma', 'no-cache')
  next()
}

/**
 * The API has no indexable content, so tell compliant crawlers not to store it.
 * Helmet does not provide this header; it is set on every response, not just 404s.
 */
export const noIndex: RequestHandler = (_req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  next()
}

/**
 * Permissions-Policy (formerly Feature-Policy). Helmet 8 has no middleware for
 * this, so keep one frozen value shared by the API and the static host.
 * Every feature not used by a JSON API (or by the marketing SPA) is disabled
 * for all origins, including frames.
 */
export const PERMISSIONS_POLICY = Object.freeze(
  [
    'accelerometer=()',
    'ambient-light-sensor=()',
    'autoplay=()',
    'battery=()',
    'camera=()',
    'display-capture=()',
    'document-domain=()',
    'encrypted-media=()',
    'gamepad=()',
    'geolocation=()',
    'gyroscope=()',
    'idle-detection=()',
    'interest-cohort=()',
    'local-fonts=()',
    'magnetometer=()',
    'manual=()',
    'microphone=()',
    'midi=()',
    'payment=()',
    'picture-in-picture=()',
    'publickey-credentials-create=()',
    'publickey-credentials-get=()',
    'screen-wake-lock=()',
    'serial=()',
    'speaker-selection=()',
    'storage-access=()',
    'usb=()',
    'web-share=()',
    'xr-spatial-tracking=()',
  ].join(', '),
)

export const permissionsPolicy: RequestHandler = (_req, res, next) => {
  res.setHeader('Permissions-Policy', PERMISSIONS_POLICY)
  next()
}

/* ------------------------------------------------------------------ */
/* CORS                                                                */
/* ------------------------------------------------------------------ */

/**
 * Rejects a request that carries a `Origin` header we did not allow *before*
 * it reaches any handler. Non-browser clients (no Origin) are unaffected —
 * CORS is a browser control, and the API never relies on cookies.
 */
export function corsGuard(allowed: ReadonlySet<string>): RequestHandler {
  return (req, res, next) => {
    const origin = req.headers.origin
    if (origin === undefined) return next()
    if (typeof origin === 'string' && allowed.has(origin)) return next()

    logger.warn('cors.denied', { origin, ip: hashIp(req.ip), path: req.path })
    res.status(403).json({ error: 'origin_not_allowed' })
  }
}

/* ------------------------------------------------------------------ */
/* Request body rules                                                  */
/* ------------------------------------------------------------------ */

const JSON_TYPES = ['application/json', 'application/*+json']

/** POST/PUT/PATCH must declare JSON; anything else is rejected with 415. */
export const requireJson: RequestHandler = (req, res, next) => {
  if (req.method !== 'POST') return next()
  if (req.is(JSON_TYPES)) return next()
  res.status(415).json({ error: 'unsupported_media_type' })
}

/** JSON.parse reviver: prototype-pollution keys are rejected outright. */
export function safeReviver(key: string, value: unknown): unknown {
  if (key === '__proto__' || key === 'prototype' || key === 'constructor') {
    throw new HttpError(400, 'invalid_payload')
  }
  return value
}

/**
 * Cheap structural guard on the raw body before it is parsed:
 * rejects absurd nesting (JSON bombs) and non-object roots.
 */
export function inspectJson(raw: string): void {
  let depth = 0
  let inString = false
  let escaped = false

  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (inString) {
      if (escaped) escaped = false
      else if (ch === '\\') escaped = true
      else if (ch === '"') inString = false
      continue
    }
    if (ch === '"') inString = true
    else if (ch === '{' || ch === '[') {
      depth++
      if (depth > 8) throw new HttpError(400, 'invalid_payload')
    } else if (ch === '}' || ch === ']') depth--
  }

  const first = raw.trimStart()[0]
  if (first !== '{') throw new HttpError(400, 'invalid_payload')
}

/* ------------------------------------------------------------------ */
/* 404 / 405                                                           */
/* ------------------------------------------------------------------ */

const HTML_404 = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>404 — Not Found</title>
<style>
  :root{color-scheme:light}
  body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f7f0d5;color:#2b2322;
       font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
  main{max-width:34rem;padding:2.5rem;text-align:center}
  p{color:#4b3f3b;line-height:1.6}
  code{background:#efe1b0;border-radius:.35rem;padding:.1rem .4rem}
  a{color:#0e7c86}
</style>
</head>
<body>
<main>
  <h1>404 — Not Found</h1>
  <p>The requested resource does not exist on this API.</p>
  <p>API routes live under <code>/api</code>. There are no public read endpoints.</p>
</main>
</body>
</html>`

export const notFoundHandler: RequestHandler = (req, res) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow')
  if (req.accepts(['json', 'html']) === 'html') {
    res.status(404).type('html').send(HTML_404)
    return
  }
  res.status(404).json({ error: 'not_found' })
}

/** Any method other than GET/POST/HEAD/OPTIONS on a known path is refused. */
export const methodNotAllowed: RequestHandler = (req, res) => {
  res.setHeader('Allow', 'GET, POST, HEAD, OPTIONS')
  res.status(405).json({ error: 'method_not_allowed' })
}

/* ------------------------------------------------------------------ */
/* Central error handler                                               */
/* ------------------------------------------------------------------ */

type BodyParserError = Error & { status?: number; statusCode?: number; type?: string }

/**
 * The single place where an error becomes a response.
 * Clients only ever see a stable machine code; details go to the log, redacted.
 */
export const errorHandler: ErrorRequestHandler = (err: BodyParserError, req: Request, res: Response, _next) => {
  const id = String(res.locals.requestId ?? 'unknown')

  if (res.headersSent) {
    // Nothing sane left to do; close the connection rather than leak a stack.
    req.destroy()
    return
  }

  // Our own errors carry an explicit, safe status/code.
  if (err instanceof HttpError) {
    if (err.headers) for (const [k, v] of Object.entries(err.headers)) res.setHeader(k, v)
    res.status(err.status).json({ error: err.code })
    return
  }

  const status = typeof err.status === 'number' ? err.status : typeof err.statusCode === 'number' ? err.statusCode : 500

  // body-parser / raw-body error taxonomy.
  if (err.type === 'entity.too.large' || status === 413) {
    res.status(413).json({ error: 'payload_too_large' })
    return
  }
  if (err.type === 'entity.verify.failed') {
    res.status(400).json({ error: 'invalid_payload' })
    return
  }
  if (err.type === 'entity.parse.failed' || err.name === 'SyntaxError') {
    res.status(400).json({ error: 'invalid_json' })
    return
  }
  if (err.type === 'encoding.unsupported' || err.type === 'charset.unsupported') {
    res.status(415).json({ error: 'unsupported_media_type' })
    return
  }
  if (err.type === 'request.aborted') {
    res.status(400).json({ error: 'request_aborted' })
    return
  }

  if (status >= 400 && status < 500) {
    res.status(status).json({ error: 'bad_request' })
    return
  }

  logger.error('unhandled_error', {
    id,
    method: req.method,
    path: req.path,
    error: sanitizeError(err),
  })
  res.status(500).json({ error: 'server_error', message: 'Something went wrong. Please try again later.' })
}

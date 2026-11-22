import cors from 'cors'
import express, { type RequestHandler } from 'express'
import helmet from 'helmet'
import { databaseIsHealthy } from './db.js'
import { corsOriginSet, env, isProduction } from './env.js'
import { apiLimiter } from './middleware/rateLimit.js'
import {
  corsGuard,
  errorHandler,
  inspectJson,
  methodNotAllowed,
  noIndex,
  noStore,
  notFoundHandler,
  permissionsPolicy,
  requestContext,
  requireJson,
  safeReviver,
} from './middleware/security.js'
import { submissions } from './routes/submissions.js'

export const app = express()

/* ------------------------------------------------------------------ */
/* Baseline                                                           */
/* ------------------------------------------------------------------ */

app.disable('x-powered-by')
app.set('etag', false) // dynamic responses; no validators to leak
app.set('json escape', true) // escapes <, >, & in JSON (HTML/XSSI hardening)
app.set('query parser', 'simple') // ?a[b]=c stays a string; no nested-object injection
if (env.TRUST_PROXY > 0) app.set('trust proxy', env.TRUST_PROXY)

app.use(requestContext)

/* ------------------------------------------------------------------ */
/* Security headers                                                   */
/* ------------------------------------------------------------------ */

/**
 * Every header recommended by the OWASP HTTP Headers Cheat Sheet is set
 * explicitly here rather than relying on Helmet defaults, so a dependency
 * upgrade cannot silently drop one. `X-XSS-Protection: 0` is intentional:
 * the legacy auditor is known to *introduce* XSS in some browsers.
 *
 * Deliberately absent: Expect-CT and Public-Key-Pins (deprecated), and
 * `Set-Cookie` (this API has no sessions and never authenticates a browser).
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: false,
      directives: {
        'default-src': ["'none'"],
        'base-uri': ["'none'"],
        'form-action': ["'none'"],
        'frame-ancestors': ["'none'"],
        'object-src': ["'none'"],
        'script-src': ["'none'"],
        'script-src-attr': ["'none'"],
        'connect-src': ["'none'"],
        'img-src': ["'none'"],
        'font-src': ["'none'"],
        'media-src': ["'none'"],
        'manifest-src': ["'none'"],
        'worker-src': ["'none'"],
        'child-src': ["'none'"],
        // Only the built-in HTML 404 page needs a stylesheet.
        'style-src': ["'unsafe-inline'"],
        'upgrade-insecure-requests': [],
      },
    },
    crossOriginEmbedderPolicy: { policy: 'require-corp' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-site' },
    referrerPolicy: { policy: 'no-referrer' },
    xFrameOptions: { action: 'deny' },
    xContentTypeOptions: true,
    xDnsPrefetchControl: { allow: false },
    xDownloadOptions: true,
    xPermittedCrossDomainPolicies: { permittedPolicies: 'none' },
    xPoweredBy: true,
    xXssProtection: true,
    originAgentCluster: true,
    // Two years + subdomains makes the API ineligible for downgrade; `preload`
    // signals intent only. Submit the apex domain to hstspreload.org only once
    // the whole zone is confirmed HTTPS (the SPA already sends `preload`).
    hsts: isProduction ? { maxAge: 63_072_000, includeSubDomains: true, preload: true } : false,
  }),
)
app.use(permissionsPolicy)
app.use(noIndex)

/* ------------------------------------------------------------------ */
/* CORS: explicit allow-list, denied origins fail closed              */
/* ------------------------------------------------------------------ */

app.use(corsGuard(corsOriginSet))
app.use(
  cors({
    // Only allow-listed origins reach this point (see corsGuard), so reflecting is safe.
    origin: true,
    methods: ['GET', 'POST', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Accept'],
    exposedHeaders: ['X-Request-Id', 'Retry-After', 'RateLimit', 'RateLimit-Policy'],
    credentials: false,
    maxAge: 600,
    optionsSuccessStatus: 204,
  }),
)

/* ------------------------------------------------------------------ */
/* API envelope                                                       */
/* ------------------------------------------------------------------ */

app.use('/api', noStore)
app.use('/api', requireJson)
app.use('/api', apiLimiter)

app.use(
  express.json({
    limit: `${env.MAX_BODY_KB}kb`,
    strict: true, // only objects/arrays, never `"string"` or `123`
    type: ['application/json', 'application/*+json'],
    reviver: safeReviver, // rejects __proto__ / constructor / prototype keys
    verify: (_req, _res, buf) => {
      // Runs before parsing: caps nesting depth and enforces an object root.
      if (buf.length) inspectJson(buf.toString('utf8'))
    },
  }),
)

/* ------------------------------------------------------------------ */
/* Routes                                                             */
/* ------------------------------------------------------------------ */

app.get('/api/health', async (_req, res) => {
  const healthy = await databaseIsHealthy()
  res.status(healthy ? 200 : 503).json({ status: healthy ? 'ok' : 'unavailable' })
})

// Only these two write endpoints exist. There are deliberately no read/list/admin routes.
app.use('/api', submissions)

// A read attempt on a write endpoint is indistinguishable from a missing route.
const writeOnly: RequestHandler = (req, res, next) => {
  if (req.method === 'GET' || req.method === 'HEAD') return notFoundHandler(req, res, next)
  return methodNotAllowed(req, res, next)
}
app.all('/api/enquiries', writeOnly)
app.all('/api/bookings', writeOnly)
app.all('/api/health', methodNotAllowed)

app.use('/api', notFoundHandler)
app.use(notFoundHandler)

/* ------------------------------------------------------------------ */
/* Errors last                                                        */
/* ------------------------------------------------------------------ */

app.use(errorHandler)

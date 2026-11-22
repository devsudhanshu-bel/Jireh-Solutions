import rateLimit from 'express-rate-limit'
import type { RequestHandler } from 'express'

/**
 * Two layers of rate limiting:
 *  - a broad per-IP budget for the whole API (cheap, stops scanning/flooding);
 *  - a tight per-IP budget per form endpoint (each submission can send two emails).
 *
 * The default key generator is used on purpose: it normalises IPv6 addresses to a
 * /56 subnet, so one host cannot rotate through addresses to bypass the limit.
 * TRUST_PROXY must be set to the real proxy hop count for `req.ip` to be correct.
 *
 * Counters live in memory, which is correct for the single-container deployment in
 * docker-compose.yml. Behind multiple replicas, point `store` at Redis so limits
 * are shared.
 */

const handler: RequestHandler = (_req, res) => {
  res.status(429).json({
    error: 'rate_limited',
    message: 'Too many submissions. Please try again later.',
  })
}

export const apiLimiter = rateLimit({
  windowMs: 15 * 60_000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
  skip: (req) => req.method === 'OPTIONS',
})

export const submitLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler,
  skip: (req) => req.method === 'OPTIONS',
})

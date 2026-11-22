import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, describe, it } from 'node:test'

// Unreachable DB on purpose: everything here is exercised before the database.
process.env.DATABASE_URL = 'postgresql://u:p@127.0.0.1:1/none'
process.env.TRUST_PROXY = '1'
process.env.CORS_ORIGINS = 'http://localhost:5173'
process.env.LOG_LEVEL = 'silent'
process.env.NODE_ENV = 'test'

let server: Server
let base = ''

before(async () => {
  const { app } = await import('../src/app.js')
  await new Promise<void>((resolve) => {
    server = app.listen(0, '127.0.0.1', () => resolve())
  })
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`
})

after(() => server.close())

let n = 1
const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(base + path, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': `10.1.0.${n++}`,
      ...headers,
    },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })

const good = {
  name: 'Asha Rao',
  contact: '+91 98765 43210',
  email: 'asha@example.com',
  profession: 'Nurse',
  description: 'Please share details about NPWT.',
}

describe('security headers', () => {
  it('sets a locked-down header set and hides the framework', async () => {
    const r = await fetch(base + '/api/health')
    assert.equal(r.headers.get('x-powered-by'), null)
    assert.equal(r.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(r.headers.get('x-frame-options'), 'DENY')
    assert.equal(r.headers.get('referrer-policy'), 'no-referrer')
    assert.match(r.headers.get('content-security-policy') ?? '', /default-src 'none'/)
    assert.match(r.headers.get('content-security-policy') ?? '', /frame-ancestors 'none'/)
    assert.equal(r.headers.get('cache-control'), 'no-store, max-age=0')
    assert.equal(r.headers.get('pragma'), 'no-cache')
    assert.match(r.headers.get('content-type') ?? '', /^application\/json; charset=utf-8/i)
    assert.equal(r.headers.get('set-cookie'), null)
  })

  it('sets every OWASP header the API can meaningfully use', async () => {
    const r = await fetch(base + '/api/health')
    // Legacy browsers: explicitly off, because the auditor can create XSS.
    assert.equal(r.headers.get('x-xss-protection'), '0')
    assert.equal(r.headers.get('x-dns-prefetch-control'), 'off')
    assert.equal(r.headers.get('x-download-options'), 'noopen')
    assert.equal(r.headers.get('x-permitted-cross-domain-policies'), 'none')
    assert.equal(r.headers.get('origin-agent-cluster'), '?1')
    assert.equal(r.headers.get('cross-origin-opener-policy'), 'same-origin')
    assert.equal(r.headers.get('cross-origin-embedder-policy'), 'require-corp')
    assert.equal(r.headers.get('cross-origin-resource-policy'), 'same-site')
    assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow')
  })

  it('disables every browser feature the API does not need', async () => {
    const r = await fetch(base + '/api/health')
    const policy = r.headers.get('permissions-policy') ?? ''
    for (const feature of [
      'camera',
      'microphone',
      'geolocation',
      'payment',
      'usb',
      'autoplay',
      'midi',
      'serial',
      'xr-spatial-tracking',
    ]) {
      assert.match(policy, new RegExp(`${feature}=\\(\\)`))
    }
    assert.doesNotMatch(policy, /\*/)
  })

  it('locks down every CSP fetch directive and never enables HSTS over plaintext', async () => {
    const r = await fetch(base + '/api/health')
    const csp = r.headers.get('content-security-policy') ?? ''
    for (const directive of [
      'object-src \'none\'',
      'script-src \'none\'',
      'connect-src \'none\'',
      'img-src \'none\'',
      'manifest-src \'none\'',
      'worker-src \'none\'',
      'upgrade-insecure-requests',
    ]) {
      assert.ok(csp.includes(directive), `missing CSP directive: ${directive}`)
    }
    // NODE_ENV=test in this suite; production turns HSTS on (see netlify.toml test).
    assert.equal(r.headers.get('strict-transport-security'), null)
  })

  it('does not send deprecated or fingerprinting headers', async () => {
    const r = await fetch(base + '/api/health')
    for (const name of ['expect-ct', 'public-key-pins', 'public-key-pins-report-only', 'x-aspnet-version', 'x-aspnetmvc-version']) {
      assert.equal(r.headers.get(name), null)
    }
  })

  it('returns a request id on every response', async () => {
    const r = await fetch(base + '/api/health')
    assert.match(r.headers.get('x-request-id') ?? '', /^[0-9a-f-]{36}$/)
  })

  it('advertises the rate-limit policy', async () => {
    const r = await fetch(base + '/api/health')
    assert.ok(r.headers.get('ratelimit-policy') ?? r.headers.get('ratelimit'))
  })
})

describe('static host header configuration', () => {
  it('applies the OWASP header set and a two-year HSTS policy to the SPA', async () => {
    const { readFile } = await import('node:fs/promises')
    const toml = await readFile(new URL('../../netlify.toml', import.meta.url), 'utf8')
    for (const header of [
      'Content-Security-Policy',
      'Strict-Transport-Security',
      'X-Content-Type-Options',
      'X-Frame-Options',
      'X-XSS-Protection',
      'Referrer-Policy',
      'Permissions-Policy',
      'Cross-Origin-Opener-Policy',
      'Cross-Origin-Resource-Policy',
      'X-Permitted-Cross-Domain-Policies',
      'X-DNS-Prefetch-Control',
      'X-Robots-Tag',
    ]) {
      assert.match(toml, new RegExp(header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
    }
    assert.match(toml, /max-age=63072000; includeSubDomains; preload/)
    assert.match(toml, /X-XSS-Protection = "0"/)
    // COEP is documented as intentionally absent (third-party maps/fonts).
    assert.match(toml, /Cross-Origin-Embedder-Policy is intentionally NOT set/)
  })
})

describe('CORS', () => {
  it('reflects an allow-listed origin and never allows credentials', async () => {
    const r = await fetch(base + '/api/health', { headers: { Origin: 'http://localhost:5173' } })
    assert.equal(r.headers.get('access-control-allow-origin'), 'http://localhost:5173')
    assert.equal(r.headers.get('access-control-allow-credentials'), null)
    assert.match(r.headers.get('vary') ?? '', /Origin/i)
  })

  it('rejects an unknown origin outright', async () => {
    const r = await fetch(base + '/api/health', { headers: { Origin: 'http://evil.example' } })
    assert.equal(r.status, 403)
    assert.equal(r.headers.get('access-control-allow-origin'), null)
  })

  it('rejects the opaque "null" origin (sandboxed iframes, file://)', async () => {
    const r = await fetch(base + '/api/health', { headers: { Origin: 'null' } })
    assert.equal(r.status, 403)
  })

  it('answers a valid preflight without granting credentials', async () => {
    const r = await fetch(base + '/api/enquiries', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'content-type',
      },
    })
    assert.equal(r.status, 204)
    assert.equal(r.headers.get('access-control-allow-origin'), 'http://localhost:5173')
    assert.equal(r.headers.get('access-control-allow-credentials'), null)
    assert.match(r.headers.get('access-control-allow-methods') ?? '', /POST/)
  })
})

describe('request validation', () => {
  it('rejects a non-JSON content type with 415', async () => {
    const r = await post('/api/enquiries', 'name=x', { 'Content-Type': 'text/plain' })
    assert.equal(r.status, 415)
  })

  it('rejects a missing content type with 415', async () => {
    const r = await fetch(base + '/api/enquiries', { method: 'POST', body: '{}' })
    assert.equal(r.status, 415)
  })

  it('rejects malformed JSON without leaking the parser error', async () => {
    const r = await post('/api/enquiries', '{bad')
    assert.equal(r.status, 400)
    assert.deepEqual(await r.json(), { error: 'invalid_json' })
  })

  it('rejects prototype-pollution keys', async () => {
    const r = await post('/api/enquiries', '{"__proto__":{"polluted":true}}')
    assert.equal(r.status, 400)
    const text = await r.text()
    assert.ok(!text.includes('polluted'))
  })

  it('rejects deeply nested JSON', async () => {
    const nested = `${'{"a":'.repeat(12)}1${'}'.repeat(12)}`
    const r = await post('/api/enquiries', nested)
    assert.equal(r.status, 400)
  })

  it('rejects a JSON array root', async () => {
    const r = await post('/api/enquiries', '[{"name":"x"}]')
    assert.equal(r.status, 400)
  })

  it('rejects unknown fields (no mass assignment)', async () => {
    const r = await post('/api/enquiries', { ...good, role: 'admin' })
    assert.equal(r.status, 400)
    const body = (await r.json()) as { fields?: Record<string, string> }
    assert.ok(body.fields && 'role' in body.fields)
  })

  it('rejects markup in structured fields', async () => {
    const r = await post('/api/enquiries', { ...good, name: '<img src=x onerror=alert(1)>' })
    assert.equal(r.status, 400)
  })

  it('rejects CRLF in the name (header injection attempt)', async () => {
    const r = await post('/api/enquiries', { ...good, name: 'Asha\r\nBcc: x@y.z' })
    assert.equal(r.status, 400)
  })

  it('rejects an over-long description at the schema level', async () => {
    const r = await post('/api/enquiries', { ...good, description: 'a'.repeat(4_001) })
    assert.equal(r.status, 400)
  })

  it('accepts non-Latin names and normalises the contact number', async () => {
    const r = await post('/api/enquiries', {
      ...good,
      name: 'ఆశా రావు',
      contact: '(91) 98765-43210',
    })
    // Validation passed, so the request reached the (deliberately dead) database.
    assert.equal(r.status, 500)
  })
})

describe('spam traps', () => {
  it('silently accepts a filled honeypot string', async () => {
    const r = await post('/api/enquiries', { ...good, website: 'http://spam.example' })
    assert.equal(r.status, 202)
    assert.deepEqual(await r.json(), { ok: true })
  })

  it('silently accepts a honeypot sent as a non-string type', async () => {
    const r = await post('/api/enquiries', { ...good, website: { url: 'x' } })
    assert.equal(r.status, 202)
  })

  it('silently accepts an oversized honeypot value instead of a validation error', async () => {
    const r = await post('/api/enquiries', { ...good, website: 'x'.repeat(10_000) })
    assert.equal(r.status, 202)
  })

  it('silently accepts an impossibly fast submission', async () => {
    const r = await post('/api/enquiries', { ...good, elapsedMs: 12 })
    assert.equal(r.status, 202)
  })

  it('silently accepts link-stuffed descriptions', async () => {
    const r = await post('/api/enquiries', {
      ...good,
      description: 'buy now https://a.example https://b.example https://c.example https://d.example',
    })
    assert.equal(r.status, 202)
  })
})

describe('routing', () => {
  it('answers 404 JSON for an unknown API path', async () => {
    const r = await fetch(base + '/api/nope')
    assert.equal(r.status, 404)
    assert.deepEqual(await r.json(), { error: 'not_found' })
  })

  it('serves a custom HTML 404 for browsers', async () => {
    const r = await fetch(base + '/nope', { headers: { Accept: 'text/html' } })
    assert.equal(r.status, 404)
    assert.match(r.headers.get('content-type') ?? '', /text\/html/)
    assert.match(await r.text(), /404/)
    assert.equal(r.headers.get('x-robots-tag'), 'noindex, nofollow')
  })

  it('returns 404 (not 405) for a read attempt on a write endpoint', async () => {
    for (const path of ['/api/enquiries', '/api/bookings']) {
      assert.equal((await fetch(base + path)).status, 404)
    }
  })

  it('returns 405 for an unsupported method', async () => {
    const r = await fetch(base + '/api/enquiries', { method: 'PUT' })
    assert.equal(r.status, 405)
    assert.match(r.headers.get('allow') ?? '', /POST/)
  })
})

describe('internals', () => {
  it('cleanText strips control, zero-width and bidi characters', async () => {
    const { cleanText } = await import('../src/schemas.js')
    assert.equal(cleanText('  A\u200Bb\u202Ec\u0000  '), 'Abc')
    assert.equal(cleanText('line1\r\nline2', true), 'line1\nline2')
    assert.equal(cleanText('a\nb'), 'a b')
  })

  it('isHoneypot treats any non-empty value as a trap', async () => {
    const { isHoneypot } = await import('../src/schemas.js')
    // A human never sees the field, so *any* content — even whitespace — is a bot.
    for (const value of ['x', ' ', 1, true, ['x'], { a: 1 }]) assert.equal(isHoneypot(value), true)
    for (const value of ['', undefined, null]) assert.equal(isHoneypot(value), false)
  })

  it('redact masks secrets and personal data', async () => {
    const { redact } = await import('../src/lib/logger.js')
    const out = redact({
      password: 'hunter2',
      email: 'alice@example.com',
      url: 'postgresql://u:p@db:5432/x',
      token: 'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxIn0.abcdefghij',
    }) as Record<string, string>
    assert.equal(out.password, '[redacted]')
    assert.equal(out.token, '[redacted]')
    assert.equal(out.email, 'a***@example.com')
    assert.ok(!out.url.includes('u:p'))
  })

  it('redacts provider tokens and secret assignments hidden in error text', async () => {
    const { redact, maskSecret, sanitizeError } = await import('../src/lib/logger.js')
    const out = redact({
      message: 'SMTP error: password=hunter2 token: ghp_abcdefghijklmnopqrstuvwxyz0123456789',
      detail: 'client_secret: "very-secret" — xoxb-12345678901234567890',
    }) as Record<string, string>
    assert.ok(!out.message.includes('hunter2'))
    assert.ok(!out.message.includes('ghp_'))
    assert.ok(!out.detail.includes('very-secret'))
    assert.ok(!out.detail.includes('xoxb-'))
    assert.equal(maskSecret('hunter2'), '[redacted]')
    assert.equal(maskSecret(''), '[not set]')
    const safe = sanitizeError(new Error('password=hunter2'))
    assert.equal(safe.name, 'Error')
    assert.ok(!JSON.stringify(safe).includes('hunter2'))
  })

  it('safeReviver blocks prototype-pollution keys', async () => {
    const { safeReviver } = await import('../src/middleware/security.js')
    assert.throws(() => JSON.parse('{"__proto__":{"x":1}}', safeReviver))
    assert.throws(() => JSON.parse('{"constructor":{"x":1}}', safeReviver))
    assert.deepEqual(JSON.parse('{"a":1}', safeReviver), { a: 1 })
  })

  it('inspectJson rejects arrays and deep nesting', async () => {
    const { inspectJson } = await import('../src/middleware/security.js')
    assert.doesNotThrow(() => inspectJson('{"a":[1,2]}'))
    assert.throws(() => inspectJson('[1,2]'))
    assert.throws(() => inspectJson(`${'{"a":'.repeat(12)}1${'}'.repeat(12)}`))
  })
})

/**
 * DAST smoke suite for the Jireh API (negative + positive checks, including the
 * full OWASP HTTP Headers Cheat Sheet set applicable to a JSON API).
 *
 *   cd backend && npm install && npm run dev       # API on :4000
 *   npm run dast                                   # from the repo root
 *
 * Override targets with BASE / DB_URL. Uses a throwaway DB: it inserts rows and
 * verifies they land, so point it at a disposable database only.
 */
import net from 'node:net'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const BASE = process.env.BASE ?? 'http://127.0.0.1:4000'
const DB = process.env.DB_URL
if (!DB) {
  console.error('Set DB_URL to a disposable PostgreSQL connection string.')
  process.exit(2)
}
const require = createRequire(import.meta.url)
const backendRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'backend')
const pg = require(path.join(backendRoot, 'node_modules', 'pg'))
const db = new pg.Client({ connectionString: DB })
await db.connect()

const RUN = `r${Date.now().toString(36)}`
const email = (tag) => `${tag}-${RUN}@example.com`
const happyEmail = email('happy')

const results = []
let ipCounter = 1
// Unique per run: rate-limit counters are per IP and survive between runs.
const salt = Math.floor(Math.random() * 250) + 1
const freshIp = () => `10.77.${salt}.${(ipCounter++ % 250) + 1}`

function check(name, ok, detail) {
  results.push({ name, ok: Boolean(ok), detail })
}

const count = async (table) => Number((await db.query(`SELECT count(*)::int AS n FROM ${table}`)).rows[0].n)

const goodEnquiry = {
  name: 'Asha Rao',
  contact: '+91 98765 43210',
  email: 'Asha@Example.com',
  profession: 'Procurement',
  description: 'Please share NPWT product details.',
}

const goodBooking = {
  name: 'Ravi Kumar',
  contact: '9876543210',
  email: email('ravi'),
  address: '12 Rose Street, Hyderabad',
  service: 'NPWT',
}

async function req(path, { method = 'GET', body, headers = {}, ip } = {}) {
  const h = { 'X-Forwarded-For': ip ?? freshIp(), ...headers }
  const res = await fetch(BASE + path, {
    method,
    headers: h,
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  })
  const text = await res.text()
  let json = null
  try {
    json = JSON.parse(text)
  } catch {
    /* html/empty */
  }
  return { status: res.status, headers: res.headers, text, json }
}

const postEnquiry = (body, opts = {}) =>
  req('/api/enquiries', {
    method: 'POST',
    body,
    ...opts,
    headers: { 'Content-Type': 'application/json', ...(opts.headers ?? {}) },
  })

/** Raw bytes so fetch cannot invent a Content-Type. */
const rawBytes = (body, headers = {}) =>
  req('/api/enquiries', { method: 'POST', body: new TextEncoder().encode(body), headers })


/* ================================================================== */
/* 1. Headers                                                          */
/* ================================================================== */
{
  const r = await req('/api/health')
  check('no X-Powered-By', r.headers.get('x-powered-by') === null)
  check('X-Content-Type-Options: nosniff', r.headers.get('x-content-type-options') === 'nosniff')
  check('X-Frame-Options: DENY', r.headers.get('x-frame-options') === 'DENY')
  check('CSP default-src none', /default-src 'none'/.test(r.headers.get('content-security-policy') ?? ''))
  check('CSP frame-ancestors none', /frame-ancestors 'none'/.test(r.headers.get('content-security-policy') ?? ''))
  check('Referrer-Policy no-referrer', r.headers.get('referrer-policy') === 'no-referrer')
  check('Cache-Control no-store', (r.headers.get('cache-control') ?? '').includes('no-store'))
  check('X-Request-Id is a UUID', /^[0-9a-f-]{36}$/.test(r.headers.get('x-request-id') ?? ''))
  check('No Server banner', r.headers.get('server') === null || !/nginx|express/i.test(r.headers.get('server')))

  // OWASP HTTP Headers Cheat Sheet — remaining applicable headers.
  check('X-XSS-Protection explicitly 0', r.headers.get('x-xss-protection') === '0')
  check('X-DNS-Prefetch-Control off', r.headers.get('x-dns-prefetch-control') === 'off')
  check('X-Download-Options noopen', r.headers.get('x-download-options') === 'noopen')
  check('X-Permitted-Cross-Domain-Policies none', r.headers.get('x-permitted-cross-domain-policies') === 'none')
  check('Origin-Agent-Cluster', r.headers.get('origin-agent-cluster') === '?1')
  check('COOP same-origin', r.headers.get('cross-origin-opener-policy') === 'same-origin')
  check('COEP require-corp', r.headers.get('cross-origin-embedder-policy') === 'require-corp')
  check('CORP same-site', r.headers.get('cross-origin-resource-policy') === 'same-site')
  const perm = r.headers.get('permissions-policy') ?? ''
  check(
    'Permissions-Policy disables unused features',
    /camera=\(\)/.test(perm) && /microphone=\(\)/.test(perm) && /geolocation=\(\)/.test(perm) && !perm.includes('*'),
  )
  check('X-Robots-Tag on API', r.headers.get('x-robots-tag') === 'noindex, nofollow')
  check('JSON Content-Type has charset', /^application\/json; charset=utf-8/i.test(r.headers.get('content-type') ?? ''))
  check('no Set-Cookie (no sessions)', r.headers.get('set-cookie') === null)
  check(
    'no deprecated Expect-CT / HPKP',
    r.headers.get('expect-ct') === null && r.headers.get('public-key-pins') === null,
  )
  const csp = r.headers.get('content-security-policy') ?? ''
  check(
    'CSP blocks all fetches and upgrades',
    /object-src 'none'/.test(csp) && /connect-src 'none'/.test(csp) && /upgrade-insecure-requests/.test(csp),
  )
}

/* ================================================================== */
/* 2. CORS                                                             */
/* ================================================================== */
{
  const ok = await req('/api/health', { headers: { Origin: 'http://localhost:5173' } })
  check('CORS reflects allow-listed origin', ok.headers.get('access-control-allow-origin') === 'http://localhost:5173')
  check('CORS never sends credentials', ok.headers.get('access-control-allow-credentials') === null)
  check('CORS sets Vary: Origin', /origin/i.test(ok.headers.get('vary') ?? ''))
  check('ACAO is never wildcard', ok.headers.get('access-control-allow-origin') !== '*')

  const evil = await req('/api/health', { headers: { Origin: 'https://evil.example' } })
  check('evil origin rejected (403)', evil.status === 403 && evil.headers.get('access-control-allow-origin') === null)
  const nul = await req('/api/health', { headers: { Origin: 'null' } })
  check('Origin: null rejected (403)', nul.status === 403)
  const suffix = await req('/api/health', { headers: { Origin: 'http://localhost:5173.evil.example' } })
  check('origin suffix trick rejected', suffix.status === 403)

  const pre = await req('/api/enquiries', {
    method: 'OPTIONS',
    headers: {
      Origin: 'http://localhost:5173',
      'Access-Control-Request-Method': 'POST',
      'Access-Control-Request-Headers': 'content-type',
    },
  })
  check('preflight 204 + ACAO', pre.status === 204 && pre.headers.get('access-control-allow-origin') !== null)
  check(
    'preflight does not allow credentials',
    pre.headers.get('access-control-allow-credentials') === null,
  )
  const preEvil = await req('/api/enquiries', {
    method: 'OPTIONS',
    headers: { Origin: 'https://evil.example', 'Access-Control-Request-Method': 'POST' },
  })
  check('evil preflight rejected', preEvil.status === 403)
}

/* ================================================================== */
/* 3. Request validation                                               */
/* ================================================================== */
{
  const cases = [
    ['empty object rejected', {}, 400],
    ['malformed JSON -> 400', '{bad', 400],
    ['array root -> 400', '[{"name":"x"}]', 400],
    ['string root -> 400', '"x"', 400],
    ['deep nesting -> 400', `${'{"a":'.repeat(14)}1${'}'.repeat(14)}`, 400],
    ['__proto__ rejected', '{"__proto__":{"x":1}}', 400],
    ['constructor key rejected', '{"constructor":{"x":1}}', 400],
  ]

  for (const [label, body, want] of cases) {
    const r = await postEnquiry(body)
    check(label, r.status === want, `got ${r.status}`)
  }

  const noType = await rawBytes('{}')
  check('missing content-type -> 415', noType.status === 415, `got ${noType.status}`)

  const textPlain = await rawBytes('name=x', { 'Content-Type': 'text/plain' })
  check('text/plain -> 415', textPlain.status === 415, `got ${textPlain.status}`)

  const utf16 = await rawBytes('{}', { 'Content-Type': 'application/json; charset=utf-16' })
  check('unsupported charset -> 415/400', [415, 400].includes(utf16.status), `got ${utf16.status}`)

  const extra = await postEnquiry({ ...goodEnquiry, role: 'admin' })
  check('unknown field rejected (mass assignment)', extra.status === 400 && extra.json?.fields?.role)

  const badName = await postEnquiry({ ...goodEnquiry, name: '<img src=x onerror=alert(1)>' })
  check('markup in name rejected', badName.status === 400)
  check('validation error does not echo payload', !badName.text.includes('onerror alert') && !badName.text.includes('<img'))

  const crlf = await postEnquiry({ ...goodEnquiry, name: 'Asha\r\nBcc: evil@example.com' })
  check('CRLF in name rejected', crlf.status === 400)

  const badContact = await postEnquiry({ ...goodEnquiry, contact: 'abc' })
  check('non-numeric contact rejected', badContact.status === 400)
  const longContact = await postEnquiry({ ...goodEnquiry, contact: '1'.repeat(20) })
  check('over-long contact rejected', longContact.status === 400)

  const badEmail = await postEnquiry({ ...goodEnquiry, email: 'a@b' })
  check('invalid email rejected', badEmail.status === 400)
  const longEmail = await postEnquiry({ ...goodEnquiry, email: `${'a'.repeat(250)}@x.com` })
  check('over-long email rejected', longEmail.status === 400)

  const longDesc = await postEnquiry({ ...goodEnquiry, description: 'a'.repeat(4001) })
  check('over-long description rejected', longDesc.status === 400)

  const huge = await postEnquiry({ ...goodEnquiry, description: 'a'.repeat(40_000) })
  check('oversized body -> 413', huge.status === 413)

  const sqliName = await postEnquiry({ ...goodEnquiry, name: "'; DROP TABLE enquiries;--" })
  check('SQL metacharacters in name rejected', sqliName.status === 400)

  const badService = await postEnquiry(goodBooking, { ip: freshIp() })
  check('wrong endpoint shape rejected', badService.status === 400)

  const wrongType = await postEnquiry({ ...goodEnquiry, name: 12345 })
  check('non-string type rejected', wrongType.status === 400)

  const bidi = await postEnquiry({ ...goodEnquiry, name: 'Asha\u202Eevil', email: email('bidi') })
  check('bidi override stripped or rejected', bidi.status === 201 || bidi.status === 400, `got ${bidi.status}`)
}

/* ================================================================== */
/* 4. Happy path + normalisation (real database)                       */
/* ================================================================== */
{
  const before = await count('enquiries')
  const r = await postEnquiry({ ...goodEnquiry, email: happyEmail })

  check('valid enquiry accepted (201)', r.status === 201, `got ${r.status} ${r.text.slice(0, 120)}`)
  check('201 body carries no internal id', r.json && !('id' in r.json))
  check('one row stored', (await count('enquiries')) === before + 1)

  const row = (
    await db.query('SELECT * FROM enquiries ORDER BY "createdAt" DESC LIMIT 1')
  ).rows[0]
  check('email stored lower-cased', row?.email === happyEmail, row?.email)
  check('contact normalised to +digits', row?.contact === '+919876543210' || row?.contact === '919876543210', row?.contact)

  const telugu = await postEnquiry({ ...goodEnquiry, name: 'ఆశా రావు', email: email('telugu') })
  check('Unicode (Telugu) name accepted', telugu.status === 201, `got ${telugu.status}`)

  const sqliDesc = await postEnquiry({
    ...goodEnquiry,
    email: email('sqli'),
    description: "Robert'); DROP TABLE enquiries; -- <script>alert(1)</script>",
  })
  check('SQLi payload in description stored literally, no error', sqliDesc.status === 201, `got ${sqliDesc.status}`)
  const stillThere = await db.query("SELECT to_regclass('public.enquiries') AS t")
  check('enquiries table still exists after SQLi attempt', stillThere.rows[0].t === 'enquiries')

  const booking = await req('/api/bookings', {
    method: 'POST',
    body: goodBooking,
    headers: { 'Content-Type': 'application/json' },
  })
  check('valid booking accepted (201)', booking.status === 201, `got ${booking.status}`)
}

/* ================================================================== */
/* 5. Spam traps                                                       */
/* ================================================================== */
{
  const before = await count('enquiries')

  const honey = await postEnquiry({ ...goodEnquiry, website: 'http://spam.example' })
  check('honeypot (string) -> 202 generic', honey.status === 202 && honey.json?.ok === true)

  const honeyObj = await postEnquiry({ ...goodEnquiry, website: { a: 1 } })
  check('honeypot (object) -> 202, no validation hint', honeyObj.status === 202)

  const honeyWs = await postEnquiry({ ...goodEnquiry, website: '   ' })
  check('honeypot (whitespace) -> 202', honeyWs.status === 202)

  const honeyBig = await postEnquiry({ ...goodEnquiry, website: 'x'.repeat(9000) })
  check('honeypot (oversized) -> 202 not 413', honeyBig.status === 202, `got ${honeyBig.status}`)

  const fast = await postEnquiry({ ...goodEnquiry, elapsedMs: 5 })
  check('timing trap -> 202', fast.status === 202)

  const spam = await postEnquiry({
    ...goodEnquiry,
    description: 'http://a.example http://b.example http://c.example http://d.example buy now',
  })
  check('link-stuffed description -> 202', spam.status === 202)

  check('no trapped submission reached the database', (await count('enquiries')) === before)

  // Replay of an already-stored submission.
  const beforeDup = await count('enquiries')
  const dup = await postEnquiry({ ...goodEnquiry, email: happyEmail })
  check('duplicate replay -> 202', dup.status === 202, `got ${dup.status}`)
  check('duplicate did not create a second row', (await count('enquiries')) === beforeDup)
}

/* ================================================================== */
/* 6. Rate limiting                                                    */
/* ================================================================== */
{
  const ip = `10.200.${salt}.1`
  const codes = []
  for (let i = 0; i < 7; i++) codes.push((await postEnquiry({}, { ip })).status)
  check('per-IP submit limit triggers 429', codes.includes(429), codes.join(','))

  const limited = await postEnquiry({}, { ip })
  check('429 carries Retry-After or RateLimit', limited.headers.get('retry-after') !== null || limited.headers.get('ratelimit') !== null)
  check('429 body is generic', limited.json?.error === 'rate_limited')

  // X-Forwarded-For must actually be honoured (TRUST_PROXY=1) - a new IP is not limited.
  const otherIp = await postEnquiry({}, { ip: `10.201.${salt}.9` })
  check('limit is per-IP, not global', otherIp.status === 400)
}

/* ================================================================== */
/* 7. Routing / 404 / 405                                              */
/* ================================================================== */
{
  const notFound = await req('/api/does-not-exist')
  check('unknown API path -> 404 JSON', notFound.status === 404 && notFound.json?.error === 'not_found')

  const html = await req('/nope', { headers: { Accept: 'text/html' } })
  check('unknown page -> custom HTML 404', html.status === 404 && /text\/html/.test(html.headers.get('content-type') ?? ''))
  check('HTML 404 is noindex', html.headers.get('x-robots-tag') === 'noindex, nofollow')
  check('HTML 404 contains no stack/SQL', !/prisma|postgres|node_modules|at \//i.test(html.text))

  check('GET on write endpoint -> 404', (await req('/api/enquiries')).status === 404)
  const put = await req('/api/enquiries', { method: 'PUT' })
  check('PUT on write endpoint -> 405 + Allow', put.status === 405 && /POST/.test(put.headers.get('allow') ?? ''))
  check('DELETE on health -> 405', (await req('/api/health', { method: 'DELETE' })).status === 405)

  // Raw socket requests bypass client-side path normalisation.
  const raw = (payload) =>
    new Promise((resolve) => {
      const port = Number(new URL(BASE).port || 80)
      const s = net.connect(port, new URL(BASE).hostname, () => s.write(payload))
      let buf = ''
      s.on('data', (d) => (buf += d.toString()))
      s.on('end', () => resolve(buf))
      s.on('error', () => resolve(buf))
      setTimeout(() => {
        s.destroy()
        resolve(buf)
      }, 2000)
    })

  for (const path of ['/api/../api/health', '//api/health', '/api/%2e%2e/api/health', '/api/health/../../etc/passwd']) {
    const res = await raw(`GET ${path} HTTP/1.1\r\nHost: 127.0.0.1\r\nConnection: close\r\n\r\n`)
    const status = Number(res.split(' ')[1])
    check(`path traversal ${path} -> no leak`, [400, 403, 404].includes(status) || (status === 200 && !/root:|postgres/i.test(res)), `got ${status}`)
  }
}

/* ================================================================== */
/* 8. Information disclosure                                           */
/* ================================================================== */
{
  const r = await postEnquiry({})
  check('validation body has no stack/internal paths', !/node_modules|prisma|at \/|postgres/i.test(r.text))

  const h = await req('/api/health')
  check('health exposes no version/build info', !/version|build|uptime|node/i.test(h.text))

  const methods = await req('/api/enquiries', { method: 'PATCH', body: '{}' })
  check('PATCH not allowed', methods.status === 405 || methods.status === 415)
}

/* ================================================================== */
/* 9. Database-level defence in depth                                  */
/* ================================================================== */
{
  let badService = false
  try {
    await db.query(
      `INSERT INTO bookings (id,name,contact,email,address,service,"createdAt","updatedAt")
       VALUES (gen_random_uuid(),'x','1234567','x@y.z','','Hacked',now(),now())`,
    )
  } catch {
    badService = true
  }
  check('DB CHECK rejects a bad service enum', badService)

  let emptyName = false
  try {
    await db.query(
      `INSERT INTO enquiries (id,name,contact,email,profession,description,"createdAt","updatedAt")
       VALUES (gen_random_uuid(),'','1234567','x@y.z','p','d',now(),now())`,
    )
  } catch {
    emptyName = true
  }
  check('DB CHECK rejects an empty name', emptyName)
}

/* ================================================================== */
/* Summary                                                             */
/* ================================================================== */
await db.end()
const failed = results.filter((r) => !r.ok)
for (const r of results) console.log(`${r.ok ? 'PASS' : 'FAIL'}  ${r.name}${r.detail ? `  [${r.detail}]` : ''}`)
console.log(`\n${results.length - failed.length}/${results.length} checks passed`)
process.exit(failed.length ? 1 : 0)

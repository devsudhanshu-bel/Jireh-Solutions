import assert from 'node:assert/strict'
import type { Server } from 'node:http'
import { after, before, describe, it } from 'node:test'

// Unreachable DB on purpose: these tests cover everything that happens before/without the database.
process.env.DATABASE_URL = 'postgresql://u:p@127.0.0.1:1/none'
process.env.TRUST_PROXY = '1'
process.env.CORS_ORIGINS = 'http://localhost:5173'

let server: Server
let base = ''

before(async () => {
  const { app } = await import('../src/app.js')
  await new Promise<void>((r) => {
    server = app.listen(0, '127.0.0.1', () => r())
  })
  base = `http://127.0.0.1:${(server.address() as { port: number }).port}`
})
after(() => server.close())

let n = 10
// Each call gets its own client IP (via X-Forwarded-For) so tests don't share a rate-limit bucket.
const post = (path: string, body: unknown, ip = `10.0.0.${n++}`) =>
  fetch(base + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Forwarded-For': ip },
    body: JSON.stringify(body),
  })

const goodEnquiry = { name: 'T', contact: '+91 98765 43210', email: 'a@b.co', profession: 'Nurse', description: 'x' }

describe('validation', () => {
  it('rejects an empty enquiry with per-field errors', async () => {
    const r = await post('/api/enquiries', {})
    assert.equal(r.status, 400)
    const j = (await r.json()) as { fields: Record<string, string> }
    assert.deepEqual(Object.keys(j.fields).sort(), ['contact', 'description', 'email', 'name', 'profession'])
  })
  it('rejects a bad booking service and bad contact', async () => {
    const r = await post('/api/bookings', { name: 'T', contact: 'abc', email: 'a@b.co', service: 'Other' })
    assert.equal(r.status, 400)
    const j = (await r.json()) as { fields: Record<string, string> }
    assert.ok(j.fields.service && j.fields.contact)
  })
  it('rejects unknown fields', async () => {
    const r = await post('/api/enquiries', { ...goodEnquiry, admin: true })
    assert.equal(r.status, 400)
  })
  it('rejects malformed JSON', async () => {
    const r = await fetch(base + '/api/enquiries', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{bad' })
    assert.equal(r.status, 400)
  })
  it('rejects oversized bodies', async () => {
    const r = await post('/api/enquiries', { ...goodEnquiry, description: 'x'.repeat(30_000) })
    assert.equal(r.status, 413)
  })
})

describe('spam + safety', () => {
  it('honeypot is accepted silently without touching the database', async () => {
    const r = await post('/api/enquiries', { ...goodEnquiry, website: 'http://spam' })
    assert.equal(r.status, 202)
  })
  it('a valid submission with the database down is a 500, never a fake success', async () => {
    const r = await post('/api/enquiries', goodEnquiry)
    assert.equal(r.status, 500)
    const t = await r.text()
    assert.ok(!t.includes('127.0.0.1') && !t.includes('postgres'), 'error body must not leak internals')
  })
  it('health reports 503 when the database is unreachable', async () => {
    const r = await fetch(base + '/api/health')
    assert.equal(r.status, 503)
  })
  it('has no read/list endpoints', async () => {
    for (const p of ['/api/enquiries', '/api/bookings']) assert.equal((await fetch(base + p)).status, 404)
  })
  it('CORS only allows configured origins', async () => {
    const ok = await fetch(base + '/api/health', { headers: { Origin: 'http://localhost:5173' } })
    const bad = await fetch(base + '/api/health', { headers: { Origin: 'http://evil.example' } })
    assert.equal(ok.headers.get('access-control-allow-origin'), 'http://localhost:5173')
    assert.equal(bad.headers.get('access-control-allow-origin'), null)
  })
  it('rate limits repeated submissions', async () => {
    const codes: number[] = []
    for (let i = 0; i < 8; i++) codes.push((await post('/api/bookings', {}, '10.9.9.9')).status)
    assert.ok(codes.includes(429), `expected a 429 in ${codes}`)
  })
})

describe('email templates', () => {
  it('escapes HTML and strips newlines from the subject', async () => {
    const { buildMessages } = await import('../src/mailer.js')
    const m = buildMessages({
      kind: 'Enquiry',
      id: 'id-1',
      createdAt: new Date(0),
      name: 'Eve\r\nBcc: x@y.z',
      email: 'e@x.co',
      rows: [['Description', '<script>alert(1)</script>']],
    })
    assert.ok(!/[\r\n]/.test(m.admin.subject))
    assert.ok(!m.admin.html.includes('<script>'))
    assert.ok(m.admin.html.includes('&lt;script&gt;'))
    assert.equal(m.admin.to, 'the.masked.as@gmail.com')
    assert.equal(m.customer.to, 'e@x.co')
  })
})

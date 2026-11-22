import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { describe, it } from 'node:test'
import nodemailer from 'nodemailer'

process.env.DATABASE_URL = 'postgresql://u:p@127.0.0.1:1/none'
const { buildMessages, transportOptions } = await import('../src/mailer.js')

const backendDir = new URL('..', import.meta.url).pathname

/** Boot env.ts in a child process; it exits(1) on any unsafe configuration. */
function runEnv(overrides: Record<string, string>) {
  const result = spawnSync(process.execPath, ['--import', 'tsx', 'src/env.ts'], {
    cwd: backendDir,
    env: {
      PATH: process.env.PATH ?? '',
      HOME: process.env.HOME ?? '',
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://u:p@127.0.0.1:1/none',
      CORS_ORIGINS: 'http://localhost:5173',
      ADMIN_EMAIL: 'admin@example.com',
      SMTP_HOST: 'smtp.example.com',
      SMTP_PORT: '587',
      SMTP_USER: 'sender@example.com',
      SMTP_PASS: 'not-a-real-password',
      ...overrides,
    },
    encoding: 'utf8',
  })
  return { status: result.status, output: `${result.stdout ?? ''}${result.stderr ?? ''}` }
}

describe('SMTP transport security', () => {
  it('verifies the server certificate and enforces a modern TLS floor', () => {
    assert.equal(transportOptions.tls.rejectUnauthorized, true)
    assert.equal(transportOptions.tls.minVersion, 'TLSv1.2')
  })

  it('requires STARTTLS on a submission port (never sends credentials in cleartext)', () => {
    assert.equal(transportOptions.secure, false)
    assert.equal(transportOptions.requireTLS, true)
  })

  it('disables Nodemailer file and URL loaders', () => {
    assert.equal(transportOptions.disableFileAccess, true)
    assert.equal(transportOptions.disableUrlAccess, true)
  })

  it('bounds all network timeouts', () => {
    for (const key of ['connectionTimeout', 'greetingTimeout', 'socketTimeout'] as const) {
      assert.ok(transportOptions[key] > 0 && transportOptions[key] <= 30_000, key)
    }
  })

  it('attaches no credentials when SMTP is not configured', () => {
    assert.equal(transportOptions.auth, undefined)
  })
})

describe('SMTP header safety', () => {
  const hostile = {
    kind: 'Enquiry' as const,
    id: 'header-test',
    createdAt: new Date(),
    name: 'A\r\nBcc: victim@example.com',
    email: 'a@example.com\r\nX-Injected: yes',
    rows: [['Name', 'x']] as [string, string][],
  }

  it('strips CR/LF from every header-bearing field', () => {
    const messages = buildMessages(hostile)
    for (const message of [messages.admin, messages.customer]) {
      for (const field of ['from', 'to', 'replyTo', 'subject'] as const) {
        assert.ok(!/[\r\n]/.test(String(message[field])), field)
      }
    }
  })

  it('produces no injected headers in the rendered MIME message', async () => {
    const messages = buildMessages(hostile)
    const transport = nodemailer.createTransport({ streamTransport: true, buffer: true })
    const raw = (await transport.sendMail(messages.admin)).message.toString()
    const headerBlock = raw.slice(0, raw.search(/\r?\n\r?\n/))
    assert.ok(!/(^|\r?\n)(Bcc|X-Injected):/m.test(headerBlock))
  })

  it('suppresses out-of-office loops on both messages', () => {
    const messages = buildMessages(hostile)
    for (const message of [messages.admin, messages.customer]) {
      assert.equal(message.headers['X-Auto-Response-Suppress'], 'OOF, AutoReply, Notification')
    }
  })
})

describe('SMTP configuration gate', () => {
  it('rejects port 465 without SMTP_SECURE', () => {
    const r = runEnv({ SMTP_PORT: '465' })
    assert.equal(r.status, 1)
    assert.match(r.output, /SMTP_PORT=465 requires SMTP_SECURE=true/)
  })

  it('rejects SMTP_SECURE on a STARTTLS port', () => {
    const r = runEnv({ SMTP_SECURE: 'true', SMTP_PORT: '587' })
    assert.equal(r.status, 1)
    assert.match(r.output, /SMTP_SECURE=true requires SMTP_PORT=465/)
  })

  it('rejects a host containing credentials or spaces', () => {
    const r = runEnv({ SMTP_HOST: 'user:pass@smtp.example.com' })
    assert.equal(r.status, 1)
    assert.match(r.output, /SMTP_HOST/)
  })

  it('rejects a FROM address with control characters', () => {
    const r = runEnv({ SMTP_FROM: 'A\r\nBcc: x@example.com <sender@example.com>' })
    assert.equal(r.status, 1)
    assert.match(r.output, /SMTP_FROM/)
  })

  it('accepts a correctly paired configuration', () => {
    const r = runEnv({})
    assert.equal(r.status, 0, r.output)
  })
})

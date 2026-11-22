import assert from 'node:assert/strict'
import { mkdirSync, writeFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import nodemailer from 'nodemailer'

process.env.DATABASE_URL = 'postgresql://u:p@127.0.0.1:1/none'
const { buildMessages } = await import('../src/mailer.js')
const { LOGO_CID, esc: escapeHtml } = await import('../src/emailTemplates.js')

const enquiry = {
  kind: 'Enquiry' as const,
  id: '3f0c2a52-7d1e-4b8a-9c11-0a5e6d7f8b90',
  createdAt: new Date('2026-11-21T09:34:00Z'),
  name: "Dr. A <b>O'Neil</b> & Co",
  email: 'dr.a@example.com',
  rows: [
    ['Name', "Dr. A <b>O'Neil</b> & Co"],
    ['Contact No.', '+91 98765 43210'],
    ['Email', 'dr.a@example.com'],
    ['Profession', 'Surgeon'],
    ['Description', 'Line one\nLine two <script>alert(1)</script>'],
  ] as [string, string][],
}
const booking = {
  kind: 'Booking' as const,
  id: '9b1deb4d-3b7d-4bad-9bdd-2b0d7b3dcb6d',
  createdAt: new Date('2026-11-21T09:34:00Z'),
  name: 'Asha Rao',
  email: 'asha@example.com',
  rows: [
    ['Name', 'Asha Rao'],
    ['Contact No.', '9876543210'],
    ['Email', 'asha@example.com'],
    ['Address', '12 Rose Street\nHyderabad'],
    ['Service', 'Advanced Dressing'],
  ] as [string, string][],
}

const mime = nodemailer.createTransport({ streamTransport: true, buffer: true })
const send = async (msg: object) => (await mime.sendMail(msg)).message.toString()

const adminCases = [
  ['admin enquiry', buildMessages(enquiry).admin, enquiry],
  ['admin booking', buildMessages(booking).admin, booking],
] as const

const customerCases = [
  ['customer enquiry', buildMessages(enquiry).customer, enquiry],
  ['customer booking', buildMessages(booking).customer, booking],
] as const

// Dump renderings for visual inspection (path is passed in by the caller, optional).
if (process.env.EMAIL_PREVIEW_DIR) {
  mkdirSync(process.env.EMAIL_PREVIEW_DIR, { recursive: true })
  for (const [n, m] of [...adminCases, ...customerCases]) {
    writeFileSync(`${process.env.EMAIL_PREVIEW_DIR}/${n.replace(' ', '-')}.html`, m.html.replace(`cid:${LOGO_CID}`, 'logo.png'))
  }
}

describe('email templates', () => {
  for (const [name, m, data] of adminCases) {
    describe(name, () => {
      it('embeds the logo via CID with a matching inline attachment', async () => {
        assert.ok(m.html.includes(`src="cid:${LOGO_CID}"`))
        assert.equal(m.attachments.length, 1)
        assert.equal(m.attachments[0]!.cid, LOGO_CID)
        // Logo bytes are embedded at boot; Nodemailer never reads a path at send time.
        assert.ok(Buffer.isBuffer(m.attachments[0]!.content))
        assert.ok(m.attachments[0]!.content.length > 1000)
        const raw = await send(m)
        assert.ok(raw.includes(`Content-ID: <${LOGO_CID}>`))
        assert.match(raw, /Content-Disposition: inline/)
        assert.match(raw, /Content-Type: image\/png/)
        assert.match(raw, /multipart\/related/)
      })
      it('uses no external, localhost or relative image URLs', () => {
        const srcs = [...m.html.matchAll(/src="([^"]+)"/g)].map((x) => x[1])
        assert.deepEqual(srcs, [`cid:${LOGO_CID}`])
        assert.ok(!/localhost|\.\.\//.test(m.html))
      })
      it('is table-based with inline CSS and a mobile query', () => {
        assert.match(m.html, /<table role="presentation"/)
        assert.match(m.html, /style="[^"]*background/)
        assert.match(m.html, /@media only screen and \(max-width:620px\)/)
        assert.match(m.html, /name="viewport"/)
      })
      it('shows every form field label and value (escaped) in html and text', () => {
        for (const [label, value] of data.rows) {
          assert.ok(m.html.includes(label), `html label ${label}`)
          const escaped = value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;').replace(/\n/g, '<br>')
          assert.ok(m.html.includes(escaped) || m.html.includes(`>${value}</a>`), `html value ${label}`)
          assert.ok(m.text.includes(`${label}: ${value}`), `text ${label}`)
        }
        assert.ok(!m.html.includes('<script>') && !m.html.includes('<b>'))
      })
      it('includes reference id and date/time in IST', () => {
        assert.ok(m.html.includes(data.id) && m.text.includes(`Reference: ${data.id}`))
        assert.ok(m.html.includes('21 Nov 2026, 3:04 pm IST'))
        assert.ok(m.text.includes('3:04 pm IST'))
      })
      it('makes phone and email clickable', () => {
        const tel = data.rows[1]![1].replace(/[^\d+]/g, '')
        assert.ok(m.html.includes(`href="tel:${tel}"`))
        assert.ok(m.html.includes(`href="mailto:${data.email}"`))
      })
      it('has a clean plain-text fallback', () => {
        assert.ok(!/<[a-z/][^>]*>/i.test(m.text.replace(/<script>alert\(1\)<\/script>|<\/?b>/g, '')))
        assert.ok(!/&(amp|lt|gt|quot|#39);/.test(m.text))
        assert.ok(m.text.length > 200)
      })
      it('builds a multipart/alternative message with text and html parts', async () => {
        const raw = await send(m)
        assert.match(raw, /multipart\/alternative/)
        assert.match(raw, /Content-Type: text\/plain/)
        assert.match(raw, /Content-Type: text\/html/)
      })
    })
  }

  for (const [name, m, data] of customerCases) {
    describe(name, () => {
      it('is a plain acknowledgement: no logo, image or attachment', () => {
        assert.equal(m.attachments.length, 0)
        assert.ok(!/src=|cid:/.test(m.html))
      })
      it('greets the customer with an HTML-escaped name', () => {
        assert.ok(m.html.includes(`Dear ${escapeHtml(data.name)},`), 'escaped greeting')
        assert.ok(!m.html.includes('<script>'))
      })
      it('has a clean plain-text fallback', () => {
        // Customer-typed markup is reproduced verbatim in plain text; the template adds no tags.
        assert.ok(m.text.length > 200)
        assert.ok(!/&(amp|lt|gt|quot|#39);/.test(m.text))
        assert.ok(m.text.startsWith('Dear '))
      })
      it('builds a multipart/alternative message with text and html parts', async () => {
        const raw = await send(m)
        assert.match(raw, /multipart\/alternative/)
        assert.match(raw, /Content-Type: text\/plain/)
        assert.match(raw, /Content-Type: text\/html/)
      })
    })
  }

  it('routes mail to the right people', () => {
    const e = buildMessages(enquiry)
    assert.equal(e.admin.to, 'the.masked.as@gmail.com')
    assert.equal(e.admin.replyTo, 'dr.a@example.com')
    assert.equal(e.customer.to, 'dr.a@example.com')
    assert.ok(!/[\r\n]/.test(e.admin.subject) && !/[\r\n]/.test(e.customer.subject))
  })

  it('never implies a booking is confirmed', () => {
    const b = buildMessages(booking)
    for (const m of [b.customer, b.admin]) {
      assert.ok(!/booking confirmed|appointment is confirmed/i.test(m.subject + m.text))
    }
    assert.ok(!/confirm/i.test(b.customer.subject))
    assert.ok(/not yet confirmed/i.test(b.customer.text))
    assert.match(b.customer.subject, /appointment request/i)
  })

  it('does not mention appointments in enquiry emails', () => {
    const e = buildMessages(enquiry)
    assert.ok(!/appointment/i.test(e.customer.html + e.customer.text + e.admin.html + e.admin.text))
  })

  it('admin emails have call/email action buttons', () => {
    const a = buildMessages(booking).admin
    assert.ok(a.html.includes('Email customer') && a.html.includes('Call customer'))
    assert.ok(!buildMessages(booking).customer.html.includes('Call customer'))
  })
})

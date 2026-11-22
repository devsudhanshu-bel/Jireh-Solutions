
export type Kind = 'Enquiry' | 'Booking'
export type Audience = 'admin' | 'customer'
export type Row = [label: string, value: string]

export interface EmailData {
  kind: Kind
  id: string
  createdAt: Date
  name: string
  email: string
  rows: Row[]
}

export const LOGO_CID = 'jireh-logo@jirehhealthcare'

const COMPANY = {
  name: 'Jireh Healthcare Solutions',
  email: 'info@jirehhealthcaresolutions.com',
  address: [
    '1-2-365/26/C, 2nd Floor, Ramakrishna Math Road,',
    'Domalguda, Himayathnagar,',
    'Hyderabad, Telangana State, India – 500029',
  ],
}

const C = {
  page: '#f7f0d5',
  card: '#fef9ef',
  espresso: '#2b2322',
  heading: '#3a1f17',
  ink: '#4b3f3b',
  soft: '#6b5d57',
  teal: '#0e7c86',
  gold: '#f0d27a',
  line: '#efe1b0',
}

const SANS = "Arial,'Helvetica Neue',Helvetica,sans-serif"
const SERIF = "Georgia,'Times New Roman',serif"

export const esc = (s: string) =>
  s.replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')

const unesc = (s: string) =>
  s.replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')

export const oneLine = (s: string) =>
  s
    // oxlint-disable-next-line no-control-regex -- intentionally stripping every control char
    .replace(/[\u0000-\u001F\u007F]+/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()

export function formatWhen(d: Date) {
  const s = new Intl.DateTimeFormat('en-IN', {
    timeZone: 'Asia/Kolkata',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d)

  return `${s} IST`
}

const telHref = (v: string) =>
  `tel:${v.replace(/[^\d+]/g, '')}`

const kindOfRow = (label: string): 'tel' | 'mail' | 'text' =>
  /^contact/i.test(label)
    ? 'tel'
    : /^email/i.test(label)
      ? 'mail'
      : 'text'

function valueHtml(label: string, value: string) {
  if (!value.trim()) {
    return `<span style="color:${C.soft}">&mdash;</span>`
  }

  const k = kindOfRow(label)

  const link = (href: string) =>
    `<a href="${esc(href)}" style="color:${C.teal};text-decoration:underline">${esc(value)}</a>`

  if (k === 'tel') return link(telHref(value))
  if (k === 'mail') return link(`mailto:${value.trim()}`)

  return esc(value).replace(/\r?\n/g, '<br>')
}

function fieldsHtml(rows: Row[]) {
  return rows
    .map(
      ([label, value], i) =>
        `<tr><td style="padding:14px 0;${i ? `border-top:1px solid ${C.line};` : ''}">` +
        `<div style="font-family:${SANS};font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${C.teal};font-weight:bold;padding-bottom:4px">${esc(label)}</div>` +
        `<div style="font-family:${SANS};font-size:16px;line-height:24px;color:${C.heading};word-break:break-word">${valueHtml(label, value)}</div>` +
        `</td></tr>`,
    )
    .join('')
}

function fieldsText(rows: Row[]) {
  return rows
    .map(([label, value]) => `${label}: ${value.trim() || '-'}`)
    .join('\n')
}

interface Copy {
  subject: string
  preheader: string
  badge: string
  title: string
  intro: string
  fieldsHeading: string
  closing: string
}

/* ======================================================
   CUSTOMER EMAILS
   Plain, professional acknowledgement.
   No logo, no image, no address, no attachments.
====================================================== */

function renderCustomerAcknowledgement(d: EmailData) {
  const name = oneLine(d.name) || 'there'
  const isBooking = d.kind === 'Booking'

  const subject = isBooking
    ? 'Appointment Request Received - Jireh Healthcare Solutions'
    : 'Thank You for Contacting Jireh Healthcare Solutions'

  const message = isBooking
    ? 'Thank you for contacting Jireh Healthcare Solutions. We have received your appointment request. Our team will review the details and get in touch with you shortly to discuss and confirm your appointment.'
    : 'Thank you for getting in touch with Jireh Healthcare Solutions. We have received your enquiry and appreciate your interest in our services. Our team will review your message and get back to you shortly.'

  const additionalNote = isBooking
    ? 'Please note that your appointment is not yet confirmed. Our team will contact you to discuss and confirm the details.'
    : 'If you have any questions or require further assistance, please feel free to contact us.'

  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>${esc(subject)}</title>
</head>
<body style="margin:0;padding:20px;background:#ffffff;font-family:Arial,Helvetica,sans-serif;color:#333333;">

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
    <tr>
      <td align="center">

        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0"
          style="width:100%;max-width:600px;">

          <tr>
            <td style="font-size:15px;line-height:26px;padding-bottom:16px;">
              Dear ${esc(name)},
            </td>
          </tr>

          <tr>
            <td style="font-size:15px;line-height:26px;padding-bottom:16px;">
              ${esc(message)}
            </td>
          </tr>

          <tr>
            <td style="font-size:15px;line-height:26px;padding-bottom:20px;">
              ${esc(additionalNote)}
            </td>
          </tr>

          <tr>
            <td style="font-size:15px;line-height:26px;padding-bottom:20px;">
              Thank you once again for considering Jireh Healthcare Solutions.
              We look forward to assisting you.
            </td>
          </tr>

          <tr>
            <td style="font-size:15px;line-height:25px;padding-bottom:20px;">
              Best regards,<br>
              <strong>Team Jireh Healthcare Solutions</strong>
            </td>
          </tr>

          <tr>
            <td style="padding-top:16px;border-top:1px solid #eeeeee;font-size:13px;line-height:22px;color:#666666;">
              For further assistance, contact us at:<br>
              <a href="mailto:${COMPANY.email}" style="color:${C.teal};text-decoration:none;">
                ${COMPANY.email}
              </a>
            </td>
          </tr>

        </table>

      </td>
    </tr>
  </table>

</body>
</html>`

  const text = [
    `Dear ${name},`,
    '',
    message,
    '',
    additionalNote,
    '',
    'Thank you once again for considering Jireh Healthcare Solutions. We look forward to assisting you.',
    '',
    'Best regards,',
    'Team Jireh Healthcare Solutions',
    '',
    'For further assistance, contact us at:',
    COMPANY.email,
  ].join('\n')

  return { subject, html, text }
}

/* ======================================================
   ADMIN EMAILS
   Existing branded notification design is retained.
====================================================== */

function adminCopy(kind: Kind, name: string): Copy {
  const n = oneLine(name)

  return kind === 'Enquiry'
    ? {
        subject: `New enquiry from ${n}`,
        preheader: `New website enquiry from ${n}.`,
        badge: 'New enquiry',
        title: 'A new enquiry has arrived',
        intro: 'Someone submitted the Enquiry form on the website. Their details are below.',
        fieldsHeading: 'Enquiry details',
        closing: `Reply to this email to respond to ${esc(n)} directly.`,
      }
    : {
        subject: `New appointment request from ${n}`,
        preheader: `New appointment request from ${n}.`,
        badge: 'New appointment request',
        title: 'A new appointment request has arrived',
        intro: 'Someone submitted the Book an Appointment form on the website. This is a request only: contact them to arrange and confirm a time.',
        fieldsHeading: 'Request details',
        closing: `Reply to this email to respond to ${esc(n)} directly.`,
      }
}

/* ======================================================
   MAIN EMAIL RENDERER
====================================================== */

export function renderEmail(
  audience: Audience,
  d: EmailData,
): { subject: string; html: string; text: string } {

  if (audience === 'customer') {
    return renderCustomerAcknowledgement(d)
  }

  const c = adminCopy(d.kind, d.name)
  const when = formatWhen(d.createdAt)

  const meta: Row[] = [
    ['Reference', d.id],
    ['Received', when],
  ]

  const metaHtml =
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px;background:${C.page};border-radius:10px"><tr>` +
    meta
      .map(
        ([label, value]) =>
          `<td class="stack" valign="top" style="padding:12px 16px;font-family:${SANS}">` +
          `<div style="font-size:11px;letter-spacing:1.2px;text-transform:uppercase;color:${C.soft}">${esc(label)}</div>` +
          `<div style="font-size:13px;line-height:20px;color:${C.heading};word-break:break-all">${esc(value)}</div></td>`,
      )
      .join('') +
    '</tr></table>'

  const contactRow = d.rows.find(
    ([label]) => kindOfRow(label) === 'tel',
  )

  const button = (href: string, label: string, filled: boolean) =>
    `<td style="padding:0 10px 10px 0"><a href="${esc(href)}" style="display:inline-block;font-family:${SANS};font-size:14px;font-weight:bold;text-decoration:none;padding:11px 22px;border-radius:999px;` +
    (filled
      ? `background:${C.heading};color:#ffffff;border:2px solid ${C.heading}`
      : `color:${C.heading};border:2px solid ${C.heading}`) +
    `">${esc(label)}</a></td>`

  const actions =
    `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:24px"><tr>` +
    button(`mailto:${d.email}`, 'Email customer', true) +
    (contactRow
      ? button(telHref(contactRow[1]), 'Call customer', false)
      : '') +
    '</tr></table>'

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light">
<title>${esc(c.subject)}</title>
<style>
@media only screen and (max-width:620px){
  .container{width:100%!important}
  .pad{padding-left:20px!important;padding-right:20px!important}
  .stack{display:block!important;width:100%!important;box-sizing:border-box}
  .h1{font-size:24px!important;line-height:30px!important}
}
</style>
</head>

<body style="margin:0;padding:0;background:${C.page};-webkit-text-size-adjust:100%">

<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${C.page};font-size:1px;line-height:1px">${esc(c.preheader)}</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${C.page}">
<tr>
<td align="center" style="padding:24px 12px">

<table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:${C.card};border-radius:14px;overflow:hidden">

<tr>
<td align="center" style="background:${C.espresso};padding:26px 24px;border-bottom:4px solid ${C.gold}">
<img src="cid:${LOGO_CID}" alt="${COMPANY.name}" width="260" style="display:block;width:260px;max-width:100%;height:auto;border:0;outline:none" />
</td>
</tr>

<tr>
<td class="pad" style="padding:36px 40px 8px">

<div style="font-family:${SANS};font-size:12px;letter-spacing:1.6px;text-transform:uppercase;color:${C.teal};font-weight:bold">
${esc(c.badge)}
</div>

<h1 class="h1" style="margin:10px 0 0;font-family:${SERIF};font-size:30px;line-height:36px;font-weight:normal;color:${C.heading}">
${esc(c.title)}
</h1>

<p style="margin:14px 0 0;font-family:${SANS};font-size:16px;line-height:25px;color:${C.ink}">
${esc(c.intro)}
</p>

${metaHtml}

</td>
</tr>

<tr>
<td class="pad" style="padding:28px 40px 8px">

<div style="font-family:${SERIF};font-size:20px;color:${C.heading};padding-bottom:6px;border-bottom:2px solid ${C.gold}">
${esc(c.fieldsHeading)}
</div>

<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
${fieldsHtml(d.rows)}
</table>

${actions}

</td>
</tr>

<tr>
<td class="pad" style="padding:8px 40px 32px">
<p style="margin:0;font-family:${SANS};font-size:14px;line-height:22px;color:${C.soft}">
${c.closing}
</p>
</td>
</tr>

<tr>
<td class="pad" style="background:${C.espresso};padding:24px 40px;font-family:${SANS};font-size:12px;line-height:19px;color:#f1ebe2">

<div style="font-family:${SERIF};font-size:15px;color:${C.gold};padding-bottom:6px">
${COMPANY.name}
</div>

${COMPANY.address.map(esc).join('<br>')}<br>

<a href="mailto:${COMPANY.email}" style="color:${C.gold};text-decoration:underline">
${COMPANY.email}
</a>

</td>
</tr>

</table>

</td>
</tr>
</table>

</body>
</html>`

  const plainClosing = unesc(
    c.closing.replace(/<[^>]+>/g, ''),
  )

  const text = [
    COMPANY.name,
    '',
    c.badge.toUpperCase(),
    unesc(c.title),
    '',
    c.intro,
    '',
    `Reference: ${d.id}`,
    `Received: ${when}`,
    '',
    c.fieldsHeading.toUpperCase(),
    fieldsText(d.rows),
    '',
    plainClosing,
    '',
    '--',
    COMPANY.name,
    ...COMPANY.address,
    COMPANY.email,
  ].join('\n')

  return {
    subject: c.subject,
    html,
    text,
  }
}

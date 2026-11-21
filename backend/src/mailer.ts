
import nodemailer from 'nodemailer'
import { fileURLToPath } from 'node:url'
import { type EmailData, LOGO_CID, renderEmail } from './emailTemplates.js'
import { env, smtpConfigured } from './env.js'

const transporter = smtpConfigured
  ? nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: false, // STARTTLS upgrade on port 587
      requireTLS: true,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 20_000,
    })
  : null

const from =
  env.SMTP_FROM ||
  `Jireh Healthcare Solutions <${env.SMTP_USER ?? 'no-reply@localhost'}>`

export type { Kind } from './emailTemplates.js'
export type Submission = EmailData

// Logo is embedded only in admin notification emails.
const logo = {
  filename: 'jireh-logo.png',
  path: fileURLToPath(
    new URL('../assets/jireh-logo.png', import.meta.url),
  ),
  cid: LOGO_CID,
  contentDisposition: 'inline' as const,
}

export function buildMessages(s: Submission) {
  const admin = renderEmail('admin', s)
  const customer = renderEmail('customer', s)

  return {
    // Branded admin notification with inline logo.
    admin: {
      from,
      to: env.ADMIN_EMAIL,
      replyTo: s.email,
      ...admin,
      attachments: [logo],
    },

    // Plain customer acknowledgement with no logo or attachments.
    customer: {
      from,
      to: s.email,
      replyTo: env.ADMIN_EMAIL,
      ...customer,
      attachments: [],
    },
  }
}

/**
 * Sends admin notification and customer acknowledgement.
 * Email failures never affect the saved database record.
 */
export async function notify(
  s: Submission,
): Promise<{ admin: boolean; customer: boolean }> {
  if (!transporter) {
    console.error(
      `[mail] SMTP not configured; no emails sent for ${s.kind} ${s.id}`,
    )
    return { admin: false, customer: false }
  }

  const messages = buildMessages(s)

  const [adminResult, customerResult] = await Promise.allSettled([
    transporter.sendMail(messages.admin),
    transporter.sendMail(messages.customer),
  ])

  if (adminResult.status === 'rejected') {
    console.error(
      `[mail] admin email failed for ${s.kind} ${s.id}:`,
      adminResult.reason?.message ?? adminResult.reason,
    )
  }

  if (customerResult.status === 'rejected') {
    console.error(
      `[mail] customer email failed for ${s.kind} ${s.id}:`,
      customerResult.reason?.message ?? customerResult.reason,
    )
  }

  return {
    admin: adminResult.status === 'fulfilled',
    customer: customerResult.status === 'fulfilled',
  }
}

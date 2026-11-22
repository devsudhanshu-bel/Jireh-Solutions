import { readFileSync } from 'node:fs'
import nodemailer from 'nodemailer'
import { fileURLToPath } from 'node:url'
import { type EmailData, LOGO_CID, oneLine, renderEmail } from './emailTemplates.js'
import { env, smtpConfigured } from './env.js'
import { logger, maskEmail } from './lib/logger.js'

/**
 * Shared transport settings, exported so the TLS/file-access invariants can be
 * unit-tested. Credentials are only present when SMTP is fully configured.
 */
export const transportOptions = {
  host: env.SMTP_HOST,
  port: env.SMTP_PORT,
  // 465 = implicit TLS; 587 = STARTTLS. Never hard-code this (env.ts validates the pair).
  secure: env.SMTP_SECURE,
  // Fail the connection if a STARTTLS-capable server does not offer TLS: credentials
  // must never be sent over a plaintext session.
  requireTLS: !env.SMTP_SECURE,
  auth: smtpConfigured
    ? { user: env.SMTP_USER as string, pass: env.SMTP_PASS as string }
    : undefined,
  tls: {
    rejectUnauthorized: true, // verify the server certificate and hostname
    minVersion: 'TLSv1.2' as const,
  },
  // No user input ever selects a file or URL. Remove Nodemailer's loaders entirely so
  // a future change cannot turn an attachment into a local-file read or SSRF primitive.
  disableFileAccess: true,
  disableUrlAccess: true,
  connectionTimeout: 10_000,
  greetingTimeout: 10_000,
  socketTimeout: 20_000,
}

const transporter = smtpConfigured ? nodemailer.createTransport(transportOptions) : null

// `oneLine` strips CR/LF so even a compromised env var cannot inject extra headers.
const from = oneLine(
  env.SMTP_FROM || `Jireh Healthcare Solutions <${env.SMTP_USER ?? 'no-reply@localhost'}>`,
)
const header = (value: string) => oneLine(value.trim())

export type { Kind } from './emailTemplates.js'
export type Submission = EmailData

// Logo bytes are loaded once at boot (disableFileAccess means no path is read at
// send time). It is embedded only in admin notification emails.
const logo = {
  filename: 'jireh-logo.png',
  content: readFileSync(fileURLToPath(new URL('../assets/jireh-logo.png', import.meta.url))),
  cid: LOGO_CID,
  contentDisposition: 'inline' as const,
}

// Suppress out-of-office and auto-reply loops on both transactional messages.
const autoResponseHeaders = { 'X-Auto-Response-Suppress': 'OOF, AutoReply, Notification' }

export function buildMessages(s: Submission) {
  const admin = renderEmail('admin', s)
  const customer = renderEmail('customer', s)

  return {
    // Branded admin notification with inline logo.
    admin: {
      from,
      to: header(env.ADMIN_EMAIL),
      replyTo: header(s.email),
      headers: autoResponseHeaders,
      ...admin,
      attachments: [logo],
    },

    // Plain customer acknowledgement with no logo or attachments.
    customer: {
      from,
      to: header(s.email),
      replyTo: header(env.ADMIN_EMAIL),
      headers: autoResponseHeaders,
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
    logger.warn('mail.not_configured', { kind: s.kind, id: s.id })
    return { admin: false, customer: false }
  }

  const messages = buildMessages(s)

  const [adminResult, customerResult] = await Promise.allSettled([
    transporter.sendMail(messages.admin),
    transporter.sendMail(messages.customer),
  ])

  if (adminResult.status === 'rejected') {
    logger.error('mail.admin_failed', {
      kind: s.kind,
      id: s.id,
      // logger.redact() masks addresses, connection strings and secrets in the message.
      error: adminResult.reason instanceof Error ? adminResult.reason.message : 'unknown',
    })
  }

  if (customerResult.status === 'rejected') {
    logger.error('mail.customer_failed', {
      kind: s.kind,
      id: s.id,
      to: maskEmail(s.email),
      error: customerResult.reason instanceof Error ? customerResult.reason.message : 'unknown',
    })
  }

  return {
    admin: adminResult.status === 'fulfilled',
    customer: customerResult.status === 'fulfilled',
  }
}

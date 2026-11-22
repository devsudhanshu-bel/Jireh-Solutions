import { Router, type Request, type Response } from 'express'
import { prisma } from '../db.js'
import { env } from '../env.js'
import { isDuplicate, remember, submissionKey } from '../lib/dedupe.js'
import { hashIp, logger } from '../lib/logger.js'
import { notify } from '../mailer.js'
import { submitLimiter } from '../middleware/rateLimit.js'
import {
  bookingSchema,
  enquirySchema,
  fieldErrors,
  isHoneypot,
  looksLikeLinkSpam,
} from '../schemas.js'

/**
 * The only write endpoints. There are deliberately no read/list/admin routes,
 * so a successful response never exposes stored records.
 */

export const submissions = Router()

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function invalid(res: Response, fields: Record<string, string>) {
  res.status(400).json({ error: 'validation', fields })
}

/**
 * Bots that trip any trap get a response shaped like a real success, but nothing
 * is stored and nothing is emailed. The small delay keeps the timing profile
 * close to a genuine submission so the trap cannot be fingerprinted.
 */
async function trapped(res: Response, reason: string, req: Request) {
  logger.warn('spam.trapped', { reason, ip: hashIp(req.ip), path: req.path })
  await sleep(150 + Math.floor(Math.random() * 150))
  res.status(202).json({ ok: true })
}

/** True when the optional client timestamp says the form was filled impossibly fast. */
function tooFast(elapsed: unknown): boolean {
  return (
    env.HONEYPOT_MIN_MS > 0 &&
    typeof elapsed === 'number' &&
    Number.isFinite(elapsed) &&
    elapsed >= 0 &&
    elapsed < env.HONEYPOT_MIN_MS
  )
}

submissions.post('/enquiries', submitLimiter, async (req: Request, res: Response, next) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>

    // Traps run before schema validation: a bot learns nothing about the rules.
    if (isHoneypot(body.website)) return await trapped(res, 'honeypot', req)
    if (tooFast(body.elapsedMs)) return await trapped(res, 'too_fast', req)

    const parsed = enquirySchema.safeParse(body)
    if (!parsed.success) return invalid(res, fieldErrors(parsed.error))

    const { name, contact, email, profession, description } = parsed.data
    if (looksLikeLinkSpam(description)) return await trapped(res, 'link_spam', req)

    const key = submissionKey('enquiry', { email, contact, description })
    if (isDuplicate(key)) return await trapped(res, 'duplicate', req)

    // Explicit field mapping: user input is never spread into a Prisma call.
    const row = await prisma.enquiry.create({
      data: { name, contact, email, profession, description },
    })

    // Saved. Email problems are logged by notify() and never affect the response.
    const mail = await notify({
      kind: 'Enquiry',
      id: row.id,
      createdAt: row.createdAt,
      name: row.name,
      email: row.email,
      rows: [
        ['Name', row.name],
        ['Contact No.', row.contact],
        ['Email', row.email],
        ['Profession', row.profession],
        ['Description', row.description],
      ],
    })

    remember(key)
    logger.info('submission.saved', { kind: 'enquiry', id: row.id, emailed: mail.admin && mail.customer })
    res.status(201).json({ ok: true, emailed: mail.admin && mail.customer })
  } catch (error) {
    next(error)
  }
})

submissions.post('/bookings', submitLimiter, async (req: Request, res: Response, next) => {
  try {
    const body = (req.body ?? {}) as Record<string, unknown>

    if (isHoneypot(body.website)) return await trapped(res, 'honeypot', req)
    if (tooFast(body.elapsedMs)) return await trapped(res, 'too_fast', req)

    const parsed = bookingSchema.safeParse(body)
    if (!parsed.success) return invalid(res, fieldErrors(parsed.error))

    const { name, contact, email, address, service } = parsed.data
    if (looksLikeLinkSpam(address)) return await trapped(res, 'link_spam', req)

    const key = submissionKey('booking', { email, contact, service, address })
    if (isDuplicate(key)) return await trapped(res, 'duplicate', req)

    const row = await prisma.booking.create({
      data: { name, contact, email, address, service },
    })

    const mail = await notify({
      kind: 'Booking',
      id: row.id,
      createdAt: row.createdAt,
      name: row.name,
      email: row.email,
      rows: [
        ['Name', row.name],
        ['Contact No.', row.contact],
        ['Email', row.email],
        ['Address', row.address],
        ['Service', row.service],
      ],
    })

    remember(key)
    logger.info('submission.saved', { kind: 'booking', id: row.id, emailed: mail.admin && mail.customer })
    res.status(201).json({ ok: true, emailed: mail.admin && mail.customer })
  } catch (error) {
    next(error)
  }
})

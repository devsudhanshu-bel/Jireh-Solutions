import { Router, type Request, type Response } from 'express'
import rateLimit from 'express-rate-limit'
import { prisma } from '../db.js'
import { notify } from '../mailer.js'
import { bookingSchema, enquirySchema, fieldErrors } from '../schemas.js'

// Tight per-IP limit on form submissions (each one can trigger two outgoing emails).
const submitLimiter = rateLimit({
  windowMs: 10 * 60_000,
  limit: 5,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'rate_limited', message: 'Too many submissions. Please try again later.' },
})

export const submissions = Router()

function invalid(res: Response, fields: Record<string, string>) {
  res.status(400).json({ error: 'validation', fields })
}

/** Bots that fill the hidden field get a generic response; nothing is stored or emailed. */
function trapped(res: Response) {
  console.warn('[spam] honeypot triggered')
  res.status(202).json({ ok: true })
}

submissions.post('/enquiries', submitLimiter, async (req: Request, res: Response) => {
  const parsed = enquirySchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, fieldErrors(parsed.error))
  const { website, ...data } = parsed.data
  if (website) return trapped(res)

  const row = await prisma.enquiry.create({ data })
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
  res.status(201).json({ ok: true, id: row.id, emailed: mail.admin && mail.customer })
})

submissions.post('/bookings', submitLimiter, async (req: Request, res: Response) => {
  const parsed = bookingSchema.safeParse(req.body)
  if (!parsed.success) return invalid(res, fieldErrors(parsed.error))
  const { website, ...data } = parsed.data
  if (website) return trapped(res)

  const row = await prisma.booking.create({ data })
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
  res.status(201).json({ ok: true, id: row.id, emailed: mail.admin && mail.customer })
})

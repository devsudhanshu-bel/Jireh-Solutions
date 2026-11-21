import { z } from 'zod'

// Mirrors the frontend validation rules.
const name = z.string().trim().min(1, 'Please enter your name.').max(120, 'Name is too long.')
const contact = z
  .string()
  .trim()
  .regex(/^[+]?[\d\s-]{7,15}$/, 'Please enter a valid contact number.')
  .refine((v) => v.replace(/\D/g, '').length >= 7, 'Please enter a valid contact number.')
const email = z
  .string()
  .trim()
  .max(254, 'Email is too long.')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email address.')
// Honeypot: real users never see or fill this field.
const website = z.string().max(500).optional()

export const SERVICES = ['NPWT', 'Advanced Dressing', 'Both'] as const

export const enquirySchema = z.strictObject({
  name,
  contact,
  email,
  profession: z.string().trim().min(1, 'Please enter your profession.').max(120, 'Profession is too long.'),
  description: z.string().trim().min(1, 'Please tell us about your requirement.').max(4000, 'Description is too long.'),
  website,
})

export const bookingSchema = z.strictObject({
  name,
  contact,
  email,
  address: z.string().trim().max(500, 'Address is too long.').default(''),
  service: z.enum(SERVICES, { error: 'Please select a service.' }),
  website,
})

export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const i of error.issues) {
    const key = String(i.path[0] ?? '_')
    if (!(key in out)) out[key] = i.message
  }
  return out
}

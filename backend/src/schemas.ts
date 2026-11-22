import { z } from 'zod'

/**
 * Server-side validation for every field that reaches the API.
 *
 * The frontend validates for UX only — these rules are the security boundary.
 * Each string is normalised (NFC), stripped of control/zero-width/bidi characters,
 * length-checked in code points, and — for structured fields — restricted to a
 * character set that cannot carry markup, header injection or log forgery.
 */

/* ------------------------------------------------------------------ */
/* Normalisation helpers                                               */
/* ------------------------------------------------------------------ */

// C0/C1 control characters except \t \n (kept only for multiline fields).
// oxlint-disable-next-line no-control-regex -- intentionally matching control chars for stripping
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g
// Zero-width + bidi overrides: used to spoof rendered text and hide payloads.
const INVISIBLE = /[\u00AD\u200B-\u200D\u2060\uFEFF\u202A-\u202E\u2066-\u2069]/g

export function cleanText(raw: string, multiline = false): string {
  let v = raw.normalize('NFC').replace(INVISIBLE, '').replace(CONTROL, '')
  v = multiline
    ? v.replace(/\r\n?/g, '\n').replace(/\n{3,}/g, '\n\n')
    : v.replace(/[\r\n\t]+/g, ' ')
  return v.replace(/[ \t]{2,}/g, ' ').trim()
}

type TextRule = {
  min: number
  max: number
  multiline?: boolean
  pattern?: RegExp
  required?: string
  tooLong?: string
  invalid?: string
}

/** A normalised, length-checked, optionally charset-restricted string. */
function text(rule: TextRule) {
  return z
    .string()
    .transform((v) => cleanText(v, rule.multiline))
    .superRefine((v, ctx) => {
      const length = [...v].length
      if (length < rule.min) {
        ctx.addIssue({ code: 'custom', message: rule.required ?? 'This field is required.' })
        return
      }
      if (length > rule.max) {
        ctx.addIssue({ code: 'custom', message: rule.tooLong ?? 'This value is too long.' })
        return
      }
      if (rule.pattern && !rule.pattern.test(v)) {
        ctx.addIssue({ code: 'custom', message: rule.invalid ?? 'Please check this value.' })
      }
    })
}

// Letters (any script, including Telugu/Devanagari), marks, digits and safe punctuation.
const NAME_RE = /^[\p{L}\p{M}\p{N}\s.'’\-&()]+$/u
const PROFESSION_RE = /^[\p{L}\p{M}\p{N}\s.,'’\-&()/+]+$/u
const ADDRESS_RE = /^[\p{L}\p{M}\p{N}\s.,'’\-&()/#:;]+$/u

/* ------------------------------------------------------------------ */
/* Fields                                                             */
/* ------------------------------------------------------------------ */

const name = text({
  min: 1,
  max: 120,
  pattern: NAME_RE,
  required: 'Please enter your name.',
  tooLong: 'Name is too long.',
  invalid: 'Please use letters, spaces and common punctuation only.',
})

const profession = text({
  min: 1,
  max: 120,
  pattern: PROFESSION_RE,
  required: 'Please enter your profession.',
  tooLong: 'Profession is too long.',
  invalid: 'Please use letters, spaces and common punctuation only.',
})

const address = text({
  min: 0,
  max: 500,
  multiline: true,
  pattern: ADDRESS_RE,
  tooLong: 'Address is too long.',
  invalid: 'Please use letters, numbers and common punctuation only.',
})

const description = text({
  min: 1,
  max: 4_000,
  multiline: true,
  required: 'Please tell us about your requirement.',
  tooLong: 'Description is too long.',
})

// RFC-5321-ish: dot-atom local part, DNS label domain, alphabetic TLD.
const EMAIL_RE =
  /^[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/

const email = z
  .string()
  .transform((v) => v.trim().toLowerCase())
  .superRefine((v, ctx) => {
    if (v.length < 3 || v.length > 254) {
      ctx.addIssue({ code: 'custom', message: 'Please enter a valid email address.' })
      return
    }
    if (!EMAIL_RE.test(v)) {
      ctx.addIssue({ code: 'custom', message: 'Please enter a valid email address.' })
      return
    }
    const [local] = v.split('@')
    if (!local || local.length > 64 || local.startsWith('.') || local.endsWith('.')) {
      ctx.addIssue({ code: 'custom', message: 'Please enter a valid email address.' })
    }
  })

/** Accepts spaces, dashes, parentheses and one optional leading `+`; stores `+<digits>`. */
const contact = z
  .string()
  .transform((v) => {
    const trimmed = v.trim()
    const plus = trimmed.startsWith('+')
    return `${plus ? '+' : ''}${trimmed.replace(/\D/g, '')}`
  })
  .superRefine((v, ctx) => {
    if (!/^\+?\d{7,15}$/.test(v)) {
      ctx.addIssue({ code: 'custom', message: 'Please enter a valid contact number.' })
    }
  })

/**
 * Honeypot: deliberately typed as `unknown` so bots that send an object/array/number
 * get a silent 202 instead of a 400 that would reveal the trap.
 */
const honeypot = z.unknown().optional()

/** Client-reported form age in ms, used for the timing trap. Optional and unprivileged. */
const elapsedMs = z.number().int().min(0).max(86_400_000).optional()

export const SERVICES = ['NPWT', 'Advanced Dressing', 'Both'] as const

export const enquirySchema = z.strictObject({
  name,
  contact,
  email,
  profession,
  description,
  website: honeypot,
  elapsedMs,
})

export const bookingSchema = z.strictObject({
  name,
  contact,
  email,
  address: address.default(''),
  service: z.enum(SERVICES, { error: 'Please select a service.' }),
  website: honeypot,
  elapsedMs,
})

export type EnquiryInput = z.infer<typeof enquirySchema>
export type BookingInput = z.infer<typeof bookingSchema>

/* ------------------------------------------------------------------ */
/* Spam heuristics                                                     */
/* ------------------------------------------------------------------ */

/** True when the hidden field carries anything at all. */
export function isHoneypot(value: unknown): boolean {
  if (value === undefined || value === null) return false
  if (typeof value === 'string') return value.length > 0
  if (typeof value === 'number' || typeof value === 'boolean') return true
  if (Array.isArray(value)) return value.length > 0
  if (typeof value === 'object') return Object.keys(value as Record<string, unknown>).length > 0
  return false
}

const LINK_RE = /(?:https?:\/\/|www\.|t\.me\/|bit\.ly\/|\.onion\/?)/gi

/** Link-stuffed descriptions are the signature of SEO/link spam. */
export function looksLikeLinkSpam(value: string, threshold = 3): boolean {
  return (value.match(LINK_RE) ?? []).length > threshold
}

/* ------------------------------------------------------------------ */
/* Error formatting                                                    */
/* ------------------------------------------------------------------ */

/** First message per field; never echoes the submitted value. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {}
  for (const issue of error.issues) {
    // zod reports unknown keys as ONE issue on the object itself; expand them per field.
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) out[key] ??= 'This field is not allowed.'
      continue
    }
    const key = String(issue.path[0] ?? '_')
    if (!(key in out)) out[key] = issue.message
  }
  return out
}

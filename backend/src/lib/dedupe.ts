import { createHash } from 'node:crypto'

/**
 * In-memory duplicate-submission suppression.
 *
 * Prevents one caller from email-bombing a victim (or the admin inbox) by replaying
 * the same enquiry. A duplicate is answered with the same generic 202 as a honeypot
 * hit: nothing is stored, nothing is emailed, and the caller learns nothing.
 *
 * A key is only remembered **after** the row is saved, so a genuine retry following
 * a database failure is never silently swallowed.
 *
 * Bounded and time-limited so it can never grow without limit.
 */

const TTL_MS = 5 * 60_000
const MAX_ENTRIES = 5_000

const seen = new Map<string, number>()

export function submissionKey(kind: string, values: Record<string, string>): string {
  const material = [kind, ...Object.keys(values).sort().map((k) => `${k}=${values[k]}`)].join('\u0000')
  return createHash('sha256').update(material).digest('hex')
}

/** Peek only — does not record anything. */
export function isDuplicate(key: string, now = Date.now()): boolean {
  const previous = seen.get(key)
  return previous !== undefined && now - previous < TTL_MS
}

/** Record a successfully stored submission. */
export function remember(key: string, now = Date.now()): void {
  if (seen.size >= MAX_ENTRIES) {
    // Drop the oldest entry (Map preserves insertion order).
    const oldest = seen.keys().next().value
    if (oldest !== undefined) seen.delete(oldest)
  }
  seen.set(key, now)
}

/** Test helper. */
export function resetDuplicates(): void {
  seen.clear()
}

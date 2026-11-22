/**
 * Thin client for the Jireh backend. `VITE_API_BASE_URL` is empty in development (Vite proxies /api to the
 * backend) and set to the API origin in production, e.g. https://api.example.com
 *
 * Hardening:
 *  - only the two known paths can be requested (no arbitrary URL construction);
 *  - no credentials/cookies are ever sent (`credentials: 'omit'`), so a misconfigured
 *    backend cannot turn this into a CSRF vector;
 *  - `referrerPolicy: 'no-referrer'` keeps the page URL out of API logs;
 *  - requests are aborted after 15 s so a stalled backend cannot wedge the form;
 *  - error bodies are never rendered as HTML — only a known field map is read.
 */
const BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').trim().replace(/\/$/, '')

const TIMEOUT_MS = 15_000

export type SubmitResult =
  | { ok: true }
  | { ok: false; kind: 'validation'; fields: Record<string, string> }
  | { ok: false; kind: 'rate_limited' | 'failed' }

type Body = Record<string, string | number>

export async function submitForm(path: '/api/enquiries' | '/api/bookings', body: Body): Promise<SubmitResult> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), TIMEOUT_MS)

  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      mode: 'cors',
      credentials: 'omit',
      cache: 'no-store',
      referrerPolicy: 'no-referrer',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    })

    // 201 = stored, 202 = accepted by a spam trap. Both are indistinguishable to the user.
    if (res.ok) return { ok: true }
    if (res.status === 429) return { ok: false, kind: 'rate_limited' }

    if (res.status === 400) {
      const data = (await res.json().catch(() => null)) as { fields?: Record<string, string> } | null
      if (data?.fields && typeof data.fields === 'object') {
        const fields: Record<string, string> = {}
        for (const [key, value] of Object.entries(data.fields)) {
          if (typeof value === 'string') fields[key] = value.slice(0, 200)
        }
        if (Object.keys(fields).length) return { ok: false, kind: 'validation', fields }
      }
    }
    return { ok: false, kind: 'failed' }
  } catch {
    return { ok: false, kind: 'failed' }
  } finally {
    window.clearTimeout(timer)
  }
}

export const failureMessage = {
  rate_limited: 'Too many requests were sent from your connection. Please try again in a few minutes.',
  failed: 'Something went wrong and your request was not sent.',
} as const

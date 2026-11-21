/**
 * Thin client for the Jireh backend. `VITE_API_BASE_URL` is empty in development (Vite proxies /api to the
 * backend) and set to the API origin in production, e.g. https://api.example.com
 */
const BASE = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? '').trim().replace(/\/$/, '')

export type SubmitResult =
  | { ok: true }
  | { ok: false; kind: 'validation'; fields: Record<string, string> }
  | { ok: false; kind: 'rate_limited' | 'failed' }

export async function submitForm(path: '/api/enquiries' | '/api/bookings', body: Record<string, string>): Promise<SubmitResult> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify(body),
    })
    if (res.ok) return { ok: true }
    if (res.status === 429) return { ok: false, kind: 'rate_limited' }
    if (res.status === 400) {
      const data = (await res.json().catch(() => null)) as { fields?: Record<string, string> } | null
      if (data?.fields) return { ok: false, kind: 'validation', fields: data.fields }
    }
    return { ok: false, kind: 'failed' }
  } catch {
    return { ok: false, kind: 'failed' }
  }
}

export const failureMessage = {
  rate_limited: 'Too many requests were sent from your connection. Please try again in a few minutes.',
  failed: 'Something went wrong and your request was not sent.',
} as const

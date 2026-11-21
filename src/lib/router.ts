import { useSyncExternalStore } from 'react'

/**
 * Minimal History-API router (no dependency). Internal same-origin links are intercepted
 * globally so existing plain <a href="/about-us"> links (e.g. the footer) navigate without a reload.
 */

const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())

function subscribe(cb: () => void) {
  listeners.add(cb)
  window.addEventListener('popstate', cb)
  return () => {
    listeners.delete(cb)
    window.removeEventListener('popstate', cb)
  }
}

const getPath = () => window.location.pathname.replace(/\/+$/, '') || '/'

export function usePath() {
  return useSyncExternalStore(subscribe, getPath, () => '/')
}

// A direct load of /page#anchor: the browser's native hash scroll runs before React has rendered the
// anchor, so queue it here and let the first post-mount flushScroll() handle it.
let pending: { hash: string; samePage: boolean; initial?: boolean } | null = window.location.hash
  ? { hash: window.location.hash, samePage: false, initial: true }
  : null

/** Scroll to the pending anchor (or top) once the target route has mounted. Called after every commit. */
export function flushScroll() {
  if (!pending) return
  const { hash, samePage, initial } = pending
  const id = hash ? decodeURIComponent(hash.slice(1)) : ''
  const el = id ? document.getElementById(id) : null
  if (id && !el) return // route not mounted yet — try again after the next commit
  pending = null
  if (!el) {
    window.scrollTo({ top: 0, behavior: samePage ? 'smooth' : 'instant' })
  } else if (initial) {
    el.scrollIntoView({ behavior: 'instant' }) // direct load: land on the section like a native anchor would
  } else if (samePage) {
    el.scrollIntoView({ behavior: 'smooth' })
  } else {
    // Cross-page anchor: start the new page at the top, then glide to the section on the next frame,
    // once the freshly mounted layout has been painted. Offset comes from the section's scroll-margin.
    window.scrollTo({ top: 0, behavior: 'instant' })
    requestAnimationFrame(() => el.scrollIntoView({ behavior: 'smooth' }))
  }
}

export function navigate(to: string) {
  const url = new URL(to, window.location.href)
  const samePage = url.pathname === window.location.pathname
  window.history.pushState({}, '', url.pathname + url.search + url.hash)
  pending = { hash: url.hash, samePage }
  notify()
  flushScroll()
}

import { useEffect, useLayoutEffect, type ReactNode } from 'react'
import { flushScroll, navigate, usePath } from './router'

/** Intercepts internal same-origin link clicks so plain <a href> links navigate without a reload. */
export function RouterProvider({ children }: { children: ReactNode }) {
  const path = usePath()
  // Runs after the new route commits, so anchors on another page exist by now.
  useLayoutEffect(flushScroll, [path])
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual'
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
      const a = (e.target as Element | null)?.closest?.('a[href]') as HTMLAnchorElement | null
      if (!a || a.target === '_blank' || a.hasAttribute('download')) return
      const raw = a.getAttribute('href') ?? ''
      if (/^(mailto:|tel:|https?:|\/\/)/i.test(raw) || raw === '#') return
      const url = new URL(a.href, window.location.href)
      if (url.origin !== window.location.origin) return
      e.preventDefault()
      navigate(url.pathname + url.search + url.hash)
    }
    document.addEventListener('click', onClick)
    return () => document.removeEventListener('click', onClick)
  }, [])
  return <>{children}</>
}

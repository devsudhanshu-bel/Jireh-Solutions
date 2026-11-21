import { animate, useReducedMotion } from 'framer-motion'
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'

type ExpandableProps = {
  children: ReactNode
  /** Number of text lines visible while collapsed. */
  lines?: number
  className?: string
}

/**
 * Read More / Read Less block. Collapsed height is `lines` × the computed line-height, so it
 * adapts to every breakpoint; height animates smoothly (instant for reduced motion).
 */
export function Expandable({ children, lines = 3, className = '' }: ExpandableProps) {
  const id = useId()
  const reduce = useReducedMotion()
  const outer = useRef<HTMLDivElement>(null)
  const inner = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)
  const [collapsedH, setCollapsedH] = useState<number | null>(null)
  const [fullH, setFullH] = useState(0)
  const firstRun = useRef(true)

  const measure = useCallback(() => {
    const el = inner.current
    if (!el) return
    const probe = el.querySelector('p') ?? el
    const cs = getComputedStyle(probe)
    const lh = parseFloat(cs.lineHeight) || parseFloat(cs.fontSize) * 1.7
    setCollapsedH(Math.round(lh * lines))
    setFullH(el.scrollHeight)
  }, [lines])

  useLayoutEffect(measure, [measure])
  useEffect(() => {
    const el = inner.current
    if (!el) return
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  const expandable = collapsedH !== null && fullH > collapsedH + 4

  useEffect(() => {
    const el = outer.current
    if (!el || collapsedH === null) return
    const target = !expandable || open ? fullH : collapsedH
    if (firstRun.current || reduce) {
      el.style.height = `${target}px`
      firstRun.current = false
      return
    }
    const controls = animate(el.getBoundingClientRect().height, target, {
      duration: 0.6,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => (el.style.height = `${v}px`),
    })
    return () => controls.stop()
  }, [open, expandable, collapsedH, fullH, reduce])

  return (
    <div className={className}>
      <div className="relative">
        <div ref={outer} id={id} className="overflow-hidden">
          <div ref={inner}>{children}</div>
        </div>
        {expandable && (
          <div
            aria-hidden
            className={`pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white to-transparent transition-opacity duration-500 ${
              open ? 'opacity-0' : 'opacity-100'
            }`}
          />
        )}
      </div>
      {expandable && (
        <button
          type="button"
          aria-expanded={open}
          aria-controls={id}
          onClick={() => setOpen((o) => !o)}
          className="mt-3 inline-flex items-center gap-2 border-b border-heading-warm/40 pb-0.5 font-display text-[14px] font-semibold text-heading-warm transition-colors duration-300 hover:border-heading-warm"
        >
          {open ? 'Read Less' : 'Read More'}
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden
            className={`transition-transform duration-500 ${open ? 'rotate-180' : ''}`}
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        </button>
      )}
    </div>
  )
}

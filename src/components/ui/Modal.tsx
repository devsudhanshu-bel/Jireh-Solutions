import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { easePremium } from '../../lib/motion'
import { Close } from './icons'

type ModalProps = {
  open: boolean
  onClose: () => void
  labelledBy: string
  children: ReactNode
  className?: string
  tone?: 'light' | 'dark'
  /** Centre the panel on every breakpoint instead of a bottom sheet on phones. */
  centered?: boolean
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, textarea, select, [tabindex]:not([tabindex="-1"])'

/** Accessible dialog: Esc to close, focus trap, scroll lock, focus restore. */
export function Modal({ open, onClose, labelledBy, children, className = '', tone = 'light', centered = false }: ModalProps) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const previouslyFocused = document.activeElement as HTMLElement | null
    const { overflow } = document.body.style
    document.body.style.overflow = 'hidden'

    const focusFirst = window.setTimeout(() => {
      const el = panelRef.current?.querySelector<HTMLElement>('[data-autofocus]') ??
        panelRef.current?.querySelector<HTMLElement>(FOCUSABLE)
      el?.focus()
    }, 60)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key !== 'Tab' || !panelRef.current) return
      const items = Array.from(panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE))
      if (!items.length) return
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)

    return () => {
      window.clearTimeout(focusFirst)
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previouslyFocused?.focus()
    }
  }, [open, onClose])

  // Portal to <body>: the hero section creates its own stacking context, which previously
  // left the sticky navbar painted above this dialog and its backdrop.
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className={`fixed inset-0 z-[100] flex justify-center overscroll-contain ${
            centered ? 'items-center p-3 sm:p-6' : 'items-end p-0 sm:items-center sm:p-6'
          }`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div
            aria-hidden
            onClick={onClose}
            className="absolute inset-0 bg-espresso-900/70 backdrop-blur-[3px]"
          />
          <motion.div
            ref={panelRef}
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            initial={{ opacity: 0, y: 40, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.98 }}
            transition={{ duration: 0.45, ease: easePremium }}
            className={`relative max-h-[92svh] max-h-[92dvh] w-full overflow-y-auto overflow-x-hidden overscroll-contain shadow-2xl ${
              centered ? 'max-h-[calc(100dvh-1.5rem)] rounded-3xl sm:max-h-[calc(100dvh-3rem)]' : 'rounded-t-3xl sm:rounded-3xl'
            } ${
              tone === 'dark' ? 'bg-espresso-900 text-white' : 'bg-cream-50 text-ink'
            } ${className}`}
          >
            {/* Zero-height sticky wrapper keeps the close button reachable while the panel scrolls. */}
            <div className="sticky top-0 z-10 h-0">
            <button
                type="button"
                onClick={onClose}
                aria-label="Close dialog"
                className={`absolute right-3 top-3 z-10 grid sm:right-4 sm:top-4 size-10 place-items-center rounded-full transition-colors duration-300 ${
                  tone === 'dark' ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-cream-200 text-heading hover:bg-cream-300'
                }`}
              >
                <Close size={20} />
              </button>
            </div>
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}


import {
  AnimatePresence,
  motion,
  useMotionValueEvent,
  useScroll,
} from 'framer-motion'
import { useCallback, useEffect, useState } from 'react'
import { careAreasMenu, navItems } from '../../data/site'
import { usePath } from '../../lib/router'
import { useEnquiry } from '../enquiry/useEnquiry'
import { ArrowUpRight, ChevronDown, Close, Menu } from '../ui/icons'
import { CareAreasMegaMenu, MEGA_MENU_ATTR } from './CareAreasMegaMenu'
import { JirehLogo } from '../ui/JirehLogo'

const NAV_SPRING = {
  type: 'spring' as const,
  stiffness: 180,
  damping: 28,
  mass: 0.85,
}

const MENU_EASE = [0.22, 1, 0.36, 1] as const

export function Navbar() {
  const { scrollY } = useScroll()
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [megaOpen, setMegaOpen] = useState(false)

  const { openEnquiry } = useEnquiry()
  const path = usePath()

  const closeMega = useCallback(() => setMegaOpen(false), [])
  const closeMobile = useCallback(() => setMobileOpen(false), [])

  useEffect(() => {
    setMegaOpen(false)
    setMobileOpen(false)
  }, [path])

  // Close mega menu on outside click or Escape.
  useEffect(() => {
    if (!megaOpen) return

    const onDown = (e: MouseEvent | TouchEvent) => {
      const target = e.target as Element | null
      if (target?.closest?.(`[${MEGA_MENU_ATTR}]`)) return
      setMegaOpen(false)
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      setMegaOpen(false)
      document.getElementById('care-areas-trigger')?.focus()
    }

    document.addEventListener('mousedown', onDown)
    document.addEventListener('touchstart', onDown)
    document.addEventListener('keydown', onKey)

    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('touchstart', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [megaOpen])

  // A small hysteresis prevents flickering around the scroll threshold.
  useMotionValueEvent(scrollY, 'change', (y) => {
    setScrolled((previous) => {
      if (!previous && y > 55) return true
      if (previous && y < 25) return false
      return previous
    })
  })

  useEffect(() => {
    const close = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false)
      else setMegaOpen(false)
    }

    window.addEventListener('resize', close)
    return () => window.removeEventListener('resize', close)
  }, [])

  // Lock background scrolling while the mobile menu or the Care Areas mega menu is open.
  const scrollLocked = mobileOpen || megaOpen
  useEffect(() => {
    if (!scrollLocked) return
    // Locked on <html>: it already sets overflow-x: clip, so a body-level lock never reaches the viewport.
    const root = document.documentElement
    const previous = root.style.overflow
    const previousPadding = root.style.paddingRight
    const scrollbar = window.innerWidth - root.clientWidth // keep content from jumping when the scrollbar disappears
    root.style.overflow = 'hidden'
    if (scrollbar > 0) root.style.paddingRight = `${scrollbar}px`
    return () => {
      root.style.overflow = previous
      root.style.paddingRight = previousPadding
    }
  }, [scrollLocked])

  return (
    <motion.header
      initial={{ y: -35, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: MENU_EASE }}
      className="fixed inset-x-0 top-0 z-50"
    >
      {/* Animated outer container */}
      <motion.div
        initial={false}
        animate={{
          marginTop: scrolled ? 12 : 0,
          paddingLeft: scrolled ? 24 : 0,
          paddingRight: scrolled ? 24 : 0,
        }}
        transition={NAV_SPRING}
        className="mx-auto w-full"
      >
        <motion.nav
          aria-label="Primary"
          initial={false}
          animate={{
            maxWidth: scrolled ? 1320 : 2000,
            // Scrolled: square left corners, fully rounded right corners.
            borderTopLeftRadius: 0,
            borderBottomLeftRadius: 0,
            borderTopRightRadius: scrolled ? 999 : 0,
            borderBottomRightRadius: scrolled ? 999 : 0,
            backgroundColor: scrolled
              ? 'rgba(255,255,255,0.97)'
              : 'rgba(255,255,255,1)',
            boxShadow: scrolled
              ? '0 18px 40px -18px rgba(67,35,27,0.30)'
              : '0 1px 0 rgba(67,35,27,0.08)',
          }}
          transition={NAV_SPRING}
          className="mx-auto flex h-[60px] w-full items-center justify-between gap-3 overflow-visible ring-1 ring-brown-600/5"
          style={{
            paddingLeft: scrolled ? 12 : undefined,
            paddingRight: scrolled ? 12 : undefined,
          }}
        >
          {/* Logo — 2px spacing on top, bottom and left */}
          <a
            href="/"
            className="flex h-full shrink-0 self-stretch items-center py-0.5 pl-0.5"
            aria-label="Jireh Healthcare Solutions — Home"
          >
            <JirehLogo
              className="!block !h-full !max-h-full w-auto max-w-none"
            />
          </a>

          <DesktopLinks
            megaOpen={megaOpen}
            onToggleMega={() => setMegaOpen((o) => !o)}
          />

          {/* Actions */}
          <div className="flex shrink-0 items-center gap-2 pr-1">
            <button
              type="button"
              onClick={openEnquiry}
              className="group hidden items-center gap-2 rounded-full bg-brown-700 px-6 py-2 font-display text-[14px] font-semibold text-white shadow-[0_8px_20px_-10px_rgba(67,35,27,0.8)] transition-all duration-300 hover:bg-espresso-900 sm:inline-flex xl:px-7"
            >
              Enquiry
              <ArrowUpRight className="size-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
            </button>

            <button
              type="button"
              onClick={() => setMobileOpen((o) => !o)}
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
              className="grid size-10 place-items-center rounded-full bg-cream-200 text-heading transition-colors hover:bg-cream-300 lg:hidden"
            >
              {mobileOpen ? <Close /> : <Menu />}
            </button>
          </div>
        </motion.nav>
      </motion.div>

      <CareAreasMegaMenu open={megaOpen} onClose={closeMega} />

      <MobileMenu
        open={mobileOpen}
        onClose={closeMobile}
        onEnquire={openEnquiry}
      />
    </motion.header>
  )
}

function isActive(path: string, href: string) {
  if (href === '/') return path === '/'
  if (href === '/#care-areas') return path.startsWith('/care-areas')
  return !href.includes('#') && path === href
}

/* Desktop Navigation */
function DesktopLinks({
  megaOpen,
  onToggleMega,
}: {
  megaOpen: boolean
  onToggleMega: () => void
}) {
  const path = usePath()
  const [hovered, setHovered] = useState<string | null>(null)
  const active = navItems.find((i) => isActive(path, i.href))?.label

  return (
    <ul
      className="ml-auto mr-3 hidden items-center gap-1 lg:flex xl:mr-6 xl:gap-2"
      onMouseLeave={() => setHovered(null)}
    >
      {navItems.map((item) => (
        <li
          key={item.label}
          className="relative"
          onMouseEnter={() => setHovered(item.label)}
        >
          {(hovered ?? active) === item.label && (
            <motion.span
              layoutId="nav-pill"
              aria-hidden
              className="absolute inset-0 rounded-full bg-brand-cream/60"
              transition={{
                type: 'spring',
                stiffness: 380,
                damping: 32,
              }}
            />
          )}

          {item.megaMenu ? (
            <button
              type="button"
              id="care-areas-trigger"
              {...{ [MEGA_MENU_ATTR]: '' }}
              onClick={onToggleMega}
              aria-expanded={megaOpen}
              aria-haspopup="true"
              aria-controls="care-areas-mega-menu"
              aria-current={item.label === active ? 'page' : undefined}
              className="relative flex items-center gap-1.5 rounded-full px-4 py-1.5 font-display text-[14px] font-semibold text-heading xl:px-5"
            >
              {item.label}
              <ChevronDown
                size={14}
                className={`transition-transform duration-300 ${
                  megaOpen ? 'rotate-180' : ''
                }`}
              />
            </button>
          ) : (
            <a
              href={item.href}
              aria-current={item.label === active ? 'page' : undefined}
              className="relative block rounded-full px-4 py-1.5 font-display text-[14px] font-semibold text-heading xl:px-5"
            >
              {item.label}
            </a>
          )}
        </li>
      ))}
    </ul>
  )
}

/* Mobile Navigation */
function MobileMenu({
  open,
  onClose,
  onEnquire,
}: {
  open: boolean
  onClose: () => void
  onEnquire: () => void
}) {
  const path = usePath()
  const [careOpen, setCareOpen] = useState(false)

  useEffect(() => {
    if (!open) return

    const onKey = (e: KeyboardEvent) =>
      e.key === 'Escape' && onClose()

    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose])

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          id="mobile-menu"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="fixed inset-x-0 bottom-0 top-[60px] z-40 lg:hidden"
        >
          <div
            aria-hidden
            className="absolute inset-0 bg-espresso-900/40"
            onClick={onClose}
          />

          <motion.div
            initial={{ y: -12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -8, opacity: 0 }}
            transition={{ duration: 0.35, ease: MENU_EASE }}
            className="relative mx-3 mt-2 max-h-[calc(100svh-84px)] overflow-y-auto rounded-3xl bg-white p-3 shadow-2xl"
          >
            <ul className="divide-y divide-brown-600/10">
              {navItems.map((item, i) => (
                <motion.li
                  key={item.label}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    delay: 0.04 * i,
                    duration: 0.3,
                    ease: MENU_EASE,
                  }}
                >
                  {item.megaMenu ? (
                    <div>
                      <button
                        type="button"
                        onClick={() => setCareOpen((o) => !o)}
                        aria-expanded={careOpen}
                        aria-controls="mobile-care-areas"
                        aria-current={
                          isActive(path, item.href) ? 'page' : undefined
                        }
                        className="flex w-full items-center justify-between px-4 py-3.5 font-display text-[15px] font-semibold text-heading aria-[current=page]:text-brown-500"
                      >
                        {item.label}
                        <ChevronDown
                          className={`transition-transform duration-300 ${
                            careOpen ? 'rotate-180' : ''
                          }`}
                        />
                      </button>

                      <AnimatePresence initial={false}>
                        {careOpen && (
                          <motion.ul
                            id="mobile-care-areas"
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{
                              duration: 0.35,
                              ease: MENU_EASE,
                            }}
                            className="overflow-hidden"
                          >
                            {careAreasMenu.links.map((link) => (
                              <li key={link.href}>
                                <a
                                  href={link.href}
                                  onClick={onClose}
                                  className="block rounded-2xl bg-cream-50 px-4 py-3 pl-8 font-display text-[14.5px] font-semibold text-heading"
                                >
                                  {link.label}
                                </a>
                              </li>
                            ))}
                          </motion.ul>
                        )}
                      </AnimatePresence>
                    </div>
                  ) : (
                    <a
                      href={item.href}
                      onClick={onClose}
                      aria-current={
                        isActive(path, item.href) ? 'page' : undefined
                      }
                      className="block px-4 py-3.5 font-display text-[15px] font-semibold text-heading aria-[current=page]:text-brown-500"
                    >
                      {item.label}
                    </a>
                  )}
                </motion.li>
              ))}
            </ul>

            <button
              type="button"
              onClick={() => {
                onClose()
                onEnquire()
              }}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-brown-700 px-6 py-3 font-display text-[15px] font-semibold text-white"
            >
              Enquiry <ArrowUpRight />
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

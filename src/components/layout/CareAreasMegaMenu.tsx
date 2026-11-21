import { AnimatePresence, motion } from 'framer-motion'
import { careAreasMenu } from '../../data/site'
import { easePremium } from '../../lib/motion'
import { ArrowRight } from '../ui/icons'
import { ImagePlaceholder } from '../ui/ImagePlaceholder'

/** Marker used by the navbar's outside-click handler. */
export const MEGA_MENU_ATTR = 'data-mega-menu'

/**
 * Full-width white mega menu for Care Areas (desktop). Rendered inside the fixed header so it
 * sits flush below the navbar. Open/close state, outside-click and Escape live in the Navbar.
 */
export function CareAreasMegaMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Soft scrim — clicking it counts as an outside click */}
          <motion.div
            key="scrim"
            aria-hidden
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            onClick={onClose}
            className="fixed inset-0 -z-10 hidden bg-espresso-900/25 lg:block"
          />

          <motion.div
            key="panel"
            id="care-areas-mega-menu"
            {...{ [MEGA_MENU_ATTR]: '' }}
            role="region"
            aria-label="Care Areas"
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: easePremium }}
            className="absolute inset-x-0 top-full hidden border-t border-brown-600/10 bg-white shadow-[0_30px_60px_-30px_rgba(67,35,27,0.35)] lg:block"
          >
            <div className="container-site grid grid-cols-[minmax(260px,0.8fr)_minmax(0,2fr)] gap-12 py-12 xl:gap-20 xl:py-14">
              {/* Left — heading and navigation links */}
              <div>
                <motion.h2
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, ease: easePremium, delay: 0.08 }}
                  className="font-serif text-[clamp(1.9rem,2.6vw,2.6rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-heading"
                >
                  {careAreasMenu.heading}
                </motion.h2>
                <motion.span
                  aria-hidden
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ duration: 0.7, ease: easePremium, delay: 0.2 }}
                  className="mt-5 block h-[2px] w-14 origin-left rounded-full bg-heading-warm"
                />

                <ul className="mt-8 space-y-1">
                  {careAreasMenu.links.map((link, i) => (
                    <motion.li
                      key={link.href}
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.5, ease: easePremium, delay: 0.14 + i * 0.07 }}
                    >
                      <a
                        href={link.href}
                        onClick={onClose}
                        className="group flex items-center justify-between gap-4 border-b border-brown-600/10 py-4 font-display text-[16px] font-semibold text-heading transition-colors hover:text-brown-500"
                      >
                        {link.label}
                        <ArrowRight
                          size={18}
                          className="shrink-0 -translate-x-1 opacity-60 transition-all duration-300 ease-premium group-hover:translate-x-0 group-hover:opacity-100"
                        />
                      </a>
                    </motion.li>
                  ))}
                </ul>
              </div>

              {/* Right — image cards */}
              <div className="grid grid-cols-2 gap-6 xl:gap-8">
                {careAreasMenu.cards.map((card, i) => (
                  <motion.a
                    key={card.id}
                    href={card.href}
                    onClick={onClose}
                    initial={{ opacity: 0, y: 22 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.65, ease: easePremium, delay: 0.12 + i * 0.09 }}
                    className="group block"
                  >
                    <div className="overflow-hidden rounded-2xl">
                      {/* FINAL IMAGE: {card.placeholder} — 4:3 landscape */}
                      <ImagePlaceholder
                        name={card.placeholder}
                        hint={card.hint}
                        className="aspect-[4/3] w-full transition-transform duration-[900ms] ease-premium group-hover:scale-[1.04]"
                      />
                    </div>
                    <h3 className="mt-5 flex items-center gap-3 font-display text-[18px] font-semibold text-heading">
                      {card.title}
                      <ArrowRight
                        size={18}
                        className="transition-transform duration-300 ease-premium group-hover:translate-x-1"
                      />
                    </h3>
                    <p className="mt-2 max-w-[44ch] text-[14.5px] leading-[1.7] text-ink-soft">
                      {card.description}
                    </p>
                  </motion.a>
                ))}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

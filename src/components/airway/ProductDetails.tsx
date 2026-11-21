
import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import type { AirwayProduct } from '../../data/airway'
import { easePremium } from '../../lib/motion'
import { ChevronDown } from '../ui/icons'
import { ImagePlaceholder } from '../ui/ImagePlaceholder'
import { SpecificationsAccordion } from './SpecificationsAccordion'

/** Details for the selected product; content swaps in place without navigation. */
export function ProductDetails({
  product,
  eyebrow = 'EEVA · Product Overview',
}: {
  product: AirwayProduct
  eyebrow?: string
}) {
  const [specsOpen, setSpecsOpen] = useState(false)

  return (
    <section
      id="product-details"
      aria-live="polite"
      aria-label="Selected product details"
      className="scroll-mt-28 bg-white pt-[5px] pb-14 sm:pt-[5px] sm:pb-16 lg:pt-[5px] lg:pb-20"
    >
      <div className="container-site">
        <div className="rounded-3xl bg-cream-50 p-6 sm:p-10 lg:p-14">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.4, ease: easePremium }}
            >
              {/* Content LEFT — Product Image RIGHT */}
              <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:gap-14">

                {/* LEFT: Product Information */}
                <div className="order-2 lg:order-1">
                  <p className="font-display text-[12px] font-semibold uppercase tracking-[0.26em] text-brown-500">
                    {eyebrow}
                  </p>

                  <h2 className="mt-3 font-serif text-[clamp(1.9rem,3.2vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-heading">
                    {product.name}
                  </h2>

                  {product.subtitle && (
                    <p className="mt-2 font-display text-[15px] font-semibold text-brown-500">
                      {product.subtitle}
                    </p>
                  )}

                  <div className="mt-5 space-y-4 text-[16px] leading-[1.85] text-ink">
                    {product.overview.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-8 flex flex-wrap items-center gap-3">
                    <LiteratureButton product={product} />

                    <button
                      type="button"
                      onClick={() => setSpecsOpen((o) => !o)}
                      aria-expanded={specsOpen}
                      aria-controls="product-specifications"
                      className="inline-flex items-center gap-2 rounded-full border-2 border-brown-700 px-6 py-2.5 font-display text-[14px] font-semibold text-brown-700 transition-colors duration-300 hover:bg-brown-700 hover:text-white"
                    >
                      Specifications

                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-300 ease-premium ${
                          specsOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </button>
                  </div>
                </div>

                {/* RIGHT: Product Image */}
                <div className="order-1 overflow-hidden rounded-2xl lg:order-2">
                  {/* FINAL IMAGE: {product.imagePlaceholder} — 4:3 product photograph */}
                  <ImagePlaceholder
                    name={product.imagePlaceholder}
                    hint={product.imageHint}
                    labelPosition="bottom-right"
                    className="aspect-[4/3] w-full"
                  />
                </div>

              </div>

              {/* Specifications */}
              <AnimatePresence initial={false}>
                {specsOpen && (
                  <motion.div
                    id="product-specifications"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.5, ease: easePremium }}
                    className="overflow-hidden"
                  >
                    <div className="pt-10">
                      <SpecificationsAccordion product={product} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}

/** Downloads only a genuine supplied file; otherwise shows a disabled Coming Soon state. */
function LiteratureButton({ product }: { product: AirwayProduct }) {
  const base =
    'inline-flex items-center gap-2 rounded-full px-6 py-2.5 font-display text-[14px] font-semibold transition-all duration-300 ease-premium'

  if (product.literatureUrl) {
    return (
      <a
        href={product.literatureUrl}
        download
        className={`${base} bg-brown-700 text-white shadow-[0_8px_20px_-10px_rgba(67,35,27,0.8)] hover:bg-espresso-900`}
      >
        Download Literature
      </a>
    )
  }

  return (
    <button
      type="button"
      disabled
      aria-disabled="true"
      title="Literature for this product is coming soon"
      className={`${base} cursor-not-allowed bg-brown-700/15 text-brown-700/70`}
    >
      Download Literature

      <span className="rounded-full bg-white px-2.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-brown-500">
        Coming Soon
      </span>
    </button>
  )
}

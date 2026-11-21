import { AnimatePresence, motion } from 'framer-motion'
import { useState, type ReactNode } from 'react'
import type { AirwayProduct } from '../../data/airway'
import { easePremium } from '../../lib/motion'
import { ChevronDown } from '../ui/icons'

/** Three-section accordion for the selected product. Remounted per product (keyed by the parent). */
export function SpecificationsAccordion({ product }: { product: AirwayProduct }) {
  return (
    <div className="divide-y divide-brown-600/10 overflow-hidden rounded-2xl border border-brown-600/10 bg-white">
      <AccordionRow id={`${product.id}-features`} title="Key Features & Advantages" index={1}>
        <ul className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {product.features.map((f) => (
            <li key={f.title} className="flex gap-3">
              <span aria-hidden className="mt-[0.7em] size-1.5 shrink-0 rounded-full bg-brown-500" />
              <p className="text-[15px] leading-[1.7] text-ink">
                <strong className="font-display font-semibold text-heading">{f.title}:</strong> {f.description}
              </p>
            </li>
          ))}
        </ul>
      </AccordionRow>

      <AccordionRow id={`${product.id}-specs`} title="Product Specifications" index={2}>
        <div className="overflow-x-auto rounded-xl border border-brown-600/10">
          <table className="w-full min-w-[420px] border-collapse text-left text-[14.5px]">
            <thead>
              <tr className="bg-cream-100 font-display text-[12.5px] uppercase tracking-[0.14em] text-heading">
                <th scope="col" className="w-[38%] px-5 py-3 font-semibold">
                  Parameter
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Specification
                </th>
              </tr>
            </thead>
            <tbody>
              {product.specifications.map((row) => (
                <tr key={row.parameter} className="border-t border-brown-600/10 odd:bg-white even:bg-cream-50/70">
                  <th scope="row" className="px-5 py-3 align-top font-display font-semibold text-heading">
                    {row.parameter}
                  </th>
                  <td className="px-5 py-3 align-top leading-[1.6] text-ink">{row.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </AccordionRow>

      <AccordionRow id={`${product.id}-summary`} title="Product Summary" index={3}>
        <p className="text-[15.5px] leading-[1.85] text-ink">{product.summary}</p>
      </AccordionRow>
    </div>
  )
}

function AccordionRow({
  id,
  title,
  index,
  children,
}: {
  id: string
  title: string
  index: number
  children: ReactNode
}) {
  const [open, setOpen] = useState(true)
  return (
    <div>
      <h4>
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls={id}
          className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-cream-50 sm:px-7 sm:py-5"
        >
          <span className="flex items-center gap-4 font-display text-[16px] font-semibold text-heading sm:text-[17px]">
            <span className="font-serif text-[20px] text-brown-500/70">{String(index).padStart(2, '0')}</span>
            {title}
          </span>
          <ChevronDown
            size={18}
            className={`shrink-0 text-heading transition-transform duration-300 ease-premium ${open ? 'rotate-180' : ''}`}
          />
        </button>
      </h4>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            id={id}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.4, ease: easePremium }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-6 pt-1 sm:px-7 sm:pb-7">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

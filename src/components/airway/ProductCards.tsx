import { motion } from 'framer-motion'
import type { AirwayProduct } from '../../data/airway'
import { easePremium } from '../../lib/motion'
import { ImagePlaceholder } from '../ui/ImagePlaceholder'
import { Reveal } from '../ui/Reveal'

type ProductCardsProps = {
  products: AirwayProduct[]
  selectedId: string
  onSelect: (id: string) => void
  /** Accessible name for the section. */
  label?: string
  /** Grid column classes; defaults to the 5-up Airway layout. */
  gridClassName?: string
}

/** Product selector: 5 columns on desktop, 3 / 2 / 1 on smaller screens. */
export function ProductCards({
  products,
  selectedId,
  onSelect,
  label = 'EEVA anesthesia and critical care products',
  gridClassName = 'sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 lg:gap-4 xl:gap-5',
}: ProductCardsProps) {
  return (
    <section aria-label={label} className="bg-white pt-16 sm:pt-20 lg:pt-24">
      <div className="container-site">
        <ul className={`grid grid-cols-1 gap-5 ${gridClassName}`}>
          {products.map((product, i) => (
            <li key={product.id} className="contents">
              <Reveal delay={i * 0.07} y={24} amount={0.15} className="h-full">
                <ProductCard
                  product={product}
                  selected={product.id === selectedId}
                  onSelect={() => onSelect(product.id)}
                />
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function ProductCard({
  product,
  selected,
  onSelect,
}: {
  product: AirwayProduct
  selected: boolean
  onSelect: () => void
}) {
  return (
    <motion.button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-controls="product-details"
      whileHover={{ y: -6 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.35, ease: easePremium }}
      className={`group relative flex h-full w-full flex-col overflow-hidden rounded-2xl border text-left transition-[box-shadow,background-color,border-color] duration-500 ease-premium ${
        selected
          ? 'border-brown-600 bg-cream-50 shadow-[0_24px_44px_-24px_rgba(67,35,27,0.45)]'
          : 'border-brown-600/10 bg-white shadow-[0_10px_28px_-22px_rgba(67,35,27,0.35)] hover:border-brown-600/30 hover:shadow-[0_24px_40px_-24px_rgba(67,35,27,0.4)]'
      }`}
    >
      <div className="overflow-hidden">
        {/* FINAL IMAGE: {product.imagePlaceholder} — 4:3 product photograph */}
        <ImagePlaceholder
          name={product.imagePlaceholder}
          hint={product.imageHint}
          labelPosition="bottom-right"
          className="aspect-[4/3] w-full transition-transform duration-[900ms] ease-premium group-hover:scale-[1.05]"
        />
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-[15.5px] font-semibold leading-[1.35] text-heading">{product.name}</h3>
        <p className="mt-2.5 text-[13.5px] leading-[1.65] text-ink-soft">{product.cardDescription}</p>
        <span
          className={`mt-auto inline-flex items-center gap-2 pt-4 font-display text-[12.5px] font-semibold uppercase tracking-[0.14em] ${
            selected ? 'text-brown-600' : 'text-brown-500/80'
          }`}
        >
          <span
            aria-hidden
            className={`h-[2px] rounded-full bg-current transition-all duration-500 ease-premium ${
              selected ? 'w-8' : 'w-4 group-hover:w-8'
            }`}
          />
          {selected ? 'Selected' : 'View details'}
        </span>
      </div>
    </motion.button>
  )
}

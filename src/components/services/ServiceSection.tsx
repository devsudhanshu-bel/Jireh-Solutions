import { motion } from 'framer-motion'
import type { ServiceDetail } from '../../data/services'
import { easePremium } from '../../lib/motion'
import { ImagePlaceholder } from '../ui/ImagePlaceholder'

/** Large image + content block; `imageSide` alternates the desktop layout and mobile stacks image-first. */
export function ServiceSection({ service }: { service: ServiceDetail }) {
  const imageLeft = service.imageSide === 'left'
  const x = imageLeft ? -32 : 32

  return (
    <article
      id={service.id}
      aria-labelledby={`${service.id}-title`}
      className="grid scroll-mt-28 items-center gap-8 lg:grid-cols-2 lg:gap-16"
    >
      <motion.div
        initial={{ opacity: 0, x }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.9, ease: easePremium }}
        className={`overflow-hidden rounded-3xl ${imageLeft ? '' : 'lg:order-2'}`}
      >
        {/* FINAL IMAGE: {service.imagePlaceholder} — 4:3 service photograph */}
        <ImagePlaceholder
          name={service.imagePlaceholder}
          hint={service.imageHint}
          labelPosition="bottom-right"
          className="aspect-[4/3] w-full"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, x: -x }}
        whileInView={{ opacity: 1, x: 0 }}
        viewport={{ once: true, amount: 0.25 }}
        transition={{ duration: 0.9, ease: easePremium, delay: 0.1 }}
        className={imageLeft ? '' : 'lg:order-1'}
      >
        <span aria-hidden className="block h-[2px] w-14 rounded-full bg-heading-warm" />
        <h3
          id={`${service.id}-title`}
          className="mt-6 font-serif text-[clamp(1.9rem,3.2vw,2.75rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-heading"
        >
          {service.title}
        </h3>
        <p className="mt-5 text-[16px] leading-[1.85] text-ink sm:text-[17px]">{service.description}</p>
      </motion.div>
    </article>
  )
}

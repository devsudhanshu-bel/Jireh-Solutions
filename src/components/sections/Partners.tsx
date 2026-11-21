import { motion } from 'framer-motion'
import { partners } from '../../data/partners'
import { easePremium } from '../../lib/motion'
import { Reveal } from '../ui/Reveal'
import { SectionEyebrow } from '../ui/SectionEyebrow'

export function Partners() {
  return (
    <section id="partners" aria-labelledby="partners-title" className="bg-white pb-10 pt-2 sm:pb-12 lg:pb-14">
      <div className="container-site text-center">
        <Reveal>
          <SectionEyebrow variant="rule-only" className="mx-auto w-16 sm:w-24" />
          <h2
            id="partners-title"
            className="mt-6 font-display text-[clamp(2rem,3vw,2.625rem)] font-semibold tracking-[-0.025em] text-heading-warm"
          >
            Our Channel Partners
          </h2>
        </Reveal>

        <ul className="mt-8 grid grid-cols-2 items-center gap-x-6 gap-y-6 sm:mt-10 md:grid-cols-4 lg:gap-x-10">
          {partners.map((p, i) => (
            <motion.li
              key={p.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.4 }}
              transition={{ duration: 0.8, ease: easePremium, delay: 0.1 * i }}
              className="flex h-28 items-center justify-center sm:h-36 lg:h-40"
            >
              {/* Original partner logo — displayed unmodified */}
              <img
                src={p.logo}
                alt={p.name}
                width={p.width}
                height={p.height}
                loading="lazy"
                decoding="async"
                className={`w-auto max-w-full object-contain transition-transform duration-500 ease-premium hover:-translate-y-1 hover:scale-[1.03] ${p.className}`}
              />
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  )
}

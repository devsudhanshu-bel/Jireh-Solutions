import { motion } from 'framer-motion'
import { services } from '../../data/site'
import { ArrowRight } from '../ui/icons'
import { ImagePlaceholder } from '../ui/ImagePlaceholder'
import { easePremium } from '../../lib/motion'
import { Reveal } from '../ui/Reveal'
import { SectionEyebrow } from '../ui/SectionEyebrow'

export function Services() {
  return (
    <section id="services" aria-labelledby="services-title" className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="container-site grid gap-12 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,2.4fr)] lg:gap-10 xl:gap-14">
        {/* Intro column */}
        <Reveal className="lg:pt-2">
          <SectionEyebrow>{services.eyebrow}</SectionEyebrow>
          <h2
            id="services-title"
            className="mt-5 font-display text-[clamp(2rem,3vw,2.625rem)] font-semibold leading-[1.15] tracking-[-0.025em] text-heading"
          >
            {services.titleLines.map((l) => (
              <span key={l} className="block whitespace-nowrap">
                {l}
              </span>
            ))}
          </h2>
          <p className="mt-5 max-w-[34ch] text-[16px] leading-[1.7] text-ink">{services.intro}</p>
          <a
            href={services.cta.href}
            className="group mt-8 inline-flex items-center gap-2.5 rounded-full bg-brown-700 px-7 py-3.5 font-display text-[15px] font-semibold text-white shadow-[0_14px_30px_-16px_rgba(67,35,27,0.9)] transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-espresso-900"
          >
            {services.cta.label}
            <ArrowRight className="transition-transform duration-300 ease-premium group-hover:translate-x-1" />
          </a>
        </Reveal>

        {/* Service cards */}
        <div className="grid gap-12 sm:grid-cols-2 sm:gap-5 xl:gap-6">
          {services.items.map((s, i) => (
            <motion.article
              key={s.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.9, ease: easePremium, delay: 0.12 * i }}
              className="group"
            >
              <a href={s.link.href} className="block overflow-hidden rounded-2xl" tabIndex={-1} aria-hidden>
                {/* FINAL IMAGE: {s.placeholder} — see `services.items[].placeholder` in data/site.ts */}
                <ImagePlaceholder
                  name={s.placeholder}
                  hint={s.id === 'npwt' ? 'NPWT device applied to a wound dressing' : 'Clinician applying an advanced wound dressing'}
                  className="aspect-[2.08/1] w-full transition-transform duration-[900ms] ease-premium group-hover:scale-[1.04]"
                />
              </a>
              <h3 className="mt-5 font-display text-[clamp(1.25rem,1.8vw,1.5rem)] font-semibold leading-[1.25] tracking-[-0.02em] text-heading">
                {s.titleLines.map((l) => (
                  <span key={l} className="block">
                    {l}
                  </span>
                ))}
              </h3>
              <p className="mt-3 text-[15px] leading-[1.7] text-ink sm:text-[16px]">{s.description}</p>
              <a
                href={s.link.href}
                className="group/link relative mt-5 inline-flex items-center gap-2.5 pb-1.5 font-display text-[15px] font-semibold text-heading"
              >
                {s.link.label}
                <ArrowRight className="transition-transform duration-300 ease-premium group-hover/link:translate-x-1" />
                <span aria-hidden className="absolute inset-x-0 bottom-0 h-px bg-heading/70" />
                <span
                  aria-hidden
                  className="absolute bottom-0 left-0 h-[2px] w-0 bg-heading transition-[width] duration-500 ease-premium group-hover/link:w-full"
                />
              </a>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  )
}

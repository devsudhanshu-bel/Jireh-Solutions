import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { careAreas } from '../../data/site'
import { ArrowRight } from '../ui/icons'
import { ImagePlaceholder } from '../ui/ImagePlaceholder'
import { easePremium } from '../../lib/motion'
import { Reveal } from '../ui/Reveal'
import { SectionEyebrow } from '../ui/SectionEyebrow'

export function CareAreas() {
  return (
    <section id="care-areas" aria-labelledby="care-areas-title" className="bg-white pb-16 sm:pb-20 lg:pb-24">
      <div className="container-site">
        <Reveal>
          <SectionEyebrow variant="rule-only" />
          <h2
            id="care-areas-title"
            className="mt-6 font-display text-[clamp(2rem,3vw,2.625rem)] font-semibold tracking-[-0.025em] text-heading"
          >
            {careAreas.title}
          </h2>
        </Reveal>

        <div className="mt-8 space-y-5 sm:mt-10 lg:space-y-6">
          {careAreas.items.map((area, i) => (
            <CareAreaCard key={area.id} area={area} index={i} />
          ))}
        </div>
      </div>
    </section>
  )
}

function CareAreaCard({ area, index }: { area: (typeof careAreas.items)[number]; index: number }) {
  const ref = useRef<HTMLAnchorElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start end', 'end start'] })
  const imgY = useTransform(scrollYProgress, [0, 1], ['-6%', '6%'])

  return (
    <motion.a
      ref={ref}
      href={area.href}
      initial={{ opacity: 0, y: 48 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 1, ease: easePremium, delay: index * 0.08 }}
      className="group relative block aspect-[5/4] overflow-hidden rounded-3xl sm:aspect-[16/9] lg:aspect-[3.4/1]"
      aria-label={area.titleLines.join(' ')}
    >
      <motion.div style={{ y: imgY }} className="absolute -inset-y-[8%] inset-x-0">
        {/*
          FINAL IMAGE: {area.placeholder}
          Reference (Airway Management) shows an EEVA anaesthesia mask with breathing tube on a teal surface.
        */}
        <ImagePlaceholder
          name={area.placeholder}
          hint={area.id === 'airway-management' ? 'EEVA anaesthesia mask with breathing circuit' : 'Advanced wound care product / dressing'}
          className="h-full w-full transition-transform duration-[1200ms] ease-premium group-hover:scale-[1.03]"
        />
      </motion.div>
      {/* Soft light fade behind the label, as in the reference */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-white/85 via-white/20 to-transparent" />

      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-6 sm:p-9 lg:px-14 lg:pb-12">
        <h3 className="flex gap-4 font-display text-[clamp(1.5rem,2.4vw,2.125rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-heading sm:gap-6">
          <span aria-hidden className="w-[3px] shrink-0 rounded-full bg-heading" />
          <span>
            {area.titleLines.map((l) => (
              <span key={l} className="block">
                {l}
              </span>
            ))}
          </span>
        </h3>
        <span
          aria-hidden
          className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-heading text-heading transition-all duration-500 ease-premium group-hover:bg-heading group-hover:text-white sm:size-14"
        >
          <ArrowRight size={22} className="transition-transform duration-500 ease-premium group-hover:translate-x-0.5" />
        </span>
      </div>
    </motion.a>
  )
}

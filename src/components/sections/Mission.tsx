import { mission } from '../../data/site'
import { ArrowRight } from '../ui/icons'
import { Reveal } from '../ui/Reveal'
import { SectionEyebrow } from '../ui/SectionEyebrow'

export function Mission() {
  return (
    <section aria-labelledby="mission-title" className="relative overflow-hidden bg-white">
      {/* Whole section is one link to /about-us. */}
      <a
        href="/about-us"
        aria-label="Learn more about Jireh Healthcare Solutions — About Us"
        className="group block py-16 transition-colors duration-500 ease-premium hover:bg-cream-50 focus-visible:bg-cream-50 sm:py-20 lg:py-24"
      >
      <div className="container-site text-center">
        <Reveal>
          <SectionEyebrow variant="center">{mission.eyebrow}</SectionEyebrow>
        </Reveal>
        <Reveal delay={0.08}>
          <h2
            id="mission-title"
            className="mx-auto mt-6 max-w-[820px] text-balance font-display text-[clamp(1.75rem,3vw,2.75rem)] font-semibold leading-[1.22] tracking-[-0.02em] text-heading"
          >
            {mission.title}
          </h2>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mx-auto mt-6 max-w-[760px] text-pretty text-[16px] leading-[1.7] text-ink sm:text-[17px] lg:text-[18px]">
            {mission.body}
          </p>
        </Reveal>
        <Reveal delay={0.24}>
          <span className="mt-8 inline-flex items-center gap-2 font-display text-[14px] font-semibold text-heading-warm">
            <span className="border-b border-transparent transition-colors duration-300 group-hover:border-heading-warm">
              About Us
            </span>
            <ArrowRight
              size={16}
              className="transition-transform duration-300 ease-premium group-hover:translate-x-1.5"
            />
          </span>
        </Reveal>
      </div>
      </a>
    </section>
  )
}

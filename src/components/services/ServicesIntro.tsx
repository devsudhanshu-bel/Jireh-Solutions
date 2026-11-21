import { servicesIntro } from '../../data/services'
import { Reveal } from '../ui/Reveal'
import { SectionEyebrow } from '../ui/SectionEyebrow'

/** Centered, constrained-width introduction (mirrors the Airway intro layout). */
export function ServicesIntro() {
  return (
    <section aria-labelledby="services-intro-title" className="bg-cream-50 py-16 sm:py-20 lg:py-24">
      <div className="container-site">
        <Reveal className="mx-auto max-w-[880px] text-center">
          <SectionEyebrow variant="rule-only" className="mx-auto" />
          <h2
            id="services-intro-title"
            className="mt-7 font-serif text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-heading"
          >
            {servicesIntro.title}
          </h2>
          <p className="mt-3 font-display text-[15px] font-semibold text-brown-500 sm:text-[16px]">
            {servicesIntro.subtitle}
          </p>
          <p className="mt-6 text-[16px] leading-[1.85] text-ink sm:text-[17px]">{servicesIntro.body}</p>
        </Reveal>
      </div>
    </section>
  )
}

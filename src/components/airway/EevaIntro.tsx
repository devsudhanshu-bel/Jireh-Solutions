
import { eevaIntro } from '../../data/airway'
import { Reveal } from '../ui/Reveal'
import { SectionEyebrow } from '../ui/SectionEyebrow'

/** EEVA brand introduction. */
export function EevaIntro() {
  return (
    <section
      aria-labelledby="eeva-intro-title"
      className="bg-cream-50 py-16 sm:py-20 lg:py-24"
    >
      <div className="container-site">
        <Reveal className="mx-auto max-w-[880px] text-center">

          <SectionEyebrow variant="center">
            {eevaIntro.eyebrow}
          </SectionEyebrow>

          {/* Main Heading */}
          <h2
            id="eeva-intro-title"
            className="mt-7 font-serif text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-heading"
          >
            {eevaIntro.title}
          </h2>

          {/* Subtitle */}
          <p className="mt-3 font-display text-[15px] font-semibold text-brown-500 sm:text-[16px]">
            {eevaIntro.subtitle}
          </p>

          {/* Brand Description */}
          <p className="mt-6 text-[16px] leading-[1.85] text-ink sm:text-[17px]">
            {eevaIntro.body}
          </p>

        </Reveal>
      </div>
    </section>
  )
}

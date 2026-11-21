
import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { airwayHero } from '../../data/airway'
import { easePremium } from '../../lib/motion'
import { ImagePlaceholder } from '../ui/ImagePlaceholder'
import eevaLogo from '../../assets/logos/eeva-logo.png'

type AirwayHeroProps = {
  /** Heading text. Defaults to the Anesthesia and Critical Care hero. */
  title?: string
  titleId?: string
  imagePlaceholder?: string
  imageHint?: string
  /** Show the EEVA logo and tagline (Airway only). Other care areas pass false. */
  showBrand?: boolean
}

export function AirwayHero({
  title = airwayHero.title,
  titleId = 'airway-title',
  imagePlaceholder = airwayHero.imagePlaceholder,
  imageHint = airwayHero.imageHint,
  showBrand = true,
}: AirwayHeroProps = {}) {
  const ref = useRef<HTMLElement>(null)

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })

  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])

  return (
    <section
      ref={ref}
      aria-labelledby={titleId}
      className="relative isolate flex min-h-[380px] items-end overflow-hidden bg-espresso-900 pt-[68px] sm:min-h-[440px] sm:pt-[72px] lg:h-[60svh] lg:max-h-[600px]"
    >
      {/* Background */}
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 -z-20 scale-110"
      >
        <ImagePlaceholder
          name={imagePlaceholder}
          hint={imageHint}
          tone="dark"
          labelPosition="bottom-right"
          className="h-full w-full"
        />
      </motion.div>

      {/* Overlay */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-espresso-900/90 via-espresso-900/50 to-transparent"
      />

      <div className="container-site w-full pb-12 pt-16 sm:pb-16 lg:pb-20">
        <div className="lg:pl-[3.5%]">
          {showBrand && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.8,
                ease: easePremium,
                delay: 0.1,
              }}
              className="mb-5 mt-14 sm:mt-16 lg:mt-20"
            >
              <img
                src={eevaLogo}
                alt="EEVA - To Live"
                className="relative -left-6 top-8 h-auto w-[190px] object-contain sm:-left-7 sm:top-10 sm:w-[220px] lg:-left-11 lg:top-12 lg:w-[245px]"
                loading="eager"
                decoding="async"
              />
            </motion.div>
          )}

          {/* Heading */}
          <span className="block overflow-hidden pb-[0.1em]">
            <motion.h1
              id={titleId}
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              transition={{
                duration: 1,
                ease: easePremium,
                delay: 0.25,
              }}
              className="block font-serif text-[clamp(2.75rem,6vw,5rem)] font-semibold leading-[1.05] tracking-[-0.01em] text-white"
            >
              {title}

              {/* Shared teal blinking accent */}
              <span
                aria-hidden
                className="cursor-blink relative -bottom-[0.01em] ml-3 inline-block h-[0.1em] w-[0.9em] bg-teal sm:ml-4"
              />
            </motion.h1>
          </span>

          {showBrand && (
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.9,
                ease: easePremium,
                delay: 0.6,
              }}
              className="mt-4 font-serif text-[clamp(1.4rem,2.4vw,2rem)] italic text-cream-200"
            >
              {airwayHero.tagline}
            </motion.p>
          )}
        </div>
      </div>
    </section>
  )
}

import { motion, useScroll, useTransform } from 'framer-motion'
import { useRef } from 'react'
import { aboutBanner, aboutUs, leader, vision } from '../../data/about'
import { mission } from '../../data/site'
import { easePremium } from '../../lib/motion'
import { Expandable } from '../ui/Expandable'
import { ImagePlaceholder } from '../ui/ImagePlaceholder'
import { Reveal } from '../ui/Reveal'
import { SectionEyebrow } from '../ui/SectionEyebrow'

const serifHeading = 'font-serif font-semibold tracking-[-0.01em] text-heading'
const bodyText = 'text-[16px] leading-[1.8] text-ink sm:text-[17px]'


/** Section 1 — landing banner, mirrors the homepage hero treatment. */
export function AboutBanner() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end start'],
  })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '16%'])

  return (
    <section
      ref={ref}
      aria-labelledby="about-title"
      className="relative isolate flex min-h-[360px] items-end overflow-hidden bg-[#26302f] pt-[68px] sm:min-h-[420px] sm:pt-[72px] lg:h-[56svh] lg:max-h-[560px]"
    >
      <motion.div
        style={{ y: bgY }}
        className="absolute inset-0 -z-20 scale-110"
      >
        <ImagePlaceholder
          name="about-banner-placeholder"
          hint="About Us banner — healthcare / lifestyle photograph"
          tone="dark"
          labelPosition="bottom-right"
          className="h-full w-full"
        />
      </motion.div>

      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1f2b2b]/85 via-[#1f2b2b]/45 to-transparent"
      />

      <div className="container-site w-full pb-12 pt-16 sm:pb-16 lg:pb-20">
        <div className="lg:pl-[3.5%]">
          <span className="block overflow-hidden pb-[0.1em]">
            <motion.h1
              id="about-title"
              initial={{ y: '105%' }}
              animate={{ y: '0%' }}
              transition={{ duration: 1, ease: easePremium, delay: 0.25 }}
              className="block font-serif text-[clamp(2.75rem,6vw,5rem)] font-semibold leading-[1.05] tracking-[-0.01em] text-white"
            >
              {aboutBanner.title}

              {/* Teal blinking accent aligned with the text baseline */}
              <span
                aria-hidden
                className="cursor-blink relative -bottom-[0.01em] ml-3 inline-block h-[0.1em] w-[0.9em] bg-teal sm:ml-4"
              />
            </motion.h1>
          </span>
        </div>
      </div>
    </section>
  )
}

/** Section 2 — vision statement. */
export function Vision() {
  return (
    <section aria-labelledby="vision-title" className="bg-white py-20 sm:py-28 lg:py-36">
      <div className="container-site text-center">
        <Reveal>
          <h2
            id="vision-title"
            className="font-display text-[12px] font-semibold uppercase tracking-[0.28em] text-heading-warm sm:text-[13px]"
          >
            {vision.eyebrow}
          </h2>
        </Reveal>
        <Reveal delay={0.1}>
          <p
            className={`mx-auto mt-8 max-w-[880px] text-balance text-[clamp(1.6rem,3.2vw,2.75rem)] font-medium leading-[1.28] ${serifHeading}`}
          >
            {vision.statement}
          </p>
        </Reveal>
      </div>
    </section>
  )
}

/** Section 3 — mission (expandable). */
export function MissionSection() {
  return (
    <section aria-labelledby="about-mission-title" className="border-t border-brown-600/10 bg-white py-16 sm:py-20 lg:py-24">
      <div className="container-site grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <Reveal>
          <SectionEyebrow>{mission.eyebrow}</SectionEyebrow>
          <h2
            id="about-mission-title"
            className={`mt-6 max-w-[520px] text-balance text-[clamp(1.9rem,3.2vw,2.9rem)] leading-[1.15] ${serifHeading}`}
          >
            {mission.title}
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="lg:pt-12">
          <Expandable>
            <p className={bodyText}>{mission.body}</p>
          </Expandable>
        </Reveal>
      </div>
    </section>
  )
}

/** Section 4 — about the company (expandable). */
export function AboutCompany() {
  return (
    <section aria-labelledby="about-company-title" className="border-t border-brown-600/10 bg-white py-16 sm:py-20 lg:py-24">
      <div className="container-site grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <Reveal>
          <SectionEyebrow>{aboutUs.title}</SectionEyebrow>
          <h2 id="about-company-title" className={`mt-6 text-[clamp(1.9rem,3.2vw,2.9rem)] leading-[1.15] ${serifHeading}`}>
            Our Story
          </h2>
        </Reveal>
        <Reveal delay={0.1} className="lg:pt-12">
          <Expandable>
            <div className="space-y-5">
              {aboutUs.paragraphs.map((p) => (
                <p key={p.slice(0, 24)} className={bodyText}>
                  {p}
                </p>
              ))}
            </div>
          </Expandable>
        </Reveal>
      </div>
    </section>
  )
}

/** Section 5 — leadership. Same two-column layout and styling as Our Story. */
export function Leadership() {
  return (
    <section aria-labelledby="leadership-title" className="border-t border-brown-600/10 bg-white py-16 sm:py-20 lg:py-24">
      <div className="container-site grid gap-8 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-20">
        <Reveal>
          <SectionEyebrow>{leader.title}</SectionEyebrow>
          <h2 id="leadership-title" className={`mt-6 text-[clamp(1.9rem,3.2vw,2.9rem)] leading-[1.15] ${serifHeading}`}>
            {leader.name}
          </h2>
          <p className="mt-3 font-display text-[14px] font-medium uppercase tracking-[0.14em] text-heading-warm">{leader.role}</p>
        </Reveal>
        <Reveal delay={0.1} className="lg:pt-12">
          <Expandable>
            <div className="space-y-5">
              {leader.paragraphs.map((p) => (
                <p key={p.slice(0, 24)} className={bodyText}>
                  {p}
                </p>
              ))}
            </div>
          </Expandable>
        </Reveal>
      </div>
    </section>
  )
}

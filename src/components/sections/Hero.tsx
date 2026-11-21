import { motion, useScroll, useTransform } from 'framer-motion'
import { useId, useRef, useState } from 'react'
import { fullVideo, hero } from '../../data/site'
import { ImagePlaceholder } from '../ui/ImagePlaceholder'
import { Modal } from '../ui/Modal'
import { VideoFrame } from '../ui/VideoFrame'
import { easePremium } from '../../lib/motion'
import { Play } from '../ui/icons'

const line = {
  hidden: { y: '105%' },
  show: (i: number) => ({ y: '0%', transition: { duration: 1, ease: easePremium, delay: 0.35 + i * 0.12 } }),
}

export function Hero() {
  const ref = useRef<HTMLElement>(null)
  const [videoOpen, setVideoOpen] = useState(false)
  const videoTitleId = useId()
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end start'] })
  const bgY = useTransform(scrollYProgress, [0, 1], ['0%', '18%'])
  const contentY = useTransform(scrollYProgress, [0, 1], ['0%', '30%'])
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0])

  const lines = [...hero.titleLines]

  return (
    <section
      id="top"
      ref={ref}
      aria-labelledby="hero-title"
      className="relative isolate flex min-h-[640px] items-center overflow-hidden bg-[#26302f] pt-[68px] sm:pt-[72px] lg:h-[88svh] lg:max-h-[860px] lg:min-h-[640px]"
    >
      {/* Background media with gentle parallax */}
      <motion.div style={{ y: bgY }} className="absolute inset-0 -z-20 scale-110">
        {/*
          FINAL IMAGE / VIDEO: hero banner — the client will supply a video clip
          (company document: "Banner: we will provide a video clip").
          Replace with:
            <video className="h-full w-full object-cover" autoPlay muted loop playsInline poster="/media/hero-poster.jpg">
              <source src="/media/hero.mp4" type="video/mp4" />
            </video>
          Reference shows a clinician in an operating theatre, subject on the right.
        */}
        <ImagePlaceholder
          name="hero-video-placeholder"
          hint="Hero banner video — clinician in operating theatre"
          tone="dark"
          labelPosition="bottom-right"
          className="h-full w-full"
        />
      </motion.div>
      {/* Readability overlay (left-weighted, as in the reference) */}
      <div
        aria-hidden
        className="absolute inset-0 -z-10 bg-gradient-to-r from-[#1f2b2b]/85 via-[#1f2b2b]/45 to-transparent"
      />

      <motion.div style={{ y: contentY, opacity: contentOpacity }} className="container-site w-full py-16 sm:py-20">
        <div className="max-w-[640px] lg:pl-[3.5%]">
          <h1
            id="hero-title"
            className="font-display text-[clamp(2.25rem,4vw,3.5rem)] font-semibold leading-[1.1] tracking-[-0.025em] text-white"
          >
            {lines.map((text, i) => (
              <span key={text} className="block overflow-hidden pb-[0.06em]">
                <motion.span className="block" variants={line} initial="hidden" animate="show" custom={i}>
                  {text}
                </motion.span>
              </span>
            ))}
            <span className="block overflow-hidden pb-[0.08em]">
              <motion.span
                className="flex items-end gap-3 sm:gap-4"
                variants={line}
                initial="hidden"
                animate="show"
                custom={lines.length}
              >
                <span className="text-gold">{hero.highlight}</span>
                <span aria-hidden className="cursor-blink mb-[0.16em] inline-block h-[0.1em] w-[0.9em] bg-teal" />
              </motion.span>
            </span>
          </h1>

          <motion.button
            type="button"
            onClick={() => setVideoOpen(true)}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, ease: easePremium, delay: 1 }}
            className="group mt-9 inline-flex items-center gap-3 rounded-full bg-white px-7 py-3.5 font-display text-[16px] font-semibold text-teal-deep shadow-[0_18px_40px_-18px_rgba(0,0,0,0.55)] transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:shadow-[0_22px_44px_-16px_rgba(0,0,0,0.6)] sm:mt-10"
          >
            <Play size={16} className="transition-transform duration-300 ease-premium group-hover:scale-110" />
            {hero.videoCta}
          </motion.button>
        </div>
      </motion.div>

      {/* Centre play affordance, as in the reference */}
      <motion.button
        type="button"
        onClick={() => setVideoOpen(true)}
        aria-label="Play video"
        initial={{ opacity: 0, scale: 0.85 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1, ease: easePremium, delay: 1.2 }}
        className="group absolute left-1/2 top-1/2 hidden size-[88px] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white/80 text-white backdrop-blur-[2px] transition-colors duration-300 hover:border-white hover:bg-white/10 lg:grid"
      >
        <span aria-hidden className="absolute inset-0 animate-ping rounded-full border border-white/30 [animation-duration:2.6s]" />
        <Play size={28} className="ml-1 transition-transform duration-300 ease-premium group-hover:scale-110" />
      </motion.button>

      <Modal
        open={videoOpen}
        onClose={() => setVideoOpen(false)}
        labelledBy={videoTitleId}
        tone="dark"
        centered
        className="max-w-5xl"
      >
        <div className="p-3 pt-14 sm:p-5 sm:pt-16">
          <h2 id={videoTitleId} className="sr-only">
            Jireh Healthcare Solutions video
          </h2>
          <VideoFrame src={fullVideo.src} poster={fullVideo.poster} title="Jireh Healthcare Solutions video" />
        </div>
      </Modal>
    </section>
  )
}


import { type ComponentType } from 'react'
import { company, socials, solutions } from '../../data/site'
import {
  ArrowRight,
  Bandage,
  Facebook,
  Instagram,
  Layers,
  LinkedIn,
  Mail,
  MapFold,
  MapPin,
  Lungs,
  YouTube,
} from '../ui/icons'
import { Reveal } from '../ui/Reveal'

const socialIcons: Record<
  (typeof socials)[number]['id'],
  ComponentType<{ size?: number }>
> = {
  linkedin: LinkedIn,
  youtube: YouTube,
  instagram: Instagram,
  facebook: Facebook,
}

const solutionIcons = {
  bandage: Bandage,
  layers: Layers,
  lungs: Lungs,
}

export function Footer() {
  return (
    <footer id="contact" className="bg-espresso-900 text-footer-text">
      <div className="container-site pb-6 pt-12 sm:pt-14">
        <Reveal
          amount={0.1}
          className="grid grid-cols-1 gap-12 sm:grid-cols-2 lg:grid-cols-[1fr_1.2fr_1.2fr] lg:gap-16"
        >
          {/* Social Links */}
          <div>
            <h2 className="font-display text-[20px] font-semibold text-white sm:text-[22px]">
              Follow Us
            </h2>

            <ul className="mt-5 space-y-4" aria-label="Social media links">
              {socials.map((s) => {
                const Icon = socialIcons[s.id]

                return (
                  <li key={s.id}>
                    <a
                      href={s.href}
                      aria-label={s.label}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="group inline-flex items-center gap-3 text-[15px] text-footer-text/85 transition-colors duration-300 hover:text-gold"
                    >
                      <span className="grid size-9 shrink-0 place-items-center rounded-lg border border-footer-text/30 transition-all duration-300 ease-premium group-hover:-translate-y-0.5 group-hover:border-gold group-hover:text-gold">
                        <Icon size={17} />
                      </span>

                      <span>{s.label}</span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Our Solutions */}
          <div>
            <h2 className="font-display text-[20px] font-semibold text-white sm:text-[22px]">
              Our Solutions
            </h2>

            <ul className="mt-5 space-y-5">
              {solutions.map((s) => {
                const Icon = solutionIcons[s.icon]
                const solutionName = s.label.join(' ').toLowerCase()

                const isNPWT =
                  s.id.toLowerCase().includes('npwt') ||
                  solutionName.includes('npwt') ||
                  solutionName.includes('negative pressure wound therapy')

                return (
                  <li key={s.id}>
                    <a
                      href={isNPWT ? '/services#npwt' : s.href}
                      className="group flex items-center gap-3 sm:gap-4"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-xl border border-footer-text/35 transition-all duration-300 ease-premium group-hover:border-gold group-hover:text-gold sm:size-12">
                        <Icon size={22} />
                      </span>

                      <span className="text-[14px] leading-snug text-footer-text/85 transition-colors duration-300 group-hover:text-gold sm:text-[15px]">
                        {s.label.map((l) => (
                          <span key={l} className="block">
                            {l}
                          </span>
                        ))}

                        {'sub' in s && (
                          <span className="block text-[13px] leading-snug text-footer-text/65">
                            {s.sub}
                          </span>
                        )}
                      </span>
                    </a>
                  </li>
                )
              })}
            </ul>
          </div>

          {/* Contact Us */}
          <div>
            <h2 className="font-display text-[20px] font-semibold text-white sm:text-[22px]">
              Contact Us
            </h2>

            <ul className="mt-5 space-y-4">
              <li className="flex gap-3.5">
                <Mail
                  size={20}
                  className="mt-0.5 shrink-0 text-footer-text/70"
                />

                <a
                  href={`mailto:${company.email}`}
                  className="break-all text-[14.5px] text-footer-text/85 transition-colors hover:text-gold sm:break-normal"
                >
                  {company.email}
                </a>
              </li>

              <li className="flex gap-3.5">
                <MapPin
                  size={20}
                  className="mt-0.5 shrink-0 text-footer-text/70"
                />

                <address className="text-[14.5px] not-italic leading-[1.6] text-footer-text/85">
                  {company.addressLines.map((l) => (
                    <span key={l} className="block">
                      {l}
                    </span>
                  ))}
                </address>
              </li>
            </ul>

            <a
              href={company.mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 inline-flex items-center gap-2.5 rounded-full border border-footer-text/50 px-5 py-2.5 font-display text-[14px] font-semibold transition-all duration-300 ease-premium hover:border-gold hover:bg-gold hover:text-espresso-900"
            >
              <MapFold size={18} />
              View on Map
              <ArrowRight
                size={16}
                className="transition-transform duration-300 ease-premium group-hover:translate-x-1"
              />
            </a>
          </div>
        </Reveal>

        {/* Copyright */}
        <div className="mt-12 border-t border-footer-text/15 pt-6 text-center">
          <p className="text-[13.5px] text-footer-text/70 sm:text-[14px]">
            © 2026 Jireh Healthcare Solutions. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}

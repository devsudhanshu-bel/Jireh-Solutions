import { useEffect } from 'react'
import { company } from '../data/site'
import { useEnquiry } from '../components/enquiry/useEnquiry'
import { ArrowRight } from '../components/ui/icons'

/**
 * Custom 404 route.
 *
 * A static host cannot change the HTTP status of an SPA fallback, so this page also
 * sets `noindex` while it is mounted. The host-level 404 (public/404.html + the
 * netlify.toml catch-all) covers direct hits and keeps crawlers out of soft-404s.
 */
export default function NotFound() {
  const { openEnquiry } = useEnquiry()

  useEffect(() => {
    const previousTitle = document.title
    document.title = 'Page not found — Jireh Healthcare Solutions'

    const meta = document.createElement('meta')
    meta.name = 'robots'
    meta.content = 'noindex, nofollow'
    meta.dataset.notFound = 'true'
    document.head.appendChild(meta)

    return () => {
      document.title = previousTitle
      meta.remove()
    }
  }, [])

  return (
    <section className="bg-cream-50 py-20 sm:py-28 lg:py-32">
      <div className="container-site">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-display text-[13px] font-semibold uppercase tracking-[0.18em] text-brown-500">
            Error 404
          </p>

          <h1 className="mt-4 font-serif text-[clamp(2.4rem,6vw,4rem)] font-semibold leading-[1.05] tracking-[-0.01em] text-heading">
            This page could not be found
          </h1>

          <p className="mx-auto mt-5 max-w-lg text-[17px] leading-relaxed text-ink">
            The link may be broken or the page may have moved. You can head back to the homepage, or get in touch and
            we will point you in the right direction.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/"
              className="group inline-flex items-center gap-3 rounded-full bg-brown-700 px-7 py-3.5 font-display text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-espresso-900"
            >
              Back to homepage
              <ArrowRight className="transition-transform duration-300 ease-premium group-hover:translate-x-1" />
            </a>

            <button
              type="button"
              onClick={openEnquiry}
              className="inline-flex items-center gap-3 rounded-full border-2 border-brown-700 px-7 py-3 font-display text-[15px] font-semibold text-brown-700 transition-colors duration-300 hover:bg-brown-700 hover:text-white"
            >
              Enquire now
            </button>
          </div>

          <nav aria-label="Helpful links" className="mt-12">
            <ul className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-[14px] font-medium text-ink">
              <li>
                <a className="underline-offset-4 hover:text-heading hover:underline" href="/about-us">
                  About us
                </a>
              </li>
              <li>
                <a className="underline-offset-4 hover:text-heading hover:underline" href="/services">
                  Services
                </a>
              </li>
              <li>
                <a className="underline-offset-4 hover:text-heading hover:underline" href="/care-areas/advanced-wound-care">
                  Advanced wound care
                </a>
              </li>
              <li>
                <a className="underline-offset-4 hover:text-heading hover:underline" href="/care-areas/airway-management">
                  Airway management
                </a>
              </li>
            </ul>
          </nav>

          <p className="mt-10 text-sm text-ink-soft">
            Still stuck? Email{' '}
            <a className="font-medium text-brown-600 underline underline-offset-4" href={`mailto:${company.email}`}>
              {company.email}
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}

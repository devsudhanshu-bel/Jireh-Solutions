import { useEffect } from 'react'
import { company } from '../data/site'
import { ArrowRight, Mail } from '../components/ui/icons'

/**
 * Public security policy page.
 *
 * This is the target of the `Policy:` and `Acknowledgments:` fields in
 * /.well-known/security.txt — keep the URL and the #acknowledgements anchor stable.
 */
export default function Security() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Security — Jireh Healthcare Solutions'
    return () => {
      document.title = previous
    }
  }, [])

  const reportUrl = `mailto:${company.email}?subject=${encodeURIComponent('Security report — Jireh Healthcare Solutions')}`

  return (
    <div className="bg-cream-50">
      {/* Hero */}
      <section className="border-b border-brown-500/15 py-16 sm:py-20">
        <div className="container-site">
          <div className="max-w-3xl">
            <p className="font-display text-[13px] font-semibold uppercase tracking-[0.18em] text-brown-500">
              Trust &amp; transparency
            </p>
            <h1 className="mt-4 font-serif text-[clamp(2.6rem,6vw,4.2rem)] font-semibold leading-[1.05] tracking-[-0.01em] text-heading">
              Security at Jireh
            </h1>
            <p className="mt-5 text-[17px] leading-relaxed text-ink sm:text-[19px]">
              We take the protection of our website, our systems and the information shared with us seriously. If you
              believe you have found a security weakness, please tell us privately so we can investigate and fix it.
            </p>
            <a
              href={reportUrl}
              className="group mt-8 inline-flex items-center gap-3 rounded-full bg-brown-700 px-7 py-3.5 font-display text-[15px] font-semibold text-white transition-colors duration-300 hover:bg-espresso-900"
            >
              <Mail size={18} />
              Report a concern
              <ArrowRight className="transition-transform duration-300 ease-premium group-hover:translate-x-1" />
            </a>
          </div>
        </div>
      </section>

      {/* Reporting */}
      <section className="py-14 sm:py-18">
        <div className="container-site">
          <div className="grid gap-6 lg:grid-cols-2 lg:gap-8">
            <div className="rounded-2xl border border-brown-500/15 bg-white p-7 shadow-sm sm:p-9">
              <h2 className="font-display text-[22px] font-semibold text-heading">How to report</h2>
              <p className="mt-4 text-[15.5px] leading-relaxed text-ink">
                Please email{' '}
                <a
                  href={reportUrl}
                  className="font-medium text-brown-600 underline underline-offset-4 hover:text-heading"
                >
                  {company.email}
                </a>{' '}
                with details of what you found. Do <strong className="font-semibold text-heading">not</strong> open a
                public issue or social media post before we have had a chance to respond.
              </p>
              <p className="mt-4 text-[15.5px] leading-relaxed text-ink">
                Include the affected page or endpoint, the steps you took, what you observed and the impact you believe
                it has. Screenshots or a short proof of concept are helpful. Please do not submit real patient or
                customer information with your report.
              </p>
            </div>

            <div className="rounded-2xl border border-brown-500/15 bg-white p-7 shadow-sm sm:p-9">
              <h2 className="font-display text-[22px] font-semibold text-heading">What happens next</h2>
              <ul className="mt-5 space-y-4">
                {[
                  ['Acknowledgement', 'Within 3 business days of your report.'],
                  ['Triage', 'We investigate and confirm the issue within 7 days.'],
                  ['Fix & verification', 'We patch the root cause, retest, and keep you informed until it is closed.'],
                  ['Credit', 'If you would like to be acknowledged, tell us how you would like to be named.'],
                ].map(([title, detail]) => (
                  <li key={title} className="flex gap-4">
                    <span
                      aria-hidden="true"
                      className="mt-1.5 size-2 shrink-0 rounded-full bg-teal-deep"
                    />
                    <p className="text-[15.5px] leading-relaxed text-ink">
                      <strong className="font-semibold text-heading">{title}.</strong> {detail}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Scope + responsible testing */}
      <section className="pb-14 sm:pb-18">
        <div className="container-site grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div>
            <h2 className="font-display text-[22px] font-semibold text-heading">Scope</h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink">
              This website, its enquiry and appointment-request APIs, and the infrastructure we operate for them are in
              scope. Third-party services we rely on (hosting, email and database providers) are not covered by this
              policy — please report issues with those directly to the provider.
            </p>
          </div>
          <div>
            <h2 className="font-display text-[22px] font-semibold text-heading">Responsible testing</h2>
            <p className="mt-4 text-[15.5px] leading-relaxed text-ink">
              Please avoid destructive testing, denial-of-service activity, or anything that could affect other users or
              expose real customer data. Use test accounts and test records where possible. We support good-faith
              security research carried out in line with this policy.
            </p>
          </div>
        </div>
      </section>

      {/* Acknowledgements */}
      <section id="acknowledgements" className="border-t border-brown-500/15 py-14 sm:py-16">
        <div className="container-site">
          <p className="font-display text-[13px] font-semibold uppercase tracking-[0.18em] text-brown-500">
            Acknowledgements
          </p>
          <h2 className="mt-3 font-display text-[22px] font-semibold text-heading">With thanks</h2>
          <p className="mt-4 max-w-2xl text-[15.5px] leading-relaxed text-ink">
            We are grateful to the researchers who help keep our services safe. No public acknowledgements have been
            published yet. If you would like to be credited for a report, let us know your preferred name and link when
            you contact us.
          </p>
          <p className="mt-8 text-[13.5px] text-ink-soft">
            Security researchers looking for our machine-readable contact details can visit{' '}
            <a
              href="/.well-known/security.txt"
              className="text-brown-600 underline underline-offset-4 hover:text-heading"
            >
              /.well-known/security.txt
            </a>
            .
          </p>
        </div>
      </section>
    </div>
  )
}

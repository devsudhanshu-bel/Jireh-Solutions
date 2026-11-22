import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from 'react'
import { appointmentContent, type ServiceChoice } from '../../data/services'
import { company } from '../../data/site'
import { failureMessage, submitForm } from '../../lib/api'
import { Reveal } from '../ui/Reveal'
import { ArrowRight } from '../ui/icons'

type Fields = { name: string; contact: string; address: string; email: string; service: ServiceChoice | '' }
type Errors = Partial<Record<keyof Fields, string>>
type Status = 'idle' | 'loading' | 'success' | 'error'

const empty: Fields = { name: '', contact: '', address: '', email: '', service: '' }

// Same rules as the existing enquiry form; the phone check also requires at least 7 digits.
function validate(v: Fields): Errors {
  const e: Errors = {}
  if (!v.name.trim()) e.name = 'Please enter your name.'
  const contact = v.contact.trim()
  if (!contact) e.contact = 'Please enter your contact number.'
  else if (!/^[+]?[\d\s-]{7,15}$/.test(contact) || contact.replace(/\D/g, '').length < 7)
    e.contact = 'Please enter a valid contact number.'
  const email = v.email.trim()
  if (!email) e.email = 'Please enter your email address.'
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = 'Please enter a valid email address.'
  if (!v.service) e.service = 'Please select a service.'
  return e
}

const fieldClass =
  'w-full rounded-xl border bg-white px-4 py-3 text-base text-heading sm:text-[15px] placeholder:text-ink-soft/60 transition-colors duration-300 focus:border-brown-600 focus:outline-none focus:ring-2 focus:ring-brown-600/15'

export function AppointmentForm() {
  const uid = useId()
  const [values, setValues] = useState<Fields>(empty)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<Status>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [honeypot, setHoneypot] = useState('') // spam trap: hidden from people, filled by bots
  const openedAt = useRef(0) // second trap: bots submit instantly (set on mount)
  useEffect(() => {
    openedAt.current = Date.now()
  }, [])

  const update =
    (key: keyof Fields) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setValues((v) => ({ ...v, [key]: e.target.value }))
      if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
      if (status === 'error') setStatus('idle')
    }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (status === 'loading') return
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return

    setStatus('loading')
    const result = await submitForm('/api/bookings', {
      name: values.name.trim(),
      contact: values.contact.trim(),
      address: values.address.trim(),
      email: values.email.trim(),
      service: values.service,
      website: honeypot,
      elapsedMs: Date.now() - openedAt.current,
    })
    if (result.ok) {
      setValues(empty)
      setHoneypot('')
      setStatus('success')
    } else if (result.kind === 'validation') {
      setErrors(result.fields as Errors)
      setStatus('idle')
    } else {
      setErrorMessage(failureMessage[result.kind])
      setStatus('error')
    }
  }

  const err = (key: keyof Fields) => (errors[key] ? `${uid}-${key}-err` : undefined)
  const border = (key: keyof Fields) => (errors[key] ? 'border-red-400' : 'border-cream-300')
  const labelClass = 'mb-1.5 block font-display text-sm font-medium text-heading'
  const errMsg = (k: keyof Fields) =>
    errors[k] ? (
      <span id={`${uid}-${k}-err`} role="alert" className="mt-1.5 block text-sm text-red-700">
        {errors[k]}
      </span>
    ) : null

  return (
    <section
      id="book-appointment"
      aria-labelledby="book-appointment-title"
      className="scroll-mt-24 bg-white py-16 sm:py-20 lg:py-24"
    >
      <div className="container-site">
        <Reveal className="mx-auto max-w-[820px] rounded-3xl bg-cream-50 p-6 sm:p-10 lg:p-14">
          <h2
            id="book-appointment-title"
            className="text-center font-serif text-[clamp(2rem,3.6vw,3rem)] font-semibold leading-[1.1] tracking-[-0.01em] text-heading"
          >
            {appointmentContent.title}
          </h2>

          {status === 'success' ? (
            <div role="status" className="py-10 text-center">
              <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-brand-cream text-brown-700">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="font-display text-[22px] font-semibold text-heading">Thank you</p>
              <p className="mx-auto mt-3 max-w-sm text-ink">
                Your appointment request has been sent. We will get back to you shortly.
              </p>
              <button
                type="button"
                onClick={() => setStatus('idle')}
                className="mt-8 rounded-full border-2 border-brown-700 px-6 py-2.5 font-display text-[14px] font-semibold text-brown-700 transition-colors duration-300 hover:bg-brown-700 hover:text-white"
              >
                Book another
              </button>
            </div>
          ) : (
            <form noValidate onSubmit={onSubmit} className="mt-8 sm:mt-10">
              <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                <input
                  name="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                />
              </div>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block min-w-0">
                  <span className={labelClass}>
                    Name <span aria-hidden>*</span>
                  </span>
                  <input
                    name="name"
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="Your full name"
                    value={values.name}
                    onChange={update('name')}
                    aria-invalid={!!errors.name}
                    aria-describedby={err('name')}
                    className={`${fieldClass} ${border('name')}`}
                  />
                  {errMsg('name')}
                </label>

                <label className="block min-w-0">
                  <span className={labelClass}>
                    Contact Number <span aria-hidden>*</span>
                  </span>
                  <input
                    name="contact"
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    placeholder="+91 00000 00000"
                    value={values.contact}
                    onChange={update('contact')}
                    aria-invalid={!!errors.contact}
                    aria-describedby={err('contact')}
                    className={`${fieldClass} ${border('contact')}`}
                  />
                  {errMsg('contact')}
                </label>

                <label className="block min-w-0 sm:col-span-2">
                  <span className={labelClass}>
                    Email ID <span aria-hidden>*</span>
                  </span>
                  <input
                    name="email"
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    required
                    placeholder="you@example.com"
                    value={values.email}
                    onChange={update('email')}
                    aria-invalid={!!errors.email}
                    aria-describedby={err('email')}
                    className={`${fieldClass} ${border('email')}`}
                  />
                  {errMsg('email')}
                </label>

                <label className="block sm:col-span-2">
                  <span className={labelClass}>Address</span>
                  <textarea
                    name="address"
                    rows={3}
                    autoComplete="street-address"
                    placeholder="Your address"
                    value={values.address}
                    onChange={update('address')}
                    className={`${fieldClass} resize-none border-cream-300`}
                  />
                </label>

                <fieldset
                  className="sm:col-span-2"
                  aria-invalid={!!errors.service}
                  aria-describedby={err('service')}
                >
                  <legend className={labelClass}>
                    Service <span aria-hidden>*</span>
                  </legend>
                  <div className="grid grid-cols-3 gap-3">
                    {appointmentContent.serviceOptions.map((o) => {
                      const checked = values.service === o.value
                      return (
                        <label
                          key={o.value}
                          className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border px-3 py-3 font-display text-[14px] font-semibold transition-colors duration-300 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brown-600/30 ${
                            checked
                              ? 'border-brown-700 bg-brown-700 text-white'
                              : `${errors.service ? 'border-red-400' : 'border-cream-300'} bg-white text-heading hover:border-brown-600/50`
                          }`}
                        >
                          <input
                            type="radio"
                            name="service"
                            value={o.value}
                            checked={checked}
                            onChange={() => {
                              setValues((v) => ({ ...v, service: o.value }))
                              if (errors.service) setErrors((er) => ({ ...er, service: undefined }))
                              if (status === 'error') setStatus('idle')
                            }}
                            className="sr-only"
                          />
                          {o.label}
                        </label>
                      )
                    })}
                  </div>
                  {errMsg('service')}
                </fieldset>
              </div>

              {status === 'error' && (
                <p role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {errorMessage} You can also email us at{' '}
                  <a className="font-medium underline underline-offset-4" href={`mailto:${company.email}`}>
                    {company.email}
                  </a>
                  .
                </p>
              )}

              <button
                type="submit"
                disabled={status === 'loading'}
                aria-busy={status === 'loading'}
                className="group mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-brown-700 px-7 py-3.5 font-display text-[16px] font-semibold text-white transition-colors duration-300 hover:bg-espresso-900 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {status === 'loading' ? 'Sending…' : appointmentContent.submitLabel}
                {status !== 'loading' && (
                  <ArrowRight className="transition-transform duration-300 ease-premium group-hover:translate-x-1" />
                )}
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}

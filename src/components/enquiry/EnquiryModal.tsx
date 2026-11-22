import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useId, useRef, useState, type FormEvent } from 'react'
import { company } from '../../data/site'
import { failureMessage, submitForm } from '../../lib/api'
import { Modal } from '../ui/Modal'
import { ArrowRight } from '../ui/icons'

type Fields = { name: string; contact: string; email: string; profession: string; description: string }
type Errors = Partial<Record<keyof Fields, string>>

const empty: Fields = { name: '', contact: '', email: '', profession: '', description: '' }

function validate(v: Fields): Errors {
  const e: Errors = {}
  if (!v.name.trim()) e.name = 'Please enter your name.'
  if (!/^[+]?[\d\s-]{7,15}$/.test(v.contact.trim())) e.contact = 'Please enter a valid contact number.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email.trim())) e.email = 'Please enter a valid email address.'
  if (!v.profession.trim()) e.profession = 'Please enter your profession.'
  if (!v.description.trim()) e.description = 'Please tell us about your requirement.'
  return e
}

/**
 * Enquiry form — fields as specified in the company document:
 * Name, Contact no, Email, Professional and Description.
 */
export function EnquiryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const titleId = useId()
  const [values, setValues] = useState<Fields>(empty)
  const [errors, setErrors] = useState<Errors>({})
  const [submitted, setSubmitted] = useState(false)
  const [sending, setSending] = useState(false)
  const [failure, setFailure] = useState('')
  const [honeypot, setHoneypot] = useState('') // spam trap: hidden from people, filled by bots
  const openedAt = useRef(0) // second trap: bots submit instantly (set on mount = on open)
  useEffect(() => {
    openedAt.current = Date.now()
  }, [])

  const update = (key: keyof Fields) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setValues((v) => ({ ...v, [key]: e.target.value }))
    if (errors[key]) setErrors((er) => ({ ...er, [key]: undefined }))
    if (failure) setFailure('')
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (sending) return
    const found = validate(values)
    setErrors(found)
    if (Object.keys(found).length) return
    setSending(true)
    setFailure('')
    const result = await submitForm('/api/enquiries', {
      name: values.name.trim(),
      contact: values.contact.trim(),
      email: values.email.trim(),
      profession: values.profession.trim(),
      description: values.description.trim(),
      website: honeypot,
      elapsedMs: Date.now() - openedAt.current,
    })
    setSending(false)
    if (result.ok) {
      setSubmitted(true)
      setValues(empty)
      setHoneypot('')
    } else if (result.kind === 'validation') {
      setErrors(result.fields as Errors)
    } else {
      setFailure(failureMessage[result.kind])
    }
  }

  const field =
    'w-full rounded-xl border bg-white px-4 py-3 text-base text-heading sm:text-[15px] placeholder:text-ink-soft/60 transition-colors duration-300 focus:border-brown-600 focus:outline-none focus:ring-2 focus:ring-brown-600/15'

  const inputs: { key: keyof Fields; label: string; type: string; autoComplete: string; placeholder: string }[] = [
    { key: 'name', label: 'Name', type: 'text', autoComplete: 'name', placeholder: 'Your full name' },
    { key: 'contact', label: 'Contact No.', type: 'tel', autoComplete: 'tel', placeholder: '+91 00000 00000' },
    { key: 'email', label: 'Email', type: 'email', autoComplete: 'email', placeholder: 'you@example.com' },
    { key: 'profession', label: 'Profession', type: 'text', autoComplete: 'organization-title', placeholder: 'e.g. Surgeon, Nurse, Procurement' },
  ]

  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} className="max-w-2xl">
      <div className="px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-6 sm:px-10 sm:pb-10 sm:pt-10">
        <AnimatePresence mode="wait" initial={false}>
          {submitted ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="py-10 text-center"
            >
              <div className="mx-auto mb-6 grid size-16 place-items-center rounded-full bg-brand-cream text-brown-700">
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" aria-hidden>
                  <path d="m5 12.5 4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 id={titleId} className="font-display text-[26px] font-semibold text-heading">
                Thank you
              </h2>
              <p className="mx-auto mt-3 max-w-sm text-ink">
                Your enquiry has been received. You can also reach us at{' '}
                <a className="font-medium text-brown-600 underline underline-offset-4" href={`mailto:${company.email}`}>
                  {company.email}
                </a>
                .
              </p>
              <button
                type="button"
                onClick={onClose}
                className="mt-8 rounded-full bg-brown-700 px-7 py-3 font-display font-medium text-white transition-colors duration-300 hover:bg-espresso-900"
              >
                Close
              </button>
            </motion.div>
          ) : (
            <motion.form key="form" noValidate onSubmit={onSubmit} exit={{ opacity: 0 }}>
              <h2 id={titleId} className="pr-12 font-display text-[26px] font-semibold tracking-tight text-heading sm:text-[30px]">
                Enquiry
              </h2>
              <p className="mt-2 max-w-md text-ink">
                Get in touch with us to explore the right healthcare solution for your needs.
              </p>

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

              <div className="mt-6 grid gap-4 sm:mt-8 sm:grid-cols-2 sm:gap-5">
                {inputs.map((f, i) => (
                  <label key={f.key} className="block min-w-0">
                    <span className="mb-1.5 block font-display text-sm font-medium text-heading">{f.label}</span>
                    <input
                      {...(i === 0 ? { 'data-autofocus': true } : {})}
                      name={f.key}
                      type={f.type}
                      inputMode={f.type === 'tel' ? 'tel' : f.type === 'email' ? 'email' : 'text'}
                      autoComplete={f.autoComplete}
                      placeholder={f.placeholder}
                      value={values[f.key]}
                      onChange={update(f.key)}
                      aria-invalid={!!errors[f.key]}
                      aria-describedby={errors[f.key] ? `${titleId}-${f.key}-err` : undefined}
                      className={`${field} ${errors[f.key] ? 'border-red-400' : 'border-cream-300'}`}
                    />
                    {errors[f.key] && (
                      <span id={`${titleId}-${f.key}-err`} className="mt-1.5 block text-sm text-red-700">
                        {errors[f.key]}
                      </span>
                    )}
                  </label>
                ))}
                <label className="block sm:col-span-2">
                  <span className="mb-1.5 block font-display text-sm font-medium text-heading">Description</span>
                  <textarea
                    name="description"
                    enterKeyHint="send"
                    rows={4}
                    placeholder="Tell us about your requirement"
                    value={values.description}
                    onChange={update('description')}
                    aria-invalid={!!errors.description}
                    aria-describedby={errors.description ? `${titleId}-description-err` : undefined}
                    className={`${field} resize-none ${errors.description ? 'border-red-400' : 'border-cream-300'}`}
                  />
                  {errors.description && (
                    <span id={`${titleId}-description-err`} className="mt-1.5 block text-sm text-red-700">
                      {errors.description}
                    </span>
                  )}
                </label>
              </div>

              {failure && (
                <p role="alert" className="mt-6 rounded-xl border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800">
                  {failure} You can also email us at{' '}
                  <a className="font-medium underline underline-offset-4" href={`mailto:${company.email}`}>
                    {company.email}
                  </a>
                  .
                </p>
              )}

              <button
                type="submit"
                disabled={sending}
                aria-busy={sending}
                className="group mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-brown-700 px-7 py-3.5 font-display text-[16px] font-semibold text-white transition-colors duration-300 hover:bg-espresso-900 disabled:cursor-not-allowed disabled:opacity-70 sm:w-auto"
              >
                {sending ? 'Sending…' : 'Submit Enquiry'}
                {!sending && (
                  <ArrowRight className="transition-transform duration-300 ease-premium group-hover:translate-x-1" />
                )}
              </button>
            </motion.form>
          )}
        </AnimatePresence>
      </div>
    </Modal>
  )
}

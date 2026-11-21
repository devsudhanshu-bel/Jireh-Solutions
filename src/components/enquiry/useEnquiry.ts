import { createContext, useContext } from 'react'

export type EnquiryContextValue = { openEnquiry: () => void }

export const EnquiryContext = createContext<EnquiryContextValue | null>(null)

/** Opens the site-wide enquiry form (navbar "Enquiry" and "Enquire Now" buttons). */
export function useEnquiry() {
  const ctx = useContext(EnquiryContext)
  if (!ctx) throw new Error('useEnquiry must be used inside <EnquiryProvider>')
  return ctx
}

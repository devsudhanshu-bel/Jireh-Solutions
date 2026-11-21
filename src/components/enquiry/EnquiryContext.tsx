import { useCallback, useMemo, useState, type ReactNode } from 'react'
import { EnquiryModal } from './EnquiryModal'
import { EnquiryContext } from './useEnquiry'

export function EnquiryProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)
  // Bumped on every open so the form remounts with a clean state.
  const [session, setSession] = useState(0)

  const openEnquiry = useCallback(() => {
    setSession((s) => s + 1)
    setOpen(true)
  }, [])
  const close = useCallback(() => setOpen(false), [])
  const value = useMemo(() => ({ openEnquiry }), [openEnquiry])

  return (
    <EnquiryContext.Provider value={value}>
      {children}
      <EnquiryModal key={session} open={open} onClose={close} />
    </EnquiryContext.Provider>
  )
}

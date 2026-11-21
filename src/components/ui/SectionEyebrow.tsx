type SectionEyebrowProps = {
  children?: React.ReactNode
  /** `rule-left`: short rule then label (Services). `center`: rules on both sides (Mission). */
  variant?: 'rule-left' | 'center' | 'rule-only'
  className?: string
}

/** Small uppercase, letter-spaced section label with the brown rule seen in the references. */
export function SectionEyebrow({ children, variant = 'rule-left', className = '' }: SectionEyebrowProps) {
  if (variant === 'rule-only') {
    return <span aria-hidden className={`block h-[2px] w-14 rounded-full bg-heading-warm sm:w-16 ${className}`} />
  }

  if (variant === 'center') {
    return (
      <p
        className={`flex items-center justify-center gap-4 font-display text-[12px] font-semibold uppercase tracking-[0.28em] text-heading sm:gap-5 sm:text-[13px] ${className}`}
      >
        <span aria-hidden className="h-px w-10 bg-heading/70 sm:w-24" />
        {children}
        <span aria-hidden className="h-px w-10 bg-heading/70 sm:w-24" />
      </p>
    )
  }

  return (
    <p
      className={`flex items-center gap-4 font-display text-[12px] font-semibold uppercase tracking-[0.26em] text-heading sm:text-[13px] ${className}`}
    >
      <span aria-hidden className="h-[2px] w-10 rounded-full bg-heading" />
      {children}
    </p>
  )
}

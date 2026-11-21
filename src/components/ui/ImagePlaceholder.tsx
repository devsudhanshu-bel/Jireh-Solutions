type ImagePlaceholderProps = {
  /** Descriptive asset name, e.g. `hero-image-placeholder`. */
  name: string
  /** What the final photograph should show — helps whoever supplies the asset. */
  hint?: string
  tone?: 'light' | 'dark'
  labelPosition?: 'top-right' | 'bottom-right'
  className?: string
}

/**
 * Neutral stand-in for photography that the client will supply later.
 * FINAL IMAGE: replace each <ImagePlaceholder> with an <img> (or <video>) of the same
 * aspect ratio. Every usage is marked with a `FINAL IMAGE` comment at the call site.
 */
export function ImagePlaceholder({
  name,
  hint,
  tone = 'light',
  labelPosition = 'top-right',
  className = '',
}: ImagePlaceholderProps) {
  const dark = tone === 'dark'
  return (
    <div
      role="img"
      aria-label={hint ? `Image placeholder: ${hint}` : 'Image placeholder'}
      data-placeholder={name}
      className={`relative isolate overflow-hidden ${dark ? 'bg-[#2f3a3b]' : 'bg-placeholder'} ${className}`}
    >
      <div
        aria-hidden
        className="absolute inset-0 -z-10 opacity-60"
        style={{
          backgroundImage: dark
            ? 'radial-gradient(circle at 70% 35%, rgba(255,255,255,0.08), transparent 55%), repeating-linear-gradient(135deg, rgba(255,255,255,0.035) 0 1px, transparent 1px 22px)'
            : 'radial-gradient(circle at 70% 30%, rgba(255,255,255,0.7), transparent 60%), repeating-linear-gradient(135deg, var(--color-placeholder-line) 0 1px, transparent 1px 22px)',
        }}
      />
      <div
        aria-hidden
        className={`pointer-events-none absolute ${labelPosition === 'top-right' ? 'right-4 top-4' : 'bottom-[16%] right-[8%]'} flex max-w-[calc(100%-2rem)] items-center gap-2 truncate rounded-full px-3 py-1.5 text-[11px] font-medium tracking-wide backdrop-blur-sm ${
          dark ? 'bg-white/10 text-white/70' : 'bg-white/70 text-ink-soft'
        }`}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
          <rect x="3" y="4" width="18" height="16" rx="2.5" />
          <circle cx="9" cy="10" r="1.8" />
          <path d="m21 16-5-5-9 9" />
        </svg>
        {name}
      </div>
    </div>
  )
}

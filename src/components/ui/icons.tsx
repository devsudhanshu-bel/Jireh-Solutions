import type { SVGProps } from 'react'

type IconProps = SVGProps<SVGSVGElement> & { size?: number }

const base = (size: number, props: SVGProps<SVGSVGElement>) => ({
  width: size,
  height: size,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  ...props,
})

export const ArrowRight = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
)

export const ArrowUpRight = ({ size = 18, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M7 17 17 7M8 7h9v9" />
  </svg>
)

export const ChevronDown = ({ size = 16, ...p }: IconProps) => (
  <svg {...base(size, { strokeWidth: 2.2, ...p })}>
    <path d="m6 9 6 6 6-6" />
  </svg>
)

export const Play = ({ size = 20, ...p }: IconProps) => (
  <svg {...base(size, { fill: 'currentColor', stroke: 'none', ...p })}>
    <path d="M7 4.5v15a1 1 0 0 0 1.52.85l12-7.5a1 1 0 0 0 0-1.7l-12-7.5A1 1 0 0 0 7 4.5Z" />
  </svg>
)

export const Close = ({ size = 22, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M6 6l12 12M18 6 6 18" />
  </svg>
)

export const Menu = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size, p)}>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </svg>
)

export const Mail = ({ size = 26, ...p }: IconProps) => (
  <svg {...base(size, { strokeWidth: 1.5, ...p })}>
    <rect x="2.5" y="5" width="19" height="14" rx="1.5" />
    <path d="m3 6 9 7 9-7M3 18l6.5-6M21 18l-6.5-6" />
  </svg>
)

export const MapPin = ({ size = 26, ...p }: IconProps) => (
  <svg {...base(size, { strokeWidth: 1.5, ...p })}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </svg>
)

export const MapFold = ({ size = 24, ...p }: IconProps) => (
  <svg {...base(size, { strokeWidth: 1.6, ...p })}>
    <path d="m3 6.5 6-2.5 6 2.5 6-2.5v13.5l-6 2.5-6-2.5-6 2.5Z" />
    <path d="M9 4v13.5M15 6.5V20" />
  </svg>
)

export const Bandage = ({ size = 36, ...p }: IconProps) => (
  <svg {...base(size, { strokeWidth: 1.4, ...p })}>
    <rect x="1.8" y="8.2" width="20.4" height="7.6" rx="3.8" transform="rotate(-45 12 12)" />
    <rect x="8.6" y="9.4" width="6.8" height="5.2" rx="0.8" transform="rotate(-45 12 12)" />
    <circle cx="11" cy="11" r="0.45" fill="currentColor" />
    <circle cx="13" cy="13" r="0.45" fill="currentColor" />
    <circle cx="13" cy="11" r="0.45" fill="currentColor" />
    <circle cx="11" cy="13" r="0.45" fill="currentColor" />
  </svg>
)

export const Layers = ({ size = 36, ...p }: IconProps) => (
  <svg {...base(size, { strokeWidth: 1.4, ...p })}>
    <path d="m12 3 9 4.5-9 4.5-9-4.5Z" />
    <path d="m3 12 9 4.5 9-4.5" />
    <path d="m3 16.5 9 4.5 9-4.5" />
  </svg>
)

export const Lungs = ({ size = 36, ...p }: IconProps) => (
  <svg {...base(size, { strokeWidth: 1.4, ...p })}>
    <path d="M12 3v8.5M12 9.5c-.8 1.4-2 2.2-3 2.5M12 9.5c.8 1.4 2 2.2 3 2.5" />
    <path d="M8.6 6.2C6.3 6.6 3 11 3 16.3c0 2.6 1.3 3.9 3.2 3.4 2-.5 3.6-1.5 3.6-4.2V7.3c0-.7-.5-1.2-1.2-1.1Z" />
    <path d="M15.4 6.2C17.7 6.6 21 11 21 16.3c0 2.6-1.3 3.9-3.2 3.4-2-.5-3.6-1.5-3.6-4.2V7.3c0-.7.5-1.2 1.2-1.1Z" />
  </svg>
)

/* Social marks (simplified glyphs) */
export const LinkedIn = ({ size = 26, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M4.98 3.5a2.48 2.48 0 1 1 0 4.96 2.48 2.48 0 0 1 0-4.96ZM3 9.75h3.96V21H3V9.75Zm6.45 0h3.8v1.54h.05c.53-1 1.82-2.05 3.75-2.05 4.01 0 4.75 2.64 4.75 6.07V21h-3.96v-5.06c0-1.2-.02-2.76-1.68-2.76-1.68 0-1.94 1.31-1.94 2.67V21H9.45V9.75Z" />
  </svg>
)

export const YouTube = ({ size = 26, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M22.2 7.2a2.75 2.75 0 0 0-1.94-1.95C18.55 4.8 12 4.8 12 4.8s-6.55 0-8.26.45A2.75 2.75 0 0 0 1.8 7.2 28.6 28.6 0 0 0 1.35 12c0 1.62.15 3.24.45 4.8a2.75 2.75 0 0 0 1.94 1.95c1.71.45 8.26.45 8.26.45s6.55 0 8.26-.45a2.75 2.75 0 0 0 1.94-1.95c.3-1.56.45-3.18.45-4.8s-.15-3.24-.45-4.8ZM9.9 15.05v-6.1L15.35 12 9.9 15.05Z" />
  </svg>
)

export const Instagram = ({ size = 26, ...p }: IconProps) => (
  <svg {...base(size, { strokeWidth: 1.9, ...p })}>
    <rect x="3.2" y="3.2" width="17.6" height="17.6" rx="5" />
    <circle cx="12" cy="12" r="4.1" />
    <circle cx="17.4" cy="6.6" r="0.9" fill="currentColor" stroke="none" />
  </svg>
)

export const Facebook = ({ size = 26, ...p }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden {...p}>
    <path d="M13.6 21v-7.7h2.6l.4-3h-3V8.4c0-.87.24-1.46 1.49-1.46h1.6V4.25a21 21 0 0 0-2.33-.12c-2.3 0-3.88 1.4-3.88 3.98v2.2H7.88v3h2.6V21h3.12Z" />
  </svg>
)

// Original logo extracted unmodified from the company document (word/media/image1.png).
import jirehLogo from '../../assets/logos/jireh-logo.png'

type JirehLogoProps = { className?: string; plate?: boolean }

/**
 * The only Jireh logo supplied in the company document is artwork on a dark
 * (#2B2322) background. It is displayed as-is — never recoloured or cropped.
 * On light surfaces it sits on a plate of the logo's own background colour.
 *
 * NOTE: the navbar reference shows a light-background version of the logo. When the
 * client supplies that variant (ideally a transparent PNG/SVG), swap it in here and
 * drop the plate.
 */
export function JirehLogo({ className = '', plate = false }: JirehLogoProps) {
  const img = (
    <img
      src={jirehLogo}
      width={461}
      height={125}
      alt="Jireh Healthcare Solutions"
      className={`block w-auto max-w-full ${plate ? 'h-full' : className}`}
      decoding="async"
    />
  )
  if (!plate) return img
  return <span className={`inline-flex overflow-hidden rounded-[3px] bg-espresso-900 ${className}`}>{img}</span>
}

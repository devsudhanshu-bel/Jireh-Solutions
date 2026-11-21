// Original partner logos extracted unmodified from the company document.
import fibroheal from '../assets/logos/partners/fibroheal.jpeg'
import schulke from '../assets/logos/partners/schulke.jpeg'
import smithNephew from '../assets/logos/partners/smith-nephew.jpeg'
import triageMeditech from '../assets/logos/partners/triage-meditech.jpeg'

/**
 * Display heights compensate for the whitespace baked into each original file so the
 * visible marks match the reference proportions. The files themselves are untouched.
 * Order follows the "Our Channel Partners" reference image. */
export const partners = [
  { id: 'smith-nephew', name: 'Smith+Nephew', logo: smithNephew, width: 263, height: 139, className: 'h-24 sm:h-28 lg:h-36' },
  { id: 'schulke', name: 'schülke', logo: schulke, width: 301, height: 154, className: 'h-20 sm:h-24 lg:h-28' },
  { id: 'triage-meditech', name: 'Triage Meditech Pvt. Ltd.', logo: triageMeditech, width: 290, height: 134, className: 'h-16 sm:h-20 lg:h-[88px]' },
  { id: 'fibroheal', name: 'Fibroheal Woundcare Pvt. Ltd.', logo: fibroheal, width: 554, height: 554, className: 'h-28 sm:h-36 lg:h-40' },
]

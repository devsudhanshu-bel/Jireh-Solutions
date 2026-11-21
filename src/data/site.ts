/**
 * Homepage content.
 * Source of truth: "Jireh Website-Final.docx" (company document) and the homepage
 * reference images supplied by the client. Do not add copy that is not in either.
 */

export const company = {
  name: 'Jireh Healthcare Solutions',
  email: 'info@jirehhealthcaresolutions.com',
  addressLines: [
    '1-2-365/26/C, 2nd Floor,',
    'Ramakrishna Math Road,',
    'Domalguda, Himayathnagar,',
    'Hyderabad, Telangana State,',
    'India – 500029',
  ],
  /** Map link built from the address in the company document ("Add Map."). */
  mapUrl:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent(
      '1-2-365/26/C, Ramakrishna Math Road, Domalguda, Himayathnagar, Hyderabad, Telangana 500029, India',
    ),
  /** Full address string used for the map embed and directions (no coordinates are invented). */
  mapQuery:
    'Jireh Healthcare Solutions, 1-2-365/26/C, 2nd Floor, Ramakrishna Math Road, Domalguda, Himayathnagar, Hyderabad, Telangana 500029, India',
  footerBlurb:
    'Delivering innovative and reliable healthcare solutions in Advanced Wound Care, NPWT and Anesthesia and Critical Care.',
  get mapEmbedUrl() {
    return `https://www.google.com/maps?q=${encodeURIComponent(this.mapQuery)}&output=embed`
  },
  get directionsUrl() {
    return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(this.mapQuery)}`
  },
} as const

export type NavLink = { label: string; href: string }
export type NavItem = NavLink & {
  /** Opens the Care Areas mega menu instead of navigating (href stays as the no-JS / fallback target). */
  megaMenu?: boolean
}

/**
 * Primary navigation. "Care Areas" opens a mega menu; "Services" opens the /services page.
 */
export const navItems: NavItem[] = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about-us' },
  { label: 'Care Areas', href: '/#care-areas', megaMenu: true },
  { label: 'Services', href: '/services' },
]

/** Care Areas mega menu. Descriptions are drawn from the company document. */
export const careAreasMenu = {
  heading: 'Comprehensive care for every need',
  links: [
    { label: 'Anesthesia and Critical Care', href: '/care-areas/airway-management' },
    { label: 'Advanced Wound Care', href: '/care-areas/advanced-wound-care' },
  ],
  cards: [
    {
      id: 'airway-management',
      title: 'Anesthesia and Critical Care',
      description:
        'EEVA airway management, anesthesia, and respiratory care products for operating theatres, intensive care units, and other clinical settings.',
      href: '/care-areas/airway-management',
      placeholder: 'mega-menu-airway-image-placeholder',
      hint: 'EEVA anesthesia and critical care product',
    },
    {
      id: 'advanced-wound-care',
      title: 'Advanced Wound Care',
      description:
        'Advanced wound care solutions for better healing, including NPWT and advanced wound dressings for chronic and complex wounds.',
      href: '/care-areas/advanced-wound-care',
      placeholder: 'mega-menu-wound-care-image-placeholder',
      hint: 'Advanced wound care product / dressing',
    },
  ],
}

export const hero = {
  titleLines: ['Your Trusted', 'Partner in', 'Healthcare'],
  highlight: 'Innovation',
  videoCta: 'Watch the Full Video',
}

/** Full company video shown in the hero dialog. Leave `src` undefined until the client supplies the file. */
export const fullVideo: { src?: string; poster?: string } = {}

export const mission = {
  eyebrow: 'Our Mission',
  title: 'Enhancing Quality of Life Through Innovative Healthcare Solutions.',
  body: 'At Jireh Healthcare Solutions, we are committed to supporting individuals with complex and diverse healthcare needs by actively listening to patients and healthcare professionals. Their experiences, insights, and evolving needs guide us in sourcing and delivering high-quality, reliable, and evidence-based medical products and solutions. With a specialized focus on Advanced Wound Care, Negative Pressure Wound Therapy (NPWT), and Anesthesia and Critical Care, we strive to empower healthcare professionals, enhance the quality of patient care, improve clinical outcomes, and ultimately enrich the quality of life.',
}

export const services = {
  eyebrow: 'Our Services',
  /** Line breaks follow the reference image. */
  titleLines: ['Specialized', 'Wound Care', 'Solutions'],
  intro: 'Evidence-based solutions in NPWT and advanced wound dressing for complex and chronic wounds.',
  cta: { label: 'View All Services', href: '/services' },
  items: [
    {
      id: 'npwt',
      titleLines: ['Negative Pressure', 'Wound Therapy (NPWT)'],
      description:
        'Advanced wound management using controlled negative pressure to help remove excess wound fluid, support granulation tissue formation, and promote wound healing in appropriately selected patients.',
      link: { label: 'Explore NPWT', href: '/services/npwt' },
      placeholder: 'service-npwt-image-placeholder',
    },
    {
      id: 'wound-dressing',
      titleLines: ['Advanced', 'Wound Dressing Services'],
      description:
        'Specialized wound dressing solutions for chronic and complex wounds, including diabetic foot ulcers, pressure injuries, venous leg ulcers, and non-healing wounds, based on wound assessment and clinical requirements.',
      link: { label: 'Explore Wound Dressing', href: '/services/advanced-wound-dressing' },
      placeholder: 'service-wound-dressing-image-placeholder',
    },
  ],
}

/** Care Areas listed in the company document: Advanced Wound Care and Anesthesia and Critical Care. */
export const careAreas = {
  title: 'Care Areas',
  items: [
    {
      id: 'advanced-wound-care',
      titleLines: ['Advanced', 'Wound Care'],
      href: '/care-areas/advanced-wound-care',
      placeholder: 'care-area-wound-care-image-placeholder',
    },
    {
      id: 'airway-management',
      titleLines: ['Anesthesia and', 'Critical Care'],
      href: '/care-areas/airway-management',
      placeholder: 'care-area-airway-management-image-placeholder',
    },
  ],
}

export const enquiryCta = {
  title: 'Have a Requirement?',
  body: 'Get in touch with us to explore the right healthcare solution for your needs.',
  button: 'Enquire',
}

export const footerQuickLinks: NavLink[] = [
  { label: 'Home', href: '/' },
  { label: 'About Us', href: '/about-us' },
  { label: 'Channel Partners', href: '/#partners' },
  { label: 'Contact Us', href: '#contact' },
]

export const solutions = [
  { id: 'wound', label: ['Advanced', 'Wound Care'], href: '/care-areas/advanced-wound-care', icon: 'bandage' },
  { id: 'npwt', label: ['NPWT'], sub: '(Negative Pressure Wound Therapy)', href: '/services/npwt', icon: 'layers' },
  { id: 'airway', label: ['Anesthesia and', 'Critical Care'], href: '/care-areas/airway-management', icon: 'lungs' },
] as const

export const legalLinks: NavLink[] = [
  { label: 'Privacy Policy', href: '/privacy-policy' },
  { label: 'Terms of Use', href: '/terms-of-use' },
  { label: 'Disclaimer', href: '/disclaimer' },
]

/**
 * Social profiles — shown in the footer reference. The company document does not
 * supply profile URLs yet; replace each `href` when the client provides them.
 */
export const socials = [
  { id: 'linkedin', label: 'LinkedIn', href: '#' },
  { id: 'youtube', label: 'YouTube', href: '#' },
  { id: 'instagram', label: 'Instagram', href: '#' },
  { id: 'facebook', label: 'Facebook', href: '#' },
] as const

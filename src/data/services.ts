/**
 * Services page content.
 * Source of truth: "Jireh Website-Final.docx" — "Services: Our Wound Care Services".
 * Wording is reproduced from the document; do not add claims that are not in it.
 */

export const servicesHero = {
  title: 'Our Services',
  imagePlaceholder: 'services-hero-image-placeholder',
  imageHint: 'Wide hero image — Jireh wound care services',
}

export const servicesIntro = {
  title: 'Our Wound Care Services',
  subtitle: 'Advanced Wound Care Solutions for Better Healing',
  body: 'At Jireh Healthcare Solutions, we provide specialized Negative Pressure Wound Therapy (NPWT) and Advanced Wound Dressing Services to support the management and healing of chronic and complex wounds. Our services focus on delivering evidence-based wound care solutions tailored to individual patient needs, with an emphasis on promoting wound healing, managing complications, and improving patient comfort and quality of life.',
}

export type ServiceDetail = {
  id: string
  title: string
  description: string
  /** Which side the image sits on at desktop widths. */
  imageSide: 'left' | 'right'
  imagePlaceholder: string
  imageHint: string
}

/** FINAL IMAGE: no service photography has been supplied yet — each is an <ImagePlaceholder>. */
export const serviceDetails: ServiceDetail[] = [
  {
    id: 'npwt',
    title: 'Negative Pressure Wound Therapy (NPWT)',
    description:
      'Advanced wound management using controlled negative pressure to help remove excess wound fluid, support granulation tissue formation, and promote wound healing in appropriately selected patients.',
    imageSide: 'left',
    imagePlaceholder: 'service-npwt-image-placeholder',
    imageHint: 'NPWT device applied to a wound dressing',
  },
  {
    id: 'advanced-wound-dressing',
    title: 'Advanced Wound Dressing Services',
    description:
      'Specialized wound dressing solutions for chronic and complex wounds, including diabetic foot ulcers, pressure injuries, venous leg ulcers, and non-healing wounds, based on wound assessment and clinical requirements.',
    imageSide: 'right',
    imagePlaceholder: 'service-wound-dressing-image-placeholder',
    imageHint: 'Clinician applying an advanced wound dressing',
  },
]

export const appointmentContent = {
  title: 'Book an Appointment',
  submitLabel: 'Send',
  serviceOptions: [
    { value: 'NPWT', label: 'NPWT' },
    { value: 'Advanced Dressing', label: 'Advanced Dressing' },
    { value: 'Both', label: 'Both' },
  ],
} as const

export type ServiceChoice = (typeof appointmentContent.serviceOptions)[number]['value']

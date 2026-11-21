/**
 * Airway Management page content.
 * Source of truth: "Jireh Website-Final.docx" — EEVA Airway Management & Anesthesia Care Products.
 * Wording, values and units are reproduced from the document; do not add claims that are not in it.
 *
 * LITERATURE: set `literatureUrl` on a product (e.g. '/literature/eeva-bain-circuit.pdf', file placed
 * in /public/literature/) once the client supplies the genuine PDF. Until then the button shows "Coming Soon".
 */

export type ProductFeature = { title: string; description: string }
export type ProductSpec = { parameter: string; value: string }

export type AirwayProduct = {
  id: string
  name: string
  /** Secondary line printed under the product name in the document. */
  subtitle?: string
  /** Short card description (taken from the product overview). */
  cardDescription: string
  /** Complete Product Overview — one entry per paragraph. */
  overview: string[]
  features: ProductFeature[]
  specifications: ProductSpec[]
  summary: string
  /** Real, supplied literature file. Leave undefined until available. */
  literatureUrl?: string
  imagePlaceholder: string
  imageHint: string
}

export const airwayHero = {
  title: 'Anesthesia and Critical Care',
  brand: 'EEVA',
  tagline: 'To Breathe. To Live.',
  imagePlaceholder: 'airway-hero-image-placeholder',
  imageHint: 'Wide hero image — EEVA anesthesia and critical care / breathing circuits',
}

export const eevaIntro = {
  eyebrow: 'Our Product Range',
  title: 'EEVA – To Breathe. To Live.',
  subtitle: 'Anesthesia and Critical Care Products',
  body: 'EEVA, the proprietary brand of Jireh Healthcare Solutions, offers a specialized range of airway management, anesthesia, and respiratory care products. Developed through our manufacturing partnerships, the EEVA product portfolio is designed to support healthcare professionals in operating theatres, intensive care units, and other clinical settings.',
}

export const airwayProducts: AirwayProduct[] = [
  {
    id: 'limb-o',
    name: 'EEVA Limb-O Anesthesia Breathing Circuit',
    cardDescription:
      'A single-limb, coaxial breathing circuit designed for use with compatible anesthesia workstations.',
    overview: [
      'The EEVA Limb-O Anesthesia Breathing Circuit is a single-limb, coaxial breathing circuit designed for use with compatible anesthesia workstations. Its innovative tube-within-a-tube configuration integrates inspiratory and expiratory gas pathways into a single compact assembly, helping optimize workspace organization and simplify circuit management in the operating theatre.',
      'Designed to support efficient anesthesia delivery, the EEVA Limb-O circuit offers a practical solution for modern anesthesia care.',
    ],
    features: [
      { title: 'Coaxial Design', description: 'Integrates inspiratory and expiratory pathways within a single circuit assembly.' },
      { title: 'Compact Configuration', description: 'Reduces circuit clutter and improves workspace organization.' },
      { title: 'Lightweight Design', description: 'Helps minimize tubing bulk around the patient.' },
      { title: 'Convenient Handling', description: 'Simplifies circuit positioning and management during anesthesia procedures.' },
      { title: 'Flexible Tubing', description: 'Supports convenient positioning of the breathing circuit.' },
      { title: 'Efficient Workspace Utilization', description: 'Helps maintain an organized anesthesia workstation.' },
    ],
    specifications: [
      { parameter: 'Brand', value: 'EEVA' },
      { parameter: 'Product Name', value: 'Limb-O Anesthesia Breathing Circuit' },
      { parameter: 'Circuit Type', value: 'Single-Limb Coaxial Breathing Circuit' },
      { parameter: 'Design', value: 'Tube-within-a-tube configuration' },
      { parameter: 'Available Lengths', value: '1.8 metres and 2.7 metres' },
    ],
    summary:
      'The EEVA Limb-O Anesthesia Breathing Circuit, available in 1.8 m and 2.7 m lengths, combines a compact coaxial design with convenient handling to support efficient anesthesia circuit management. Its integrated breathing pathways help reduce tubing clutter and promote an organized clinical environment.',
    imagePlaceholder: 'product-limb-o-image-placeholder',
    imageHint: 'EEVA Limb-O Anesthesia Breathing Circuit',
  },
  {
    id: 'bain',
    name: 'EEVA Bain Breathing Circuit',
    subtitle: '(Adult Anesthesia Breathing System)',
    cardDescription:
      'A lightweight, coaxial anesthesia breathing system based on the Mapleson D configuration.',
    overview: [
      'The EEVA Bain Breathing Circuit is a lightweight, coaxial anesthesia breathing system based on the Mapleson D configuration, designed to support efficient delivery of fresh gases during anesthesia procedures. Its innovative tube-within-a-tube design incorporates inspiratory and expiratory gas pathways within a single compact circuit, providing convenient handling and improved workspace organization in operating theatres.',
    ],
    features: [
      { title: 'Coaxial Design', description: 'Integrates fresh gas delivery and expiratory pathways into a single breathing circuit.' },
      { title: 'Lightweight & Flexible', description: 'Facilitates easy handling and positioning during anesthesia procedures.' },
      { title: 'Compact Configuration', description: 'Minimizes tubing clutter around the anesthesia workstation.' },
      { title: '2-Litre Reservoir Bag', description: 'Equipped with a 2-litre breathing bag for adult anesthesia applications.' },
      { title: 'Low-Resistance Design', description: 'Supports effective gas flow when used under appropriate clinical conditions.' },
      { title: 'Convenient Handling', description: 'Simplifies circuit setup and management.' },
      { title: 'Versatile Application', description: 'Suitable for spontaneous, assisted, and controlled ventilation with appropriate fresh gas flow and monitoring.' },
    ],
    specifications: [
      { parameter: 'Brand', value: 'EEVA' },
      { parameter: 'Product Name', value: 'Bain Breathing Circuit' },
      { parameter: 'Circuit Classification', value: 'Mapleson D' },
      { parameter: 'Circuit Type', value: 'Coaxial Anesthesia Breathing Circuit' },
      { parameter: 'Patient Category', value: 'Adult' },
      { parameter: 'Reservoir Bag Capacity', value: '2 Litres' },
      { parameter: 'Circuit Design', value: 'Tube-within-a-tube' },
      { parameter: 'Fresh Gas Pathway', value: 'Inner tube' },
      { parameter: 'Expiratory Gas Pathway', value: 'Outer tube' },
      { parameter: 'Ventilation Modes', value: 'Spontaneous, assisted, and controlled ventilation' },
    ],
    summary:
      'The EEVA Bain Breathing Circuit is a compact, lightweight Mapleson D coaxial anesthesia breathing system designed for adult anesthesia applications. Featuring a 2-litre reservoir bag, its integrated breathing pathways support convenient handling, efficient circuit management, and an organized operating theatre environment. Designed for use with appropriate fresh gas flow and clinical monitoring, it offers a practical solution for anesthesia professionals.',
    imagePlaceholder: 'product-bain-image-placeholder',
    imageHint: 'EEVA Bain Breathing Circuit',
  },
  {
    id: 'jackson-rees',
    name: 'EEVA Jackson-Rees Breathing Circuit',
    cardDescription:
      'A lightweight, non-coaxial pediatric anesthesia breathing system based on the Mapleson F configuration.',
    overview: [
      "The EEVA Jackson-Rees Breathing Circuit is a lightweight, non-coaxial pediatric anesthesia breathing system based on the Mapleson F configuration (modified Ayre's T-piece). Designed for neonatal and pediatric anesthesia applications, the circuit features a simple, low-resistance breathing pathway and a 0.5-litre reservoir bag.",
      'Its compact and flexible design supports convenient handling, controlled ventilation, and effective respiratory management during pediatric anesthesia procedures.',
    ],
    features: [
      { title: 'Mapleson F Design', description: "Modified Ayre's T-piece configuration commonly used in pediatric anesthesia." },
      { title: 'Low-Resistance Breathing Pathway', description: 'Designed to minimize resistance to breathing, particularly important for pediatric patients.' },
      { title: 'Lightweight Construction', description: 'Helps reduce the weight and bulk of the breathing system near the patient.' },
      { title: '0.5-Litre Reservoir Bag', description: 'Equipped with a 500 mL reservoir bag for pediatric applications.' },
      { title: 'Flexible Circuit Design', description: 'Facilitates convenient positioning and handling during anesthesia procedures.' },
      { title: 'Ventilation Support', description: 'Can be used for spontaneous or assisted/controlled ventilation with appropriate fresh gas flow and clinical monitoring.' },
      { title: 'Compact Configuration', description: 'Supports practical circuit management in pediatric anesthesia settings.' },
    ],
    specifications: [
      { parameter: 'Brand', value: 'EEVA' },
      { parameter: 'Product Name', value: 'Jackson-Rees Pediatric Breathing Circuit' },
      { parameter: 'Circuit Classification', value: 'Mapleson F' },
      { parameter: 'Circuit Design', value: "Modified Ayre's T-piece" },
      { parameter: 'Patient Category', value: 'Pediatric; neonatal suitability subject to manufacturer specifications' },
      { parameter: 'Reservoir Bag Capacity', value: '0.5 Litre (500 mL)' },
      { parameter: 'Breathing System', value: 'Non-coaxial, non-circle breathing system' },
      { parameter: 'Ventilation Modes', value: 'Spontaneous, assisted, and controlled ventilation, subject to clinical setup' },
      { parameter: 'Bag Configuration', value: 'Open-ended reservoir bag with appropriate outlet control, subject to product design' },
      { parameter: 'Packaging', value: 'As per manufacturer specifications' },
    ],
    summary:
      "The EEVA Jackson-Rees Paediatric Breathing Circuit is a lightweight, low-resistance Mapleson F anesthesia breathing system designed for pediatric respiratory and anaesthesia care. Featuring a 0.5-litre (500 mL) reservoir bag, its modified Ayre's T-piece configuration supports spontaneous and assisted ventilation when used with appropriate fresh gas flow and monitoring. Its compact design makes it a practical choice for pediatric anesthesia applications.",
    imagePlaceholder: 'product-jackson-rees-image-placeholder',
    imageHint: 'EEVA Jackson-Rees Breathing Circuit',
  },
  {
    id: 'three-limb',
    name: 'EEVA 3-Limb Anesthesia Breathing Circuit',
    subtitle: 'With 2-Litre Rebreathing Bag',
    cardDescription:
      'Designed for use with compatible anesthesia workstations, with a three-limb configuration and a 2-litre rebreathing bag.',
    overview: [
      'The EEVA 3-Limb Anesthesia Breathing Circuit is designed for use with compatible anesthesia workstations to support the delivery of anesthetic gases and respiratory ventilation during surgical procedures. Featuring a three-limb configuration with a 2-litre rebreathing bag, the circuit provides a practical solution for anesthesia professionals, supporting convenient handling and efficient circuit management in operating theatres.',
    ],
    features: [
      { title: 'Three-Limb Configuration', description: 'Designed to support anesthesia gas delivery and respiratory circuit management.' },
      { title: '2-Litre Rebreathing Bag', description: 'Supplied with a 2-litre reservoir bag for use in compatible anesthesia breathing systems.' },
      { title: 'Flexible Tubing', description: 'Facilitates convenient positioning and handling during anesthesia procedures.' },
      { title: 'Efficient Circuit Organization', description: 'Helps maintain an organized anesthesia workstation.' },
      { title: 'Convenient Connectivity', description: 'Designed for integration with compatible anesthesia equipment.' },
      { title: 'Practical Design', description: 'Supports convenient circuit setup and management during anesthesia procedures.' },
    ],
    specifications: [
      { parameter: 'Brand', value: 'EEVA' },
      { parameter: 'Product Name', value: '3-Limb Anesthesia Breathing Circuit' },
      { parameter: 'Circuit Type', value: 'Three-Limb Anesthesia Circuit' },
      { parameter: 'Configuration', value: 'Three-limb circuit with reservoir bag' },
      { parameter: 'Rebreathing Bag Capacity', value: '2 Litres (2000 mL)' },
      { parameter: 'Application', value: 'Anesthesia and respiratory ventilation' },
      { parameter: 'Clinical Setting', value: 'Operating theatres' },
      { parameter: 'Packaging', value: 'Circuit with 2-litre rebreathing bag' },
    ],
    summary:
      'The EEVA 3-Limb Anesthesia Breathing Circuit with 2-Litre Rebreathing Bag is designed to support anesthesia gas delivery and ventilation in compatible anesthesia breathing systems. Its flexible, three-limb configuration facilitates convenient handling, organized circuit management, and efficient clinical workflows in operating theatres.',
    imagePlaceholder: 'product-3-limb-image-placeholder',
    imageHint: 'EEVA 3-Limb Anesthesia Breathing Circuit with 2-litre rebreathing bag',
  },
  {
    id: 'two-limb',
    name: 'EEVA Two-Limb Breathing Circuit',
    subtitle: 'Anesthesia & Mechanical Ventilation Applications',
    cardDescription:
      'Separate inspiratory and expiratory limbs for use with compatible anesthesia workstations and mechanical ventilators.',
    overview: [
      'The EEVA Two-Limb Breathing Circuit is designed to support respiratory gas delivery and ventilation through compatible anesthesia workstations and mechanical ventilators. Featuring separate inspiratory and expiratory limbs, the circuit facilitates effective gas flow management during anesthesia and respiratory support.',
      'Its lightweight, flexible, and practical design allows convenient handling and positioning, making it suitable for use in operating theatres, intensive care units (ICUs), and critical care settings, subject to equipment compatibility.',
    ],
    features: [
      { title: 'Dual-Limb Design', description: 'Separate inspiratory and expiratory pathways for respiratory gas delivery and exhalation.' },
      { title: 'Anesthesia & Ventilator Compatibility', description: 'Designed for use with compatible anesthesia machines and mechanical ventilators.' },
      { title: 'Efficient Gas Flow Management', description: 'Supports controlled inspiratory and expiratory gas pathways.' },
      { title: 'Lightweight & Flexible', description: 'Facilitates convenient positioning and minimizes tubing bulk.' },
      { title: 'Convenient Connectivity', description: 'Supports integration with compatible respiratory and anesthesia equipment.' },
      { title: 'Versatile Applications', description: 'Suitable for operating theatres, ICUs, and critical care environments.' },
      { title: 'Easy Circuit Management', description: 'Simplifies setup and handling for healthcare professionals.' },
    ],
    specifications: [
      { parameter: 'Brand', value: 'EEVA' },
      { parameter: 'Product Name', value: 'Two-Limb Breathing Circuit' },
      { parameter: 'Circuit Type', value: 'Dual-Limb Breathing Circuit' },
      { parameter: 'Configuration', value: 'Separate inspiratory and expiratory limbs' },
      { parameter: 'Application', value: 'Anesthesia and mechanical ventilation' },
      { parameter: 'Equipment Compatibility', value: 'Compatible anesthesia workstations and ventilator machines' },
      { parameter: 'Clinical Settings', value: 'Operating theatres, ICUs, and critical care units' },
      { parameter: 'Patient Category', value: 'As per manufacturer specifications' },
    ],
    summary:
      'The EEVA Two-Limb Breathing Circuit is a flexible, dual-limb respiratory circuit designed for use with compatible anesthesia workstations and mechanical ventilators. Its separate inspiratory and expiratory pathways support efficient gas flow management, convenient handling, and reliable circuit organization in operating theatres and intensive care environments.',
    imagePlaceholder: 'product-two-limb-image-placeholder',
    imageHint: 'EEVA Two-Limb Breathing Circuit',
  },
]

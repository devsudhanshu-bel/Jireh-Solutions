/**
 * Advanced Wound Care page content.
 *
 * NOTE: the DOCX supplies no wound-care products (only NPWT / dressing SERVICES and partner names).
 * At the client's explicit direction, this page currently shows three EEVA products taken verbatim from the
 * DOCX (HME Filter, BV Filter, Yankauer Suction Set). They are respiratory/suction products, not wound-care
 * products — swap in genuine wound-care products here when supplied (same shape as Airway products).
 */
import type { AirwayProduct } from './airway'

export type WoundCareProduct = AirwayProduct

export const woundCareHero = {
  title: 'Advanced Wound Care',
  imagePlaceholder: 'wound-care-hero-image-placeholder',
  imageHint: 'Wide hero image — Advanced Wound Care',
}

const feat = (title: string, description: string) => ({ title, description })
const spec = (parameter: string, value: string) => ({ parameter, value })

export const woundCareProducts: WoundCareProduct[] = [
  {
    id: 'hme-filter',
    name: 'EEVA Heat and Moisture Exchange (HME) Filter',
    cardDescription:
      'Designed to support passive humidification of inspired gases during mechanical ventilation and anesthesia.',
    overview: [
      'The EEVA Heat and Moisture Exchange (HME) Filter is designed to support passive humidification of inspired gases during mechanical ventilation and anesthesia. It helps retain heat and moisture from exhaled breath and returns a portion of that heat and moisture during inspiration, supporting airway humidification in patients with an artificial airway.',
      'Its compact design facilitates convenient integration into compatible anesthesia and ventilator breathing circuits.',
    ],
    features: [
      feat('Heat and Moisture Exchange', 'Helps conserve heat and moisture from exhaled gases.'),
      feat('Passive Humidification', 'Supports airway humidification without an external power source.'),
      feat('Compact Design', 'Facilitates convenient placement within compatible breathing circuits.'),
      feat('Easy Connectivity', 'Designed for integration with compatible anesthesia and ventilator systems.'),
      feat('Respiratory Care Support', 'Helps reduce heat and moisture loss during mechanical ventilation.'),
      feat('Versatile Application', 'Intended for use in operating theatres and critical care settings, subject to product compatibility.'),
    ],
    specifications: [
      spec('Brand', 'EEVA'),
      spec('Product Name', 'Heat and Moisture Exchange (HME) Filter'),
      spec('Product Category', 'Respiratory Humidification Device'),
      spec('Function', 'Passive heat and moisture exchange'),
      spec('Application', 'Anesthesia and mechanical ventilation'),
    ],
    summary:
      'The EEVA HME Filter is a passive respiratory humidification device designed to help maintain heat and moisture in inspired gases during anesthesia and mechanical ventilation. Its compact design supports convenient integration into compatible breathing circuits, contributing to effective airway humidification and respiratory care.',
    imagePlaceholder: 'product-hme-filter-image-placeholder',
    imageHint: 'EEVA Heat and Moisture Exchange (HME) Filter',
  },
  {
    id: 'bv-filter',
    name: 'EEVA Bacterial/Viral (BV) Filter',
    cardDescription:
      'Designed to provide respiratory gas filtration within compatible anesthesia and mechanical ventilation systems.',
    overview: [
      'The EEVA Bacterial/Viral (BV) Filter is designed to provide respiratory gas filtration within compatible anesthesia and mechanical ventilation systems. It helps reduce the passage of airborne bacteria and viruses through breathing circuits, supporting infection prevention measures and respiratory equipment protection.',
      'Its compact configuration facilitates convenient placement in compatible breathing systems used in operating theatres and intensive care units.',
    ],
    features: [
      feat('Bacterial and Viral Filtration', 'Designed to reduce the passage of microorganisms through respiratory gas pathways.'),
      feat('Breathing Circuit Protection', 'Helps reduce microbial contamination within compatible respiratory systems.'),
      feat('Compact Configuration', 'Facilitates convenient integration into anesthesia and ventilator circuits.'),
      feat('Convenient Connectivity', 'Supports connection to compatible respiratory equipment.'),
      feat('Infection Prevention Support', 'Complements established infection prevention and control practices.'),
      feat('Clinical Versatility', 'Designed for anesthesia and critical care applications, subject to product specifications.'),
    ],
    specifications: [
      spec('Brand', 'EEVA'),
      spec('Product Name', 'Bacterial/Viral (BV) Filter'),
      spec('Product Category', 'Respiratory Filtration Device'),
      spec('Primary Function', 'Bacterial and viral filtration'),
      spec('Application', 'Anesthesia and mechanical ventilation'),
    ],
    summary:
      'The EEVA BV Filter is a respiratory filtration device designed to reduce bacterial and viral transmission through compatible anesthesia and mechanical ventilation breathing circuits. Its compact design supports convenient integration into respiratory systems, contributing to equipment protection and infection prevention practices.',
    imagePlaceholder: 'product-bv-filter-image-placeholder',
    imageHint: 'EEVA Bacterial/Viral (BV) Filter',
  },
  {
    id: 'yankauer',
    name: 'EEVA Yankauer Suction Set',
    subtitle: 'Surgical & Airway Suction Management',
    cardDescription:
      'Designed for the effective removal of blood, fluids, and secretions during surgical procedures and airway management.',
    overview: [
      'The EEVA Yankauer Suction Set is designed for the effective removal of blood, fluids, and secretions during surgical procedures and airway management. Featuring a rigid Yankauer suction handle connected to flexible suction tubing, the set supports controlled suctioning and convenient handling in operating theatres, emergency departments, and critical care settings.',
      'Its practical design helps healthcare professionals maintain a clear surgical field and manage oral and oropharyngeal secretions during clinical procedures.',
    ],
    features: [
      feat('Effective Suction Management', 'Designed to remove blood, fluids, and secretions during surgical and airway procedures.'),
      feat('Ergonomic Yankauer Handle', 'Provides a comfortable grip for controlled suctioning.'),
      feat('Rigid Suction Tip', 'Facilitates precise suctioning in accessible surgical and oral areas.'),
      feat('Flexible Suction Tubing', 'Supports convenient positioning and maneuverability.'),
      feat('Convenient Connectivity', 'Designed for attachment to compatible medical suction systems.'),
      feat('Versatile Clinical Applications', 'Suitable for operating theatres, emergency care, and critical care settings.'),
      feat('Practical Design', 'Supports convenient setup and handling by healthcare professionals.'),
    ],
    specifications: [
      spec('Brand', 'EEVA'),
      spec('Product Name', 'Yankauer Suction Set'),
      spec('Product Category', 'Surgical and Airway Suction Device'),
      spec('Configuration', 'Rigid Yankauer handle with flexible suction tubing'),
      spec('Primary Function', 'Removal of blood, fluids, and secretions'),
      spec('Application', 'Surgical suctioning and oral/oropharyngeal secretion management'),
      spec('Clinical Settings', 'Operating theatres, emergency departments, and critical care units'),
      spec('Suction Tip Type', 'Yankauer-type rigid suction tip'),
      spec('Handle Design', 'Ergonomic handheld design'),
      spec('Packaging', 'Yankauer suction handle with suction tubing'),
    ],
    summary:
      'The EEVA Yankauer Suction Set is a practical surgical and airway suction device designed to facilitate the removal of blood, fluids, and secretions during clinical procedures. Featuring a rigid suction handle and flexible tubing, it supports controlled suctioning, convenient handling, and effective fluid management in operating theatres, emergency departments, and critical care environments.',
    imagePlaceholder: 'product-yankauer-image-placeholder',
    imageHint: 'EEVA Yankauer Suction Set',
  },
]

import { useEffect, useState } from 'react'
import { AirwayHero } from '../components/airway/AirwayHero'
import { ProductCards } from '../components/airway/ProductCards'
import { ProductDetails } from '../components/airway/ProductDetails'
import { woundCareHero, woundCareProducts } from '../data/woundCare'

export default function AdvancedWoundCare() {
  const [selectedId, setSelectedId] = useState(woundCareProducts[0].id)
  const selected = woundCareProducts.find((p) => p.id === selectedId) ?? woundCareProducts[0]

  useEffect(() => {
    const previous = document.title
    document.title = 'Jireh Healthcare Solutions'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <>
      <AirwayHero
        title={woundCareHero.title}
        titleId="wound-care-title"
        imagePlaceholder={woundCareHero.imagePlaceholder}
        imageHint={woundCareHero.imageHint}
        showBrand={false}
      />
      <ProductCards
        products={woundCareProducts}
        selectedId={selected.id}
        onSelect={setSelectedId}
        label="Advanced wound care products"
        gridClassName="sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
      />
      <ProductDetails product={selected} eyebrow="EEVA · Product Overview" />
    </>
  )
}

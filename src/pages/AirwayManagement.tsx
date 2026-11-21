import { useEffect, useState } from 'react'
import { AirwayHero } from '../components/airway/AirwayHero'
import { EevaIntro } from '../components/airway/EevaIntro'
import { ProductCards } from '../components/airway/ProductCards'
import { ProductDetails } from '../components/airway/ProductDetails'
import { airwayProducts } from '../data/airway'

export default function AirwayManagement() {
  const [selectedId, setSelectedId] = useState(airwayProducts[0].id)
  const selected = airwayProducts.find((p) => p.id === selectedId) ?? airwayProducts[0]

  useEffect(() => {
    const previous = document.title
    document.title = 'Jireh Healthcare Solutions'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <>
      <AirwayHero />
      <EevaIntro />
      <ProductCards products={airwayProducts} selectedId={selected.id} onSelect={setSelectedId} />
      <ProductDetails product={selected} />
    </>
  )
}

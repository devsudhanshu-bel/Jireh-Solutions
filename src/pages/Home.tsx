import { CareAreas } from '../components/sections/CareAreas'
import { EnquiryCta } from '../components/sections/EnquiryCta'
import { Hero } from '../components/sections/Hero'
import { Mission } from '../components/sections/Mission'
import { Partners } from '../components/sections/Partners'
import { Services } from '../components/sections/Services'

/** Homepage — section order follows the supplied reference images. */
export default function Home() {
  return (
    <>
      <Hero />
      <Mission />
      <Services />
      <CareAreas />
      <Partners />
      <EnquiryCta />
    </>
  )
}

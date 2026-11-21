
import { useEffect } from 'react'
import { AirwayHero } from '../components/airway/AirwayHero'
import { AppointmentForm } from '../components/services/AppointmentForm'
import { ServiceSection } from '../components/services/ServiceSection'
import { ServicesIntro } from '../components/services/ServicesIntro'
import { serviceDetails, servicesHero } from '../data/services'

export default function Services() {
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
        title={servicesHero.title}
        titleId="services-title"
        imagePlaceholder={servicesHero.imagePlaceholder}
        imageHint={servicesHero.imageHint}
        showBrand={false}
      />

      <ServicesIntro />

      <section
        aria-label="Specialized services"
        className="bg-white pt-5 pb-0 sm:pt-6 sm:pb-0 lg:pt-8 lg:pb-0"
      >
        <div className="container-site space-y-16 sm:space-y-20 lg:space-y-28">
          {serviceDetails.map((s) => (
            <ServiceSection key={s.id} service={s} />
          ))}
        </div>
      </section>

      <div className="-mt-6 sm:-mt-8 lg:-mt-10">
        <AppointmentForm />
      </div>
    </>
  )
}

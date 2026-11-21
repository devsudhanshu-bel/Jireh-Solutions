import { useEffect } from 'react'
import { AboutBanner, AboutCompany, Leadership, MissionSection, Vision } from '../components/about/AboutSections'
import { ContactSection } from '../components/about/ContactSection'

export default function AboutUs() {
  useEffect(() => {
    const previous = document.title
    document.title = 'Jireh Healthcare Solutions'
    return () => {
      document.title = previous
    }
  }, [])

  return (
    <>
      <AboutBanner />
      <MissionSection />
      <Vision />
      <AboutCompany />
      <Leadership />
      <ContactSection />
    </>
  )
}

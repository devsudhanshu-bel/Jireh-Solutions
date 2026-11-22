import { MotionConfig } from 'framer-motion'
import { EnquiryProvider } from './components/enquiry/EnquiryContext'
import { Footer } from './components/layout/Footer'
import { Navbar } from './components/layout/Navbar'
import { RouterProvider } from './lib/RouterProvider'
import { usePath } from './lib/router'
import AboutUs from './pages/AboutUs'
import AdvancedWoundCare from './pages/AdvancedWoundCare'
import AirwayManagement from './pages/AirwayManagement'
import Home from './pages/Home'
import NotFound from './pages/NotFound'
import Security from './pages/Security'
import Services from './pages/Services'

function Routes() {
  const path = usePath()
  // /about is kept as an alias of the canonical /about-us route.
  if (path === '/about-us' || path === '/about') return <AboutUs />
  if (path === '/care-areas/airway-management') return <AirwayManagement />
  if (path === '/care-areas/advanced-wound-care') return <AdvancedWoundCare />
  if (path === '/services') return <Services />
  if (path === '/security') return <Security />
  if (path === '/') return <Home />
  return <NotFound />
}

/** Site shell: shared navbar + footer around the current route. */
export default function App() {
  return (
    <MotionConfig reducedMotion="user">
      <RouterProvider>
        <EnquiryProvider>
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[200] focus:rounded-full focus:bg-white focus:px-5 focus:py-3 focus:text-heading"
          >
            Skip to content
          </a>
          <Navbar />
          <main id="main">
            <Routes />
          </main>
          <Footer />
        </EnquiryProvider>
      </RouterProvider>
    </MotionConfig>
  )
}


import { useMemo } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

import { company } from '../../data/site'
import { useEnquiry } from '../enquiry/useEnquiry'
import {
  ArrowRight,
  ArrowUpRight,
  Mail,
  MapPin,
} from '../ui/icons'
import { Reveal } from '../ui/Reveal'
import { SectionEyebrow } from '../ui/SectionEyebrow'

// Existing approximate Hyderabad coordinates.
// Replace with the exact office pin coordinates if available.
const officePosition: [number, number] = [
  17.4065,
  78.4772,
]

// Custom Jireh location marker.
const officeIcon = L.divIcon({
  className: 'jireh-map-marker',
  html: `
    <div style="
      width: 38px;
      height: 38px;
      background: #542c1d;
      border: 3px solid #ffffff;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 3px 12px rgba(40,20,10,0.25);
      display: flex;
      align-items: center;
      justify-content: center;
    ">
      <div style="
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #ffffff;
      "></div>
    </div>
  `,
  iconSize: [38, 38],
  iconAnchor: [19, 38],
  popupAnchor: [0, -36],
})

function JirehMap() {
  const popupAddress = useMemo(
    () => company.addressLines.join(', '),
    [],
  )

  return (
    <MapContainer
      center={officePosition}
      zoom={16}
      scrollWheelZoom={false}
      zoomControl={true}
      attributionControl={true}
      className="jireh-map absolute inset-0 h-full w-full"
    >
<TileLayer
  attribution='Tiles &copy; Esri'
  url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}"
  maxZoom={16}
/>

      <Marker
        position={officePosition}
        icon={officeIcon}
        title={company.name}
      >
        <Popup>
          <div className="min-w-[190px]">
            <strong className="block text-[14px] text-[#542c1d]">
              {company.name}
            </strong>

            <p className="mt-1 text-[12px] leading-relaxed text-gray-600">
              {popupAddress}
            </p>

            <a
              href={company.directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-[12px] font-semibold text-[#542c1d] underline"
            >
              Get directions
            </a>
          </div>
        </Popup>
      </Marker>
    </MapContainer>
  )
}

/** Section 6 — map on the left, contact details on the right. */
export function ContactSection() {
  const { openEnquiry } = useEnquiry()

  return (
    <section
      id="visit"
      aria-labelledby="visit-title"
      className="border-t border-brown-600/10 bg-white py-16 sm:py-20 lg:py-24"
    >
      <div className="container-site">

        <Reveal>
          <SectionEyebrow>Contact Us</SectionEyebrow>


        </Reveal>

        <div className="mt-10 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] lg:gap-16">

          {/* Interactive Jireh Map */}
          <Reveal className="order-2 lg:order-1">
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-sm bg-[#f7f4ed] ring-1 ring-brown-600/10 lg:aspect-auto lg:h-full lg:min-h-[420px]">
              <JirehMap />
            </div>
          </Reveal>

          {/* Contact Information */}
          <Reveal delay={0.1} className="order-1 lg:order-2">

            <dl className="divide-y divide-brown-600/15 border-y border-brown-600/15">

              {/* Address */}
              <div className="flex gap-4 py-6">

                <dt className="mt-0.5 shrink-0 text-brown-500">
                  <MapPin size={22} />
                  <span className="sr-only">Address</span>
                </dt>

                <dd>
                  <address className="text-[16px] not-italic leading-[1.75] text-ink">

                    <strong className="block font-display font-semibold text-heading">
                      {company.name}
                    </strong>

                    {company.addressLines.map((line) => (
                      <span key={line} className="block">
                        {line}
                      </span>
                    ))}

                  </address>

                  <a
                    href={company.directionsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group mt-4 inline-flex items-center gap-2 border-b border-heading-warm/40 pb-0.5 font-display text-[14px] font-semibold text-heading-warm transition-colors hover:border-heading-warm"
                  >
                    Get directions

                    <ArrowUpRight
                      size={15}
                      className="transition-transform duration-300 ease-premium group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                    />

                    <span className="sr-only">
                      (opens Google Maps in a new tab)
                    </span>
                  </a>

                </dd>
              </div>

              {/* Email */}
              <div className="flex gap-4 py-6">

                <dt className="mt-0.5 shrink-0 text-brown-500">
                  <Mail size={22} />
                  <span className="sr-only">Email</span>
                </dt>

                <dd className="min-w-0">
                  <a
                    href={`mailto:${company.email}`}
                    className="break-all text-[16px] text-ink underline-offset-4 transition-colors hover:text-heading-warm hover:underline sm:break-normal"
                  >
                    {company.email}
                  </a>
                </dd>

              </div>

            </dl>

            {/* Enquiry Button */}
            <button
              type="button"
              onClick={openEnquiry}
              className="group mt-8 inline-flex w-full items-center justify-center gap-3 rounded-full bg-brown-700 px-8 py-3.5 font-display text-[16px] font-semibold text-white transition-colors duration-300 hover:bg-espresso-900 sm:w-auto"
            >
              Enquire Now

              <ArrowRight
                className="transition-transform duration-300 ease-premium group-hover:translate-x-1"
              />
            </button>

          </Reveal>

        </div>
      </div>
    </section>
  )
}

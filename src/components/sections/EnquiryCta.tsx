
import { enquiryCta } from '../../data/site'
import { useEnquiry } from '../enquiry/useEnquiry'
import { ArrowRight } from '../ui/icons'
import { Reveal } from '../ui/Reveal'

export function EnquiryCta() {
  const { openEnquiry } = useEnquiry()

  return (
    <section className="bg-white py-14 sm:py-16 lg:py-20">
      <div className="container-site">
        <Reveal>
          <button
            type="button"
            onClick={openEnquiry}
            className="group inline-flex items-center gap-3 rounded-full bg-espresso-800 px-8 py-4 font-display text-[16px] font-semibold text-white shadow-[0_20px_40px_-20px_rgba(51,30,24,0.9)] transition-all duration-300 ease-premium hover:-translate-y-0.5 hover:bg-espresso-900 sm:px-9 sm:text-[17px]"
          >
            {enquiryCta.button}
            <ArrowRight
              size={20}
              className="transition-transform duration-300 ease-premium group-hover:translate-x-1.5"
            />
          </button>
        </Reveal>
      </div>
    </section>
  )
}

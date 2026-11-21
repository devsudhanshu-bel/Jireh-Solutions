import { motion, type HTMLMotionProps } from 'framer-motion'
import { easePremium } from '../../lib/motion'

type RevealProps = HTMLMotionProps<'div'> & {
  delay?: number
  y?: number
  /** Fraction of the element that must be visible before it animates in. */
  amount?: number
}

/** Scroll-triggered fade-and-rise reveal. Animates once. */
export function Reveal({ delay = 0, y = 28, amount = 0.25, children, ...rest }: RevealProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount }}
      transition={{ duration: 0.85, ease: easePremium, delay }}
      {...rest}
    >
      {children}
    </motion.div>
  )
}

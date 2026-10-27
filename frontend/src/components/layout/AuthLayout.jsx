import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'

/** The split editorial layout shared by every authentication screen. */
export default function AuthLayout({ image, imageAlt, title, subtitle, children, footer }) {
  return (
    <div className="w-full min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-ivory">
      <div className="hidden lg:block relative overflow-hidden h-screen bg-charcoal">
        <motion.img
          src={image}
          alt={imageAlt}
          className="w-full h-full object-cover mix-blend-luminosity opacity-80"
          initial={{ scale: 1.05 }}
          animate={{ scale: 1.0 }}
          transition={{ duration: 12, ease: 'easeOut' }}
        />
        <div className="absolute inset-0 bg-charcoal/20" />
      </div>

      <div className="flex flex-col justify-center items-center w-full min-h-screen px-4 p-8 bg-bg">
        <div className="w-full max-w-xs mx-auto flex flex-col">
          <Link to="/" className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors mb-16 inline-block w-max">← Return to House</Link>
          <h1 className="font-display text-4xl font-light text-charcoal mb-2 m-0 tracking-tight">{title}</h1>
          <p className="text-[10px] tracking-luxury uppercase text-warmgray mb-12">{subtitle}</p>
          {children}
          {footer && <div className="mt-12 text-center">{footer}</div>}
        </div>
      </div>
    </div>
  )
}

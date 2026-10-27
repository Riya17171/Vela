import { useState } from 'react'

/**
 * Product photo with an on-brand fallback: if the URL fails to load (a dead
 * link in the catalogue, or a bad URL entered by an admin) the piece's name
 * is shown on a quiet tile instead of a broken-image icon.
 */
export default function ProductImage({ src, alt, className = '', fallbackClassName = '', ...props }) {
  const [failedSrc, setFailedSrc] = useState(null)

  if (!src || failedSrc === src) {
    return (
      <div role="img" aria-label={alt} className={`w-full h-full flex items-center justify-center bg-parchment p-4 text-center ${fallbackClassName}`}>
        <span className="font-display font-light text-charcoal/70 text-sm leading-snug">{alt || 'Vela'}</span>
      </div>
    )
  }
  return <img src={src} alt={alt} onError={() => setFailedSrc(src)} className={className} {...props} />
}

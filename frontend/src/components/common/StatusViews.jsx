import { Link } from 'react-router-dom'

export function LoadingState({ label = 'Loading...', className = 'min-h-[40vh]' }) {
  return (
    <div role="status" aria-live="polite" className={`w-full flex items-center justify-center font-sans text-xs tracking-luxury uppercase text-warmgray ${className}`}>
      {label}
    </div>
  )
}

export function EmptyState({ title, message, actionLabel, actionTo, onAction, className = 'min-h-[60vh]' }) {
  return (
    <div className={`flex flex-col items-center justify-center text-center px-4 ${className}`}>
      <h2 className="font-display text-4xl lg:text-5xl font-light text-charcoal mb-4 tracking-tight">{title}</h2>
      {message && <p className="font-sans text-sm text-charcoal font-light mb-8 max-w-md">{message}</p>}
      {actionLabel && actionTo && (
        <Link to={actionTo} className="bg-transparent border border-charcoal text-charcoal text-xs tracking-luxury uppercase px-8 py-3.5 rounded-none font-medium hover:bg-parchment transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal">
          {actionLabel}
        </Link>
      )}
      {actionLabel && onAction && (
        <button type="button" onClick={onAction} className="bg-transparent border border-charcoal text-charcoal text-xs tracking-luxury uppercase px-8 py-3.5 rounded-none font-medium hover:bg-parchment transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal">
          {actionLabel}
        </button>
      )}
    </div>
  )
}

/** Shown when a request fails; never hides the failure behind an empty list. */
export function ErrorState({ error, onRetry, className = 'min-h-[40vh]' }) {
  const notFound = error?.status === 404
  return (
    <div role="alert" className={`flex flex-col items-center justify-center text-center px-4 ${className}`}>
      <h2 className="font-display text-3xl font-light text-charcoal mb-4">{notFound ? 'Not found' : 'Something went wrong'}</h2>
      <p className="font-sans text-sm text-warmgray font-light mb-8 max-w-md">{error?.message ?? 'Please try again.'}</p>
      {onRetry && !notFound && (
        <button type="button" onClick={onRetry} className="text-[10px] tracking-luxury uppercase text-charcoal border-b border-charcoal pb-1 hover:opacity-70 transition-opacity focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal">
          Try again
        </button>
      )}
    </div>
  )
}

export function FormAlert({ message, tone = 'error' }) {
  if (!message) return null
  const styles = tone === 'error'
    ? 'text-[#e53e3e] border-[#e53e3e]/30 bg-[#e53e3e]/5'
    : 'text-charcoal border-silk bg-parchment/50'
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`text-[10px] tracking-luxury uppercase mb-8 border px-4 py-3 ${styles}`}>
      {message}
    </div>
  )
}

import { forwardRef, useId } from 'react'

/** Underlined input in the Vela style, with an accessible label and error. */
const FormField = forwardRef(function FormField({ label, error, className = '', as = 'input', ...props }, ref) {
  const id = useId()
  const Element = as
  return (
    <div className={`flex flex-col gap-2 relative w-full ${className}`}>
      <label htmlFor={id} className="text-[10px] tracking-luxury uppercase text-warmgray">{label}</label>
      <Element
        id={id}
        ref={ref}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`w-full bg-transparent border-b border-t-0 border-l-0 border-r-0 rounded-none py-2 text-sm text-charcoal font-sans outline-none focus:ring-0 transition-colors placeholder:text-warmgray/50 ${error ? 'border-[#e53e3e]' : 'border-silk focus:border-charcoal'}`}
        {...props}
      />
      {error && <span id={`${id}-error`} className="text-[10px] tracking-luxury uppercase text-[#e53e3e]">{error}</span>}
    </div>
  )
})

export default FormField

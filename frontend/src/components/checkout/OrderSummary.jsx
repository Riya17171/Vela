import { formatPrice } from '../../utils/format.js'

/** Totals always come from the server (cart view or order); nothing is computed here. */
export default function OrderSummary({ summary, title = 'Order Summary', children }) {
  const currency = summary?.currency ?? 'INR'
  const taxPercent = summary?.taxRate !== undefined ? ` (${Math.round(summary.taxRate * 1000) / 10}%)` : ''
  return (
    <div className="border border-silk p-6 sm:p-8 bg-parchment/30">
      <h2 className="font-display text-2xl font-light text-charcoal mb-8 m-0">{title}</h2>
      <dl className="flex flex-col gap-4 font-sans text-sm text-charcoal font-light mb-8">
        <div className="flex justify-between items-center"><dt>Subtotal</dt><dd>{formatPrice(summary?.subtotal, currency)}</dd></div>
        <div className="flex justify-between items-center text-warmgray"><dt>Shipping</dt><dd>{summary?.shipping ? formatPrice(summary.shipping, currency) : 'Complimentary'}</dd></div>
        <div className="flex justify-between items-center"><dt>Tax{taxPercent}</dt><dd>{formatPrice(summary?.tax, currency)}</dd></div>
      </dl>
      <div className="border-t border-charcoal pt-6 flex justify-between items-end mb-8">
        <span className="font-sans text-sm text-charcoal">Total</span>
        <span className="font-display text-3xl font-light text-charcoal">{formatPrice(summary?.total, currency)}</span>
      </div>
      {children}
    </div>
  )
}

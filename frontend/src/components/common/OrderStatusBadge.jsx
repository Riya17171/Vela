import { statusLabel } from '../../utils/format.js'

const STYLES = {
  pending_payment: 'bg-linen text-warmgray',
  confirmed: 'bg-parchment text-charcoal border border-silk',
  processing: 'bg-parchment text-charcoal border border-charcoal',
  shipped: 'bg-charcoal text-cream',
  delivered: 'bg-obsidian text-cream',
  cancelled: 'border border-silk text-warmgray line-through',
  expired: 'border border-silk text-warmgray',
  paid: 'bg-parchment text-charcoal border border-silk',
  pending: 'bg-linen text-warmgray',
  failed: 'border border-[#e53e3e]/40 text-[#e53e3e]',
  refund_pending: 'border border-charcoal text-charcoal',
  refunded: 'border border-silk text-warmgray',
  void: 'border border-silk text-warmgray',
}

export default function OrderStatusBadge({ status }) {
  return (
    <span className={`text-[9px] tracking-luxury uppercase px-3 py-1 rounded-none inline-block whitespace-nowrap ${STYLES[status] ?? 'bg-linen text-warmgray'}`}>
      {statusLabel(status)}
    </span>
  )
}

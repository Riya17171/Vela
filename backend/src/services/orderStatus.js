/**
 * Order lifecycle. Fulfilment (`status`) and money (`paymentStatus`) are
 * tracked separately so a cancelled order can still be "refund_pending".
 *
 *   pending_payment ──payment──▶ confirmed ──▶ processing ──▶ shipped ──▶ delivered
 *         │                         │              │
 *         ├──customer/admin──▶ cancelled ◀─────────┘ (admin only after confirmed)
 *         └──reservation timeout──▶ expired
 */
export const FULFILMENT_STATUSES = [
  'pending_payment',
  'confirmed',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
  'expired',
]

export const ORDER_PAYMENT_STATUSES = ['pending', 'paid', 'failed', 'refund_pending', 'refunded', 'void']

export const TERMINAL_STATUSES = ['delivered', 'cancelled', 'expired']

const TRANSITIONS = {
  pending_payment: { confirmed: ['payment'], cancelled: ['customer', 'admin', 'system'], expired: ['system'] },
  confirmed: { processing: ['admin'], shipped: ['admin'], cancelled: ['customer', 'admin'] },
  processing: { shipped: ['admin'], cancelled: ['admin'] },
  shipped: { delivered: ['admin'] },
  delivered: {},
  cancelled: {},
  expired: {},
}

// Statuses an admin may pick in the dashboard (confirmation only comes from a verified payment).
export const ADMIN_SETTABLE_STATUSES = ['processing', 'shipped', 'delivered', 'cancelled']

export function canTransition(from, to, actor) {
  return Boolean(TRANSITIONS[from]?.[to]?.includes(actor))
}

export function allowedNextStatuses(from, actor) {
  return Object.entries(TRANSITIONS[from] ?? {})
    .filter(([, actors]) => actors.includes(actor))
    .map(([status]) => status)
}

/** Payment status that follows cancelling an order in the given payment state. */
export function paymentStatusAfterCancellation(paymentStatus) {
  if (paymentStatus === 'paid') return 'refund_pending'
  if (paymentStatus === 'pending' || paymentStatus === 'failed') return 'void'
  return paymentStatus
}

/** Stock reserved for an order goes back to inventory only if it never shipped. */
export function shouldReleaseInventory(fromStatus) {
  return ['pending_payment', 'confirmed', 'processing'].includes(fromStatus)
}

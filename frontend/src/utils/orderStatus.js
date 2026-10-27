// Mirrors backend/src/services/orderStatus.js so the admin UI only offers
// valid moves. The server remains the authority and rejects anything else.
export const ADMIN_NEXT_STATUSES = {
  pending_payment: ['cancelled'],
  confirmed: ['processing', 'shipped', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['delivered'],
  delivered: [],
  cancelled: [],
  expired: [],
}

export function isRefundable(order) {
  return order.paymentStatus === 'refund_pending' || (order.paymentStatus === 'paid' && order.status === 'cancelled')
}

import { useState } from 'react'
import { Link } from 'react-router-dom'

import OrderStatusBadge from '../../components/common/OrderStatusBadge.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StatusViews.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { fetchMyOrders } from '../../services/orders.js'
import { formatDate, formatPrice } from '../../utils/format.js'

export default function Orders() {
  const [page, setPage] = useState(1)
  const { data, loading, error, reload } = useAsync(() => fetchMyOrders({ page, limit: 10 }), [page])

  if (loading && !data) return <LoadingState label="Loading orders..." className="min-h-[60vh]" />
  if (error) return <ErrorState error={error} onRetry={reload} className="min-h-[60vh]" />

  const { orders, meta } = data
  if (orders.length === 0 && page === 1) {
    return <EmptyState title="Order History" message="You haven't placed any orders yet." actionLabel="Start Shopping" actionTo="/products" />
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 md:py-24 min-h-screen">
      <h1 className="font-display text-4xl lg:text-5xl font-light text-charcoal mb-16 pb-6 border-b border-silk tracking-tight">Order History</h1>

      <ul className="flex flex-col gap-8">
        {orders.map((o) => (
          <li className="border border-silk bg-bg rounded-none" key={o.id}>
            <div className="flex flex-col md:flex-row gap-4 md:gap-8 py-4 px-6 bg-parchment/30 border-b border-silk justify-between md:items-center">
              <dl className="flex flex-wrap gap-6 md:gap-8">
                <div className="flex flex-col gap-1">
                  <dt className="text-[10px] tracking-luxury uppercase text-warmgray">Order Placed</dt>
                  <dd className="font-sans text-sm text-charcoal font-medium">{formatDate(o.createdAt)}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-[10px] tracking-luxury uppercase text-warmgray">Total</dt>
                  <dd className="font-sans text-sm text-charcoal font-medium">{formatPrice(o.total, o.currency)}</dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-[10px] tracking-luxury uppercase text-warmgray">Status</dt>
                  <dd className="mt-0.5"><OrderStatusBadge status={o.status} /></dd>
                </div>
                <div className="flex flex-col gap-1">
                  <dt className="text-[10px] tracking-luxury uppercase text-warmgray">Payment</dt>
                  <dd className="mt-0.5"><OrderStatusBadge status={o.paymentStatus} /></dd>
                </div>
              </dl>
              <Link to={`/orders/${o.id}`} className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal underline underline-offset-4 focus:outline-none transition-colors">
                {o.status === 'pending_payment' ? 'Complete Payment' : 'View Details'}
              </Link>
            </div>
            <div className="px-6 py-4 flex flex-col sm:flex-row sm:justify-between gap-2">
              <span className="text-sm text-charcoal font-light">{o.items.map((item) => `${item.title}${item.quantity > 1 ? ` × ${item.quantity}` : ''}`).join(', ')}</span>
              <span className="font-sans text-xs text-warmgray tracking-wider">{o.orderNumber}</span>
            </div>
          </li>
        ))}
      </ul>

      {meta.totalPages > 1 && (
        <nav className="flex justify-center items-center gap-8 mt-16" aria-label="Pagination">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="text-[10px] tracking-luxury uppercase text-charcoal disabled:opacity-30">← Newer</button>
          <span className="text-[10px] tracking-luxury uppercase text-warmgray">Page {meta.page} of {meta.totalPages}</span>
          <button type="button" disabled={!meta.hasNextPage} onClick={() => setPage(page + 1)} className="text-[10px] tracking-luxury uppercase text-charcoal disabled:opacity-30">Older →</button>
        </nav>
      )}
    </div>
  )
}

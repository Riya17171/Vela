import { Fragment, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { DataTable, StatusBadge } from '../../components/admin/Primitives.jsx'
import { ErrorState } from '../../components/common/StatusViews.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useDebounce } from '../../hooks/useDebounce.js'
import { fetchAdminOrders, refundOrder, updateOrderStatus } from '../../services/admin.js'
import { formatDate, formatDateTime, formatPrice, statusLabel, variantLabel } from '../../utils/format.js'
import { ADMIN_NEXT_STATUSES, isRefundable } from '../../utils/orderStatus.js'

const STATUS_TABS = ['all', 'pending_payment', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'expired']

function OrderDetails({ order }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 bg-parchment/30 text-xs text-charcoal">
      <div>
        <h3 className="text-[10px] tracking-luxury uppercase text-warmgray mb-2">Items</h3>
        <ul className="space-y-1">
          {order.items.map((item) => (
            <li key={item.id}>{item.title} × {item.quantity} <span className="text-warmgray">{variantLabel(item)} · {item.sku}</span> — {formatPrice(item.lineTotal, order.currency)}</li>
          ))}
        </ul>
        <p className="mt-2">Subtotal {formatPrice(order.subtotal, order.currency)} · Tax {formatPrice(order.tax, order.currency)} · Shipping {formatPrice(order.shipping, order.currency)}</p>
      </div>
      <div>
        <h3 className="text-[10px] tracking-luxury uppercase text-warmgray mb-2">Ship to</h3>
        <p className="leading-relaxed">{order.shippingAddress.fullName}<br />{order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />{order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />{order.shippingAddress.phone} · {order.contactEmail}</p>
        {order.razorpayOrderId && <p className="mt-2 text-warmgray font-mono">Razorpay {order.razorpayOrderId}</p>}
        {order.needsAttention && <p className="mt-2 text-[#C53030]">{order.attentionReason}</p>}
      </div>
      <div>
        <h3 className="text-[10px] tracking-luxury uppercase text-warmgray mb-2">History</h3>
        <ol className="space-y-1">
          {order.statusHistory.map((event, index) => (
            <li key={index}>{statusLabel(event.status)} / {statusLabel(event.paymentStatus)} · {event.by} · {formatDateTime(event.at)}{event.note ? ` — ${event.note}` : ''}</li>
          ))}
        </ol>
      </div>
    </div>
  )
}

export default function OrdersAdmin() {
  const [params] = useSearchParams()
  const [status, setStatus] = useState('all')
  const [search, setSearch] = useState(params.get('search') ?? '')
  const [needsAttention] = useState(params.get('needsAttention') === 'true')
  const [page, setPage] = useState(1)
  const [expanded, setExpanded] = useState(null)
  const [busyId, setBusyId] = useState(null)
  const debouncedSearch = useDebounce(search, 400)

  const query = { page, limit: 20, ...(status !== 'all' && { status }), ...(debouncedSearch && { search: debouncedSearch }), ...(needsAttention && { needsAttention: 'true' }) }
  const { data, loading, error, reload, setData } = useAsync(() => fetchAdminOrders(query), [JSON.stringify(query)])

  const replace = (order) => setData((prev) => ({ ...prev, orders: prev.orders.map((o) => (o.id === order.id ? order : o)) }))

  async function changeStatus(order, next) {
    setBusyId(order.id)
    try {
      replace(await updateOrderStatus(order.id, { status: next }))
      toast.success(`${order.orderNumber} → ${statusLabel(next)}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  async function refund(order) {
    setBusyId(order.id)
    try {
      const result = await refundOrder(order.id)
      replace(result.order)
      toast.success(result.message)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setBusyId(null)
    }
  }

  if (error) return <ErrorState error={error} onRetry={reload} />
  const meta = data?.meta

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-sans text-xl font-medium text-charcoal">Orders</h1>
          <p className="text-xs text-warmgray mt-1">{meta?.total ?? '…'} orders{needsAttention ? ' needing attention' : ''}</p>
        </div>
        <input type="search" aria-label="Search by order number" placeholder="Search order number..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="w-full md:w-72 border border-silk rounded-none px-3 py-2.5 text-sm text-charcoal bg-bg focus:outline-none focus:border-charcoal" />
      </div>

      <div className="flex gap-1 border-b border-silk mb-2 overflow-x-auto" role="tablist">
        {STATUS_TABS.map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={status === tab} onClick={() => { setStatus(tab); setPage(1) }}
            className={`text-[10px] tracking-luxury uppercase px-4 py-3 whitespace-nowrap focus:outline-none border-b-2 transition-colors font-sans ${status === tab ? 'border-charcoal text-charcoal' : 'border-transparent text-warmgray hover:text-charcoal'}`}>
            {tab === 'all' ? 'All' : statusLabel(tab)}
          </button>
        ))}
      </div>

      <DataTable
        columns={['Order', 'Customer', 'Date', 'Total', 'Status', 'Payment', 'Actions']}
        rows={data?.orders ?? []}
        loading={loading}
        empty="No orders found for this filter."
        renderRow={(order) => (
          <Fragment key={order.id}>
            <tr className="border-b border-silk hover:bg-parchment/50 transition-colors">
              <td className="px-4 py-3">
                <button type="button" aria-expanded={expanded === order.id} onClick={() => setExpanded(expanded === order.id ? null : order.id)} className="text-xs font-mono text-charcoal hover:underline">
                  {order.orderNumber}
                </button>
                {order.needsAttention && <span className="ml-2 text-[9px] tracking-luxury uppercase text-[#C53030]">Attention</span>}
              </td>
              <td className="px-4 py-3 text-sm text-charcoal">{order.customer?.fullName}<span className="block text-[10px] text-warmgray">{order.customer?.email}</span></td>
              <td className="px-4 py-3 text-xs text-warmgray whitespace-nowrap">{formatDate(order.createdAt)}</td>
              <td className="px-4 py-3 text-sm text-charcoal font-medium whitespace-nowrap">{formatPrice(order.total, order.currency)}</td>
              <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
              <td className="px-4 py-3"><StatusBadge status={order.paymentStatus} /></td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-3">
                  {ADMIN_NEXT_STATUSES[order.status]?.map((next) => (
                    <button key={next} type="button" disabled={busyId === order.id} onClick={() => changeStatus(order, next)}
                      className={`text-[10px] tracking-luxury uppercase whitespace-nowrap disabled:opacity-40 ${next === 'cancelled' ? 'text-warmgray hover:text-[#C53030]' : 'text-charcoal hover:underline'}`}>
                      {next === 'cancelled' ? 'Cancel' : `Mark ${statusLabel(next)}`}
                    </button>
                  ))}
                  {isRefundable(order) && (
                    <button type="button" disabled={busyId === order.id} onClick={() => refund(order)} className="text-[10px] tracking-luxury uppercase text-[#C53030] whitespace-nowrap disabled:opacity-40">Issue refund</button>
                  )}
                </div>
              </td>
            </tr>
            {expanded === order.id && (
              <tr className="border-b border-silk"><td colSpan={7}><OrderDetails order={order} /></td></tr>
            )}
          </Fragment>
        )}
      />

      {meta?.totalPages > 1 && (
        <div className="flex items-center justify-end gap-6 text-[10px] tracking-luxury uppercase">
          <button type="button" disabled={page <= 1} onClick={() => setPage(page - 1)} className="disabled:opacity-30">← Prev</button>
          <span className="text-warmgray">Page {meta.page} / {meta.totalPages}</span>
          <button type="button" disabled={!meta.hasNextPage} onClick={() => setPage(page + 1)} className="disabled:opacity-30">Next →</button>
        </div>
      )}
    </div>
  )
}

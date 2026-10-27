import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import OrderStatusBadge from '../../components/common/OrderStatusBadge.jsx'
import { ErrorState, FormAlert, LoadingState } from '../../components/common/StatusViews.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import { useConfig } from '../../context/ConfigContext.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useRazorpayCheckout } from '../../hooks/useRazorpayCheckout.js'
import { cancelOrder, fetchOrder } from '../../services/orders.js'
import { formatDate, formatDateTime, formatPrice, statusLabel, variantLabel } from '../../utils/format.js'

export default function OrderDetail() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const { config } = useConfig()
  const { reload: reloadCart } = useCartContext()
  const { data: order, loading, error, reload, setData } = useAsync(() => fetchOrder(id), [id])
  const { pay, busy } = useRazorpayCheckout()
  const [cancelling, setCancelling] = useState(false)
  const [confirmCancel, setConfirmCancel] = useState(false)

  if (loading && !order) return <LoadingState label="Locating records..." className="min-h-[60vh]" />
  if (error) return <ErrorState error={error} onRetry={reload} className="min-h-[70vh]" />
  if (!order) return null

  const justPlaced = params.get('placed') === '1' && order.paymentStatus === 'paid'
  const canPay = order.status === 'pending_payment' && config.payments?.enabled
  const canCancel = ['pending_payment', 'confirmed'].includes(order.status)

  async function handlePay() {
    try {
      const result = await pay(order.id)
      setData(result.order)
      if (result.outcome === 'paid') {
        toast.success('Payment verified. Your order is confirmed.')
        reloadCart()
      } else {
        toast.info('Payment was not completed.')
      }
    } catch (err) {
      toast.error(err.message)
      reload()
    }
  }

  async function handleCancel() {
    setCancelling(true)
    try {
      const result = await cancelOrder(order.id)
      setData(result.order)
      toast.success(result.message)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setCancelling(false)
      setConfirmCancel(false)
    }
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 md:py-24 min-h-screen">
      {justPlaced ? (
        <div className="text-center mb-20">
          <h1 className="font-display text-6xl md:text-8xl font-light text-charcoal mb-6 tracking-tight">Thank you.</h1>
          <p className="font-sans text-sm text-charcoal font-light max-w-md mx-auto">
            Your payment was verified and order {order.orderNumber} is confirmed. A receipt will be sent to {order.contactEmail}.
          </p>
        </div>
      ) : (
        <div className="mb-12">
          <Link to="/orders" className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors focus:outline-none">&larr; Back to Order History</Link>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-silk pb-6 gap-4">
        <h2 className="font-display text-4xl lg:text-5xl font-light text-charcoal m-0 tracking-tight">Order Details</h2>
        <p className="font-sans text-xs text-warmgray tracking-wider m-0">{order.orderNumber}</p>
      </div>

      {order.status === 'pending_payment' && (
        <FormAlert
          tone="info"
          message={`Awaiting payment. Your pieces are reserved until ${formatDateTime(order.reservationExpiresAt)}; after that the order expires and the stock is released.`}
        />
      )}
      {order.paymentStatus === 'refund_pending' && <FormAlert tone="info" message="This order was cancelled after payment. Our team will issue your refund to the original payment method." />}

      <div className="border border-silk bg-bg rounded-none">
        <dl className="flex flex-wrap gap-6 md:gap-8 py-4 px-6 bg-parchment/30 border-b border-silk md:items-center">
          <div className="flex flex-col gap-1">
            <dt className="text-[10px] tracking-luxury uppercase text-warmgray">Order Placed</dt>
            <dd className="font-sans text-sm text-charcoal font-medium">{formatDate(order.createdAt)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-[10px] tracking-luxury uppercase text-warmgray">Total</dt>
            <dd className="font-sans text-sm text-charcoal font-medium">{formatPrice(order.total, order.currency)}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-[10px] tracking-luxury uppercase text-warmgray">Status</dt>
            <dd className="mt-0.5"><OrderStatusBadge status={order.status} /></dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="text-[10px] tracking-luxury uppercase text-warmgray">Payment</dt>
            <dd className="mt-0.5"><OrderStatusBadge status={order.paymentStatus} /></dd>
          </div>
          <div className="flex gap-4 md:ml-auto">
            {canPay && (
              <button type="button" onClick={handlePay} disabled={busy} className="bg-obsidian text-cream text-[10px] tracking-luxury uppercase px-6 py-3 hover:bg-charcoal transition-colors disabled:opacity-50">
                {busy ? 'Processing...' : `Pay ${formatPrice(order.total, order.currency)}`}
              </button>
            )}
            {canCancel && !confirmCancel && (
              <button type="button" onClick={() => setConfirmCancel(true)} className="border border-charcoal text-charcoal text-[10px] tracking-luxury uppercase px-6 py-3 hover:bg-parchment transition-colors">
                Cancel Order
              </button>
            )}
            {confirmCancel && (
              <span className="flex items-center gap-4">
                <span className="text-[10px] tracking-luxury uppercase text-warmgray">{order.paymentStatus === 'paid' ? 'Cancel and request refund?' : 'Cancel this order?'}</span>
                <button type="button" onClick={handleCancel} disabled={cancelling} className="text-[10px] tracking-luxury uppercase text-[#C53030] disabled:opacity-50">{cancelling ? 'Cancelling...' : 'Confirm'}</button>
                <button type="button" onClick={() => setConfirmCancel(false)} className="text-[10px] tracking-luxury uppercase text-warmgray">Keep</button>
              </span>
            )}
          </div>
        </dl>

        <div className="p-6 md:p-8 border-b border-silk">
          <h3 className="font-display text-2xl font-light text-charcoal mb-8 m-0 tracking-tight">Reserves Included</h3>
          <ul className="flex flex-col">
            {order.items.map((item) => (
              <li key={item.id} className="flex gap-6 py-6 border-silk border-t first:border-0 first:pt-0 last:pb-0">
                <Link to={`/products/${item.slug ?? item.productId}`} className="w-20 md:w-24 aspect-[3/4] bg-ivory dark:bg-white shrink-0 border border-silk hover:border-charcoal transition-colors">
                  {item.image && <img src={item.image} alt={item.title} className="w-full h-full object-cover object-top mix-blend-multiply dark:mix-blend-normal" />}
                </Link>
                <div className="flex-1 flex flex-col justify-center">
                  <Link to={`/products/${item.slug ?? item.productId}`} className="font-display text-lg lg:text-xl font-light text-charcoal hover:opacity-70 transition-opacity m-0">{item.title}</Link>
                  <div className="text-[10px] tracking-luxury uppercase text-warmgray mt-2">{[item.category, variantLabel(item)].filter(Boolean).join(' — ')}</div>
                </div>
                <div className="font-sans text-sm text-charcoal font-medium flex flex-col justify-center text-right">
                  <span>{formatPrice(item.lineTotal, order.currency)}</span>
                  <span className="text-[10px] tracking-luxury uppercase text-warmgray mt-1 font-normal">Qty: {item.quantity} × {formatPrice(item.unitPrice, order.currency)}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3">
          <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-silk">
            <h4 className="text-[10px] tracking-luxury uppercase text-warmgray mb-4">Shipping To</h4>
            <address className="not-italic text-sm text-charcoal font-light leading-relaxed">
              {order.shippingAddress.fullName}<br />
              {order.shippingAddress.line1}{order.shippingAddress.line2 ? `, ${order.shippingAddress.line2}` : ''}<br />
              {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}<br />
              {order.shippingAddress.phone}
            </address>
          </div>
          <div className="p-6 md:p-8 border-b lg:border-b-0 lg:border-r border-silk">
            <h4 className="text-[10px] tracking-luxury uppercase text-warmgray mb-4">Timeline</h4>
            <ol className="space-y-3">
              {order.statusHistory.map((event, index) => (
                <li key={index} className="text-xs text-charcoal font-light">
                  <span className="font-medium">{statusLabel(event.status)}</span> · {formatDateTime(event.at)}
                  {event.note && <span className="block text-warmgray">{event.note}</span>}
                </li>
              ))}
            </ol>
          </div>
          <dl className="p-6 md:p-8 flex flex-col gap-4 bg-parchment/30">
            <div className="flex justify-between items-center font-sans text-sm text-charcoal font-light"><dt>Subtotal</dt><dd>{formatPrice(order.subtotal, order.currency)}</dd></div>
            <div className="flex justify-between items-center font-sans text-sm text-warmgray font-light"><dt>Shipping</dt><dd>{order.shipping ? formatPrice(order.shipping, order.currency) : 'Complimentary'}</dd></div>
            <div className="flex justify-between items-center font-sans text-sm text-warmgray font-light"><dt>Tax</dt><dd>{formatPrice(order.tax, order.currency)}</dd></div>
            <div className="flex justify-between items-end border-t border-charcoal pt-6 mt-2">
              <dt className="font-sans text-sm text-charcoal">Total</dt>
              <dd className="font-display text-3xl font-light text-charcoal">{formatPrice(order.total, order.currency)}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

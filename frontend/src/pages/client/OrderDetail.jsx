import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { useOrders } from '../../hooks/useOrders.js'

const getStatusStyle = (status) => {
  switch (status?.toLowerCase()) {
    case 'pending': return 'bg-linen text-warmgray'
    case 'confirmed': return 'bg-parchment text-charcoal border border-silk'
    case 'shipped': return 'bg-charcoal text-cream'
    case 'delivered': return 'bg-obsidian text-cream'
    case 'cancelled': return 'border border-silk text-warmgray line-through'
    default: return 'bg-linen text-warmgray'
  }
}

export default function OrderDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const { getOrder } = useOrders(user?.id)
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await getOrder(id)
      setOrder(data)
      setLoading(false)
    }
    if (user?.id) {
      load()
    }
  }, [id, getOrder, user?.id])

  if (loading) return <div className="w-full min-h-[60vh] flex items-center justify-center font-sans text-xs tracking-luxury uppercase text-warmgray">Locating records...</div>

  if (!order) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
      <h2 className="font-display text-4xl lg:text-5xl font-light text-charcoal mb-4 tracking-tight">Order Not Found</h2>
      <p className="font-sans text-sm text-charcoal font-light mb-8">We could not locate the details for this order matrix.</p>
      <Link to="/orders" className="bg-obsidian text-cream text-xs tracking-luxury uppercase px-8 py-3.5 rounded-none font-medium hover:bg-charcoal transition-colors focus:outline-none">Back to Directory</Link>
    </div>
  )

  return (
    <div className="w-full max-w-7xl mx-auto px-8 py-16 md:py-24 min-h-screen">
      <div className="mb-12">
        <Link to="/orders" className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors focus:outline-none">
          &larr; Back to Order History
        </Link>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-silk pb-6 gap-4">
        <h1 className="font-display text-4xl lg:text-5xl font-light text-charcoal m-0 tracking-tight">Order Details</h1>
        <p className="font-sans text-xs text-warmgray tracking-wider m-0">ID: {order.id}</p>
      </div>

      <div className="border border-silk bg-bg rounded-none">
        <div className="flex flex-col md:flex-row gap-4 md:gap-8 py-4 px-6 bg-parchment/30 border-b border-silk md:items-center">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] tracking-luxury uppercase text-warmgray">Order Placed</span>
            <span className="font-sans text-sm text-charcoal font-medium">{new Date(order.created_at).toLocaleDateString()}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] tracking-luxury uppercase text-warmgray">Total</span>
            <span className="font-sans text-sm text-charcoal font-medium">${order.total.toFixed(2)}</span>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] tracking-luxury uppercase text-warmgray">Status</span>
            <span className={`text-[9px] tracking-luxury uppercase px-3 py-1 rounded-none inline-block max-w-[fit-content] mt-0.5 ${getStatusStyle(order.status)}`}>
              {order.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col">
          <div className="p-6 md:p-8 border-b border-silk">
            <h3 className="font-display text-2xl font-light text-charcoal mb-8 m-0 tracking-tight">Reserves Included</h3>
            <div className="flex flex-col">
              {order.order_items?.map(item => (
                <div key={item.id} className="flex gap-6 py-6 border-silk border-t border-opacity-50 first:border-0 first:pt-0 last:pb-0">
                  <Link to={`/products/${item.product_id}`} className="w-20 md:w-24 aspect-[3/4] bg-ivory dark:bg-white shrink-0 border border-silk hover:border-charcoal transition-colors">
                    <img src={item.products?.image_url} alt="" className="w-full h-full object-cover object-top mix-blend-multiply dark:mix-blend-normal" />
                  </Link>
                  <div className="flex-1 flex flex-col justify-center">
                    <Link to={`/products/${item.product_id}`} className="font-display text-lg lg:text-xl font-light text-charcoal hover:opacity-70 transition-opacity m-0">
                      {item.products?.title || 'Archive Collection Piece'}
                    </Link>
                    <div className="text-[10px] tracking-luxury uppercase text-warmgray mt-2">
                      {item.products?.category || 'House Selection'} — Size M — Obsidian
                    </div>
                  </div>
                  <div className="font-sans text-sm text-charcoal font-medium flex items-center flex-col justify-center text-right">
                    <span>${(item.price_at_purchase || 120.00).toFixed(2)}</span>
                    <span className="text-[10px] tracking-luxury uppercase text-warmgray mt-1 font-normal text-right w-full">Qty: {item.quantity}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 md:p-8 flex flex-col gap-4 w-full lg:w-96 ml-auto bg-parchment/30">
            <div className="flex justify-between items-center font-sans text-sm text-charcoal font-light">
              <span>Subtotal</span><span>${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center font-sans text-sm text-warmgray font-light">
              <span>Tax</span><span>${order.tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-end border-t border-charcoal pt-6 mt-2">
              <span className="font-sans text-sm text-charcoal">Total</span>
              <span className="font-display text-3xl font-light text-charcoal">${order.total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

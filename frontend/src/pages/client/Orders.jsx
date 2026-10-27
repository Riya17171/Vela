import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
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

export default function Orders() {
  const { user } = useAuth()
  const { orders, loading } = useOrders(user?.id)

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-display text-4xl lg:text-5xl font-light text-charcoal mb-4 tracking-tight">Login Required</h2>
        <p className="font-sans text-sm text-charcoal font-light mb-8">Please authenticate to view your order history.</p>
        <Link to="/login" className="bg-obsidian text-cream text-xs tracking-luxury uppercase px-8 py-3.5 rounded-none font-medium hover:bg-charcoal transition-colors focus:outline-none">
          Authenticate
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-8 py-16 md:py-24 min-h-screen">
      <h1 className="font-display text-4xl lg:text-5xl font-light text-charcoal mb-16 pb-6 border-b border-silk tracking-tight">Order History</h1>

      {loading ? (
        <div className="min-h-[40vh] flex items-center justify-center font-sans text-xs tracking-luxury uppercase text-warmgray">Loading insights...</div>
      ) : orders.length === 0 ? (
        <div className="min-h-[40vh] flex flex-col items-center justify-center text-center">
          <p className="font-sans text-sm text-charcoal font-light mb-8">You haven't placed any orders yet.</p>
          <Link to="/products" className="bg-transparent border border-charcoal text-charcoal text-xs tracking-luxury uppercase px-8 py-3.5 rounded-none font-medium hover:bg-parchment transition-colors focus:outline-none">Start Shopping</Link>
        </div>
      ) : (
        <div className="flex flex-col gap-8">
          {orders.map(o => (
            <div className="border border-silk bg-bg rounded-none" key={o.id}>
              <div className="flex flex-col md:flex-row gap-4 md:gap-8 py-4 px-6 bg-parchment/30 border-b border-silk justify-between md:items-center">
                <div className="flex gap-8">
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] tracking-luxury uppercase text-warmgray">Order Placed</span>
                    <span className="font-sans text-sm text-charcoal font-medium">{new Date(o.created_at).toLocaleDateString()}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] tracking-luxury uppercase text-warmgray">Total</span>
                    <span className="font-sans text-sm text-charcoal font-medium">${o.total.toFixed(2)}</span>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] tracking-luxury uppercase text-warmgray">Status</span>
                    <span className={`text-[9px] tracking-luxury uppercase px-3 py-1 rounded-none inline-block mt-0.5 ${getStatusStyle(o.status)}`}>
                      {o.status}
                    </span>
                  </div>
                </div>
                <div>
                  <Link to={`/orders/${o.id}`} className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal underline underline-offset-4 focus:outline-none transition-colors">View Details</Link>
                </div>
              </div>
              <div className="px-6 py-4">
                <span className="text-[10px] tracking-luxury uppercase text-warmgray">Order ID:</span> <span className="font-sans text-xs text-warmgray tracking-wider ml-2">{o.id}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

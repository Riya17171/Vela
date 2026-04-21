import React from 'react'
import { useAdminOrders } from '../../hooks/useAdminOrders.js'
import { DataTable, StatusBadge } from '../../components/admin/Primitives.jsx'
import { toast } from 'react-toastify'

const STATUS_TABS = ['all', 'pending', 'confirmed', 'shipped', 'delivered', 'cancelled']

export default function OrdersAdmin() {
  const {
    orders, total, loading,
    statusFilter, setStatusFilter, updateStatus
  } = useAdminOrders()

  async function handleStatusChange(orderId, newStatus) {
    const success = await updateStatus(orderId, newStatus)
    if (success) {
      toast.success(`Order ${orderId.slice(0, 8)} marked as ${newStatus}`)
    } else {
      toast.error('Failed to update status')
    }
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-xl font-medium text-charcoal">Orders</h1>
          <p className="text-xs text-warmgray mt-1">{total} orders found</p>
        </div>
      </div>

      <div className="flex gap-1 border-b border-silk mb-2">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setStatusFilter(tab)}
            className={`
              text-[10px] tracking-luxury uppercase px-4 py-3 focus:outline-none
              border-b-2 transition-colors font-sans
              ${statusFilter === tab
                ? 'border-charcoal text-charcoal'
                : 'border-transparent text-warmgray hover:text-charcoal'
              }
            `}
          >
            {tab}
          </button>
        ))}
      </div>

      <DataTable
        columns={['Order ID', 'Customer', 'Date', 'Total', 'State / Actions']}
        rows={orders}
        loading={loading}
        empty="No orders found matching this status."
        renderRow={(order) => (
          <tr key={order.id} className="border-b border-silk hover:bg-parchment/50 transition-colors">
            <td className="px-4 py-3">
              <span className="text-xs font-mono text-warmgray">
                {order.id.slice(0, 8)}...
              </span>
            </td>
            <td className="px-4 py-3 text-sm text-charcoal">
              {order.profiles?.full_name || 'Guest'}
            </td>
            <td className="px-4 py-3 text-xs text-warmgray">
              {new Date(order.created_at).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 text-sm text-charcoal font-medium">
              ${order.total.toFixed(2)}
            </td>
            <td className="px-4 py-3">
              <select
                value={order.status}
                onChange={(e) => handleStatusChange(order.id, e.target.value)}
                className="text-[10px] tracking-luxury uppercase bg-transparent
                           border-b border-silk py-1 focus:outline-none
                           focus:border-charcoal cursor-pointer text-charcoal"
              >
                {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(s => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </td>
          </tr>
        )}
      />
    </div>
  )
}

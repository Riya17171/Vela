import React from 'react'
import { Link } from 'react-router-dom'
import { FiDollarSign, FiShoppingBag, FiUsers, FiAlertCircle } from 'react-icons/fi'
import { useAdminStats } from '../../hooks/useAdminStats.js'
import { StatCard, DataTable, StatusBadge } from '../../components/admin/Primitives.jsx'

export default function Dashboard() {
  const { stats, recentOrders, loading } = useAdminStats()

  return (
    <div className="flex flex-col gap-8">

      {/* Page header */}
      <div>
        <h1 className="font-sans text-xl font-medium text-charcoal">Overview</h1>
        <p className="text-xs text-warmgray mt-1">
          {new Date().toLocaleDateString('en-GB', {
            weekday: 'long', year: 'numeric',
            month: 'long', day: 'numeric'
          })}
        </p>
      </div>

      {/* Stat cards grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`$${(stats?.totalRevenue || 0).toLocaleString()}`}
          icon={<FiDollarSign size={14} />}
        />
        <StatCard
          label="Total Orders"
          value={stats?.totalOrders || 0}
          icon={<FiShoppingBag size={14} />}
        />
        <StatCard
          label="Customers"
          value={stats?.totalCustomers || 0}
          icon={<FiUsers size={14} />}
        />
        <StatCard
          label="Low Stock"
          value={stats?.lowStockCount || 0}
          icon={<FiAlertCircle size={14} />}
        />
      </div>

      {/* Recent orders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-sans text-sm font-medium text-charcoal">
            Recent Orders
          </h2>
          <Link
            to="/admin/orders"
            className="text-[10px] tracking-luxury uppercase
                       text-warmgray hover:text-charcoal transition-colors"
          >
            View All
          </Link>
        </div>

        <DataTable
          columns={['Order ID', 'Customer', 'Date', 'Total', 'Status']}
          rows={recentOrders}
          loading={loading}
          empty="No orders yet."
          renderRow={(order) => (
            <tr key={order.id} className="border-b border-silk hover:bg-parchment/50 transition-colors">
              <td className="px-4 py-3">
                <Link
                  to={`/admin/orders`}
                  className="text-xs font-sans text-warmgray hover:text-charcoal
                             font-mono transition-colors"
                >
                  {order.id.slice(0, 8)}...
                </Link>
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
                <StatusBadge status={order.status} />
              </td>
            </tr>
          )}
        />
      </div>

    </div>
  )
}

import { FiAlertCircle, FiCreditCard, FiShoppingBag, FiUsers } from 'react-icons/fi'
import { Link } from 'react-router-dom'

import { DataTable, StatCard, StatusBadge } from '../../components/admin/Primitives.jsx'
import { ErrorState } from '../../components/common/StatusViews.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { fetchDashboard } from '../../services/admin.js'
import { formatDate, formatPrice } from '../../utils/format.js'

export default function Dashboard() {
  const { data, loading, error, reload } = useAsync(fetchDashboard, [])
  if (error) return <ErrorState error={error} onRetry={reload} />

  const stats = data?.stats
  const currency = stats?.currency ?? 'INR'

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-sans text-xl font-medium text-charcoal">Overview</h1>
          <p className="text-xs text-warmgray mt-1">{new Date().toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
        <button type="button" onClick={reload} className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal">Refresh</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Revenue (paid)" value={loading ? '…' : formatPrice(stats.totalRevenue, currency)} delta={stats && `${stats.paidOrders} paid orders`} icon={<FiCreditCard size={14} />} />
        <StatCard label="Total Orders" value={loading ? '…' : stats.totalOrders} delta={stats && `${stats.ordersByStatus.pending_payment ?? 0} awaiting payment`} icon={<FiShoppingBag size={14} />} />
        <StatCard label="Customers" value={loading ? '…' : stats.totalCustomers} icon={<FiUsers size={14} />} />
        <StatCard label="Low / Out of Stock" value={loading ? '…' : `${stats.lowStockCount} / ${stats.outOfStockCount}`} delta={stats && `Threshold ≤ ${stats.lowStockThreshold}`} icon={<FiAlertCircle size={14} />} />
      </div>

      {stats?.ordersNeedingAttention > 0 && (
        <Link to="/admin/orders?needsAttention=true" className="border border-[#C53030] text-[#C53030] text-xs px-4 py-3">
          {stats.ordersNeedingAttention} order(s) need attention (for example a payment received after expiry). Review →
        </Link>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans text-sm font-medium text-charcoal">Recent Orders</h2>
            <Link to="/admin/orders" className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors">View All</Link>
          </div>
          <DataTable
            columns={['Order', 'Customer', 'Date', 'Total', 'Status', 'Payment']}
            rows={data?.recentOrders ?? []}
            loading={loading}
            empty="No orders yet."
            renderRow={(order) => (
              <tr key={order.id} className="border-b border-silk hover:bg-parchment/50 transition-colors">
                <td className="px-4 py-3"><Link to={`/admin/orders?search=${order.orderNumber}`} className="text-xs font-mono text-warmgray hover:text-charcoal">{order.orderNumber}</Link></td>
                <td className="px-4 py-3 text-sm text-charcoal">{order.customer?.fullName ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-warmgray">{formatDate(order.createdAt)}</td>
                <td className="px-4 py-3 text-sm text-charcoal font-medium">{formatPrice(order.total, order.currency)}</td>
                <td className="px-4 py-3"><StatusBadge status={order.status} /></td>
                <td className="px-4 py-3"><StatusBadge status={order.paymentStatus} /></td>
              </tr>
            )}
          />
        </div>
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-sans text-sm font-medium text-charcoal">Low Stock</h2>
            <Link to="/admin/products?lowStock=true" className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal">Manage</Link>
          </div>
          <DataTable
            columns={['Piece', 'Stock']}
            rows={data?.lowStockProducts ?? []}
            loading={loading}
            empty="All pieces are well stocked."
            renderRow={(product) => (
              <tr key={product.id} className="border-b border-silk">
                <td className="px-4 py-3 text-sm text-charcoal"><Link to={`/admin/products/${product.id}/edit`} className="hover:underline">{product.title}</Link></td>
                <td className={`px-4 py-3 text-sm font-medium ${product.stock === 0 ? 'text-[#C53030]' : 'text-charcoal'}`}>{product.stock}</td>
              </tr>
            )}
          />
        </div>
      </div>
    </div>
  )
}

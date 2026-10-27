import { useState } from 'react'
import { toast } from 'react-toastify'

import { DataTable } from '../../components/admin/Primitives.jsx'
import { ErrorState } from '../../components/common/StatusViews.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useDebounce } from '../../hooks/useDebounce.js'
import { fetchCustomers, updateCustomerStatus } from '../../services/admin.js'
import { formatDate, formatPrice } from '../../utils/format.js'

export default function CustomersAdmin() {
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const debouncedSearch = useDebounce(search, 400)
  const query = { page, limit: 25, role: 'user', ...(debouncedSearch && { search: debouncedSearch }) }
  const { data, loading, error, reload, setData } = useAsync(() => fetchCustomers(query), [JSON.stringify(query)])

  async function toggleStatus(customer) {
    const next = customer.status === 'active' ? 'suspended' : 'active'
    try {
      const updated = await updateCustomerStatus(customer.id, next)
      setData((prev) => ({ ...prev, users: prev.users.map((u) => (u.id === updated.id ? { ...u, status: updated.status } : u)) }))
      toast.success(`${customer.fullName} ${next === 'active' ? 'reactivated' : 'suspended'}`)
    } catch (err) {
      toast.error(err.message)
    }
  }

  if (error) return <ErrorState error={error} onRetry={reload} />
  const meta = data?.meta

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-sans text-xl font-medium text-charcoal">Customers</h1>
          <p className="text-xs text-warmgray mt-1">{meta?.total ?? '…'} accounts</p>
        </div>
        <input type="search" aria-label="Search customers" placeholder="Search name or email..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="w-full md:w-72 border border-silk rounded-none px-3 py-2.5 text-sm text-charcoal bg-bg focus:outline-none focus:border-charcoal" />
      </div>

      <DataTable
        columns={['Name', 'Email', 'Joined', 'Orders', 'Spent', 'Status', '']}
        rows={data?.users ?? []}
        loading={loading}
        empty="No customers found."
        renderRow={(customer) => (
          <tr key={customer.id} className="border-b border-silk hover:bg-parchment/50 transition-colors">
            <td className="px-4 py-3 text-sm text-charcoal font-medium">{customer.fullName}</td>
            <td className="px-4 py-3 text-xs text-warmgray">{customer.email}</td>
            <td className="px-4 py-3 text-xs text-warmgray whitespace-nowrap">{formatDate(customer.createdAt)}</td>
            <td className="px-4 py-3 text-sm text-charcoal">{customer.orderCount}</td>
            <td className="px-4 py-3 text-sm text-charcoal whitespace-nowrap">{formatPrice(customer.totalSpent)}</td>
            <td className="px-4 py-3 text-[10px] tracking-luxury uppercase text-warmgray">{customer.status}</td>
            <td className="px-4 py-3">
              <button type="button" onClick={() => toggleStatus(customer)} className={`text-[10px] tracking-luxury uppercase ${customer.status === 'active' ? 'text-warmgray hover:text-[#C53030]' : 'text-charcoal'}`}>
                {customer.status === 'active' ? 'Suspend' : 'Reactivate'}
              </button>
            </td>
          </tr>
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

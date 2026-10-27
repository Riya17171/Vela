import React, { useEffect, useState } from 'react'
import { fetchAllCustomers } from '../../services/admin.js'
import { DataTable } from '../../components/admin/Primitives.jsx'

export default function CustomersAdmin() {
  const [customers, setCustomers] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    async function load() {
      setLoading(true)
      const res = await fetchAllCustomers({ limit: 50 })
      setCustomers(res.customers)
      setTotal(res.total)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-xl font-medium text-charcoal">Customers</h1>
          <p className="text-xs text-warmgray mt-1">{total} accounts</p>
        </div>
      </div>

      <DataTable
        columns={['Name', 'Joined', 'Orders']}
        rows={customers}
        loading={loading}
        empty="No customers found."
        renderRow={(customer) => (
          <tr key={customer.id} className="border-b border-silk hover:bg-parchment/50 transition-colors">
            <td className="px-4 py-3 text-sm text-charcoal font-medium">
              {customer.full_name || 'Anonymous User'}
            </td>

            <td className="px-4 py-3 text-xs text-warmgray">
              {new Date(customer.created_at).toLocaleDateString()}
            </td>
            <td className="px-4 py-3 text-sm text-charcoal">
              <span className="bg-silk/30 px-2 py-0.5 text-xs">
                {customer.orders?.length || 0}
              </span>
            </td>
          </tr>
        )}
      />
    </div>
  )
}

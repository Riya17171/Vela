import { useState } from 'react'
import { FiSearch } from 'react-icons/fi'
import { Link, useSearchParams } from 'react-router-dom'
import { toast } from 'react-toastify'

import { AdminButton, DataTable } from '../../components/admin/Primitives.jsx'
import { ErrorState } from '../../components/common/StatusViews.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useDebounce } from '../../hooks/useDebounce.js'
import { archiveProduct, fetchAdminProducts, updateInventory } from '../../services/admin.js'
import { formatPrice } from '../../utils/format.js'

function StockEditor({ product, onSaved }) {
  const [value, setValue] = useState(String(product.stock))
  const [saving, setSaving] = useState(false)
  const dirty = Number(value) !== product.stock

  async function save() {
    const stock = Number(value)
    if (!Number.isInteger(stock) || stock < 0) return toast.error('Stock must be a whole number ≥ 0')
    setSaving(true)
    try {
      onSaved(await updateInventory(product.id, { stock }))
      toast.success(`Stock for ${product.title} set to ${stock}`)
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <input aria-label={`Stock for ${product.title}`} type="number" min="0" value={value} onChange={(e) => setValue(e.target.value)} className="w-16 border border-silk bg-bg px-2 py-1 text-sm text-charcoal focus:outline-none focus:border-charcoal" />
      {dirty && <button type="button" disabled={saving} onClick={save} className="text-[10px] tracking-luxury uppercase text-charcoal disabled:opacity-40">{saving ? '…' : 'Save'}</button>}
    </div>
  )
}

export default function ProductsAdmin() {
  const [params] = useSearchParams()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [lowStock, setLowStock] = useState(params.get('lowStock') === 'true')
  const [page, setPage] = useState(1)
  const [confirmId, setConfirmId] = useState(null)
  const debouncedSearch = useDebounce(search, 400)

  const query = { page, limit: 20, sort: 'newest', ...(debouncedSearch && { search: debouncedSearch }), ...(status && { status }), ...(lowStock && { lowStock: 'true' }) }
  const { data, loading, error, reload, setData } = useAsync(() => fetchAdminProducts(query), [JSON.stringify(query)])

  const replaceProduct = (updated) => setData((prev) => ({ ...prev, products: prev.products.map((p) => (p.id === updated.id ? updated : p)) }))

  async function handleArchive(id) {
    try {
      replaceProduct(await archiveProduct(id))
      toast.success('Product archived. It no longer appears in the storefront.')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setConfirmId(null)
    }
  }

  if (error) return <ErrorState error={error} onRetry={reload} />
  const meta = data?.meta

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-sans text-xl font-medium text-charcoal">Products</h1>
          <p className="text-xs text-warmgray mt-1">{meta?.total ?? '…'} items</p>
        </div>
        <Link to="/admin/products/new"><AdminButton variant="solid">+ Add Product</AdminButton></Link>
      </div>

      <div className="flex flex-col md:flex-row gap-4 md:items-center">
        <div className="relative w-full max-w-sm">
          <FiSearch size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-warmgray" strokeWidth={1.5} />
          <input type="search" aria-label="Search products" placeholder="Search title, SKU..." value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} className="w-full border border-silk rounded-none pl-9 pr-4 py-2.5 text-sm text-charcoal bg-bg font-sans placeholder:text-warmgray/50 focus:outline-none focus:border-charcoal transition-colors" />
        </div>
        <select aria-label="Filter by status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }} className="border border-silk bg-bg px-3 py-2.5 text-sm text-charcoal">
          <option value="">All statuses</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
          <option value="archived">Archived</option>
        </select>
        <label className="flex items-center gap-2 text-xs text-charcoal">
          <input type="checkbox" checked={lowStock} onChange={(e) => { setLowStock(e.target.checked); setPage(1) }} className="accent-charcoal" /> Low stock only
        </label>
      </div>

      <DataTable
        columns={['', 'Title', 'SKU', 'Category', 'Price', 'Stock', 'Status', '']}
        rows={data?.products ?? []}
        loading={loading}
        empty="No products found."
        renderRow={(product) => (
          <tr key={product.id} className="border-b border-silk hover:bg-parchment/50 transition-colors">
            <td className="px-4 py-3 w-12">
              <div className="w-10 h-10 bg-ivory dark:bg-white border border-silk overflow-hidden shrink-0">
                <img src={product.image} alt="" className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
              </div>
            </td>
            <td className="px-4 py-3"><span className="text-sm text-charcoal font-sans line-clamp-1 max-w-[220px] block">{product.title}{product.isFeatured && <span className="ml-2 text-[9px] tracking-luxury uppercase bg-obsidian text-cream px-1.5 py-0.5">Featured</span>}</span></td>
            <td className="px-4 py-3 text-xs font-mono text-warmgray">{product.sku}</td>
            <td className="px-4 py-3 text-[10px] tracking-luxury uppercase text-warmgray">{product.category?.name}</td>
            <td className="px-4 py-3 text-sm text-charcoal font-medium whitespace-nowrap">{formatPrice(product.price, product.currency)}</td>
            <td className="px-4 py-3"><StockEditor key={`${product.id}-${product.stock}`} product={product} onSaved={replaceProduct} /></td>
            <td className="px-4 py-3 text-[10px] tracking-luxury uppercase text-warmgray">{product.status}</td>
            <td className="px-4 py-3">
              <div className="flex items-center gap-4">
                <Link to={`/admin/products/${product.id}/edit`} className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors">Edit</Link>
                {product.status !== 'archived' && (confirmId === product.id ? (
                  <span className="flex items-center gap-3">
                    <button type="button" onClick={() => handleArchive(product.id)} className="text-[10px] tracking-luxury uppercase text-[#C53030]">Confirm</button>
                    <button type="button" onClick={() => setConfirmId(null)} className="text-[10px] tracking-luxury uppercase text-warmgray">Cancel</button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setConfirmId(product.id)} className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-[#C53030] transition-colors">Archive</button>
                ))}
              </div>
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

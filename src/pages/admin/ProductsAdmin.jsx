import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { FiSearch } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { useAdminProducts } from '../../hooks/useAdminProducts.js'
import { DataTable, AdminButton } from '../../components/admin/Primitives.jsx'

export default function ProductsAdmin() {
  const {
    products, total, loading,
    search, setSearch, remove
  } = useAdminProducts()

  const [deleteConfirm, setDeleteConfirm] = useState(null)

  async function handleDelete(id) {
    const result = await remove(id)
    setDeleteConfirm(null)
    if (result.success) {
      toast.success('Product removed.')
    } else {
      toast.error(`Failed: ${result.error}`)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-xl font-medium text-charcoal">Products</h1>
          <p className="text-xs text-warmgray mt-1">{total} items</p>
        </div>
        <Link to="/admin/products/new">
          <AdminButton variant="solid">+ Add Product</AdminButton>
        </Link>
      </div>

      {/* Search */}
      <div className="relative w-full max-w-sm">
        <FiSearch
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-warmgray"
          strokeWidth={1.5}
        />
        <input
          type="text"
          placeholder="Search products..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full border border-silk rounded-none pl-9 pr-4 py-2.5
                     text-sm text-charcoal bg-bg font-sans
                     placeholder:text-warmgray/50
                     focus:outline-none focus:border-charcoal transition-colors"
        />
      </div>

      {/* Table */}
      <DataTable
        columns={['', 'Title', 'Category', 'Price', 'Rating', 'Featured', '']}
        rows={products}
        loading={loading}
        empty="No products found."
        renderRow={(product) => (
          <tr
            key={product.id}
            className="border-b border-silk hover:bg-parchment/50 transition-colors"
          >
            {/* Thumbnail */}
            <td className="px-4 py-3 w-12">
              <div className="w-10 h-10 bg-ivory dark:bg-white border border-silk overflow-hidden shrink-0">
                <img
                  src={product.image_url}
                  alt={product.title}
                  className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
                />
              </div>
            </td>

            {/* Title */}
            <td className="px-4 py-3">
              <span className="text-sm text-charcoal font-sans line-clamp-1 max-w-[220px] block">
                {product.title}
              </span>
            </td>

            {/* Category */}
            <td className="px-4 py-3">
              <span className="text-[10px] tracking-luxury uppercase text-warmgray">
                {product.category}
              </span>
            </td>

            {/* Price */}
            <td className="px-4 py-3 text-sm text-charcoal font-medium">
              ${Number(product.price).toFixed(2)}
            </td>

            {/* Rating */}
            <td className="px-4 py-3 text-xs text-warmgray">
              {product.rating} ({product.rating_count})
            </td>

            {/* Featured */}
            <td className="px-4 py-3">
              {product.is_featured ? (
                <span className="text-[9px] tracking-luxury uppercase
                                 bg-obsidian text-cream px-2 py-1">
                  Featured
                </span>
              ) : (
                <span className="text-[9px] tracking-luxury uppercase text-warmgray">
                  —
                </span>
              )}
            </td>

            {/* Actions */}
            <td className="px-4 py-3">
              <div className="flex items-center gap-4">
                <Link
                  to={`/admin/products/${product.id}/edit`}
                  className="text-[10px] tracking-luxury uppercase
                             text-warmgray hover:text-charcoal transition-colors focus:outline-none"
                >
                  Edit
                </Link>
                {deleteConfirm === product.id ? (
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="text-[10px] tracking-luxury uppercase
                                 text-[#C53030] hover:opacity-70 transition-opacity focus:outline-none"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="text-[10px] tracking-luxury uppercase
                                 text-warmgray hover:text-charcoal transition-colors focus:outline-none"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(product.id)}
                    className="text-[10px] tracking-luxury uppercase
                               text-warmgray hover:text-[#C53030] transition-colors focus:outline-none"
                  >
                    Delete
                  </button>
                )}
              </div>
            </td>
          </tr>
        )}
      />

    </div>
  )
}

import { useState } from 'react'
import { toast } from 'react-toastify'

import { AdminButton, AdminInput, DataTable } from '../../components/admin/Primitives.jsx'
import { ErrorState } from '../../components/common/StatusViews.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { createCategory, deleteCategory, fetchAdminCategories, updateCategory } from '../../services/admin.js'

function generateSlug(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

const EMPTY = { name: '', slug: '', imageUrl: '', colorLabel: '', sizeLabel: '' }

export default function CategoriesAdmin() {
  const { data: categories, loading, error, reload } = useAsync(fetchAdminCategories, [], { initialData: [] })
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [creating, setCreating] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  async function handleCreate(e) {
    e.preventDefault()
    setCreating(true)
    setErrors({})
    try {
      const body = Object.fromEntries(Object.entries(form).filter(([, value]) => value.trim()))
      await createCategory(body)
      toast.success('Category created')
      setForm(EMPTY)
      reload()
    } catch (err) {
      setErrors(err.fieldErrors?.() ?? {})
      toast.error(err.message)
    } finally {
      setCreating(false)
    }
  }

  async function toggleActive(category) {
    try {
      await updateCategory(category.id, { isActive: !category.isActive })
      toast.success(`${category.name} ${category.isActive ? 'hidden from' : 'shown in'} the storefront`)
      reload()
    } catch (err) {
      toast.error(err.message)
    }
  }

  async function handleDelete(id) {
    try {
      await deleteCategory(id)
      toast.success('Category removed.')
      reload()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setDeleteConfirm(null)
    }
  }

  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-sans text-xl font-medium text-charcoal">Categories</h1>
        <p className="text-xs text-warmgray mt-1">Classification for storefront filtering</p>
      </div>

      <form onSubmit={handleCreate} className="border border-silk p-6 grid grid-cols-1 md:grid-cols-3 gap-4 items-end mb-4 bg-parchment/30">
        <AdminInput label="Category Name" value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value, slug: generateSlug(e.target.value) })} placeholder="e.g. Outerwear" />
        <AdminInput label="Slug" value={form.slug} error={errors.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} placeholder="outerwear" />
        <AdminInput label="Image URL (https)" value={form.imageUrl} error={errors.imageUrl} onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} placeholder="https://..." />
        <AdminInput label="Size label" value={form.sizeLabel} onChange={(e) => setForm({ ...form, sizeLabel: e.target.value })} placeholder="Size / EU Size" />
        <AdminInput label="Colour label" value={form.colorLabel} onChange={(e) => setForm({ ...form, colorLabel: e.target.value })} placeholder="Colour / Leather / Finish" />
        <AdminButton type="submit" variant="solid" disabled={!form.name || creating}>{creating ? 'Adding...' : 'Add Category'}</AdminButton>
      </form>

      <DataTable
        columns={['Name', 'Slug', 'Products', 'Visibility', 'Actions']}
        rows={categories}
        loading={loading}
        empty="No categories found."
        renderRow={(category) => (
          <tr key={category.id} className="border-b border-silk hover:bg-parchment/50 transition-colors">
            <td className="px-4 py-3 text-sm text-charcoal font-medium">{category.name}</td>
            <td className="px-4 py-3 text-xs text-warmgray font-mono">{category.slug}</td>
            <td className="px-4 py-3 text-sm text-charcoal">{category.productCount}</td>
            <td className="px-4 py-3">
              <button type="button" onClick={() => toggleActive(category)} className="text-[10px] tracking-luxury uppercase text-charcoal hover:underline">
                {category.isActive ? 'Visible · Hide' : 'Hidden · Show'}
              </button>
            </td>
            <td className="px-4 py-3">
              {deleteConfirm === category.id ? (
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => handleDelete(category.id)} className="text-[10px] tracking-luxury uppercase text-[#C53030] hover:opacity-70 transition-opacity focus:outline-none">Confirm</button>
                  <button type="button" onClick={() => setDeleteConfirm(null)} className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors focus:outline-none">Cancel</button>
                </div>
              ) : (
                <button type="button" onClick={() => setDeleteConfirm(category.id)} className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-[#C53030] transition-colors focus:outline-none">Delete</button>
              )}
            </td>
          </tr>
        )}
      />
    </div>
  )
}

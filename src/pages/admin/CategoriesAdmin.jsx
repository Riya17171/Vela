import React, { useEffect, useState } from 'react'
import { fetchAllCategories, createCategory, deleteCategory } from '../../services/admin.js'
import { DataTable, AdminInput, AdminButton } from '../../components/admin/Primitives.jsx'
import { toast } from 'react-toastify'

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

export default function CategoriesAdmin() {
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(false)
  const [creating, setCreating] = useState(false)

  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState(null)

  async function load() {
    setLoading(true)
    const data = await fetchAllCategories()
    setCategories(data)
    setLoading(false)
  }

  useEffect(() => {
    load()
  }, [])

  async function handleCreate() {
    setCreating(true)
    const res = await createCategory({ name, slug })
    if (res) {
      toast.success('Category created')
      setName('')
      setSlug('')
      load()
    } else {
      toast.error('Failed to create category')
    }
    setCreating(false)
  }

  async function handleDelete(id) {
    const result = await deleteCategory({ id })
    setDeleteConfirm(null)
    if (result.success) {
      toast.success('Category removed.')
      load()
    } else {
      toast.error(`Failed: ${result.error}`)
    }
  }

  return (
    <div className="flex flex-col gap-6">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-sans text-xl font-medium text-charcoal">Categories</h1>
          <p className="text-xs text-warmgray mt-1">Classification tags for storefront filtration</p>
        </div>
      </div>

      <div className="border border-silk p-6 flex flex-col md:flex-row gap-4 items-end mb-4 bg-parchment/30">
        <AdminInput
          label="Category Name"
          value={name}
          onChange={(e) => {
            setName(e.target.value)
            setSlug(generateSlug(e.target.value))
          }}
          placeholder="e.g. Outerwear"
          className="flex-1"
        />
        <AdminInput
          label="Slug"
          value={slug}
          onChange={e => setSlug(e.target.value)}
          placeholder="e.g. outerwear"
          className="flex-1"
        />
        <AdminButton
          variant="solid"
          onClick={handleCreate}
          disabled={!name || !slug || creating}
        >
          {creating ? 'Adding...' : 'Add Category'}
        </AdminButton>
      </div>

      <DataTable
        columns={['Name', 'Slug', 'Actions']}
        rows={categories}
        loading={loading}
        empty="No categories found."
        renderRow={(category) => (
          <tr key={category.id} className="border-b border-silk hover:bg-parchment/50 transition-colors">
            <td className="px-4 py-3 text-sm text-charcoal font-medium">
              {category.name}
            </td>
            <td className="px-4 py-3 text-xs text-warmgray font-mono">
              {category.slug}
            </td>
            <td className="px-4 py-3">
              {deleteConfirm === category.id ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => handleDelete(category.id)}
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
                  onClick={() => setDeleteConfirm(category.id)}
                  className="text-[10px] tracking-luxury uppercase
                             text-warmgray hover:text-[#C53030] transition-colors focus:outline-none"
                >
                  Delete
                </button>
              )}
            </td>
          </tr>
        )}
      />
    </div>
  )
}

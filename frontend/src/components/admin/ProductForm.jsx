import { useRef, useState } from 'react'
import { FiPlus, FiTrash2, FiUpload } from 'react-icons/fi'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'

import { useConfig } from '../../context/ConfigContext.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { createProduct, fetchAdminCategories, updateProduct, uploadProductImage } from '../../services/admin.js'
import { fromMinorUnits, toMinorUnits } from '../../utils/format.js'
import { AdminButton, AdminInput } from './Primitives.jsx'

const textareaClass = 'w-full bg-bg border border-silk rounded-none px-3 py-2.5 text-sm text-charcoal font-sans placeholder:text-warmgray/50 focus:outline-none focus:border-charcoal transition-colors resize-none'
const selectClass = 'w-full bg-bg border border-silk rounded-none px-3 py-2.5 text-sm text-charcoal font-sans focus:outline-none focus:border-charcoal transition-colors cursor-pointer'

function initialState(product) {
  return {
    title: product?.title ?? '',
    description: product?.description ?? '',
    category: product?.category?.id ?? '',
    price: fromMinorUnits(product?.price),
    stock: product?.stock ?? 0,
    sku: product?.sku ?? '',
    sizes: product?.sizes?.join(', ') ?? '',
    colors: product?.colors ?? [],
    images: product?.images?.map((image) => image.url) ?? [],
    attributes: product?.attributes ?? [],
    status: product?.status ?? 'active',
    isFeatured: product?.isFeatured ?? false,
  }
}

/** Builds the API payload. Ratings and currency are server-controlled and never sent. */
function toPayload(form) {
  return {
    title: form.title.trim(),
    description: form.description.trim(),
    category: form.category,
    price: toMinorUnits(form.price),
    stock: Number(form.stock),
    sku: form.sku.trim(),
    sizes: form.sizes.split(',').map((size) => size.trim()).filter(Boolean),
    colors: form.colors.filter((color) => color.name.trim()).map((color) => ({ name: color.name.trim(), hex: color.hex })),
    images: form.images.filter(Boolean).map((url) => ({ url: url.trim() })),
    attributes: form.attributes.filter((attr) => attr.name.trim() && attr.value.trim()),
    status: form.status,
    isFeatured: form.isFeatured,
  }
}

export default function ProductForm({ product = null }) {
  const navigate = useNavigate()
  const { config } = useConfig()
  const { data: categories } = useAsync(fetchAdminCategories, [], { initialData: [] })
  const [form, setForm] = useState(() => initialState(product))
  const [imageUrl, setImageUrl] = useState('')
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef(null)

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }))
  const updateList = (field, index, patch) => set(field, form[field].map((item, i) => (i === index ? { ...item, ...patch } : item)))
  const removeFrom = (field, index) => set(field, form[field].filter((_, i) => i !== index))

  function addImageUrl() {
    if (!/^https:\/\/\S+$/.test(imageUrl.trim())) return toast.error('Image URLs must start with https://')
    set('images', [...form.images, imageUrl.trim()])
    setImageUrl('')
  }

  async function handleFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    try {
      const image = await uploadProductImage(file)
      set('images', [...form.images, image.url])
      toast.success('Image uploaded')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function onSubmit(e) {
    e.preventDefault()
    const payload = toPayload(form)
    const localErrors = {}
    if (!Number.isInteger(payload.price) || payload.price < 0) localErrors.price = 'Enter a valid price'
    if (!Number.isInteger(payload.stock) || payload.stock < 0) localErrors.stock = 'Stock must be a whole number'
    if (!payload.images.length) localErrors.images = 'Add at least one image'
    if (!payload.category) localErrors.category = 'Choose a category'
    setErrors(localErrors)
    if (Object.keys(localErrors).length) return

    setSaving(true)
    try {
      if (product) await updateProduct(product.id, payload)
      else await createProduct(payload)
      toast.success(product ? 'Product updated' : 'Product created')
      navigate('/admin/products')
    } catch (err) {
      setErrors(err.fieldErrors?.() ?? {})
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12" noValidate>
      <div className="flex flex-col gap-6">
        <h2 className="font-sans text-lg font-medium text-charcoal mb-2">Core Details</h2>
        <AdminInput label="Title" required value={form.title} error={errors.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. Silk Evening Dress" />

        <div className="flex flex-col gap-1.5">
          <label htmlFor="product-description" className="text-[10px] tracking-luxury uppercase text-warmgray">Description</label>
          <textarea id="product-description" required rows={5} value={form.description} onChange={(e) => set('description', e.target.value)} placeholder="Materials, fit and origin..." className={textareaClass} />
          {errors.description && <span className="text-[10px] tracking-luxury uppercase text-[#C53030]">{errors.description}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="product-category" className="text-[10px] tracking-luxury uppercase text-warmgray">Category</label>
            <select id="product-category" required value={form.category} onChange={(e) => set('category', e.target.value)} className={selectClass}>
              <option value="" disabled>Select category...</option>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.isActive ? '' : ' (inactive)'}</option>)}
            </select>
            {errors.category && <span className="text-[10px] tracking-luxury uppercase text-[#C53030]">{errors.category}</span>}
          </div>
          <AdminInput label="SKU" required value={form.sku} error={errors.sku} onChange={(e) => set('sku', e.target.value.toUpperCase())} placeholder="VL-WRTW-09" />
        </div>

        <AdminInput label="Sizes (comma separated, blank if none)" value={form.sizes} error={errors.sizes} onChange={(e) => set('sizes', e.target.value)} placeholder="XS, S, M, L, XL" />

        <fieldset className="flex flex-col gap-3">
          <legend className="text-[10px] tracking-luxury uppercase text-warmgray mb-1">Colours / finishes</legend>
          {form.colors.map((color, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input type="color" aria-label="Colour swatch" value={color.hex} onChange={(e) => updateList('colors', index, { hex: e.target.value.toUpperCase() })} className="w-10 h-10 border border-silk bg-bg" />
              <input aria-label="Colour name" value={color.name} onChange={(e) => updateList('colors', index, { name: e.target.value })} placeholder="Obsidian" className="flex-1 border border-silk bg-bg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-charcoal" />
              <button type="button" aria-label="Remove colour" onClick={() => removeFrom('colors', index)} className="text-warmgray hover:text-[#C53030]"><FiTrash2 size={14} /></button>
            </div>
          ))}
          <button type="button" onClick={() => set('colors', [...form.colors, { name: '', hex: '#1A1916' }])} className="self-start text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal flex items-center gap-1"><FiPlus size={12} /> Add colour</button>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-[10px] tracking-luxury uppercase text-warmgray mb-1">Attributes (e.g. Origin, Care)</legend>
          {form.attributes.map((attr, index) => (
            <div key={index} className="flex gap-3 items-center">
              <input aria-label="Attribute name" value={attr.name} onChange={(e) => updateList('attributes', index, { name: e.target.value })} placeholder="Origin" className="w-1/3 border border-silk bg-bg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-charcoal" />
              <input aria-label="Attribute value" value={attr.value} onChange={(e) => updateList('attributes', index, { value: e.target.value })} placeholder="Italy" className="flex-1 border border-silk bg-bg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-charcoal" />
              <button type="button" aria-label="Remove attribute" onClick={() => removeFrom('attributes', index)} className="text-warmgray hover:text-[#C53030]"><FiTrash2 size={14} /></button>
            </div>
          ))}
          <button type="button" onClick={() => set('attributes', [...form.attributes, { name: '', value: '' }])} className="self-start text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal flex items-center gap-1"><FiPlus size={12} /> Add attribute</button>
        </fieldset>
      </div>

      <div className="flex flex-col gap-6">
        <h2 className="font-sans text-lg font-medium text-charcoal mb-2">Media, Pricing &amp; Inventory</h2>

        <div className="flex flex-col gap-3">
          <span className="text-[10px] tracking-luxury uppercase text-warmgray">Images (first is the cover)</span>
          <div className="flex flex-wrap gap-3">
            {form.images.map((url, index) => (
              <div key={url + index} className="relative w-24 h-32 border border-silk bg-ivory dark:bg-white">
                <img src={url} alt={`Product image ${index + 1}`} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />
                <button type="button" aria-label="Remove image" onClick={() => removeFrom('images', index)} className="absolute top-1 right-1 bg-bg border border-silk p-1 text-warmgray hover:text-[#C53030]"><FiTrash2 size={12} /></button>
              </div>
            ))}
            {config.uploadsEnabled && (
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="w-24 h-32 border border-dashed border-silk flex flex-col items-center justify-center gap-2 text-warmgray hover:border-warmgray disabled:opacity-50">
                <FiUpload size={18} strokeWidth={1} />
                <span className="text-[9px] tracking-luxury uppercase">{uploading ? 'Uploading' : 'Upload'}</span>
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleFile} className="hidden" />
          </div>
          <div className="flex gap-3">
            <input aria-label="Image URL" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addImageUrl())} placeholder="https://images.example.com/piece.jpg" className="flex-1 border border-silk bg-bg px-3 py-2 text-sm text-charcoal focus:outline-none focus:border-charcoal" />
            <AdminButton variant="ghost" onClick={addImageUrl}>Add URL</AdminButton>
          </div>
          {!config.uploadsEnabled && <p className="text-[10px] text-warmgray">File upload is disabled until Cloudinary is configured on the server; paste an https image URL instead.</p>}
          {errors.images && <span className="text-[10px] tracking-luxury uppercase text-[#C53030]">{errors.images}</span>}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <AdminInput label="Price (₹)" type="number" step="0.01" min="0" required value={form.price} error={errors.price} onChange={(e) => set('price', e.target.value)} placeholder="106500" />
          <AdminInput label="Stock" type="number" min="0" step="1" required value={form.stock} error={errors.stock} onChange={(e) => set('stock', e.target.value)} />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="product-status" className="text-[10px] tracking-luxury uppercase text-warmgray">Visibility</label>
          <select id="product-status" value={form.status} onChange={(e) => set('status', e.target.value)} className={selectClass}>
            <option value="active">Active — visible and purchasable</option>
            <option value="inactive">Inactive — hidden from the storefront</option>
            <option value="archived">Archived — retired</option>
          </select>
        </div>

        <label className="flex items-center gap-3 cursor-pointer w-max">
          <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} className="accent-charcoal w-4 h-4" />
          <span className="text-xs font-sans text-charcoal">Feature on the storefront homepage</span>
        </label>

        {product && <p className="text-[10px] text-warmgray">Rating {product.ratingAverage.toFixed(1)} from {product.ratingCount} reviews (calculated from customer reviews).</p>}

        <div className="mt-8 flex items-center justify-end gap-4 border-t border-silk pt-6">
          <button type="button" onClick={() => navigate('/admin/products')} className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors focus:outline-none">Cancel</button>
          <AdminButton type="submit" variant="solid" disabled={saving || uploading}>
            {saving ? 'Saving...' : product ? 'Save Changes' : 'Publish Product'}
          </AdminButton>
        </div>
      </div>
    </form>
  )
}

import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiUpload } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { useAdminProducts } from '../../hooks/useAdminProducts.js'
import { fetchAllCategories } from '../../services/admin.js'
import { AdminInput, AdminButton } from './Primitives.jsx'

export default function ProductForm({ isEditing = false, product = null, productId = null }) {
    const navigate = useNavigate()
    const { create, update, uploadImage } = useAdminProducts()

    const [categories, setCategories] = useState([])
    const [uploading, setUploading] = useState(false)
    const fileInputRef = useRef(null)

    const [imageFile, setImageFile] = useState(null)
    const [imagePreview, setImagePreview] = useState(product?.image_url || null)

    const [formData, setFormData] = useState({
        title: product?.title || '',
        description: product?.description || '',
        category: product?.category || '',
        price: product?.price || '',
        rating: product?.rating || '0.0',
        rating_count: product?.rating_count || 0,
        is_featured: product?.is_featured || false,
        image_url: product?.image_url || '',
    })

    useEffect(() => {
        fetchAllCategories().then(setCategories)
    }, [])

    function handleChange(field, value) {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    function handleFileChange(e) {
        const file = e.target.files[0]
        if (!file) return
        setImageFile(file)
        const reader = new FileReader()
        reader.onload = (ev) => setImagePreview(ev.target.result)
        reader.readAsDataURL(file)
    }

    async function onSubmit(e) {
        e.preventDefault()

        if (!imageFile && !formData.image_url) {
            toast.error('Please upload a product image.')
            return
        }

        setUploading(true)

        try {
            let imageUrl = formData.image_url || product?.image_url || ''

            if (imageFile) {
                const uploadedUrl = await uploadImage(imageFile)
                if (!uploadedUrl) {
                    toast.error('Image upload failed.')
                    return
                }
                imageUrl = uploadedUrl
            }

            const payload = {
                title: formData.title,
                description: formData.description,
                category: formData.category,
                image_url: imageUrl,
                price: parseFloat(formData.price),
                rating: parseFloat(formData.rating),
                rating_count: parseInt(formData.rating_count, 10),
                is_featured: formData.is_featured,
            }

            if (isEditing) {
                await update(productId, payload)
                toast.success('Product updated.')
            } else {
                await create(payload)
                toast.success('Product created.')
            }

            navigate('/admin/products')
        } finally {
            setUploading(false)
        }
    }

    return (
        <form onSubmit={onSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            {/* Left Column */}
            <div className="flex flex-col gap-6">
                <h2 className="font-sans text-lg font-medium text-charcoal mb-2">Core Details</h2>

                <AdminInput
                    label="Title"
                    required
                    value={formData.title}
                    onChange={e => handleChange('title', e.target.value)}
                    placeholder="e.g. Silk Evening Dress"
                />

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-luxury uppercase text-warmgray">Description</label>
                    <textarea
                        required
                        rows={5}
                        value={formData.description}
                        onChange={e => handleChange('description', e.target.value)}
                        placeholder="Detailed description of materials, fit, and origin..."
                        className="w-full bg-bg border border-silk rounded-none px-3 py-2.5
                       text-sm text-charcoal font-sans placeholder:text-warmgray/50
                       focus:outline-none focus:border-charcoal transition-colors resize-none"
                    />
                </div>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-luxury uppercase text-warmgray">Category</label>
                    <select
                        required
                        value={formData.category}
                        onChange={e => handleChange('category', e.target.value)}
                        className="w-full bg-bg border border-silk rounded-none px-3 py-2.5
                       text-sm text-charcoal font-sans focus:outline-none focus:border-charcoal
                       transition-colors cursor-pointer appearance-none"
                    >
                        <option value="" disabled>Select category...</option>
                        {categories.map(c => (
                            <option key={c.id} value={c.slug}>{c.name}</option>
                        ))}
                    </select>
                </div>

                <label className="flex items-center gap-3 mt-2 cursor-pointer w-max group">
                    <div className="relative flex items-center justify-center">
                        <input
                            type="checkbox"
                            checked={formData.is_featured}
                            onChange={e => handleChange('is_featured', e.target.checked)}
                            className="peer appearance-none w-4 h-4 border border-silk bg-transparent 
                         checked:bg-obsidian checked:border-obsidian transition-colors cursor-pointer"
                        />
                        {formData.is_featured && (
                            <span className="absolute text-cream pointer-events-none mt-px text-[10px]">
                                ✓
                            </span>
                        )}
                    </div>
                    <span className="text-xs font-sans text-charcoal group-hover:opacity-70 transition-opacity">
                        Feature product on storefront homepage
                    </span>
                </label>
            </div>

            {/* Right Column */}
            <div className="flex flex-col gap-6">
                <h2 className="font-sans text-lg font-medium text-charcoal mb-2">Media & Pricing</h2>

                <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] tracking-luxury uppercase text-warmgray">Cover Image</label>
                    <div
                        className="border border-dashed border-silk h-48 flex flex-col
                       items-center justify-center gap-4 bg-parchment/30 cursor-pointer
                       hover:border-warmgray transition-colors"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        {imagePreview ? (
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="w-full h-full object-contain mix-blend-multiply p-2"
                            />
                        ) : (
                            <>
                                <FiUpload size={20} strokeWidth={1} className="text-warmgray" />
                                <span className="text-[10px] tracking-luxury uppercase text-warmgray">
                                    Click to upload image cover
                                </span>
                            </>
                        )}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileChange}
                            className="hidden"
                        />
                    </div>
                </div>

                <AdminInput
                    label="Price (USD)"
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formData.price}
                    onChange={e => handleChange('price', e.target.value)}
                    placeholder="e.g. 1990.00"
                />

                <div className="grid grid-cols-2 gap-4">
                    <AdminInput
                        label="Initial Rating"
                        type="number"
                        step="0.1"
                        min="0"
                        max="5"
                        required
                        value={formData.rating}
                        onChange={e => handleChange('rating', e.target.value)}
                    />
                    <AdminInput
                        label="Review Count"
                        type="number"
                        min="0"
                        required
                        value={formData.rating_count}
                        onChange={e => handleChange('rating_count', e.target.value)}
                    />
                </div>

                <div className="mt-8 flex items-center justify-end gap-4 border-t border-silk pt-6">
                    <button
                        type="button"
                        onClick={() => navigate('/admin/products')}
                        className="text-[10px] tracking-luxury uppercase text-warmgray
                       hover:text-charcoal transition-colors focus:outline-none"
                    >
                        Cancel
                    </button>
                    <AdminButton type="submit" variant="solid" disabled={uploading}>
                        {uploading ? 'Processing...' : isEditing ? 'Save Changes' : 'Publish Product'}
                    </AdminButton>
                </div>
            </div>

        </form>
    )
}

import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabaseClient.js'
import ProductForm from '../../components/admin/ProductForm.jsx'

// Helper fetch locally so we don't depend on client services folder if we don't want to
async function loadProductAdmin(id) {
    const { data } = await supabase.from('products').select('*').eq('id', id).single()
    return data
}

export default function EditProduct() {
    const { id } = useParams()
    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function init() {
            const data = await loadProductAdmin(id)
            setProduct(data)
            setLoading(false)
        }
        init()
    }, [id])

    if (loading) {
        return (
            <div className="flex items-center justify-center p-24 text-[10px] tracking-luxury uppercase text-warmgray">
                Loading core data...
            </div>
        )
    }

    if (!product) {
        return (
            <div className="text-[10px] tracking-luxury uppercase text-[#C53030]">
                Product not found
            </div>
        )
    }

    return (
        <div className="flex flex-col gap-10">
            <div>
                <h1 className="font-sans text-xl font-medium text-charcoal">Edit Product</h1>
                <p className="text-xs text-warmgray mt-1">Modify metadata for {product.title}</p>
            </div>

            <ProductForm isEditing={true} product={product} productId={id} />
        </div>
    )
}

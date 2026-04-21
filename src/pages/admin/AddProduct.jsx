import React from 'react'
import ProductForm from '../../components/admin/ProductForm.jsx'

export default function AddProduct() {
    return (
        <div className="flex flex-col gap-10">
            <div>
                <h1 className="font-sans text-xl font-medium text-charcoal">Add New Product</h1>
                <p className="text-xs text-warmgray mt-1">Deploy a new piece to the storefront catalog.</p>
            </div>

            <ProductForm isEditing={false} />
        </div>
    )
}

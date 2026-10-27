import { useParams } from 'react-router-dom'

import ProductForm from '../../components/admin/ProductForm.jsx'
import { ErrorState, LoadingState } from '../../components/common/StatusViews.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { fetchAdminProduct } from '../../services/admin.js'

export default function EditProduct() {
  const { id } = useParams()
  const { data: product, loading, error, reload } = useAsync(() => fetchAdminProduct(id), [id])

  if (loading) return <LoadingState label="Loading product..." className="p-24" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-sans text-xl font-medium text-charcoal">Edit Product</h1>
        <p className="text-xs text-warmgray mt-1">Modify {product.title} · {product.sku}</p>
      </div>
      <ProductForm key={product.id} product={product} />
    </div>
  )
}

import { FiShoppingCart, FiTrash2 } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import ProductImage from '../../components/common/ProductImage.jsx'

import { EmptyState, ErrorState, LoadingState } from '../../components/common/StatusViews.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import { useCompare } from '../../context/CompareContext.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { fetchProductsByIds } from '../../services/products.js'
import { formatPrice } from '../../utils/format.js'

const STOCK_COPY = { in_stock: 'In stock', low_stock: 'Few left', out_of_stock: 'Sold out' }

export default function Compare() {
  const { ids, removeFromCompare, clearCompare } = useCompare()
  const { add } = useCartContext()
  const { user } = useAuth()
  const key = ids.join(',')
  // Always compare current data; ids the API no longer returns are shown as unavailable.
  const { data: products, loading, error, reload } = useAsync(() => fetchProductsByIds(key ? key.split(',') : []), [key], { initialData: [] })

  if (ids.length === 0) {
    return <EmptyState title="Compare Matrix Empty" message="Select pieces from the shop to analyse side-by-side." actionLabel="Browse Collection" actionTo="/products" />
  }
  if (loading && !products.length) return <LoadingState label="Assembling comparison..." className="min-h-[60vh]" />
  if (error) return <ErrorState error={error} onRetry={reload} />

  const byId = new Map(products.map((product) => [product.id, product]))
  const columns = ids.map((id) => byId.get(id) ?? { id, unavailable: true })

  const handleAdd = (product) => {
    if (!user) return toast.error('Please sign in to reserve pieces.')
    if (product.sizes.length || product.colors.length > 1) return toast.info('Choose a size or colour on the piece page first.')
    add(product.id, 1, { color: product.colors[0]?.name })
  }

  const rows = [
    ['Category', (p) => p.category?.name],
    ['Rating', (p) => (p.ratingCount ? `${p.ratingAverage.toFixed(1)} / 5 (${p.ratingCount})` : 'No reviews yet')],
    ['Availability', (p) => STOCK_COPY[p.stockStatus]],
    ['Sizes', (p) => (p.sizes.length ? p.sizes.join(', ') : 'One size')],
    ['Colours', (p) => (p.colors.length ? p.colors.map((c) => c.name).join(', ') : '—')],
    ['Details', (p) => p.attributes.filter((a) => a.name !== 'Care').map((a) => `${a.name}: ${a.value}`).join(' · ') || '—'],
    ['Description', (p) => p.description],
  ]

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 md:py-24 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-16 border-b border-silk pb-6 gap-4">
        <h1 className="font-display text-4xl lg:text-5xl font-light text-charcoal m-0 tracking-tight">Compare Pieces</h1>
        <button type="button" className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal underline underline-offset-4 focus:outline-none transition-colors" onClick={clearCompare}>
          Clear Matrix
        </button>
      </div>

      <div className="overflow-x-auto hide-scrollbar">
        <table className="w-full text-left border-collapse min-w-[800px]">
          <thead>
            <tr>
              <th scope="col" className="w-48 p-4 align-top font-sans text-[10px] tracking-luxury uppercase text-warmgray border-b border-silk">Attributes</th>
              {columns.map((product) => (
                <th scope="col" key={product.id} className="p-4 align-top border-b border-silk w-64 font-normal">
                  <div className="flex flex-col items-start gap-4 h-full relative">
                    <button type="button" className="absolute -top-2 right-0 text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal transition-colors flex items-center gap-1 focus:outline-none" onClick={() => removeFromCompare(product.id)}>
                      <FiTrash2 size={12} /> Remove
                    </button>
                    {product.unavailable ? (
                      <div className="w-full aspect-[3/4] bg-parchment border border-silk flex items-center justify-center p-4 text-center text-[10px] tracking-luxury uppercase text-warmgray">
                        This piece is no longer available
                      </div>
                    ) : (
                      <>
                        <div className="w-full aspect-[3/4] bg-ivory dark:bg-white border border-silk mb-2 flex shrink-0 items-center justify-center p-4">
                          <ProductImage src={product.image} alt={product.title} className="w-full h-full object-cover object-top mix-blend-multiply dark:mix-blend-normal" />
                        </div>
                        <Link to={`/products/${product.slug}`} className="font-display text-xl text-charcoal font-light m-0 line-clamp-1 hover:opacity-70 transition-opacity">{product.title}</Link>
                        <div className="font-sans text-sm text-charcoal font-medium">{formatPrice(product.price, product.currency)}</div>
                        <button
                          type="button"
                          disabled={!product.isAvailable}
                          className="w-full mt-auto bg-obsidian text-cream text-[10px] tracking-luxury uppercase py-3 rounded-none font-medium hover:bg-charcoal transition-colors focus:outline-none flex justify-center items-center gap-2 disabled:opacity-50"
                          onClick={() => handleAdd(product)}
                        >
                          <FiShoppingCart size={12} /> {product.isAvailable ? 'Add to Bag' : 'Sold Out'}
                        </button>
                      </>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map(([label, render]) => (
              <tr key={label} className="border-b border-silk last:border-0">
                <th scope="row" className="p-4 align-top font-sans text-[10px] tracking-luxury uppercase text-warmgray font-normal">{label}</th>
                {columns.map((product) => (
                  <td key={product.id} className="p-4 align-top text-sm text-charcoal font-light leading-relaxed">
                    {product.unavailable ? '—' : render(product)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

import { useAuth } from '../../context/AuthContext.jsx'
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed.js'
import { useProducts } from '../../hooks/useProducts.js'
import ProductCard from '../ProductCard/ProductCard.jsx'

export default function RecommendationsRow() {
    const { user } = useAuth()
    const { recommendations, loading: recsLoading } = useRecentlyViewed({ userId: user?.id })
    const { products: fallback, loading: fallbackLoading } = useProducts({ sort: 'rating', limit: 6 })

    const loading = recsLoading || fallbackLoading
    const displayProducts = recommendations?.length > 0 ? recommendations : (fallback || [])
    const rowTitle = recommendations?.length > 0 ? 'Because you browsed' : (user ? 'New Arrivals' : 'Most loved')

    if (loading && displayProducts.length === 0) return null
    if (displayProducts.length === 0) return null

    return (
        <section className="w-full max-w-7xl mx-auto px-8 py-24 border-t border-silk">
            <h2 className="font-display text-4xl font-light text-charcoal mb-12">{rowTitle}</h2>
            <div className="w-full overflow-x-auto hide-scrollbar flex gap-6 pb-8">
                {displayProducts.map(p => (
                    <div key={p.id} className="w-72 shrink-0">
                        <ProductCard product={p} hideCategory={true} />
                    </div>
                ))}
            </div>
        </section>
    )
}

import { useAuth } from '../../context/AuthContext.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { fetchRecommendations } from '../../services/products.js'
import ProductCard from '../ProductCard/ProductCard.jsx'

const TITLES = { based_on_activity: 'Because you browsed', top_rated: 'Most loved' }

export default function RecommendationsRow() {
  const { user } = useAuth()
  // Re-requested when the shopper signs in, so suggestions use their history.
  const { data } = useAsync(() => fetchRecommendations(8), [user?.id])

  if (!data?.products?.length) return null

  return (
    <section className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-24 border-t border-silk">
      <h2 className="font-display text-4xl font-light text-charcoal mb-12">{TITLES[data.reason] ?? 'Most loved'}</h2>
      <div className="w-full overflow-x-auto hide-scrollbar flex gap-6 pb-8">
        {data.products.map((p) => (
          <div key={p.id} className="w-72 shrink-0">
            <ProductCard product={p} hideCategory />
          </div>
        ))}
      </div>
    </section>
  )
}

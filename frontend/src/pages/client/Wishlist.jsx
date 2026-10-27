import ProductCard from '../../components/ProductCard/ProductCard.jsx'
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StatusViews.jsx'
import { useWishlistContext } from '../../context/WishlistContext.jsx'

export default function Wishlist() {
  const { items, loading, error, reload } = useWishlistContext()

  if (loading && items.length === 0) return <LoadingState label="Loading wishlist..." className="min-h-[60vh]" />
  if (error && items.length === 0) return <ErrorState error={error} onRetry={reload} />
  if (items.length === 0) {
    return <EmptyState title="Your Wishlist is Empty" message="Save pieces you love to revisit them later." actionLabel="Explore Collection" actionTo="/products" />
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 md:py-24 min-h-screen">
      <h1 className="font-display text-4xl lg:text-5xl font-light text-charcoal mb-16 pb-6 border-b border-silk tracking-tight">Your Wishlist</h1>
      <ProductGrid>
        {items.map((item) => <ProductCard key={item.productId} product={item.product} />)}
      </ProductGrid>
    </div>
  )
}

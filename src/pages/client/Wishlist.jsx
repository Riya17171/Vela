import { Link } from 'react-router-dom'
import { useWishlistContext } from '../../context/WishlistContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx'
import ProductCard from '../../components/ProductCard/ProductCard.jsx'

export default function Wishlist() {
  const { user } = useAuth()
  const { items } = useWishlistContext()

  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-display text-4xl lg:text-5xl font-light text-charcoal mb-4 tracking-tight">Login Required</h2>
        <p className="font-sans text-sm text-charcoal font-light mb-8">Please authenticate to view your curated collection.</p>
        <Link to="/login" className="bg-obsidian text-cream text-xs tracking-luxury uppercase px-8 py-3.5 rounded-none font-medium hover:bg-charcoal transition-colors focus:outline-none">
          Authenticate
        </Link>
      </div>
    )
  }

  if (!items || items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-display text-4xl lg:text-5xl font-light text-charcoal mb-4 tracking-tight">Your Wishlist is Empty</h2>
        <p className="font-sans text-sm text-charcoal font-light mb-8">Save pieces you love to revisit them later.</p>
        <Link to="/products" className="bg-transparent border border-charcoal text-charcoal text-xs tracking-luxury uppercase px-8 py-3.5 rounded-none font-medium hover:bg-parchment transition-colors focus:outline-none">
          Explore Collection
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-8 py-16 md:py-24 min-h-screen">
      <h1 className="font-display text-4xl lg:text-5xl font-light text-charcoal mb-16 pb-6 border-b border-silk tracking-tight">Your Wishlist</h1>
      <ProductGrid>
        {items.map(item => (
          item.products ? <ProductCard key={item.id} product={item.products} /> : null
        ))}
      </ProductGrid>
    </div>
  )
}

import { FiBarChart2, FiHeart, FiStar } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import ProductImage from '../common/ProductImage.jsx'

import { useAuth } from '../../context/AuthContext.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import { useCompare } from '../../context/CompareContext.jsx'
import { useWishlistContext } from '../../context/WishlistContext.jsx'
import { formatPrice } from '../../utils/format.js'

export default function ProductCard({ product, hideCategory = false }) {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { add, pending } = useCartContext()
  const { toggle, isWishlisted } = useWishlistContext()
  const { toggleCompare, isCompared } = useCompare()

  const saved = isWishlisted(product.id)
  const compared = isCompared(product.id)
  const needsOptions = product.sizes?.length > 0 || product.colors?.length > 1
  const soldOut = !product.isAvailable

  const handleAddToCart = (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please sign in to add pieces to your bag')
      return
    }
    // Pieces with sizes or several colours need a choice first.
    if (needsOptions) {
      navigate(`/products/${product.slug ?? product.id}`)
      return
    }
    add(product.id, 1, { color: product.colors?.[0]?.name })
  }

  const handleWishlist = (e) => {
    e.preventDefault()
    if (!user) {
      toast.error('Please sign in to save pieces')
      return
    }
    toggle(product.id)
  }

  const handleCompare = (e) => {
    e.preventDefault()
    toggleCompare(product)
  }

  return (
    <Link to={`/products/${product.slug ?? product.id}`} className="block group bg-parchment rounded-none cursor-pointer transition-colors duration-300 hover:bg-silk focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal">
      <div className="relative aspect-[3/4] overflow-hidden bg-ivory dark:bg-white border-b border-silk">
        <ProductImage
          src={product.image}
          alt={product.title}
          loading="lazy"
          className={`w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-700 ease-out p-4 ${soldOut ? 'opacity-60 grayscale' : ''}`}
        />

        {!hideCategory && product.category?.name && (
          <div className="absolute top-3 right-3 bg-ivory text-warmgray text-[10px] tracking-luxury uppercase px-2 py-1 z-10 shadow-sm border border-silk">
            {product.category.name}
          </div>
        )}
        {soldOut && (
          <div className="absolute bottom-3 right-3 bg-obsidian text-cream text-[10px] tracking-luxury uppercase px-2 py-1 z-10">Sold out</div>
        )}

        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
          <button
            type="button"
            onClick={handleWishlist}
            className={`p-2 rounded-full bg-ivory border border-silk shadow-sm transition-opacity duration-300 focus:outline-none focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-charcoal hover:border-charcoal ${saved ? 'opacity-100 text-[#e53e3e]' : 'opacity-0 group-hover:opacity-100 text-charcoal'}`}
            aria-label={saved ? 'Remove from wishlist' : 'Save to wishlist'}
            aria-pressed={saved}
          >
            <FiHeart size={14} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.5} />
          </button>
          <button
            type="button"
            onClick={handleCompare}
            className={`p-2 rounded-full bg-ivory border shadow-sm transition-opacity duration-300 focus:outline-none focus-visible:opacity-100 focus-visible:ring-1 focus-visible:ring-charcoal hover:border-charcoal text-charcoal ${compared ? 'opacity-100 border-charcoal' : 'opacity-0 group-hover:opacity-100 border-silk'}`}
            aria-label={compared ? 'Remove from comparison' : 'Add to comparison'}
            aria-pressed={compared}
          >
            <FiBarChart2 size={14} strokeWidth={1.5} />
          </button>
        </div>

        {!soldOut && (
          <div className="absolute bottom-0 left-0 w-full translate-y-full group-hover:translate-y-0 group-focus-within:translate-y-0 transition-transform duration-300 ease-out z-20">
            <button
              type="button"
              onClick={handleAddToCart}
              disabled={pending}
              className="w-full bg-obsidian text-cream text-xs tracking-luxury uppercase py-3.5 rounded-none font-medium hover:bg-charcoal transition-colors duration-300 focus:outline-none disabled:opacity-60"
            >
              {needsOptions ? 'Select Options' : 'Add to Bag'}
            </button>
          </div>
        )}
      </div>

      <div className="p-4 space-y-2 flex flex-col items-start border border-t-0 border-silk border-opacity-0 group-hover:border-opacity-100 transition-colors duration-300">
        <h3 className="font-display text-lg font-light text-charcoal leading-tight m-0 line-clamp-1 w-full text-left">{product.title}</h3>
        {!hideCategory && <span className="text-[10px] tracking-luxury uppercase text-warmgray">{product.category?.name}</span>}

        <div className="flex items-center justify-between w-full mt-2">
          <span className="font-sans text-sm font-medium text-charcoal tracking-wide">{formatPrice(product.price, product.currency)}</span>
          {product.ratingCount > 0 ? (
            <div className="flex items-center gap-1 opacity-80" aria-label={`Rated ${product.ratingAverage} out of 5`}>
              <FiStar size={10} fill="currentColor" className="text-warmgray" />
              <span className="text-xs text-warmgray font-sans mt-[1px]">{product.ratingAverage.toFixed(1)}</span>
            </div>
          ) : product.stockStatus === 'low_stock' ? (
            <span className="text-[10px] tracking-luxury uppercase text-warmgray">Few left</span>
          ) : null}
        </div>
      </div>
    </Link>
  )
}

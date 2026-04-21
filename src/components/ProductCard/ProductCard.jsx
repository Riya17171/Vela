
import { Link } from 'react-router-dom'
import { FiHeart, FiShoppingCart, FiArrowRight, FiStar } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { useCartContext } from '../../context/CartContext.jsx'
import { useWishlistContext } from '../../context/WishlistContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'

export default function ProductCard({ product }) {
    const { user } = useAuth()
    const { add } = useCartContext()
    const { toggle, items: wishlistItems } = useWishlistContext()

    const isWishlisted = wishlistItems?.some((item) => item.product_id === product.id)

    const handleAddToCart = (e) => {
        e.preventDefault()
        if (!user) {
            toast.error("Please login to add to bag")
            return
        }
        add(product.id, 1)
    }

    const handleWishlist = (e) => {
        e.preventDefault()
        if (!user) {
            toast.error("Please login to add to wishlist")
            return
        }
        toggle(product.id)
    }

    return (
        <Link to={`/products/${product.id}`} className="block group bg-parchment rounded-none cursor-pointer transition-colors duration-300 hover:bg-silk focus:outline-none focus:ring-1 focus:ring-charcoal">
            <div className="relative aspect-[3/4] overflow-hidden bg-ivory dark:bg-white border-b border-silk">
                {/* Image */}
                <img
                    src={product.image_url}
                    alt={product.title}
                    className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal group-hover:scale-105 transition-transform duration-700 ease-out p-4"
                />

                {/* Top Right Tag */}
                <div className="absolute top-3 right-3 bg-ivory text-warmgray text-[10px] tracking-luxury uppercase px-2 py-1 z-10 shadow-sm border border-silk">
                    {product.category}
                </div>

                {/* Wishlist Heart */}
                <button
                    onClick={handleWishlist}
                    className={`absolute top-3 left-3 z-10 p-2 rounded-full bg-ivory border border-silk shadow-sm transition-opacity duration-300 focus:outline-none hover:border-charcoal ${isWishlisted ? 'opacity-100 text-[#e53e3e]' : 'opacity-0 group-hover:opacity-100 text-charcoal'}`}
                    aria-label="Toggle Wishlist"
                >
                    <FiHeart size={14} fill={isWishlisted ? 'currentColor' : 'none'} strokeWidth={1.5} />
                </button>

                {/* Add to Bag Slider */}
                <div className="absolute bottom-0 left-0 w-full translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out z-20">
                    <button
                        onClick={handleAddToCart}
                        className="w-full bg-obsidian text-cream text-xs tracking-luxury uppercase py-3.5 rounded-none font-medium hover:bg-charcoal transition-colors duration-300 focus:outline-none"
                    >
                        Add to Bag
                    </button>
                </div>
            </div>

            {/* Content Context */}
            <div className="p-4 space-y-2 flex flex-col items-start border border-t-0 border-silk border-opacity-0 group-hover:border-opacity-100 transition-colors duration-300">
                <h3 className="font-display text-lg font-light text-charcoal leading-tight m-0 line-clamp-1 w-full text-left">
                    {product.title || 'Archive Collection Piece'}
                </h3>
                <span className="text-[10px] tracking-luxury uppercase text-warmgray">
                    {product.category || 'House'}
                </span>

                <div className="flex items-center justify-between w-full mt-2">
                    <span className="font-sans text-sm font-medium text-charcoal tracking-wide">
                        ${Number(product.price || 120.00).toFixed(2)}
                    </span>
                    <div className="flex items-center gap-1 opacity-80">
                        <FiStar size={10} fill="currentColor" className="text-warmgray" />
                        <span className="text-xs text-warmgray font-sans mt-[1px]">{product.rating}</span>
                    </div>
                </div>
            </div>
        </Link>
    )
}

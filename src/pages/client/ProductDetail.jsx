
import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { FiHeart, FiMinus, FiPlus, FiArrowRight } from 'react-icons/fi'
import { toast } from 'react-toastify'
import { motion, useScroll, useTransform } from 'framer-motion'
import { fetchProductById } from '../../services/products.js'
import { useCartContext } from '../../context/CartContext.jsx'
import { useWishlistContext } from '../../context/WishlistContext.jsx'
import ReviewSection from '../../components/ReviewSection/ReviewSection.jsx'
import ProductGrid from '../../components/ProductGrid/ProductGrid.jsx'
import ProductCard from '../../components/ProductCard/ProductCard.jsx'
import { useProducts } from '../../hooks/useProducts.js'
import { useRecentlyViewed } from '../../hooks/useRecentlyViewed.js'
import { useAuth } from '../../context/AuthContext.jsx'
import { getCategoryConfig, SIZES as CONFIG_SIZES } from '../../utils/categoryConfig.js'

export default function ProductDetail() {
  const { id } = useParams()
  const { user } = useAuth()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [qty, setQty] = useState(1)

  const [selectedSize, setSelectedSize] = useState('M')
  const [selectedColor, setSelectedColor] = useState('#1A1916')
  const [selectedVolume, setSelectedVolume] = useState('50ml')
  const [expandedSection, setExpandedSection] = useState('description')

  const { add: addToCart, loading: cartLoading } = useCartContext()
  const { toggle: toggleWishlist, items: wishlistItems } = useWishlistContext()
  const { products: relatedProducts } = useProducts({ categoryId: product?.category, limit: 6 })
  const { logView } = useRecentlyViewed({ userId: user?.id })

  useEffect(() => {
    async function load() {
      setLoading(true)
      const data = await fetchProductById(id)
      setProduct(data)
      setLoading(false)
      window.scrollTo(0, 0)

      if (user?.id) {
        logView({ productId: id })
      }
    }
    load()
  }, [id, user?.id, logView])

  if (loading) return <div className="w-full min-h-screen flex items-center justify-center font-sans text-xs tracking-luxury uppercase text-warmgray">Locating piece...</div>
  if (!product) return <div className="w-full min-h-screen flex items-center justify-center font-display text-2xl text-charcoal">Piece unavailable.</div>

  const isWishlisted = wishlistItems?.some(item => item.product_id === product.id)
  const config = getCategoryConfig(product.category)
  const COLORS = ['#1A1916', '#EFECE5', '#8A877F', '#5B4B38']

  const handleAddToCart = () => {
    if (!user) {
      toast.error("Please authenticate to reserve this piece.")
      return
    }
    addToCart(product.id, qty)
  }

  const handleWishlist = () => {
    if (!user) {
      toast.error("Please authenticate to save this piece.")
      return
    }
    toggleWishlist(product.id)
  }

  const toggleAccordion = (section) => {
    setExpandedSection(expandedSection === section ? null : section)
  }

  return (
    <div className="w-full bg-bg">
      {/* Product Fold */}
      <div className="max-w-7xl mx-auto px-8 w-full min-h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-12 lg:gap-24 py-16">

        {/* Left: Gallery */}
        <div className="md:w-1/2 flex flex-col gap-4">
          <div className="w-full aspect-[3/4] bg-ivory dark:bg-white overflow-hidden border border-silk">
            <img
              src={product.image_url}
              alt={product.title}
              className="w-full h-full object-cover object-top mix-blend-multiply dark:mix-blend-normal"
            />
          </div>
          {/* Thumbnails strip */}
          <div className="flex gap-4 overflow-x-auto hide-scrollbar">
            <div className="w-24 aspect-[3/4] bg-ivory dark:bg-white border-b-2 border-charcoal shrink-0 cursor-pointer">
              <img src={product.image_url} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal opacity-100" />
            </div>
            {/* Mocking second image for structure representation */}
            <div className="w-24 aspect-[3/4] bg-ivory dark:bg-white border border-silk shrink-0 cursor-pointer hover:border-charcoal transition-colors">
              <img src={product.image_url} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal opacity-50 grayscale" />
            </div>
          </div>
        </div>

        {/* Right: Specs & Commerce */}
        <div className="md:w-1/2 flex flex-col pt-4 md:pt-12">
          <nav className="flex items-center text-[10px] tracking-luxury uppercase text-warmgray mb-6">
            <Link to="/" className="hover:text-charcoal transition-colors">House</Link>
            <span className="mx-2">/</span>
            <Link to="/products" className="hover:text-charcoal transition-colors">{product.category}</Link>
          </nav>

          <h1 className="font-display text-4xl lg:text-5xl font-light text-charcoal leading-tight m-0">
            {product.title}
          </h1>

          <div className="font-sans text-xl text-charcoal mt-6 mb-8 tracking-wide">
            ${Number(product.price).toFixed(2)}
          </div>

          {/* Size Selector */}
          {config.hasSizes && (
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] tracking-luxury uppercase text-warmgray">Size</span>
                <button className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal underline underline-offset-4 focus:outline-none">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {CONFIG_SIZES[config.sizeType]?.map(size => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`w-12 h-12 flex items-center justify-center font-sans text-xs border rounded-none transition-colors duration-300 focus:outline-none ${selectedSize === size ? 'bg-obsidian border-obsidian text-cream' : 'border-silk text-charcoal hover:border-charcoal bg-transparent'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Color Selector */}
          {config.hasColors && (
            <div className="mb-12">
              <span className="block text-[10px] tracking-luxury uppercase text-warmgray mb-4">
                {config.colorLabel || 'Color'}
              </span>
              <div className="flex gap-4">
                {COLORS.map(hex => (
                  <button
                    key={hex}
                    onClick={() => setSelectedColor(hex)}
                    style={{ backgroundColor: hex }}
                    className={`w-6 h-6 rounded-full border border-silk focus:outline-none transition-transform ${selectedColor === hex ? 'ring-1 ring-offset-2 ring-charcoal' : 'hover:scale-110'}`}
                    aria-label="Color Box"
                  />
                ))}
              </div>
            </div>
          )}

          {/* Volume Selector */}
          {config.hasVolume && (
            <div className="mb-8">
              <span className="block text-[10px] tracking-luxury uppercase text-warmgray mb-4">
                Volume
              </span>
              <div className="flex gap-3">
                {['30ml', '50ml', '100ml'].map(vol => (
                  <button
                    key={vol}
                    onClick={() => setSelectedVolume(vol)}
                    className={`px-4 py-2 border rounded-none text-xs font-sans transition-colors duration-300 focus:outline-none ${selectedVolume === vol ? 'bg-obsidian border-obsidian text-cream' : 'border-silk text-charcoal hover:border-charcoal bg-transparent'}`}
                  >
                    {vol}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity & Action CTAs */}
          <div className="flex flex-col gap-4 mb-16">
            <div className="flex items-center gap-6 mb-2">
              <span className="text-[10px] tracking-luxury uppercase text-warmgray">Quantity</span>
              <div className="flex items-center border border-silk w-max">
                <button onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 text-warmgray hover:text-charcoal transition-colors focus:outline-none"><FiMinus size={14} /></button>
                <span className="w-8 text-center text-sm font-sans text-charcoal">{qty}</span>
                <button onClick={() => setQty(qty + 1)} className="px-4 py-2 text-warmgray hover:text-charcoal transition-colors focus:outline-none"><FiPlus size={14} /></button>
              </div>
            </div>

            <button
              onClick={handleAddToCart}
              disabled={cartLoading}
              className="w-full bg-[#1A1916] text-[#F7F5F0] text-xs tracking-luxury uppercase py-4 rounded-none font-medium hover:bg-charcoal/80 transition-colors duration-300 focus:outline-none disabled:opacity-70"
            >
              {cartLoading ? 'Reserving...' : config.addLabel}
            </button>
            <button
              onClick={handleWishlist}
              className="w-full border border-charcoal text-charcoal bg-transparent text-xs tracking-luxury uppercase py-4 rounded-none hover:bg-parchment transition-colors duration-300 flex justify-center items-center gap-2 focus:outline-none"
            >
              <FiHeart size={14} fill={isWishlisted ? 'currentColor' : 'none'} color="currentColor" strokeWidth={1.5} />
              <span>{isWishlisted ? 'Saved to Wishlist' : 'Add to Wishlist'}</span>
            </button>
          </div>

          {/* Luxury Accordions */}
          <div className="border-t border-silk w-full">
            {/* Description */}
            <div className="border-b border-silk">
              <button
                className="w-full py-6 flex justify-between items-center text-xs tracking-luxury uppercase text-charcoal focus:outline-none"
                onClick={() => toggleAccordion('description')}
              >
                <span>The Details</span>
                {expandedSection === 'description' ? <FiMinus size={14} strokeWidth={1} /> : <FiPlus size={14} strokeWidth={1} />}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSection === 'description' ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-charcoal leading-relaxed font-light">{product.description}</p>
                <p className="text-sm text-charcoal leading-relaxed font-light mt-4">Crafted with precision. Engineered for an exceptional lifestyle.</p>
              </div>
            </div>

            {/* Materials & Care */}
            <div className="border-b border-silk">
              <button
                className="w-full py-6 flex justify-between items-center text-xs tracking-luxury uppercase text-charcoal focus:outline-none"
                onClick={() => toggleAccordion('materials')}
              >
                <span>Materials & Care</span>
                {expandedSection === 'materials' ? <FiMinus size={14} strokeWidth={1} /> : <FiPlus size={14} strokeWidth={1} />}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSection === 'materials' ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-charcoal leading-relaxed font-light">Dry clean only. Handle with extreme care. Keep away from direct sunlight for extended periods.</p>
              </div>
            </div>

            {/* Shipping */}
            <div className="border-b border-silk">
              <button
                className="w-full py-6 flex justify-between items-center text-xs tracking-luxury uppercase text-charcoal focus:outline-none"
                onClick={() => toggleAccordion('shipping')}
              >
                <span>Shipping & Returns</span>
                {expandedSection === 'shipping' ? <FiMinus size={14} strokeWidth={1} /> : <FiPlus size={14} strokeWidth={1} />}
              </button>
              <div className={`overflow-hidden transition-all duration-300 ease-in-out ${expandedSection === 'shipping' ? 'max-h-96 opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
                <p className="text-sm text-charcoal leading-relaxed font-light">Complimentary express shipping on all domestic orders. Returns accepted within 14 days of delivery, provided the garment is unworn and tags remain intact.</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* Edge-to-edge Review Component */}
      <ReviewSection productId={product.id} productRating={product.rating} ratingCount={product.rating_count} />

      {/* Recommendations Horizontal Overflow Row */}
      <section className="w-full py-24 pl-8 md:pl-16 border-t border-silk bg-bg pb-32 overflow-hidden">
        <div className="w-full max-w-[1400px]">
          <div className="flex justify-between items-end mb-16 pr-8">
            <h2 className="font-display text-3xl md:text-4xl font-light text-charcoal m-0">You may also appreciate</h2>
            <div className="flex items-center gap-4">
              <button className="text-charcoal hover:opacity-50 transition-opacity focus:outline-none"><FiPlus style={{ transform: 'rotate(45deg)' }} strokeWidth={1} size={24} /></button>
              <button className="text-charcoal hover:opacity-50 transition-opacity focus:outline-none"><FiPlus style={{ transform: 'rotate(-45deg)' }} strokeWidth={1} size={24} /></button>
            </div>
          </div>

          {/* Draggable Row Simulation */}
          <div className="flex gap-6 overflow-x-auto hide-scrollbar pb-8 -mb-8 cursor-grab active:cursor-grabbing snap-x">
            {relatedProducts?.filter(p => p.id !== product.id).map(p => (
              <div key={p.id} className="w-72 shrink-0 snap-start">
                <ProductCard product={p} />
              </div>
            ))}
            {/* Fallback structural cards */}
            {relatedProducts?.length < 3 && [...Array(4)].map((_, i) => (
              <div key={`blank - ${i} `} className="w-72 aspect-[3/4] shrink-0 bg-parchment border border-silk flex items-center justify-center snap-start">
                <span className="text-[10px] tracking-luxury uppercase text-warmgray">Vela Archive</span>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

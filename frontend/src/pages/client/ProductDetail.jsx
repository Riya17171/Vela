import { useEffect, useRef, useState } from 'react'
import { FiBarChart2, FiChevronLeft, FiChevronRight, FiHeart, FiMinus, FiPlus } from 'react-icons/fi'
import { Link, useParams } from 'react-router-dom'
import { toast } from 'react-toastify'
import ProductImage from '../../components/common/ProductImage.jsx'

import ProductCard from '../../components/ProductCard/ProductCard.jsx'
import ReviewSection from '../../components/ReviewSection/ReviewSection.jsx'
import { ErrorState, LoadingState } from '../../components/common/StatusViews.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import { useCompare } from '../../context/CompareContext.jsx'
import { useWishlistContext } from '../../context/WishlistContext.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useProducts } from '../../hooks/useProducts.js'
import { fetchProduct } from '../../services/products.js'
import { recordRecentlyViewed } from '../../services/users.js'
import { formatPrice } from '../../utils/format.js'

const STOCK_COPY = { in_stock: 'In stock', low_stock: 'Only a few left', out_of_stock: 'Sold out' }

function Accordion({ id, title, open, onToggle, children }) {
  return (
    <div className="border-b border-silk">
      <button
        type="button"
        aria-expanded={open}
        aria-controls={`panel-${id}`}
        className="w-full py-6 flex justify-between items-center text-xs tracking-luxury uppercase text-charcoal focus:outline-none focus-visible:underline"
        onClick={onToggle}
      >
        <span>{title}</span>
        {open ? <FiMinus size={14} strokeWidth={1} /> : <FiPlus size={14} strokeWidth={1} />}
      </button>
      <div id={`panel-${id}`} className={`overflow-hidden transition-all duration-300 ease-in-out ${open ? 'max-h-[40rem] opacity-100 pb-6' : 'max-h-0 opacity-0'}`}>
        {children}
      </div>
    </div>
  )
}

export default function ProductDetail() {
  const { id } = useParams()
  const { data: product, loading, error, reload } = useAsync(() => fetchProduct(id), [id])

  if (loading) return <LoadingState label="Locating piece..." className="min-h-screen" />
  if (error) return <ErrorState error={error} onRetry={reload} className="min-h-screen" />
  if (!product) return null
  // Keyed so size/colour/quantity selections start fresh for every piece.
  return <ProductView key={product.id} product={product} />
}

function ProductView({ product }) {
  const { user } = useAuth()
  const { add, pending } = useCartContext()
  const { toggle: toggleWishlist, isWishlisted } = useWishlistContext()
  const { toggleCompare, isCompared } = useCompare()

  const [qty, setQty] = useState(1)
  const [selectedSize, setSelectedSize] = useState(null)
  const [selectedColor, setSelectedColor] = useState(product.colors.length === 1 ? product.colors[0].name : null)
  const [activeImage, setActiveImage] = useState(0)
  const [expandedSection, setExpandedSection] = useState('description')
  const rowRef = useRef(null)

  const { products: related } = useProducts({ category: product.category?.slug, limit: 8 }, { enabled: Boolean(product.category?.slug) })

  const userId = user?.id
  useEffect(() => {
    window.scrollTo(0, 0)
    if (userId) recordRecentlyViewed(product.id).catch(() => {})
  }, [product.id, userId])

  const saved = isWishlisted(product.id)
  const compared = isCompared(product.id)
  const sizeLabel = product.category?.sizeLabel || 'Size'
  const colorLabel = product.category?.colorLabel || 'Colour'
  const maxQty = product.availableQuantity
  const otherPieces = related.filter((p) => p.id !== product.id)
  const care = product.attributes.find((attr) => attr.name === 'Care')?.value
  const details = product.attributes.filter((attr) => attr.name !== 'Care')

  const handleAddToCart = async () => {
    if (!user) return toast.error('Please sign in to reserve this piece.')
    if (product.sizes.length && !selectedSize) return toast.error(`Select a ${sizeLabel.toLowerCase()}.`)
    if (product.colors.length && !selectedColor) return toast.error(`Select a ${colorLabel.toLowerCase()}.`)
    await add(product.id, qty, { size: selectedSize, color: selectedColor })
  }

  const handleWishlist = () => (user ? toggleWishlist(product.id) : toast.error('Please sign in to save this piece.'))
  const scrollRow = (direction) => rowRef.current?.scrollBy({ left: direction * 320, behavior: 'smooth' })

  return (
    <div className="w-full bg-bg">
      <div className="max-w-7xl mx-auto px-4 sm:px-8 w-full min-h-[calc(100vh-4rem)] flex flex-col md:flex-row gap-12 lg:gap-24 py-16">
        <div className="md:w-1/2 flex flex-col gap-4">
          <div className="w-full aspect-[3/4] bg-ivory dark:bg-white overflow-hidden border border-silk">
            <ProductImage src={product.images[activeImage]?.url ?? product.image} alt={product.images[activeImage]?.alt ?? product.title} fallbackClassName="text-2xl" className="w-full h-full object-cover object-top mix-blend-multiply dark:mix-blend-normal" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-4 overflow-x-auto hide-scrollbar">
              {product.images.map((image, index) => (
                <button
                  key={image.url}
                  type="button"
                  aria-label={`View image ${index + 1}`}
                  aria-pressed={index === activeImage}
                  onClick={() => setActiveImage(index)}
                  className={`w-24 aspect-[3/4] bg-ivory dark:bg-white shrink-0 cursor-pointer transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal ${index === activeImage ? 'border-b-2 border-charcoal' : 'border border-silk hover:border-charcoal'}`}
                >
                  <img src={image.url} alt="" className={`w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal ${index === activeImage ? '' : 'opacity-60'}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="md:w-1/2 flex flex-col pt-4 md:pt-12">
          <nav aria-label="Breadcrumb" className="flex items-center text-[10px] tracking-luxury uppercase text-warmgray mb-6">
            <Link to="/" className="hover:text-charcoal transition-colors">House</Link>
            <span className="mx-2">/</span>
            <Link to={`/products?category=${product.category.slug}`} className="hover:text-charcoal transition-colors">{product.category.name}</Link>
          </nav>

          <h1 className="font-display text-4xl lg:text-5xl font-light text-charcoal leading-tight m-0">{product.title}</h1>

          <div className="flex items-baseline gap-6 mt-6 mb-8">
            <span className="font-sans text-xl text-charcoal tracking-wide">{formatPrice(product.price, product.currency)}</span>
            <span className={`text-[10px] tracking-luxury uppercase ${product.stockStatus === 'in_stock' ? 'text-warmgray' : 'text-charcoal'}`}>{STOCK_COPY[product.stockStatus]}</span>
          </div>

          {product.sizes.length > 0 && (
            <fieldset className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <legend className="text-[10px] tracking-luxury uppercase text-warmgray">{sizeLabel}{selectedSize ? `: ${selectedSize}` : ''}</legend>
                <button type="button" onClick={() => setExpandedSection('sizing')} className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal underline underline-offset-4 focus:outline-none">Size Guide</button>
              </div>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    aria-pressed={selectedSize === size}
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-12 h-12 px-2 flex items-center justify-center font-sans text-xs border rounded-none transition-colors duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal ${selectedSize === size ? 'bg-obsidian border-obsidian text-cream' : 'border-silk text-charcoal hover:border-charcoal bg-transparent'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </fieldset>
          )}

          {product.colors.length > 0 && (
            <fieldset className="mb-12">
              <legend className="block text-[10px] tracking-luxury uppercase text-warmgray mb-4">{colorLabel}{selectedColor ? `: ${selectedColor}` : ''}</legend>
              <div className="flex gap-4">
                {product.colors.map((color) => (
                  <button
                    key={color.name}
                    type="button"
                    title={color.name}
                    aria-label={color.name}
                    aria-pressed={selectedColor === color.name}
                    onClick={() => setSelectedColor(color.name)}
                    style={{ backgroundColor: color.hex }}
                    className={`w-6 h-6 rounded-full border border-silk focus:outline-none focus-visible:ring-1 focus-visible:ring-offset-2 focus-visible:ring-charcoal transition-transform ${selectedColor === color.name ? 'ring-1 ring-offset-2 ring-charcoal' : 'hover:scale-110'}`}
                  />
                ))}
              </div>
            </fieldset>
          )}

          <div className="flex flex-col gap-4 mb-16">
            {product.isAvailable && (
              <div className="flex items-center gap-6 mb-2">
                <span className="text-[10px] tracking-luxury uppercase text-warmgray" id="qty-label">Quantity</span>
                <div className="flex items-center border border-silk w-max" role="group" aria-labelledby="qty-label">
                  <button type="button" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))} className="px-4 py-2 text-warmgray hover:text-charcoal transition-colors focus:outline-none"><FiMinus size={14} /></button>
                  <span className="w-8 text-center text-sm font-sans text-charcoal" aria-live="polite">{qty}</span>
                  <button type="button" aria-label="Increase quantity" disabled={qty >= maxQty} onClick={() => setQty(Math.min(maxQty, qty + 1))} className="px-4 py-2 text-warmgray hover:text-charcoal transition-colors focus:outline-none disabled:opacity-30"><FiPlus size={14} /></button>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={handleAddToCart}
              disabled={pending || !product.isAvailable}
              className="w-full bg-[#1A1916] text-[#F7F5F0] text-xs tracking-luxury uppercase py-4 rounded-none font-medium hover:bg-charcoal/80 transition-colors duration-300 focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {!product.isAvailable ? 'Sold Out' : pending ? 'Reserving...' : 'Add to Bag'}
            </button>
            <div className="flex gap-4">
              <button type="button" onClick={handleWishlist} aria-pressed={saved} className="flex-1 border border-charcoal text-charcoal bg-transparent text-xs tracking-luxury uppercase py-4 rounded-none hover:bg-parchment transition-colors duration-300 flex justify-center items-center gap-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal">
                <FiHeart size={14} fill={saved ? 'currentColor' : 'none'} strokeWidth={1.5} />
                <span>{saved ? 'Saved' : 'Wishlist'}</span>
              </button>
              <button type="button" onClick={() => toggleCompare(product)} aria-pressed={compared} className="flex-1 border border-charcoal text-charcoal bg-transparent text-xs tracking-luxury uppercase py-4 rounded-none hover:bg-parchment transition-colors duration-300 flex justify-center items-center gap-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal">
                <FiBarChart2 size={14} strokeWidth={1.5} />
                <span>{compared ? 'Comparing' : 'Compare'}</span>
              </button>
            </div>
          </div>

          <div className="border-t border-silk w-full">
            <Accordion id="description" title="The Details" open={expandedSection === 'description'} onToggle={() => setExpandedSection(expandedSection === 'description' ? null : 'description')}>
              <p className="text-sm text-charcoal leading-relaxed font-light">{product.description}</p>
              {details.length > 0 && (
                <dl className="mt-6 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                  {details.map((attr) => (
                    <div key={attr.name} className="contents">
                      <dt className="text-[10px] tracking-luxury uppercase text-warmgray pt-0.5">{attr.name}</dt>
                      <dd className="text-charcoal font-light">{attr.value}</dd>
                    </div>
                  ))}
                  <div className="contents">
                    <dt className="text-[10px] tracking-luxury uppercase text-warmgray pt-0.5">Reference</dt>
                    <dd className="text-charcoal font-light">{product.sku}</dd>
                  </div>
                </dl>
              )}
            </Accordion>
            {care && (
              <Accordion id="care" title="Materials & Care" open={expandedSection === 'care'} onToggle={() => setExpandedSection(expandedSection === 'care' ? null : 'care')}>
                <p className="text-sm text-charcoal leading-relaxed font-light">{care}</p>
              </Accordion>
            )}
            {product.sizes.length > 0 && (
              <Accordion id="sizing" title="Size & Fit" open={expandedSection === 'sizing'} onToggle={() => setExpandedSection(expandedSection === 'sizing' ? null : 'sizing')}>
                <p className="text-sm text-charcoal leading-relaxed font-light">
                  Vela pieces follow standard {sizeLabel === 'EU Size' ? 'EU shoe sizing; if between sizes, choose the larger.' : 'international sizing (XS–XL) with a relaxed, generous cut. If between sizes, we suggest your usual size.'}
                </p>
              </Accordion>
            )}
            <Accordion id="shipping" title="Shipping & Returns" open={expandedSection === 'shipping'} onToggle={() => setExpandedSection(expandedSection === 'shipping' ? null : 'shipping')}>
              <p className="text-sm text-charcoal leading-relaxed font-light">Complimentary express shipping on all domestic orders. Returns accepted within 14 days of delivery, provided the garment is unworn and tags remain intact.</p>
            </Accordion>
          </div>
        </div>
      </div>

      <ReviewSection productId={product.id} />

      {otherPieces.length > 0 && (
        <section className="w-full py-24 pl-4 sm:pl-8 md:pl-16 border-t border-silk bg-bg pb-32 overflow-hidden">
          <div className="w-full max-w-[1400px]">
            <div className="flex justify-between items-end mb-16 pr-4 sm:pr-8">
              <h2 className="font-display text-3xl md:text-4xl font-light text-charcoal m-0">You may also appreciate</h2>
              <div className="flex items-center gap-4">
                <button type="button" aria-label="Scroll left" onClick={() => scrollRow(-1)} className="text-charcoal hover:opacity-50 transition-opacity focus:outline-none"><FiChevronLeft strokeWidth={1} size={24} /></button>
                <button type="button" aria-label="Scroll right" onClick={() => scrollRow(1)} className="text-charcoal hover:opacity-50 transition-opacity focus:outline-none"><FiChevronRight strokeWidth={1} size={24} /></button>
              </div>
            </div>
            <div ref={rowRef} className="flex gap-6 overflow-x-auto hide-scrollbar pb-8 -mb-8 snap-x">
              {otherPieces.map((p) => (
                <div key={p.id} className="w-72 shrink-0 snap-start">
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  )
}

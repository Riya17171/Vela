import { FiMinus, FiPlus } from 'react-icons/fi'
import { Link, useNavigate } from 'react-router-dom'
import ProductImage from '../../components/common/ProductImage.jsx'

import OrderSummary from '../../components/checkout/OrderSummary.jsx'
import { EmptyState, ErrorState, LoadingState } from '../../components/common/StatusViews.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import { useConfig } from '../../context/ConfigContext.jsx'
import { formatPrice, variantLabel } from '../../utils/format.js'

const ISSUE_COPY = {
  unavailable: 'No longer available — please remove',
  out_of_stock: 'Sold out — please remove',
  insufficient_stock: 'Not enough stock for this quantity',
}

export default function Cart() {
  const navigate = useNavigate()
  const { config } = useConfig()
  const { items, summary, hasIssues, updateQty, remove, loading, pending, error, reload } = useCartContext()

  if (loading && items.length === 0) return <LoadingState label="Fetching bag..." className="min-h-[60vh]" />
  if (error && items.length === 0) return <ErrorState error={error} onRetry={reload} className="min-h-[60vh]" />
  if (items.length === 0) {
    return <EmptyState title="Your Bag is Empty" message="It appears you haven't selected any pieces yet." actionLabel="Explore Collection" actionTo="/products" className="min-h-[70vh]" />
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-8 py-16 md:py-24 min-h-screen">
      <h1 className="font-display text-4xl lg:text-5xl font-light text-charcoal leading-tight m-0 mb-16 tracking-tight">Shopping Bag</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-24">
        <ul className="lg:col-span-2 flex flex-col">
          {items.map((item) => {
            const product = item.product
            const link = product ? `/products/${product.slug}` : '/products'
            const maxQty = Math.min(config.maxCartItemQuantity, product?.availableQuantity ?? 0)
            return (
              <li className={`flex gap-4 sm:gap-6 py-8 border-b border-silk ${item.available ? '' : 'opacity-80'}`} key={item.id}>
                <Link to={link} className="w-24 md:w-32 aspect-[3/4] bg-ivory dark:bg-white shrink-0 border border-silk hover:border-charcoal transition-colors">
                  {product && <ProductImage src={product.image} alt={product.title} className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal" />}
                </Link>

                <div className="flex-1 flex flex-col justify-between gap-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <Link to={link} className="font-display text-xl lg:text-2xl font-light text-charcoal hover:opacity-70 transition-opacity">
                        {product?.title ?? 'Unavailable piece'}
                      </Link>
                      <div className="text-[10px] tracking-luxury uppercase text-warmgray mt-2">
                        {[product?.category?.name, variantLabel(item)].filter(Boolean).join(' — ')}
                      </div>
                      {item.issue && <p role="alert" className="text-[10px] tracking-luxury uppercase text-[#e53e3e] mt-2">{ISSUE_COPY[item.issue]}</p>}
                    </div>
                    <div className="font-sans text-sm text-charcoal font-medium text-right mt-1 whitespace-nowrap">
                      {formatPrice(item.lineTotal, product?.currency)}
                      {item.quantity > 1 && <div className="text-[10px] text-warmgray font-normal">{formatPrice(item.unitPrice, product?.currency)} each</div>}
                    </div>
                  </div>

                  <div className="flex justify-between items-end">
                    <div className="flex items-center gap-6 border border-silk px-4 py-2" role="group" aria-label={`Quantity for ${product?.title}`}>
                      <button type="button" aria-label="Decrease quantity" disabled={pending || item.quantity <= 1} onClick={() => updateQty(item.id, item.quantity - 1)} className="text-warmgray hover:text-charcoal focus:outline-none transition-colors disabled:opacity-30">
                        <FiMinus size={14} strokeWidth={1} />
                      </button>
                      <span className="font-sans text-sm text-charcoal w-4 text-center" aria-live="polite">{item.quantity}</span>
                      <button type="button" aria-label="Increase quantity" disabled={pending || !item.available || item.quantity >= maxQty} onClick={() => updateQty(item.id, item.quantity + 1)} className="text-warmgray hover:text-charcoal focus:outline-none transition-colors disabled:opacity-30">
                        <FiPlus size={14} strokeWidth={1} />
                      </button>
                    </div>
                    <button type="button" disabled={pending} className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal underline underline-offset-4 focus:outline-none transition-colors" onClick={() => remove(item.id)}>
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>

        <div className="lg:col-span-1">
          <OrderSummary summary={summary}>
            {hasIssues && <p role="alert" className="text-[10px] tracking-luxury uppercase text-[#e53e3e] mb-4">Resolve the highlighted pieces to continue.</p>}
            <button
              type="button"
              disabled={hasIssues || pending}
              className="w-full bg-obsidian text-cream text-xs tracking-luxury uppercase py-3.5 rounded-none font-medium hover:bg-charcoal transition-colors duration-300 flex items-center justify-center gap-2 focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal disabled:opacity-50"
              onClick={() => navigate('/checkout')}
            >
              Secure Checkout
            </button>
            <p className="text-[10px] tracking-luxury uppercase text-warmgray text-center mt-6">Payments processed by Razorpay</p>
          </OrderSummary>
        </div>
      </div>
    </div>
  )
}

import { Link, useNavigate } from 'react-router-dom'
import { FiMinus, FiPlus, FiArrowRight } from 'react-icons/fi'
import { useCartContext } from '../../context/CartContext.jsx'

export default function Cart() {
  const navigate = useNavigate()
  const { items, updateQty, remove, subtotal, loading } = useCartContext()

  const tax = subtotal * 0.08
  const total = subtotal + tax

  if (loading && items.length === 0) {
    return <div className="min-h-[60vh] flex items-center justify-center font-sans text-xs tracking-luxury uppercase text-warmgray">Fetching bag...</div>
  }

  if (items.length === 0) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-display text-4xl font-light text-charcoal mb-4">Your Bag is Empty</h2>
        <p className="font-sans text-sm text-charcoal font-light mb-8">It appears you haven't selected any pieces yet.</p>
        <Link to="/products" className="bg-obsidian text-cream text-xs tracking-luxury uppercase px-8 py-3.5 rounded-none font-medium hover:bg-charcoal transition-colors focus:outline-none">
          Explore Collection
        </Link>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-8 py-16 md:py-24 min-h-screen">
      <h1 className="font-display text-4xl lg:text-5xl font-light text-charcoal leading-tight m-0 mb-16 tracking-tight">Shopping Bag</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-16 lg:gap-24">

        {/* Bag Items Matrix */}
        <div className="lg:col-span-2 flex flex-col">
          {items.map(item => (
            <div className="flex gap-6 py-8 border-b border-silk first:border-top" key={item.product_id}>

              {/* Cover Image */}
              <Link to={`/products/${item.product_id}`} className="w-24 md:w-32 aspect-[3/4] bg-ivory dark:bg-white shrink-0 border border-silk hover:border-charcoal transition-colors">
                <img
                  src={item.products?.image_url}
                  alt={item.products?.title}
                  className="w-full h-full object-cover mix-blend-multiply dark:mix-blend-normal"
                />
              </Link>

              {/* Technical Details */}
              <div className="flex-1 flex flex-col justify-between">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <Link to={`/products/${item.product_id}`} className="font-display text-xl lg:text-2xl font-light text-charcoal hover:opacity-70 transition-opacity">
                      {item.products?.title || 'Archive Collection Piece'}
                    </Link>
                    <div className="text-[10px] tracking-luxury uppercase text-warmgray mt-2">
                      {item.products?.category || 'House'} — Size M — Obsidian
                    </div>
                  </div>
                  <div className="font-sans text-sm text-charcoal font-medium text-right mt-1">
                    ${(item.quantity * (item.products?.price || 120.00)).toFixed(2)}
                  </div>
                </div>

                <div className="flex justify-between items-end">
                  {/* Stepper Logic */}
                  <div className="flex items-center gap-6 border border-silk px-4 py-2">
                    <button
                      onClick={() => updateQty(item.product_id, item.quantity - 1)}
                      className="text-warmgray hover:text-charcoal focus:outline-none transition-colors"
                    >
                      <FiMinus size={14} strokeWidth={1} />
                    </button>
                    <span className="font-sans text-sm text-charcoal w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => updateQty(item.product_id, item.quantity + 1)}
                      className="text-warmgray hover:text-charcoal focus:outline-none transition-colors"
                    >
                      <FiPlus size={14} strokeWidth={1} />
                    </button>
                  </div>

                  {/* Destructive Path */}
                  <button
                    className="text-[10px] tracking-luxury uppercase text-warmgray hover:text-charcoal underline underline-offset-4 focus:outline-none transition-colors"
                    onClick={() => remove(item.product_id)}
                  >
                    Remove
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>

        {/* Global Costing Ledger */}
        <div className="lg:col-span-1">
          <div className="border border-silk p-8 bg-parchment/30">
            <h2 className="font-display text-2xl font-light text-charcoal mb-8 m-0">Order Summary</h2>

            <div className="flex flex-col gap-4 font-sans text-sm text-charcoal font-light mb-8">
              <div className="flex justify-between items-center">
                <span>Subtotal</span>
                <span>${subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-warmgray">
                <span>Shipping</span>
                <span>Complimentary</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Estimated Tax</span>
                <span>${tax.toFixed(2)}</span>
              </div>
            </div>

            <div className="border-t border-charcoal pt-6 flex justify-between items-end mb-8">
              <span className="font-sans text-sm text-charcoal">Total</span>
              <span className="font-display text-3xl font-light text-charcoal">${total.toFixed(2)}</span>
            </div>

            <button
              className="w-full bg-obsidian text-cream text-xs tracking-luxury uppercase py-3.5 rounded-none font-medium hover:bg-charcoal transition-colors duration-300 flex items-center justify-center gap-2 focus:outline-none"
              onClick={() => navigate('/checkout')}
            >
              Secure Checkout
            </button>
            <p className="text-[10px] tracking-luxury uppercase text-warmgray text-center mt-6">
              Secure Encrypted Transaction
            </p>
          </div>
        </div>

      </div>
    </div>
  )
}

import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { toast } from 'react-toastify'
import { useCartContext } from '../../context/CartContext.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { placeOrder } from '../../services/orders.js'

const schema = yup.object({
  fullName: yup.string().required('Full name is required'),
  email: yup.string().email('Valid email required').required('Email required'),
  address: yup.string().required('Address is required'),
  city: yup.string().required('City is required'),
  zipCode: yup.string().required('ZIP Code is required'),
  cardNumber: yup.string().matches(/^[0-9]{16}$/, 'Must be 16 digits').required('Card number required'),
  expiry: yup.string().matches(/^(0[1-9]|1[0-2])\/?([0-9]{2})$/, 'Format MM/YY').required('Expiry required'),
  cvv: yup.string().matches(/^[0-9]{3,4}$/, 'Valid CVV required').required('CVV required')
})

export default function Checkout() {
  const navigate = useNavigate()
  const { items, subtotal, reload } = useCartContext()
  const { user } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)

  const tax = subtotal * 0.08
  const total = subtotal + tax

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      fullName: user?.user_metadata?.full_name || '',
      email: user?.email || '',
    }
  })

  // Prevent accessing checkout with empty bag natively
  if (items.length === 0 && !orderComplete) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-display text-4xl font-light text-charcoal mb-4">Your Bag is Empty</h2>
        <button className="border border-charcoal text-charcoal bg-transparent text-xs tracking-luxury uppercase px-8 py-3.5 rounded-none font-medium hover:bg-parchment transition-colors" onClick={() => navigate('/products')}>
          Return to Boutique
        </button>
      </div>
    )
  }

  // Graceful success state mapped to luxury standard
  if (orderComplete) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-bg">
        <h1 className="font-display text-6xl md:text-8xl font-light text-charcoal mb-6 tracking-tight">Thank you.</h1>
        <p className="font-sans text-sm text-charcoal font-light mb-12 max-w-md">
          Your order has been placed. You will receive an email confirmation containing your receipt and tracking details momentarily.
        </p>
        <Link to="/orders" className="bg-obsidian text-cream text-xs tracking-luxury uppercase px-8 py-3.5 rounded-none font-medium hover:bg-charcoal transition-colors">
          View Order Status
        </Link>
      </div>
    )
  }

  const onSubmit = async (data) => {
    if (!user) return toast.error("Please authenticate to secure this order.")

    setSubmitting(true)
    try {
      const order = await placeOrder({
        userId: user.id,
        items,
        subtotal,
        tax,
        total,
        shippingDetails: { address: data.address, city: data.city, zipCode: data.zipCode }
      })

      if (order) {
        toast.success("Transaction securely approved.")
        await reload() // Flushes bag context
        setOrderComplete(true)
      } else {
        toast.error("Transaction declined. Please verify your details.")
      }
    } catch (err) {
      toast.error("An unexpected disruption occurred.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="w-full max-w-2xl mx-auto px-8 py-16 md:py-24 min-h-screen">

      {/* Editorial Breadcrumbs Matrix */}
      <div className="flex justify-center items-center gap-4 text-[10px] tracking-luxury uppercase text-warmgray mb-16 flex-wrap">
        <span className="text-charcoal border-b border-charcoal pb-[1px]">Bag</span>
        <span>→</span>
        <span className="text-charcoal border-b border-charcoal pb-[1px]">Details</span>
        <span>→</span>
        <span className="text-charcoal border-b border-charcoal pb-[1px]">Payment</span>
        <span>→</span>
        <span>Confirm</span>
      </div>

      <h1 className="font-display text-4xl font-light text-charcoal mb-12 text-center">Secure Checkout</h1>

      {/* Primary Gateway Form */}
      <form className="w-full space-y-16" onSubmit={handleSubmit(onSubmit)}>

        {/* Logistics Grouping */}
        <section className="space-y-8">
          <h2 className="text-[10px] tracking-luxury uppercase text-warmgray border-b border-silk pb-4">Shipping Destination</h2>

          <div className="space-y-8">
            <div className="flex flex-col gap-2 relative">
              <label className="text-[10px] tracking-luxury uppercase text-warmgray">Full Name</label>
              <input type="text" {...register('fullName')} className={`w-full bg-transparent border-b border-t-0 border-l-0 border-r-0 rounded-none py-2 text-sm text-charcoal font-sans outline-none focus:ring-0 transition-colors ${errors.fullName ? 'border-[#e53e3e]' : 'border-silk focus:border-charcoal'}`} />
              {errors.fullName && <span className="absolute -bottom-5 left-0 text-[10px] tracking-luxury uppercase text-[#e53e3e]">{errors.fullName.message}</span>}
            </div>

            <div className="flex flex-col gap-2 relative">
              <label className="text-[10px] tracking-luxury uppercase text-warmgray">Email Contact</label>
              <input type="email" {...register('email')} className={`w-full bg-transparent border-b border-t-0 border-l-0 border-r-0 rounded-none py-2 text-sm text-charcoal font-sans outline-none focus:ring-0 transition-colors ${errors.email ? 'border-[#e53e3e]' : 'border-silk focus:border-charcoal'}`} />
            </div>

            <div className="flex flex-col gap-2 relative">
              <label className="text-[10px] tracking-luxury uppercase text-warmgray">Primary Address</label>
              <input type="text" {...register('address')} className={`w-full bg-transparent border-b border-t-0 border-l-0 border-r-0 rounded-none py-2 text-sm text-charcoal font-sans outline-none focus:ring-0 transition-colors ${errors.address ? 'border-[#e53e3e]' : 'border-silk focus:border-charcoal'}`} />
            </div>

            <div className="flex flex-col md:flex-row gap-8 w-full">
              <div className="flex flex-col gap-2 flex-1 relative">
                <label className="text-[10px] tracking-luxury uppercase text-warmgray">City</label>
                <input type="text" {...register('city')} className={`w-full bg-transparent border-b border-t-0 border-l-0 border-r-0 rounded-none py-2 text-sm text-charcoal font-sans outline-none focus:ring-0 transition-colors ${errors.city ? 'border-[#e53e3e]' : 'border-silk focus:border-charcoal'}`} />
              </div>
              <div className="flex flex-col gap-2 w-full md:w-1/3 relative">
                <label className="text-[10px] tracking-luxury uppercase text-warmgray">Zip / Postal Code</label>
                <input type="text" {...register('zipCode')} className={`w-full bg-transparent border-b border-t-0 border-l-0 border-r-0 rounded-none py-2 text-sm text-charcoal font-sans outline-none focus:ring-0 transition-colors ${errors.zipCode ? 'border-[#e53e3e]' : 'border-silk focus:border-charcoal'}`} />
              </div>
            </div>
          </div>
        </section>

        {/* Security / Payment Grouping */}
        <section className="space-y-8">
          <h2 className="text-[10px] tracking-luxury uppercase text-warmgray border-b border-silk pb-4">Payment Credentials</h2>

          <div className="space-y-8">
            <div className="flex flex-col gap-2 relative">
              <label className="text-[10px] tracking-luxury uppercase text-warmgray">Card Number</label>
              <input type="text" placeholder="0000 0000 0000 0000" {...register('cardNumber')} className={`w-full bg-transparent border-b border-t-0 border-l-0 border-r-0 rounded-none py-2 text-sm text-charcoal font-sans outline-none focus:ring-0 transition-colors placeholder:text-warmgray/50 ${errors.cardNumber ? 'border-[#e53e3e]' : 'border-silk focus:border-charcoal'}`} />
              {errors.cardNumber && <span className="absolute -bottom-5 left-0 text-[10px] tracking-luxury uppercase text-[#e53e3e]">{errors.cardNumber.message}</span>}
            </div>

            <div className="flex flex-col md:flex-row gap-8 w-full">
              <div className="flex flex-col gap-2 flex-1 relative">
                <label className="text-[10px] tracking-luxury uppercase text-warmgray">Expiry (MM/YY)</label>
                <input type="text" placeholder="12/25" {...register('expiry')} className={`w-full bg-transparent border-b border-t-0 border-l-0 border-r-0 rounded-none py-2 text-sm text-charcoal font-sans outline-none focus:ring-0 transition-colors placeholder:text-warmgray/50 ${errors.expiry ? 'border-[#e53e3e]' : 'border-silk focus:border-charcoal'}`} />
              </div>
              <div className="flex flex-col gap-2 w-full md:w-1/3 relative">
                <label className="text-[10px] tracking-luxury uppercase text-warmgray">Security Code</label>
                <input type="password" placeholder="123" {...register('cvv')} className={`w-full bg-transparent border-b border-t-0 border-l-0 border-r-0 rounded-none py-2 text-sm text-charcoal font-sans outline-none focus:ring-0 transition-colors placeholder:text-warmgray/50 ${errors.cvv ? 'border-[#e53e3e]' : 'border-silk focus:border-charcoal'}`} />
              </div>
            </div>
          </div>
        </section>

        {/* Final Render Validation */}
        <div className="border-t border-charcoal pt-6 flex justify-between items-end pb-8 mt-12">
          <span className="font-sans text-sm text-charcoal">Total Amount Authorized</span>
          <span className="font-display text-3xl font-light text-charcoal">${total.toFixed(2)}</span>
        </div>

        <button type="submit" disabled={submitting} className="w-full bg-obsidian text-cream text-xs tracking-luxury uppercase py-4 rounded-none font-medium hover:bg-charcoal transition-colors focus:outline-none disabled:opacity-50 mt-8">
          {submitting ? 'Authenticating...' : 'Authorize & Place Order'}
        </button>
      </form>
    </div>
  )
}

import { yupResolver } from '@hookform/resolvers/yup'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { v4 as uuid } from 'uuid'
import * as yup from 'yup'

import AddressFields from '../../components/checkout/AddressFields.jsx'
import OrderSummary from '../../components/checkout/OrderSummary.jsx'
import { EmptyState, ErrorState, FormAlert, LoadingState } from '../../components/common/StatusViews.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import { useConfig } from '../../context/ConfigContext.jsx'
import { useAsync } from '../../hooks/useAsync.js'
import { useRazorpayCheckout } from '../../hooks/useRazorpayCheckout.js'
import { createOrder } from '../../services/orders.js'
import { listAddresses } from '../../services/users.js'
import { formatPrice, variantLabel } from '../../utils/format.js'
import { addressSchema, compactAddress } from '../../validators/address.js'

const NEW_ADDRESS = 'new'

const STAGE_COPY = {
  creating: 'Reserving your pieces...',
  preparing: 'Preparing secure payment...',
  awaiting_payment: 'Complete payment in the Razorpay window...',
  verifying: 'Verifying payment...',
}

export default function Checkout() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { config } = useConfig()
  const { items, summary, hasIssues, loading: cartLoading, reload: reloadCart } = useCartContext()
  const { data: addresses, loading: addressesLoading, error: addressesError, reload: reloadAddresses } = useAsync(listAddresses, [], { initialData: [] })
  const { pay, stage } = useRazorpayCheckout()

  const [choice, setChoice] = useState(null)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState(null)
  // One idempotency key per checkout attempt: double clicks or retries reuse the same order.
  const [attemptKey, setAttemptKey] = useState(() => uuid())

  const selectedAddressId = choice ?? addresses?.find((a) => a.isDefault)?.id ?? addresses?.[0]?.id ?? NEW_ADDRESS
  const usingNewAddress = selectedAddressId === NEW_ADDRESS

  const schema = useMemo(
    () => yup.object({
      contactEmail: yup.string().trim().required('Email is required').email('Enter a valid email'),
      saveAddress: yup.boolean(),
      ...(usingNewAddress ? { address: addressSchema } : {}),
    }),
    [usingNewAddress],
  )

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: yupResolver(schema),
    defaultValues: { contactEmail: user?.email ?? '', saveAddress: true, address: { fullName: user?.fullName ?? '', phone: user?.phone ?? '', country: 'IN' } },
  })

  const busy = creating || stage !== 'idle'
  const paymentsEnabled = config.payments?.enabled

  if (cartLoading || addressesLoading) return <LoadingState label="Preparing checkout..." className="min-h-[60vh]" />
  if (addressesError) return <ErrorState error={addressesError} onRetry={reloadAddresses} />
  if (items.length === 0 && !busy) {
    return <EmptyState title="Your Bag is Empty" actionLabel="Return to Boutique" actionTo="/products" className="min-h-[70vh]" />
  }

  const onSubmit = async (values) => {
    setError(null)
    setCreating(true)
    let order
    try {
      order = await createOrder({
        ...(usingNewAddress
          ? { shippingAddress: compactAddress(values.address), saveAddress: values.saveAddress }
          : { addressId: selectedAddressId }),
        contactEmail: values.contactEmail,
        idempotencyKey: attemptKey,
      })
    } catch (err) {
      setError(err.errors?.length ? `${err.message}: ${err.errors.map((e) => e.message).join('; ')}` : err.message)
      if (err.code === 'CART_ITEMS_UNAVAILABLE') reloadCart()
      setCreating(false)
      return
    }
    setCreating(false)

    try {
      const result = await pay(order.id)
      setAttemptKey(uuid())
      if (result.outcome === 'paid') {
        await reloadCart()
        navigate(`/orders/${order.id}?placed=1`, { replace: true })
      } else {
        toast.info('Payment was not completed. Your pieces are reserved for a short while — you can pay from your order page.')
        navigate(`/orders/${order.id}`)
      }
    } catch (err) {
      // The order exists and holds stock; send the client to it rather than showing a false success.
      setError(`${err.message} Your order ${order.orderNumber} is saved; you can retry payment from your orders.`)
      setAttemptKey(uuid())
    }
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-8 py-16 md:py-24 min-h-screen">
      <div className="flex justify-center items-center gap-4 text-[10px] tracking-luxury uppercase text-warmgray mb-16 flex-wrap" aria-label="Checkout progress">
        <Link to="/cart" className="text-charcoal border-b border-charcoal pb-[1px]">Bag</Link>
        <span>→</span>
        <span className="text-charcoal border-b border-charcoal pb-[1px]">Details</span>
        <span>→</span>
        <span className={stage !== 'idle' ? 'text-charcoal border-b border-charcoal pb-[1px]' : ''}>Payment</span>
        <span>→</span>
        <span>Confirm</span>
      </div>

      <h1 className="font-display text-4xl font-light text-charcoal mb-12 text-center">Secure Checkout</h1>

      {!paymentsEnabled && (
        <FormAlert message="Payments are not configured on this server yet. Ask the administrator to add Razorpay test keys; you cannot place an order until then." />
      )}
      <FormAlert message={error} />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-16">
        <form className="lg:col-span-3 w-full space-y-16" onSubmit={handleSubmit(onSubmit)} noValidate>
          <section className="space-y-8" aria-labelledby="shipping-heading">
            <h2 id="shipping-heading" className="text-[10px] tracking-luxury uppercase text-warmgray border-b border-silk pb-4">Shipping Destination</h2>

            {addresses?.length > 0 && (
              <div className="space-y-3" role="radiogroup" aria-label="Saved addresses">
                {addresses.map((address) => (
                  <label key={address.id} className={`flex gap-4 p-4 border cursor-pointer transition-colors ${selectedAddressId === address.id ? 'border-charcoal bg-parchment/40' : 'border-silk hover:border-warmgray'}`}>
                    <input type="radio" name="address" className="accent-charcoal mt-1" checked={selectedAddressId === address.id} onChange={() => setChoice(address.id)} />
                    <span className="text-sm text-charcoal font-light leading-relaxed">
                      <span className="font-medium">{address.fullName}</span>{address.isDefault && <span className="ml-2 text-[9px] tracking-luxury uppercase text-warmgray">Default</span>}<br />
                      {address.line1}{address.line2 ? `, ${address.line2}` : ''}, {address.city}, {address.state} {address.postalCode}<br />
                      <span className="text-warmgray">{address.phone}</span>
                    </span>
                  </label>
                ))}
                <label className={`flex gap-4 p-4 border cursor-pointer transition-colors ${usingNewAddress ? 'border-charcoal bg-parchment/40' : 'border-silk hover:border-warmgray'}`}>
                  <input type="radio" name="address" className="accent-charcoal" checked={usingNewAddress} onChange={() => setChoice(NEW_ADDRESS)} />
                  <span className="text-sm text-charcoal">Ship to a new address</span>
                </label>
              </div>
            )}

            {usingNewAddress && (
              <>
                <AddressFields register={register} errors={errors} prefix="address." />
                <label className="flex items-center gap-3 text-sm text-warmgray cursor-pointer">
                  <input type="checkbox" className="accent-charcoal" {...register('saveAddress')} /> Save this address to my account
                </label>
              </>
            )}
          </section>

          <section className="space-y-8" aria-labelledby="contact-heading">
            <h2 id="contact-heading" className="text-[10px] tracking-luxury uppercase text-warmgray border-b border-silk pb-4">Contact</h2>
            <div className="flex flex-col gap-2">
              <label htmlFor="contactEmail" className="text-[10px] tracking-luxury uppercase text-warmgray">Email for receipts</label>
              <input id="contactEmail" type="email" {...register('contactEmail')} className={`w-full bg-transparent border-b border-t-0 border-l-0 border-r-0 rounded-none py-2 text-sm text-charcoal font-sans outline-none focus:ring-0 transition-colors ${errors.contactEmail ? 'border-[#e53e3e]' : 'border-silk focus:border-charcoal'}`} />
              {errors.contactEmail && <span className="text-[10px] tracking-luxury uppercase text-[#e53e3e]">{errors.contactEmail.message}</span>}
            </div>
          </section>

          <section className="space-y-4" aria-labelledby="payment-heading">
            <h2 id="payment-heading" className="text-[10px] tracking-luxury uppercase text-warmgray border-b border-silk pb-4">Payment</h2>
            <p className="text-sm text-charcoal font-light leading-relaxed">
              You will complete payment in Razorpay's secure window (cards, UPI, net banking). Vela never sees or stores your card details.
              {config.payments?.testMode && ' This store runs in Razorpay test mode: use Razorpay test credentials only.'}
            </p>
          </section>

          <button type="submit" disabled={busy || hasIssues || !paymentsEnabled} className="w-full bg-obsidian text-cream text-xs tracking-luxury uppercase py-4 rounded-none font-medium hover:bg-charcoal transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-charcoal disabled:opacity-50">
            {creating ? STAGE_COPY.creating : stage !== 'idle' ? STAGE_COPY[stage] : `Pay ${formatPrice(summary.total, summary.currency)}`}
          </button>
          {hasIssues && <p className="text-[10px] tracking-luxury uppercase text-[#e53e3e]">Some pieces in your bag need attention. <Link to="/cart" className="underline">Review bag</Link></p>}
        </form>

        <aside className="lg:col-span-2">
          <OrderSummary summary={summary} title="Your Order">
            <ul className="space-y-4 border-t border-silk pt-6">
              {items.map((item) => (
                <li key={item.id} className="flex justify-between gap-4 text-sm text-charcoal font-light">
                  <span>
                    {item.product?.title} × {item.quantity}
                    <span className="block text-[10px] tracking-luxury uppercase text-warmgray">{variantLabel(item)}</span>
                  </span>
                  <span className="whitespace-nowrap">{formatPrice(item.lineTotal, summary.currency)}</span>
                </li>
              ))}
            </ul>
            <p className="text-[10px] tracking-luxury uppercase text-warmgray mt-6">Final prices are confirmed by our server when you pay.</p>
          </OrderSummary>
        </aside>
      </div>
    </div>
  )
}

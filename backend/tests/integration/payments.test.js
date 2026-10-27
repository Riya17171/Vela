import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Cart } from '../../src/models/Cart.js'
import { Order } from '../../src/models/Order.js'
import { Payment } from '../../src/models/Payment.js'
import { Product } from '../../src/models/Product.js'
import { WebhookEvent } from '../../src/models/WebhookEvent.js'
import { razorpayGateway } from '../../src/services/payment.service.js'
import { addToCart, api, bearer, createProduct, createUser, placeOrder, resetDatabase } from '../helpers/factories.js'
import { signedWebhook, stubRazorpay } from '../helpers/razorpayStub.js'

let user
let provider
let product

beforeEach(async () => {
  await resetDatabase()
  provider = stubRazorpay()
  user = await createUser()
  product = await createProduct({ price: 200_000, stock: 5 })
})

afterEach(() => vi.restoreAllMocks())

async function checkout(buyer = user, quantity = 1) {
  await addToCart(buyer, product._id, quantity)
  const order = (await placeOrder(buyer)).body.data.order
  const res = await api().post('/api/v1/payments/create-order').set(bearer(buyer)).send({ orderId: order.id })
  return { order, res, checkout: res.body.data?.checkout }
}

const verify = (buyer, body) => api().post('/api/v1/payments/verify').set(bearer(buyer)).send(body)

const postWebhook = (event, payload, { eventId = `evt_${Math.random().toString(36).slice(2)}`, signature } = {}) => {
  const signed = signedWebhook(event, payload)
  return api()
    .post('/api/v1/payments/webhook')
    .set('Content-Type', 'application/json')
    .set('X-Razorpay-Signature', signature ?? signed.signature)
    .set('X-Razorpay-Event-Id', eventId)
    .send(signed.raw.toString('utf8')) // a string is sent byte-for-byte; a Buffer would be re-serialised
}

describe('POST /api/v1/payments/create-order', () => {
  it('creates a Razorpay order for the server-calculated amount', async () => {
    const { order, res, checkout: data } = await checkout(user, 2)
    expect(res.status).toBe(201)
    expect(data).toMatchObject({ keyId: 'rzp_test_FakeKeyForTests', amount: order.total, currency: 'INR', orderId: order.id })
    expect(razorpayGateway.createOrder).toHaveBeenCalledWith(expect.objectContaining({ amount: 432_000, currency: 'INR', receipt: order.orderNumber }))
    expect(JSON.stringify(res.body)).not.toContain('fake_test_key_secret')
  })

  it('is idempotent per order', async () => {
    const { order, checkout: first } = await checkout()
    const again = await api().post('/api/v1/payments/create-order').set(bearer(user)).send({ orderId: order.id })
    expect(again.status).toBe(200)
    expect(again.body.data.checkout.razorpayOrderId).toBe(first.razorpayOrderId)
    expect(razorpayGateway.createOrder).toHaveBeenCalledTimes(1)
  })

  it('surfaces provider failures as 502 without marking anything paid', async () => {
    razorpayGateway.createOrder.mockRejectedValueOnce({ statusCode: 500, error: { description: 'Provider down' } })
    const { order, res } = await checkout()
    expect(res.status).toBe(502)
    const stored = await Order.findById(order.id)
    expect(stored).toMatchObject({ status: 'pending_payment', paymentStatus: 'pending' })
    expect(stored.razorpayOrderId).toBeUndefined()
  })

  it("refuses to create payments for someone else's order", async () => {
    const { order } = await checkout()
    const stranger = await createUser()
    const res = await api().post('/api/v1/payments/create-order').set(bearer(stranger)).send({ orderId: order.id })
    expect(res.status).toBe(404)
  })

  it('refuses expired orders', async () => {
    await addToCart(user, product._id, 1)
    const order = (await placeOrder(user)).body.data.order
    await Order.updateOne({ _id: order.id }, { $set: { reservationExpiresAt: new Date(Date.now() - 1000) } })
    const res = await api().post('/api/v1/payments/create-order').set(bearer(user)).send({ orderId: order.id })
    expect(res.status).toBe(409)
    expect(res.body.code).toBe('ORDER_EXPIRED')
    expect((await Product.findById(product._id)).stock).toBe(5)
  })
})

describe('POST /api/v1/payments/verify', () => {
  it('confirms the order after signature + provider verification and clears purchased items', async () => {
    const { order, checkout: data } = await checkout(user, 2)
    const { callback } = provider.pay(data.razorpayOrderId)

    const res = await verify(user, { orderId: order.id, ...callback })
    expect(res.status).toBe(200)
    expect(res.body.data.outcome).toBe('confirmed')
    expect(res.body.data.order).toMatchObject({ status: 'confirmed', paymentStatus: 'paid' })
    expect(res.body.data.payment).toMatchObject({ status: 'captured', providerPaymentId: callback.razorpayPaymentId })

    expect((await Cart.findOne({ user: user._id })).items).toHaveLength(0)
    expect((await Product.findById(product._id)).stock).toBe(3) // reserved once at order creation, not again
  })

  it('rejects an invalid signature and does not mark the order paid', async () => {
    const { order, checkout: data } = await checkout()
    const { callback } = provider.pay(data.razorpayOrderId)
    const res = await verify(user, { ...callback, orderId: order.id, razorpaySignature: 'f'.repeat(64) })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('INVALID_SIGNATURE')
    expect((await Order.findById(order.id)).paymentStatus).toBe('pending')
  })

  it('rejects a payment reference belonging to another order', async () => {
    const first = await checkout()
    const { callback } = provider.pay(first.checkout.razorpayOrderId)
    await Cart.deleteMany({})
    const second = await checkout()
    const res = await verify(user, { ...callback, orderId: second.order.id })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('ORDER_MISMATCH')
  })

  it('rejects an amount mismatch even with a valid signature', async () => {
    const { order, checkout: data } = await checkout()
    const { callback } = provider.pay(data.razorpayOrderId, { amount: 100 })
    const res = await verify(user, { orderId: order.id, ...callback })
    expect(res.status).toBe(400)
    expect(res.body.code).toBe('AMOUNT_MISMATCH')
    expect((await Order.findById(order.id)).paymentStatus).toBe('pending')
  })

  it('handles duplicate verification requests without double-processing', async () => {
    const { order, checkout: data } = await checkout()
    const { callback } = provider.pay(data.razorpayOrderId)
    const results = await Promise.all([verify(user, { orderId: order.id, ...callback }), verify(user, { orderId: order.id, ...callback })])
    expect(results.map((r) => r.status)).toEqual([200, 200])
    expect(results.map((r) => r.body.data.outcome).sort()).toEqual(['already_processed', 'confirmed'])
    expect((await Product.findById(product._id)).stock).toBe(4)
    const history = (await Order.findById(order.id)).statusHistory.filter((event) => event.status === 'confirmed')
    expect(history).toHaveLength(1)
  })

  it('records a failed payment as 402 and keeps the order payable', async () => {
    const { order, checkout: data } = await checkout()
    const { callback } = provider.pay(data.razorpayOrderId, { status: 'failed' })
    const res = await verify(user, { orderId: order.id, ...callback })
    expect(res.status).toBe(402)
    expect(await Order.findById(order.id)).toMatchObject({ status: 'pending_payment', paymentStatus: 'failed' })

    // The customer retries and succeeds on the same Razorpay order.
    const retry = provider.pay(data.razorpayOrderId)
    const ok = await verify(user, { orderId: order.id, ...retry.callback })
    expect(ok.body.data.order.paymentStatus).toBe('paid')
  })

  it("does not let another user verify someone else's payment", async () => {
    const { order, checkout: data } = await checkout()
    const { callback } = provider.pay(data.razorpayOrderId)
    const res = await verify(await createUser(), { orderId: order.id, ...callback })
    expect(res.status).toBe(404)
  })

  it('captures an authorised payment before confirming', async () => {
    const { order, checkout: data } = await checkout()
    const { callback } = provider.pay(data.razorpayOrderId, { status: 'authorized' })
    const res = await verify(user, { orderId: order.id, ...callback })
    expect(res.status).toBe(200)
    expect(razorpayGateway.capturePayment).toHaveBeenCalledOnce()
  })
})

describe('reconciliation after the checkout window closes', () => {
  it('discovers a payment that completed without a client callback', async () => {
    const { order, checkout: data } = await checkout()
    provider.pay(data.razorpayOrderId)
    const res = await api().post(`/api/v1/payments/${data.paymentId}/reconcile`).set(bearer(user))
    expect(res.status).toBe(200)
    expect(res.body.data.outcome).toBe('confirmed')
    expect((await Order.findById(order.id)).paymentStatus).toBe('paid')
  })

  it('does not treat a dismissed window with no attempts as a failure', async () => {
    const { order, checkout: data } = await checkout()
    const res = await api().post(`/api/v1/payments/${data.paymentId}/reconcile`).set(bearer(user))
    expect(res.body.data.outcome).toBe('no_attempts')
    expect((await Order.findById(order.id)).paymentStatus).toBe('pending')
    const status = await api().get(`/api/v1/payments/${data.paymentId}/status`).set(bearer(user))
    expect(status.body.data.payment.status).toBe('created')
  })
})

describe('POST /api/v1/payments/webhook', () => {
  it('rejects unsigned or tampered events', async () => {
    const res = await postWebhook('payment.captured', {}, { signature: 'a'.repeat(64) })
    expect(res.status).toBe(400)
    expect(await WebhookEvent.countDocuments()).toBe(0)
  })

  it('confirms an order from payment.captured and ignores duplicate deliveries', async () => {
    const { order, checkout: data } = await checkout(user, 2)
    const { payment } = provider.pay(data.razorpayOrderId)

    const first = await postWebhook('payment.captured', { payment: { entity: payment } }, { eventId: 'evt_dup_1' })
    const second = await postWebhook('payment.captured', { payment: { entity: payment } }, { eventId: 'evt_dup_1' })
    expect(first.status).toBe(200)
    expect(second.status).toBe(200)
    expect(second.body.message).toMatch(/Duplicate/)
    expect((await Order.findById(order.id)).paymentStatus).toBe('paid')
    expect((await Product.findById(product._id)).stock).toBe(3)
  })

  it('stays consistent when both verify and the webhook report the same payment', async () => {
    const { order, checkout: data } = await checkout()
    const { payment, callback } = provider.pay(data.razorpayOrderId)
    await Promise.all([verify(user, { orderId: order.id, ...callback }), postWebhook('order.paid', { payment: { entity: payment } })])
    const stored = await Order.findById(order.id)
    expect(stored.paymentStatus).toBe('paid')
    expect(stored.statusHistory.filter((event) => event.status === 'confirmed')).toHaveLength(1)
    expect((await Product.findById(product._id)).stock).toBe(4)
  })

  it('records payment.failed without failing the order permanently', async () => {
    const { order, checkout: data } = await checkout()
    const { payment } = provider.pay(data.razorpayOrderId, { status: 'failed' })
    await postWebhook('payment.failed', { payment: { entity: payment } })
    expect(await Order.findById(order.id)).toMatchObject({ status: 'pending_payment', paymentStatus: 'failed' })
  })

  it('revives an expired order when a delayed payment arrives and stock is still available', async () => {
    const { order, checkout: data } = await checkout()
    await Order.updateOne({ _id: order.id }, { $set: { reservationExpiresAt: new Date(Date.now() - 1000) } })
    await api().get(`/api/v1/orders/${order.id}`).set(bearer(user)) // triggers expiry
    expect((await Product.findById(product._id)).stock).toBe(5)

    const { payment } = provider.pay(data.razorpayOrderId)
    await postWebhook('payment.captured', { payment: { entity: payment } })
    expect(await Order.findById(order.id)).toMatchObject({ status: 'confirmed', paymentStatus: 'paid' })
    expect((await Product.findById(product._id)).stock).toBe(4)
  })

  it('flags a late payment for refund when the stock has gone', async () => {
    const { order, checkout: data } = await checkout()
    await Order.updateOne({ _id: order.id }, { $set: { reservationExpiresAt: new Date(Date.now() - 1000) } })
    await api().get(`/api/v1/orders/${order.id}`).set(bearer(user))
    await Product.updateOne({ _id: product._id }, { $set: { stock: 0 } })

    const { payment } = provider.pay(data.razorpayOrderId)
    await postWebhook('payment.captured', { payment: { entity: payment } })
    expect(await Order.findById(order.id)).toMatchObject({ status: 'expired', paymentStatus: 'refund_pending', needsAttention: true })
  })

  it('marks refunds processed from refund.processed', async () => {
    const { order, checkout: data } = await checkout()
    const { callback } = provider.pay(data.razorpayOrderId)
    await verify(user, { orderId: order.id, ...callback })
    await Order.updateOne({ _id: order.id }, { $set: { status: 'cancelled', paymentStatus: 'refund_pending' } })

    const refund = { id: 'rfnd_TEST123456', entity: 'refund', payment_id: callback.razorpayPaymentId, amount: order.total, status: 'processed' }
    await postWebhook('refund.processed', { refund: { entity: refund } })
    expect((await Order.findById(order.id)).paymentStatus).toBe('refunded')
    expect((await Payment.findOne({ providerPaymentId: callback.razorpayPaymentId })).status).toBe('refunded')
  })
})

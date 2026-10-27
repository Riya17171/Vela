import { beforeEach, describe, expect, it } from 'vitest'

import { Cart } from '../../src/models/Cart.js'
import { Order } from '../../src/models/Order.js'
import { Product } from '../../src/models/Product.js'
import { expireStaleOrders } from '../../src/services/order.service.js'
import { addToCart, api, bearer, createProduct, createUser, placeOrder, resetDatabase, validAddress } from '../helpers/factories.js'

let user

beforeEach(async () => {
  await resetDatabase()
  user = await createUser()
})

const stockOf = async (product) => (await Product.findById(product._id)).stock

describe('POST /api/v1/orders', () => {
  it('creates a pending order with server-side totals, snapshots and reserved stock', async () => {
    const coat = await createProduct({ title: 'Camel Coat', price: 250_000, stock: 5, sizes: ['M'] })
    await addToCart(user, coat._id, 2, { size: 'M' })

    const res = await placeOrder(user)
    expect(res.status).toBe(201)
    const { order } = res.body.data
    expect(order).toMatchObject({ status: 'pending_payment', paymentStatus: 'pending', subtotal: 500_000, tax: 40_000, total: 540_000, currency: 'INR' })
    expect(order.items[0]).toMatchObject({ title: 'Camel Coat', size: 'M', unitPrice: 250_000, quantity: 2, lineTotal: 500_000 })
    expect(order.orderNumber).toMatch(/^VL-\d{6}-[0-9A-F]{8}$/)
    expect(await stockOf(coat)).toBe(3)
    // The bag is only cleared once payment is verified.
    expect((await Cart.findOne({ user: user._id })).items).toHaveLength(1)
  })

  it('keeps purchase-time snapshots when the product changes later', async () => {
    const coat = await createProduct({ title: 'Camel Coat', price: 250_000 })
    await addToCart(user, coat._id, 1)
    const { order } = (await placeOrder(user)).body.data
    await Product.updateOne({ _id: coat._id }, { $set: { title: 'Renamed', price: 1 } })
    const fetched = await api().get(`/api/v1/orders/${order.id}`).set(bearer(user))
    expect(fetched.body.data.order.items[0]).toMatchObject({ title: 'Camel Coat', unitPrice: 250_000 })
  })

  it('rejects an empty bag and unavailable pieces', async () => {
    expect((await placeOrder(user)).status).toBe(400)

    const coat = await createProduct({ stock: 2 })
    await addToCart(user, coat._id, 2)
    await Product.updateOne({ _id: coat._id }, { $set: { stock: 1 } })
    const res = await placeOrder(user)
    expect(res.status).toBe(409)
    expect(res.body.code).toBe('CART_ITEMS_UNAVAILABLE')
    expect(await stockOf(coat)).toBe(1)
  })

  it('ignores nothing: client-supplied totals are rejected outright', async () => {
    await addToCart(user, (await createProduct())._id, 1)
    const res = await placeOrder(user, { total: 1 })
    expect(res.status).toBe(400)
  })

  it('returns the same order for a repeated idempotency key', async () => {
    const coat = await createProduct({ stock: 5 })
    await addToCart(user, coat._id, 1)
    const key = 'checkout-attempt-0001'
    const [a, b] = await Promise.all([placeOrder(user, { idempotencyKey: key }), placeOrder(user, { idempotencyKey: key })])
    expect([a.status, b.status].sort()).toEqual([200, 201])
    expect(a.body.data.order.id).toBe(b.body.data.order.id)
    expect(await Order.countDocuments()).toBe(1)
    expect(await stockOf(coat)).toBe(4)
  })

  it('lets only one of two concurrent buyers take the last unit', async () => {
    const lastOne = await createProduct({ stock: 1 })
    const rival = await createUser()
    await addToCart(user, lastOne._id, 1)
    await addToCart(rival, lastOne._id, 1)

    const results = await Promise.all([placeOrder(user), placeOrder(rival)])
    expect(results.map((r) => r.status).sort()).toEqual([201, 409])
    expect(await stockOf(lastOne)).toBe(0)
    expect(await Order.countDocuments()).toBe(1)
  })

  it('uses a saved address by id', async () => {
    const withAddress = await createUser({ addresses: [{ ...validAddress, isDefault: true }] })
    await addToCart(withAddress, (await createProduct())._id, 1)
    const res = await api().post('/api/v1/orders').set(bearer(withAddress)).send({ addressId: String(withAddress.addresses[0]._id) })
    expect(res.status).toBe(201)
    expect(res.body.data.order.shippingAddress.city).toBe('Bengaluru')
  })
})

describe('order access and cancellation', () => {
  async function pendingOrder(stock = 5) {
    const product = await createProduct({ stock })
    await addToCart(user, product._id, 2)
    return { product, order: (await placeOrder(user)).body.data.order }
  }

  it('lists only the caller’s orders and hides others behind 404', async () => {
    const { order } = await pendingOrder()
    const stranger = await createUser()
    expect((await api().get('/api/v1/orders/my-orders').set(bearer(stranger))).body.data.orders).toHaveLength(0)
    expect((await api().get(`/api/v1/orders/${order.id}`).set(bearer(stranger))).status).toBe(404)
    const mine = await api().get('/api/v1/orders/my-orders').set(bearer(user))
    expect(mine.body.data.orders).toHaveLength(1)
    expect(mine.body.meta.total).toBe(1)
  })

  it('validates order ids', async () => {
    expect((await api().get('/api/v1/orders/not-an-id').set(bearer(user))).status).toBe(400)
  })

  it('cancels a pending order once and returns its stock', async () => {
    const { product, order } = await pendingOrder()
    expect(await stockOf(product)).toBe(3)
    const first = await api().post(`/api/v1/orders/${order.id}/cancel`).set(bearer(user)).send({})
    expect(first.status).toBe(200)
    expect(first.body.data.order).toMatchObject({ status: 'cancelled', paymentStatus: 'void' })
    expect(await stockOf(product)).toBe(5)

    const again = await api().post(`/api/v1/orders/${order.id}/cancel`).set(bearer(user)).send({})
    expect(again.status).toBe(200)
    expect(again.body.message).toMatch(/already cancelled/)
    expect(await stockOf(product)).toBe(5)
  })

  it('refuses customer cancellation once the order has shipped', async () => {
    const { order } = await pendingOrder()
    await Order.updateOne({ _id: order.id }, { $set: { status: 'shipped', paymentStatus: 'paid' } })
    const res = await api().post(`/api/v1/orders/${order.id}/cancel`).set(bearer(user)).send({})
    expect(res.status).toBe(409)
  })

  it('expires unpaid orders after the reservation window and releases stock once', async () => {
    const { product, order } = await pendingOrder()
    await Order.updateOne({ _id: order.id }, { $set: { reservationExpiresAt: new Date(Date.now() - 1000) } })
    expect(await expireStaleOrders()).toBe(1)
    expect(await expireStaleOrders()).toBe(0)
    expect(await stockOf(product)).toBe(5)
    expect((await Order.findById(order.id)).status).toBe('expired')
  })
})

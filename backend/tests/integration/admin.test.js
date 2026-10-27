import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Order } from '../../src/models/Order.js'
import { Product } from '../../src/models/Product.js'
import { razorpayGateway } from '../../src/services/payment.service.js'
import { addToCart, api, bearer, createCategory, createProduct, createUser, placeOrder, resetDatabase } from '../helpers/factories.js'
import { stubRazorpay } from '../helpers/razorpayStub.js'

let admin
let customer

beforeEach(async () => {
  await resetDatabase()
  admin = await createUser({ role: 'admin', email: 'admin@example.com' })
  customer = await createUser({ email: 'customer@example.com' })
})

afterEach(() => vi.restoreAllMocks())

describe('admin authorization', () => {
  const routes = [
    ['get', '/api/v1/admin/dashboard'],
    ['get', '/api/v1/admin/users'],
    ['get', '/api/v1/admin/orders'],
    ['get', '/api/v1/admin/products'],
    ['post', '/api/v1/admin/products'],
    ['post', '/api/v1/admin/categories'],
  ]

  it.each(routes)('%s %s is 401 anonymously and 403 for customers', async (method, path) => {
    expect((await api()[method](path)).status).toBe(401)
    expect((await api()[method](path).set(bearer(customer)).send({})).status).toBe(403)
  })
})

describe('dashboard', () => {
  it('reports figures computed from the database', async () => {
    await createProduct({ stock: 2 })
    await createProduct({ stock: 0 })
    await createProduct({ stock: 50 })
    const res = await api().get('/api/v1/admin/dashboard').set(bearer(admin))
    expect(res.status).toBe(200)
    expect(res.body.data.stats).toMatchObject({ totalRevenue: 0, totalOrders: 0, totalCustomers: 1, lowStockCount: 1, outOfStockCount: 1 })
  })
})

describe('product management', () => {
  it('creates, updates, adjusts inventory and archives products', async () => {
    const category = await createCategory({ slug: 'coats' })
    const created = await api().post('/api/v1/admin/products').set(bearer(admin)).send({
      title: 'Double-Faced Wool Coat',
      description: 'Hand-finished double-faced wool.',
      price: 345_000,
      category: String(category._id),
      images: [{ url: 'https://images.example.com/coat.jpg' }],
      sku: 'vl-coat-99',
      stock: 4,
      sizes: ['S', 'M'],
    })
    expect(created.status).toBe(201)
    const product = created.body.data.product
    expect(product).toMatchObject({ slug: 'double-faced-wool-coat', sku: 'VL-COAT-99', stock: 4, ratingAverage: 0 })

    const updated = await api().patch(`/api/v1/admin/products/${product.id}`).set(bearer(admin)).send({ price: 360_000 })
    expect(updated.body.data.product).toMatchObject({ price: 360_000, sizes: ['S', 'M'] })

    const adjusted = await api().patch(`/api/v1/admin/products/${product.id}/inventory`).set(bearer(admin)).send({ adjustment: -3 })
    expect(adjusted.body.data.product.stock).toBe(1)
    const negative = await api().patch(`/api/v1/admin/products/${product.id}/inventory`).set(bearer(admin)).send({ adjustment: -2 })
    expect(negative.status).toBe(409)

    const archived = await api().delete(`/api/v1/admin/products/${product.id}`).set(bearer(admin))
    expect(archived.body.data.product.status).toBe('archived')
    expect((await api().get(`/api/v1/products/${product.id}`)).status).toBe(404)
  })

  it('rejects server-controlled fields, duplicate SKUs and unknown categories', async () => {
    const category = await createCategory()
    const body = {
      title: 'Coat', description: 'A long wool coat.', price: 1000, category: String(category._id),
      images: [{ url: 'https://images.example.com/c.jpg' }], sku: 'DUP-SKU-1', stock: 1,
    }
    expect((await api().post('/api/v1/admin/products').set(bearer(admin)).send({ ...body, ratingAverage: 5 })).status).toBe(400)
    expect((await api().post('/api/v1/admin/products').set(bearer(admin)).send(body)).status).toBe(201)
    expect((await api().post('/api/v1/admin/products').set(bearer(admin)).send({ ...body, title: 'Other' })).status).toBe(409)
    expect((await api().post('/api/v1/admin/products').set(bearer(admin)).send({ ...body, sku: 'NEW-SKU-2', category: '64b7f9e2a1b2c3d4e5f60718' })).status).toBe(400)
  })

  it('reports that image uploads are disabled without storage credentials', async () => {
    const res = await api().post('/api/v1/admin/uploads/images').set(bearer(admin)).attach('image', Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]), { filename: 'a.png', contentType: 'image/png' })
    expect(res.status).toBe(503)
    expect(res.body.code).toBe('UPLOADS_DISABLED')
  })
})

describe('category management', () => {
  it('creates, renames and protects categories still in use', async () => {
    const created = await api().post('/api/v1/admin/categories').set(bearer(admin)).send({ name: 'Outerwear' })
    expect(created.status).toBe(201)
    const { id, slug } = created.body.data.category
    expect(slug).toBe('outerwear')

    expect((await api().post('/api/v1/admin/categories').set(bearer(admin)).send({ name: 'outerwear' })).status).toBe(409)

    await createProduct({ category: id })
    expect((await api().delete(`/api/v1/admin/categories/${id}`).set(bearer(admin))).status).toBe(409)
    expect((await api().patch(`/api/v1/admin/categories/${id}`).set(bearer(admin)).send({ isActive: false })).body.data.category.isActive).toBe(false)
    expect((await api().get('/api/v1/categories')).body.data.categories).toHaveLength(0)
  })
})

describe('order management', () => {
  async function paidOrder() {
    const provider = stubRazorpay()
    const product = await createProduct({ stock: 3 })
    await addToCart(customer, product._id, 1)
    const order = (await placeOrder(customer)).body.data.order
    const checkout = (await api().post('/api/v1/payments/create-order').set(bearer(customer)).send({ orderId: order.id })).body.data.checkout
    const { callback } = provider.pay(checkout.razorpayOrderId)
    await api().post('/api/v1/payments/verify').set(bearer(customer)).send({ orderId: order.id, ...callback })
    return { order, product }
  }

  it('moves orders through valid transitions and rejects invalid ones', async () => {
    const { order } = await paidOrder()
    const auth = bearer(admin)
    const set = (status) => api().patch(`/api/v1/admin/orders/${order.id}/status`).set(auth).send({ status })

    expect((await set('confirmed')).status).toBe(400) // only payments confirm
    expect((await set('delivered')).status).toBe(409)
    expect((await set('processing')).body.data.order.status).toBe('processing')
    expect((await set('shipped')).body.data.order.status).toBe('shipped')
    expect((await set('cancelled')).status).toBe(409)
    expect((await set('delivered')).body.data.order.status).toBe('delivered')
  })

  it('cancels a paid order into refund_pending, restores stock, then refunds once', async () => {
    const { order, product } = await paidOrder()
    const cancelled = await api().patch(`/api/v1/admin/orders/${order.id}/status`).set(bearer(admin)).send({ status: 'cancelled', note: 'Customer request' })
    expect(cancelled.body.data.order).toMatchObject({ status: 'cancelled', paymentStatus: 'refund_pending' })
    expect((await Product.findById(product._id)).stock).toBe(3)

    const refund = await api().post(`/api/v1/admin/orders/${order.id}/refund`).set(bearer(admin)).send({})
    expect(refund.status).toBe(200)
    expect(refund.body.data.order.paymentStatus).toBe('refunded')
    expect((await api().post(`/api/v1/admin/orders/${order.id}/refund`).set(bearer(admin)).send({})).status).toBe(409)
  })

  it('keeps the order refund_pending when Razorpay rejects the refund', async () => {
    const { order } = await paidOrder()
    await api().patch(`/api/v1/admin/orders/${order.id}/status`).set(bearer(admin)).send({ status: 'cancelled' })
    razorpayGateway.refundPayment.mockRejectedValueOnce({ statusCode: 400, error: { code: 'BAD_REQUEST_ERROR', description: 'invalid request sent' } })

    const rejected = await api().post(`/api/v1/admin/orders/${order.id}/refund`).set(bearer(admin)).send({})
    expect(rejected.status).toBe(502)
    expect(rejected.body.code).toBe('REFUND_REJECTED')
    expect((await Order.findById(order.id)).paymentStatus).toBe('refund_pending')

    // The claim is released, so the admin can retry once the balance allows it.
    const retry = await api().post(`/api/v1/admin/orders/${order.id}/refund`).set(bearer(admin)).send({})
    expect(retry.body.data.order.paymentStatus).toBe('refunded')
  })

  it('lists and filters orders with customer details', async () => {
    await paidOrder()
    const res = await api().get('/api/v1/admin/orders?paymentStatus=paid').set(bearer(admin))
    expect(res.body.meta.total).toBe(1)
    expect(res.body.data.orders[0].customer.email).toBe('customer@example.com')
    expect(await Order.countDocuments()).toBe(1)
  })
})

describe('customer management', () => {
  it('lists customers without secrets and with order counts', async () => {
    const res = await api().get('/api/v1/admin/users?role=user').set(bearer(admin))
    expect(res.body.data.users).toHaveLength(1)
    expect(res.body.data.users[0]).toMatchObject({ email: 'customer@example.com', orderCount: 0 })
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|tokenVersion/)
  })

  it('suspends a customer and immediately rejects their token', async () => {
    const token = bearer(customer)
    const res = await api().patch(`/api/v1/admin/users/${customer._id}/status`).set(bearer(admin)).send({ status: 'suspended' })
    expect(res.status).toBe(200)
    expect((await api().get('/api/v1/users/me').set(token)).status).toBe(403)
    expect((await api().patch(`/api/v1/admin/users/${admin._id}/status`).set(bearer(admin)).send({ status: 'suspended' })).status).toBe(400)
  })
})

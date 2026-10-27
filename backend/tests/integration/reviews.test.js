import { beforeEach, describe, expect, it } from 'vitest'

import { Order } from '../../src/models/Order.js'
import { Product } from '../../src/models/Product.js'
import { api, bearer, createProduct, createUser, resetDatabase, validAddress } from '../helpers/factories.js'

let product
let alice
let bob

beforeEach(async () => {
  await resetDatabase()
  product = await createProduct()
  alice = await createUser({ fullName: 'Alice' })
  bob = await createUser({ fullName: 'Bob' })
})

const post = (user, body) => api().post(`/api/v1/products/${product._id}/reviews`).set(bearer(user)).send(body)

describe('reviews', () => {
  it('requires authentication to post and validates the rating', async () => {
    expect((await api().post(`/api/v1/products/${product._id}/reviews`).send({ rating: 5, comment: 'Lovely' })).status).toBe(401)
    expect((await post(alice, { rating: 6, comment: 'Lovely' })).status).toBe(400)
    expect((await post(alice, { rating: 4.5, comment: 'Lovely' })).status).toBe(400)
  })

  it('maintains server-calculated aggregates and breakdown', async () => {
    await post(alice, { rating: 5, comment: 'Exquisite drape.' })
    await post(bob, { rating: 2, comment: 'Runs small.' })
    const stored = await Product.findById(product._id)
    expect(stored).toMatchObject({ ratingAverage: 3.5, ratingCount: 2 })

    const res = await api().get(`/api/v1/products/${product._id}/reviews?sort=highest`)
    expect(res.body.data.summary).toEqual({ average: 3.5, count: 2, breakdown: { 1: 0, 2: 1, 3: 0, 4: 0, 5: 1 } })
    expect(res.body.data.reviews.map((r) => r.author.fullName)).toEqual(['Alice', 'Bob'])
  })

  it('prevents duplicate reviews by the same customer', async () => {
    await post(alice, { rating: 5, comment: 'Exquisite.' })
    expect((await post(alice, { rating: 1, comment: 'Changed my mind.' })).status).toBe(409)
  })

  it('lets only the author edit, and the author or an admin delete', async () => {
    const created = (await post(alice, { rating: 5, comment: 'Exquisite.' })).body.data.review
    expect((await api().patch(`/api/v1/reviews/${created.id}`).set(bearer(bob)).send({ rating: 1 })).status).toBe(403)
    expect((await api().patch(`/api/v1/reviews/${created.id}`).set(bearer(alice)).send({ rating: 4 })).body.data.review.rating).toBe(4)
    expect((await api().delete(`/api/v1/reviews/${created.id}`).set(bearer(bob))).status).toBe(403)

    const admin = await createUser({ role: 'admin' })
    expect((await api().delete(`/api/v1/reviews/${created.id}`).set(bearer(admin))).status).toBe(200)
    expect((await Product.findById(product._id)).ratingCount).toBe(0)
  })

  it('marks reviews from paying customers as verified purchases', async () => {
    await Order.create({
      orderNumber: 'VL-TEST-0001', user: alice._id, contactEmail: alice.email, shippingAddress: validAddress,
      items: [{ product: product._id, title: product.title, sku: product.sku, unitPrice: 1, quantity: 1, lineTotal: 1 }],
      subtotal: 1, taxRate: 0, tax: 0, shipping: 0, total: 1, status: 'delivered', paymentStatus: 'paid',
    })
    expect((await post(alice, { rating: 5, comment: 'Worth it.' })).body.data.review.verifiedPurchase).toBe(true)
    expect((await post(bob, { rating: 5, comment: 'Saw it in store.' })).body.data.review.verifiedPurchase).toBe(false)
  })
})

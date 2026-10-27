import { beforeEach, describe, expect, it } from 'vitest'

import { Product } from '../../src/models/Product.js'
import { addToCart, api, bearer, createProduct, createUser, resetDatabase } from '../helpers/factories.js'

let user

beforeEach(async () => {
  await resetDatabase()
  user = await createUser()
})

describe('cart', () => {
  it('requires authentication', async () => {
    expect((await api().get('/api/v1/cart')).status).toBe(401)
  })

  it('adds items, merges identical variants and prices from the database', async () => {
    const product = await createProduct({ price: 150_000, stock: 5 })
    await addToCart(user, product._id, 1)
    const res = await addToCart(user, product._id, 2)
    expect(res.status).toBe(200)
    const { cart } = res.body.data
    expect(cart.items).toHaveLength(1)
    expect(cart.items[0]).toMatchObject({ quantity: 3, unitPrice: 150_000, lineTotal: 450_000 })
    expect(cart.summary).toMatchObject({ subtotal: 450_000, tax: 36_000, total: 486_000 })
  })

  it('keeps different variants as separate lines but enforces shared stock', async () => {
    const product = await createProduct({ stock: 3, sizes: ['S', 'M'] })
    await addToCart(user, product._id, 2, { size: 'S' })
    const second = await addToCart(user, product._id, 1, { size: 'M' })
    expect(second.body.data.cart.items).toHaveLength(2)
    const tooMany = await addToCart(user, product._id, 1, { size: 'M' })
    expect(tooMany.status).toBe(409)
  })

  it('validates variant choices against the product', async () => {
    const product = await createProduct({ sizes: ['S'], colors: [{ name: 'Ivory', hex: '#EFECE5' }] })
    expect((await addToCart(user, product._id, 1)).status).toBe(400)
    expect((await addToCart(user, product._id, 1, { size: 'XL', color: 'Ivory' })).status).toBe(400)
    expect((await addToCart(user, product._id, 1, { size: 'S', color: 'Ivory' })).status).toBe(200)
  })

  it('rejects invalid quantities, inactive products and client prices', async () => {
    const product = await createProduct()
    const inactive = await createProduct({ status: 'inactive' })
    expect((await addToCart(user, product._id, 0)).status).toBe(400)
    expect((await addToCart(user, product._id, 1.5)).status).toBe(400)
    expect((await addToCart(user, product._id, 999)).status).toBe(400)
    expect((await addToCart(user, inactive._id, 1)).status).toBe(404)
    const withPrice = await api().post('/api/v1/cart/items').set(bearer(user)).send({ productId: String(product._id), quantity: 1, price: 1 })
    expect(withPrice.status).toBe(400)
  })

  it('updates and removes lines, scoped to the owner', async () => {
    const product = await createProduct()
    const added = await addToCart(user, product._id, 1)
    const itemId = added.body.data.cart.items[0].id

    const other = await createUser()
    expect((await api().patch(`/api/v1/cart/items/${itemId}`).set(bearer(other)).send({ quantity: 2 })).status).toBe(404)

    const updated = await api().patch(`/api/v1/cart/items/${itemId}`).set(bearer(user)).send({ quantity: 4 })
    expect(updated.body.data.cart.items[0].quantity).toBe(4)

    const removed = await api().delete(`/api/v1/cart/items/${itemId}`).set(bearer(user))
    expect(removed.body.data.cart.items).toHaveLength(0)
  })

  it('reflects price changes and flags pieces that became unavailable', async () => {
    const product = await createProduct({ price: 100_000, stock: 5 })
    const doomed = await createProduct({ stock: 5 })
    await addToCart(user, product._id, 2)
    await addToCart(user, doomed._id, 1)

    await Product.updateOne({ _id: product._id }, { $set: { price: 120_000, stock: 1 } })
    await Product.updateOne({ _id: doomed._id }, { $set: { status: 'archived' } })

    const { cart } = (await api().get('/api/v1/cart').set(bearer(user))).body.data
    const live = cart.items.find((item) => item.productId === String(product._id))
    const gone = cart.items.find((item) => item.productId === String(doomed._id))
    expect(live).toMatchObject({ unitPrice: 120_000, issue: 'insufficient_stock', available: false })
    expect(gone).toMatchObject({ issue: 'unavailable', available: false })
    expect(cart.hasIssues).toBe(true)
    expect(cart.summary.subtotal).toBe(0)
  })

  it('clears the bag', async () => {
    await addToCart(user, (await createProduct())._id, 1)
    const res = await api().delete('/api/v1/cart').set(bearer(user))
    expect(res.body.data.cart.items).toEqual([])
  })
})

describe('wishlist', () => {
  it('saves products once and removes them', async () => {
    const product = await createProduct()
    const auth = bearer(user)
    await api().post('/api/v1/wishlist/items').set(auth).send({ productId: String(product._id) })
    const twice = await api().post('/api/v1/wishlist/items').set(auth).send({ productId: String(product._id) })
    expect(twice.body.data.wishlist.count).toBe(1)

    const removed = await api().delete(`/api/v1/wishlist/items/${product._id}`).set(auth)
    expect(removed.body.data.wishlist.count).toBe(0)
  })

  it('404s for products that do not exist', async () => {
    const res = await api().post('/api/v1/wishlist/items').set(bearer(user)).send({ productId: '64b7f9e2a1b2c3d4e5f60718' })
    expect(res.status).toBe(404)
  })
})

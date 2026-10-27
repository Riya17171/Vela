import crypto from 'node:crypto'

import mongoose from 'mongoose'
import request from 'supertest'

import { createApp } from '../../src/app.js'
import { Category } from '../../src/models/Category.js'
import { Product } from '../../src/models/Product.js'
import { User } from '../../src/models/User.js'
import { signAccessToken } from '../../src/utils/generateToken.js'

export const app = createApp()
export const api = () => request(app)

export const PASSWORD = 'Sup3rSecret!'

export async function resetDatabase() {
  await Promise.all(Object.values(mongoose.connection.collections).map((collection) => collection.deleteMany({})))
}

export async function createUser(overrides = {}) {
  const user = new User({
    fullName: overrides.fullName ?? 'Test Client',
    email: overrides.email ?? `client-${crypto.randomBytes(4).toString('hex')}@example.com`,
    role: overrides.role ?? 'user',
    status: overrides.status ?? 'active',
    addresses: overrides.addresses ?? [],
  })
  await user.setPassword(overrides.password ?? PASSWORD)
  await user.save()
  return user
}

export function bearer(user) {
  return { Authorization: `Bearer ${signAccessToken(user)}` }
}

export async function createCategory(overrides = {}) {
  const slug = overrides.slug ?? `cat-${crypto.randomBytes(3).toString('hex')}`
  return Category.create({ name: overrides.name ?? `Category ${slug}`, slug, isActive: true, ...overrides })
}

export async function createProduct(overrides = {}) {
  const category = overrides.category ?? (await createCategory())._id
  const suffix = crypto.randomBytes(3).toString('hex')
  return Product.create({
    title: `Piece ${suffix}`,
    slug: `piece-${suffix}`,
    description: 'A quiet, considered piece for testing.',
    price: 100_000,
    currency: 'INR',
    images: [{ url: 'https://images.example.com/piece.jpg' }],
    sku: `TEST-${suffix.toUpperCase()}`,
    stock: 10,
    status: 'active',
    sizes: [],
    colors: [],
    ...overrides,
    category,
  })
}

export const validAddress = {
  fullName: 'Asha Rao',
  phone: '+91 98765 43210',
  line1: '12 Linen Lane',
  city: 'Bengaluru',
  state: 'Karnataka',
  postalCode: '560001',
  country: 'IN',
}

/** Puts items in the user's bag through the real API. */
export async function addToCart(user, productId, quantity = 1, variant = {}) {
  return api().post('/api/v1/cart/items').set(bearer(user)).send({ productId: String(productId), quantity, ...variant })
}

export async function placeOrder(user, body = {}) {
  return api()
    .post('/api/v1/orders')
    .set(bearer(user))
    .send({ shippingAddress: validAddress, ...body })
}

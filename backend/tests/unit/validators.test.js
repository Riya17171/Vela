import { describe, expect, it } from 'vitest'

import { loginBody, registerBody } from '../../src/validators/auth.validator.js'
import { createOrderBody } from '../../src/validators/order.validator.js'
import { createProductBody, productListQuery, updateProductBody } from '../../src/validators/product.validator.js'
import { updateProfileBody } from '../../src/validators/user.validator.js'

const address = { fullName: 'Asha Rao', phone: '+91 98765 43210', line1: '12 Linen Lane', city: 'Bengaluru', state: 'Karnataka', postalCode: '560001' }

describe('auth validators', () => {
  it('normalises email and enforces password strength', () => {
    const parsed = registerBody.parse({ fullName: 'Asha', email: '  Asha@Example.COM ', password: 'Strong123' })
    expect(parsed.email).toBe('asha@example.com')
    expect(registerBody.safeParse({ fullName: 'Asha', email: 'a@b.co', password: 'weakpass' }).success).toBe(false)
    expect(registerBody.safeParse({ fullName: 'Asha', email: 'a@b.co', password: 'Sh0rt' }).success).toBe(false)
  })

  it('rejects privilege fields at registration', () => {
    const result = registerBody.safeParse({ fullName: 'Asha', email: 'a@b.co', password: 'Strong123', role: 'admin' })
    expect(result.success).toBe(false)
  })

  it('does not leak password rules at login', () => {
    expect(loginBody.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true)
  })
})

describe('profile validator', () => {
  it('rejects attempts to change role, email or status', () => {
    for (const field of ['role', 'email', 'status', 'tokenVersion']) {
      expect(updateProfileBody.safeParse({ fullName: 'Asha', [field]: 'admin' }).success).toBe(false)
    }
  })
})

describe('order validator', () => {
  it('never accepts client-supplied money or status fields', () => {
    for (const field of ['total', 'subtotal', 'price', 'paymentStatus', 'status', 'items']) {
      expect(createOrderBody.safeParse({ shippingAddress: address, [field]: 1 }).success).toBe(false)
    }
  })

  it('requires exactly one of addressId or shippingAddress', () => {
    expect(createOrderBody.safeParse({}).success).toBe(false)
    expect(createOrderBody.safeParse({ shippingAddress: address }).success).toBe(true)
    expect(createOrderBody.safeParse({ shippingAddress: address, addressId: '64b7f9e2a1b2c3d4e5f60718' }).success).toBe(false)
  })
})

describe('product validators', () => {
  it('whitelists sort options and coerces numbers', () => {
    expect(productListQuery.parse({ sort: 'price_asc', page: '2', minPrice: '1000' })).toMatchObject({ sort: 'price_asc', page: 2, minPrice: 1000 })
    expect(productListQuery.safeParse({ sort: 'password' }).success).toBe(false)
    expect(productListQuery.safeParse({ minPrice: '500', maxPrice: '100' }).success).toBe(false)
  })

  it('rejects operator-shaped and unknown query keys', () => {
    expect(productListQuery.safeParse({ 'price[$gt]': '0' }).success).toBe(false)
  })

  it('does not accept server-controlled rating fields', () => {
    const base = {
      title: 'Coat', description: 'A long wool coat.', price: 10000, category: '64b7f9e2a1b2c3d4e5f60718',
      images: [{ url: 'https://images.example.com/c.jpg' }], sku: 'VL-COAT-1', stock: 3,
    }
    expect(createProductBody.safeParse(base).success).toBe(true)
    expect(createProductBody.safeParse({ ...base, ratingAverage: 5 }).success).toBe(false)
    expect(createProductBody.safeParse({ ...base, price: 10.5 }).success).toBe(false)
    expect(createProductBody.safeParse({ ...base, images: [{ url: 'http://insecure.example.com/c.jpg' }] }).success).toBe(false)
  })

  it('leaves omitted fields untouched on partial updates', () => {
    expect(updateProductBody.parse({ price: 5000 })).toEqual({ price: 5000 })
  })
})

import { beforeEach, describe, expect, it } from 'vitest'

import { User } from '../../src/models/User.js'
import { api, bearer, createProduct, createUser, resetDatabase, validAddress } from '../helpers/factories.js'

beforeEach(resetDatabase)

describe('profile', () => {
  it('reads and updates only safe fields', async () => {
    const user = await createUser()
    const res = await api().patch('/api/v1/users/me').set(bearer(user)).send({ fullName: 'Asha R.', phone: '+91 90000 00000' })
    expect(res.status).toBe(200)
    expect(res.body.data.user).toMatchObject({ fullName: 'Asha R.', phone: '+91 90000 00000' })
    expect(res.body.data.user.passwordHash).toBeUndefined()
  })

  it('refuses role escalation through the profile endpoint', async () => {
    const user = await createUser()
    const res = await api().patch('/api/v1/users/me').set(bearer(user)).send({ fullName: 'Mallory', role: 'admin' })
    expect(res.status).toBe(400)
    expect((await User.findById(user._id)).role).toBe('user')
  })
})

describe('addresses', () => {
  it('creates, defaults, updates and deletes addresses', async () => {
    const user = await createUser()
    const auth = bearer(user)

    const first = await api().post('/api/v1/users/me/addresses').set(auth).send(validAddress)
    expect(first.status).toBe(201)
    expect(first.body.data.addresses[0].isDefault).toBe(true)

    const second = await api().post('/api/v1/users/me/addresses').set(auth).send({ ...validAddress, line1: '99 Silk Street', isDefault: true })
    const [a, b] = second.body.data.addresses
    expect(a.isDefault).toBe(false)
    expect(b.isDefault).toBe(true)

    const updated = await api().patch(`/api/v1/users/me/addresses/${a.id}`).set(auth).send({ city: 'Mysuru' })
    expect(updated.body.data.addresses.find((x) => x.id === a.id)).toMatchObject({ city: 'Mysuru', country: 'IN' })

    const deleted = await api().delete(`/api/v1/users/me/addresses/${b.id}`).set(auth)
    expect(deleted.body.data.addresses).toHaveLength(1)
    expect(deleted.body.data.addresses[0].isDefault).toBe(true)
  })

  it("cannot touch another user's address", async () => {
    const owner = await createUser({ addresses: [validAddress] })
    const intruder = await createUser()
    const addressId = String(owner.addresses[0]._id)
    expect((await api().patch(`/api/v1/users/me/addresses/${addressId}`).set(bearer(intruder)).send({ city: 'Mysuru' })).status).toBe(404)
    expect((await api().delete(`/api/v1/users/me/addresses/${addressId}`).set(bearer(intruder))).status).toBe(404)
  })

  it('validates address fields', async () => {
    const user = await createUser()
    const res = await api().post('/api/v1/users/me/addresses').set(bearer(user)).send({ ...validAddress, postalCode: '!!' })
    expect(res.status).toBe(400)
    expect(res.body.errors[0].field).toBe('postalCode')
  })
})

describe('recently viewed', () => {
  it('records views without duplicates, newest first', async () => {
    const user = await createUser()
    const [p1, p2] = [await createProduct(), await createProduct()]
    for (const product of [p1, p2, p1]) {
      await api().post('/api/v1/users/me/recently-viewed').set(bearer(user)).send({ productId: String(product._id) })
    }
    const res = await api().get('/api/v1/users/me/recently-viewed').set(bearer(user))
    expect(res.body.data.items.map((item) => item.product.id)).toEqual([String(p1._id), String(p2._id)])
  })
})

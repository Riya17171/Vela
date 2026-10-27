import { beforeEach, describe, expect, it } from 'vitest'

import { api, bearer, createCategory, createProduct, createUser, resetDatabase } from '../helpers/factories.js'

let coats
let bags

beforeEach(async () => {
  await resetDatabase()
  coats = await createCategory({ slug: 'coats', name: 'Coats' })
  bags = await createCategory({ slug: 'bags', name: 'Bags' })
  await createProduct({ title: 'Camel Wool Coat', slug: 'camel-wool-coat', category: coats._id, price: 300_000, sizes: ['S', 'M'], colors: [{ name: 'Camel', hex: '#C19A6B' }], isFeatured: true })
  await createProduct({ title: 'Cashmere Overcoat', slug: 'cashmere-overcoat', category: coats._id, price: 500_000, sizes: ['M', 'L'], colors: [{ name: 'Obsidian', hex: '#1A1916' }] })
  await createProduct({ title: 'Obsidian Tote', slug: 'obsidian-tote', category: bags._id, price: 200_000, colors: [{ name: 'Obsidian', hex: '#1A1916' }] })
  await createProduct({ title: 'Hidden Draft Coat', slug: 'hidden-draft', category: coats._id, price: 100_000, status: 'inactive' })
  await createProduct({ title: 'Archived Clutch', slug: 'archived-clutch', category: bags._id, price: 90_000, status: 'archived' })
})

describe('GET /api/v1/products', () => {
  it('lists only active products with pagination metadata', async () => {
    const res = await api().get('/api/v1/products?page=1&limit=2')
    expect(res.status).toBe(200)
    expect(res.body.data.products).toHaveLength(2)
    expect(res.body.meta).toEqual({ page: 1, limit: 2, total: 3, totalPages: 2, hasNextPage: true })
    expect(res.body.data.products[0]).not.toHaveProperty('stock')
  })

  it('filters by category, price, size, colour, search and featured', async () => {
    const titles = async (query) => (await api().get(`/api/v1/products?${query}`)).body.data.products.map((p) => p.title).sort()
    expect(await titles('category=coats')).toEqual(['Camel Wool Coat', 'Cashmere Overcoat'])
    expect(await titles('minPrice=250000&maxPrice=400000')).toEqual(['Camel Wool Coat'])
    expect(await titles('size=L')).toEqual(['Cashmere Overcoat'])
    expect(await titles('colour=obsidian')).toEqual(['Cashmere Overcoat', 'Obsidian Tote'])
    expect(await titles('search=cash')).toEqual(['Cashmere Overcoat'])
    expect(await titles('featured=true')).toEqual(['Camel Wool Coat'])
    expect(await titles('category=does-not-exist')).toEqual([])
  })

  it('treats search input literally, not as a regular expression', async () => {
    const res = await api().get('/api/v1/products?search=.*')
    expect(res.status).toBe(200)
    expect(res.body.data.products).toHaveLength(0)
  })

  it('sorts by whitelisted keys only', async () => {
    const asc = await api().get('/api/v1/products?sort=price_asc')
    expect(asc.body.data.products.map((p) => p.price)).toEqual([200_000, 300_000, 500_000])
    expect((await api().get('/api/v1/products?sort=passwordHash')).status).toBe(400)
  })

  it('rejects invalid pagination and operator-shaped parameters', async () => {
    expect((await api().get('/api/v1/products?page=0')).status).toBe(400)
    expect((await api().get('/api/v1/products?limit=abc')).status).toBe(400)
    expect((await api().get('/api/v1/products?price[$gt]=0')).status).toBe(400)
  })

  it('returns an empty list, not an error, when nothing matches', async () => {
    const res = await api().get('/api/v1/products?search=nothing-like-this')
    expect(res.status).toBe(200)
    expect(res.body.meta.total).toBe(0)
    expect(res.body.meta.totalPages).toBe(0)
  })

  it('fetches a specific set of ids for comparison', async () => {
    const all = (await api().get('/api/v1/products')).body.data.products
    const ids = all.slice(0, 2).map((p) => p.id)
    const res = await api().get(`/api/v1/products?ids=${ids.join(',')}`)
    expect(res.body.data.products.map((p) => p.id).sort()).toEqual(ids.sort())
    expect((await api().get('/api/v1/products?ids=not-an-id')).status).toBe(400)
  })
})

describe('GET /api/v1/products/:idOrSlug', () => {
  it('finds products by id or slug', async () => {
    const bySlug = await api().get('/api/v1/products/camel-wool-coat')
    expect(bySlug.status).toBe(200)
    expect(bySlug.body.data.product).toMatchObject({ title: 'Camel Wool Coat', sizes: ['S', 'M'] })
    const byId = await api().get(`/api/v1/products/${bySlug.body.data.product.id}`)
    expect(byId.body.data.product.slug).toBe('camel-wool-coat')
  })

  it('404s for missing, inactive and archived products', async () => {
    expect((await api().get('/api/v1/products/64b7f9e2a1b2c3d4e5f60718')).status).toBe(404)
    expect((await api().get('/api/v1/products/hidden-draft')).status).toBe(404)
    expect((await api().get('/api/v1/products/archived-clutch')).status).toBe(404)
  })

  it('serves featured products', async () => {
    const res = await api().get('/api/v1/products/featured')
    expect(res.body.data.products.map((p) => p.title)).toEqual(['Camel Wool Coat'])
  })
})

describe('categories', () => {
  it('lists active categories with accurate counts of active products', async () => {
    const res = await api().get('/api/v1/categories')
    const counts = Object.fromEntries(res.body.data.categories.map((c) => [c.slug, c.productCount]))
    expect(counts).toEqual({ coats: 2, bags: 1 })
  })

  it('gets a category by slug or 404s', async () => {
    expect((await api().get('/api/v1/categories/coats')).body.data.category.name).toBe('Coats')
    expect((await api().get('/api/v1/categories/nope')).status).toBe(404)
  })
})

describe('recommendations', () => {
  it('suggests other pieces from categories the shopper browsed', async () => {
    const user = await createUser()
    const coat = (await api().get('/api/v1/products/camel-wool-coat')).body.data.product
    await api().post('/api/v1/users/me/recently-viewed').set(bearer(user)).send({ productId: coat.id })
    const res = await api().get('/api/v1/products/recommendations').set(bearer(user))
    expect(res.body.data.reason).toBe('based_on_activity')
    expect(res.body.data.products[0].title).toBe('Cashmere Overcoat')
    expect(res.body.data.products.map((p) => p.id)).not.toContain(coat.id)
  })

  it('falls back to top pieces for anonymous visitors', async () => {
    const res = await api().get('/api/v1/products/recommendations')
    expect(res.body.data.reason).toBe('top_rated')
    expect(res.body.data.products.length).toBe(3)
  })
})

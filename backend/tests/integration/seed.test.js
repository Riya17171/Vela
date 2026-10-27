import { beforeEach, describe, expect, it } from 'vitest'

import { Category } from '../../src/models/Category.js'
import { Product } from '../../src/models/Product.js'
import { User } from '../../src/models/User.js'
import { seedCatalog } from '../../src/scripts/seed.js'
import { resetDatabase } from '../helpers/factories.js'

beforeEach(resetDatabase)

describe('seed script', () => {
  it('is idempotent and preserves live stock on re-run', async () => {
    const first = await seedCatalog()
    expect(first).toMatchObject({ categories: 6, inserted: 37, updated: 0 })

    await Product.updateOne({ sku: 'VL-WRTW-01' }, { $set: { stock: 1 } })
    const second = await seedCatalog()
    expect(second).toMatchObject({ inserted: 0, updated: 37 })
    expect(await Product.countDocuments()).toBe(37)
    expect(await Category.countDocuments()).toBe(6)
    expect((await Product.findOne({ sku: 'VL-WRTW-01' })).stock).toBe(1)
  })

  it('creates no user accounts and stores integer paise prices', async () => {
    await seedCatalog()
    expect(await User.countDocuments()).toBe(0)
    const coat = await Product.findOne({ sku: 'VL-WRTW-01' })
    expect(coat.price).toBe(10_650_000)
    expect(coat.sizes).toEqual(['XS', 'S', 'M', 'L', 'XL'])
  })
})

/**
 * Seeds categories and the Vela catalogue. Safe to re-run: documents are
 * upserted by slug/SKU, descriptive fields are refreshed, but live stock and
 * review aggregates of existing products are left alone.
 *
 *   npm run seed            upsert catalogue
 *   npm run seed -- --reset wipe catalogue + carts/orders/payments first (development only)
 *
 * No user accounts are created here; see createAdmin.js.
 */
import { pathToFileURL } from 'node:url'

import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { env } from '../config/env.js'
import { Cart } from '../models/Cart.js'
import { Category } from '../models/Category.js'
import { Order } from '../models/Order.js'
import { Payment } from '../models/Payment.js'
import { Product } from '../models/Product.js'
import { RecentlyViewed } from '../models/RecentlyViewed.js'
import { Review } from '../models/Review.js'
import { WebhookEvent } from '../models/WebhookEvent.js'
import { Wishlist } from '../models/Wishlist.js'
import { slugify } from '../utils/strings.js'
import { categories, categoryVariants, productOverrides, products } from './data/catalog.js'

const ORIGIN_PATTERN = /\b(Italy|France|Japan|Spain|Portugal|Scotland|England|Grasse|India)\b/

export function buildProductDocument(entry, categoryId) {
  const variants = categoryVariants[entry.category]
  const override = productOverrides[entry.sku] ?? {}
  const origin = entry.description.match(ORIGIN_PATTERN)?.[1]
  const attributes = [
    ...(origin ? [{ name: 'Origin', value: origin === 'Grasse' ? 'Grasse, France' : origin }] : []),
    ...(variants.volume ? [{ name: 'Volume', value: variants.volume }] : []),
    { name: 'Care', value: variants.care },
  ]
  return {
    content: {
      title: entry.title,
      slug: slugify(entry.title),
      description: entry.description,
      price: entry.priceRupees * 100,
      currency: env.CURRENCY,
      category: categoryId,
      images: [{ url: entry.image, alt: entry.title }],
      sizes: override.sizes ?? variants.sizes,
      colors: override.colors ?? variants.colors,
      attributes,
      isFeatured: entry.isFeatured,
    },
    initial: { sku: entry.sku, stock: entry.stock, status: 'active', ratingAverage: 0, ratingCount: 0 },
  }
}

export async function seedCatalog() {
  const categoryIds = {}
  for (const category of categories) {
    const doc = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: { ...category, isActive: true } },
      { upsert: true, new: true, runValidators: true },
    )
    categoryIds[category.slug] = doc._id
  }

  let inserted = 0
  let updated = 0
  for (const entry of products) {
    const { content, initial } = buildProductDocument(entry, categoryIds[entry.category])
    const result = await Product.updateOne(
      { sku: entry.sku },
      { $set: content, $setOnInsert: initial },
      { upsert: true, runValidators: true },
    )
    if (result.upsertedCount) inserted += 1
    else updated += 1
  }
  return { categories: categories.length, inserted, updated }
}

async function resetDevelopmentData() {
  await Promise.all(
    [Order, Payment, Cart, Wishlist, Review, RecentlyViewed, WebhookEvent, Product, Category].map((model) => model.deleteMany({})),
  )
}

async function main() {
  const reset = process.argv.includes('--reset')
  if (env.isProduction && !process.argv.includes('--allow-production')) {
    throw new Error('Refusing to seed a production database. Re-run with --allow-production if you really mean it.')
  }
  if (reset && env.isProduction) throw new Error('--reset is never allowed in production')

  await connectDatabase()
  if (reset) {
    await resetDevelopmentData()
    console.log('Development catalogue, carts, orders and payments cleared (user accounts kept).')
  }
  const summary = await seedCatalog()
  console.log(`Seeded ${summary.categories} categories; products inserted: ${summary.inserted}, refreshed: ${summary.updated}.`)
  await Product.syncIndexes()
}

// Run only when executed directly (tests import seedCatalog without side effects).
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main()
    .catch((error) => {
      console.error(`Seed failed: ${error.message}`)
      process.exitCode = 1
    })
    .finally(() => disconnectDatabase().catch(() => {}))
}

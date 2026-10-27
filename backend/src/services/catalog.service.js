import mongoose from 'mongoose'

import { Category } from '../models/Category.js'
import { Product } from '../models/Product.js'
import { RecentlyViewed } from '../models/RecentlyViewed.js'
import { Wishlist } from '../models/Wishlist.js'
import { ApiError } from '../utils/ApiError.js'
import { isObjectId } from '../utils/objectId.js'
import { buildPageMeta, resolvePagination } from '../utils/pagination.js'
import { escapeRegex } from '../utils/strings.js'

// Whitelisted sort options; anything else is rejected by the validator.
export const PRODUCT_SORTS = {
  newest: { createdAt: -1, _id: -1 },
  price_asc: { price: 1, _id: 1 },
  price_desc: { price: -1, _id: -1 },
  rating: { ratingAverage: -1, ratingCount: -1, _id: -1 },
  title_asc: { title: 1, _id: 1 },
}

const CATEGORY_POPULATE = { path: 'category', select: 'name slug colorLabel sizeLabel isActive' }

async function resolveCategoryId(slug) {
  const category = await Category.findOne({ slug, isActive: true }, { _id: 1 })
  return category?._id ?? null
}

/** Builds a Mongo filter only from validated, typed values — never raw query objects. */
export async function buildProductFilter(query, { admin = false } = {}) {
  const filter = {}
  if (admin) {
    if (query.status) filter.status = query.status
    if (query.lowStock) filter.stock = { $lte: query.lowStockThreshold }
  } else {
    filter.status = 'active'
  }

  if (query.category) {
    const categoryId = await resolveCategoryId(query.category)
    if (!categoryId) return null
    filter.category = categoryId
  }
  if (query.featured !== undefined) filter.isFeatured = query.featured
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    filter.price = {}
    if (query.minPrice !== undefined) filter.price.$gte = query.minPrice
    if (query.maxPrice !== undefined) filter.price.$lte = query.maxPrice
  }
  if (query.size) filter.sizes = query.size
  if (query.colour) filter['colors.name'] = new RegExp(`^${escapeRegex(query.colour)}$`, 'i')
  if (query.inStock) filter.stock = { ...(filter.stock ?? {}), $gt: 0 }
  if (query.ids?.length) filter._id = { $in: query.ids.map((value) => new mongoose.Types.ObjectId(value)) }
  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i')
    filter.$or = [{ title: pattern }, { description: pattern }, { sku: pattern }]
  }
  return filter
}

export async function listProducts(query, options = {}) {
  const { page, limit, skip } = resolvePagination(query)
  const filter = await buildProductFilter(query, options)
  if (!filter) return { products: [], meta: buildPageMeta({ page, limit, total: 0 }) }

  const [products, total] = await Promise.all([
    Product.find(filter).sort(PRODUCT_SORTS[query.sort ?? 'newest']).skip(skip).limit(limit).populate(CATEGORY_POPULATE),
    Product.countDocuments(filter),
  ])
  return { products, meta: buildPageMeta({ page, limit, total }) }
}

export async function getPublicProduct(idOrSlug) {
  const filter = isObjectId(idOrSlug) ? { _id: idOrSlug } : { slug: String(idOrSlug).toLowerCase() }
  const product = await Product.findOne({ ...filter, status: 'active' }).populate(CATEGORY_POPULATE)
  if (!product) throw ApiError.notFound('Product not found')
  return product
}

export async function listCategoriesWithCounts({ includeInactive = false } = {}) {
  const categories = await Category.find(includeInactive ? {} : { isActive: true }).sort({ sortOrder: 1, name: 1 })
  const counts = await Product.aggregate([
    { $match: { status: includeInactive ? { $ne: 'archived' } : 'active' } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ])
  const countById = new Map(counts.map((row) => [String(row._id), row.count]))
  return categories.map((category) => ({ category, productCount: countById.get(String(category._id)) ?? 0 }))
}

export async function recordRecentlyViewed(userId, productId, maxEntries) {
  const exists = await Product.exists({ _id: productId, status: 'active' })
  if (!exists) throw ApiError.notFound('Product not found')

  await RecentlyViewed.updateOne(
    { user: userId, product: productId },
    { $set: { viewedAt: new Date() } },
    { upsert: true },
  )
  // Trim history to the newest `maxEntries` items.
  const overflow = await RecentlyViewed.find({ user: userId }, { _id: 1 }).sort({ viewedAt: -1 }).skip(maxEntries)
  if (overflow.length) await RecentlyViewed.deleteMany({ _id: { $in: overflow.map((doc) => doc._id) } })
}

export async function listRecentlyViewed(userId, limit) {
  const entries = await RecentlyViewed.find({ user: userId }).sort({ viewedAt: -1 }).limit(limit).populate({
    path: 'product',
    match: { status: 'active' },
    populate: CATEGORY_POPULATE,
  })
  return entries.filter((entry) => entry.product).map((entry) => ({ product: entry.product, viewedAt: entry.viewedAt }))
}

/**
 * Transparent, rule-based recommendations (no machine learning):
 *  1. collect categories from the shopper's recently viewed and wishlisted pieces,
 *  2. suggest other active, in-stock pieces from those categories,
 *     best rated first, excluding what they already viewed or saved,
 *  3. top up with the highest-rated pieces overall.
 */
export async function recommendProducts(userId, limit = 8) {
  const seenIds = new Set()
  const categoryIds = new Set()

  if (userId) {
    const [recent, wishlist] = await Promise.all([
      RecentlyViewed.find({ user: userId }).sort({ viewedAt: -1 }).limit(10).populate('product', 'category'),
      Wishlist.findOne({ user: userId }).populate('items.product', 'category'),
    ])
    for (const entry of recent) {
      if (!entry.product) continue
      seenIds.add(String(entry.product._id))
      categoryIds.add(String(entry.product.category))
    }
    for (const item of wishlist?.items ?? []) {
      if (!item.product) continue
      seenIds.add(String(item.product._id))
      categoryIds.add(String(item.product.category))
    }
  }

  const exclude = [...seenIds].map((value) => new mongoose.Types.ObjectId(value))
  const base = { status: 'active', stock: { $gt: 0 }, _id: { $nin: exclude } }
  const results = []
  let reason = 'top_rated'

  if (categoryIds.size) {
    const personal = await Product.find({ ...base, category: { $in: [...categoryIds] } })
      .sort(PRODUCT_SORTS.rating)
      .limit(limit)
      .populate(CATEGORY_POPULATE)
    results.push(...personal)
    if (personal.length) reason = 'based_on_activity'
  }

  if (results.length < limit) {
    const taken = results.map((product) => product._id)
    const fallback = await Product.find({ ...base, _id: { $nin: [...exclude, ...taken] } })
      .sort({ isFeatured: -1, ...PRODUCT_SORTS.rating })
      .limit(limit - results.length)
      .populate(CATEGORY_POPULATE)
    results.push(...fallback)
  }

  return { products: results, reason }
}

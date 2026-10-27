import mongoose from 'mongoose'

import { businessRules } from '../config/businessRules.js'
import { Cart } from '../models/Cart.js'
import { Product } from '../models/Product.js'
import { ApiError } from '../utils/ApiError.js'
import { serializeProduct } from '../utils/serializers.js'
import { calculateTotals } from './pricing.service.js'

const PRODUCT_FIELDS = 'title slug price currency images sku sizes colors stock status category isFeatured ratingAverage ratingCount createdAt'

function sameVariant(item, { productId, size, color }) {
  return String(item.product) === String(productId) && (item.size ?? null) === (size ?? null) && (item.color ?? null) === (color ?? null)
}

/** Validates a variant choice against what the product actually offers. */
export function validateVariant(product, { size, color }) {
  const errors = []
  if (product.sizes?.length) {
    if (!size) errors.push({ field: 'size', message: 'Select a size' })
    else if (!product.sizes.includes(size)) errors.push({ field: 'size', message: `Size "${size}" is not offered` })
  } else if (size) {
    errors.push({ field: 'size', message: 'This product has no size options' })
  }
  if (product.colors?.length) {
    if (!color) errors.push({ field: 'color', message: 'Select a colour' })
    else if (!product.colors.some((c) => c.name === color)) errors.push({ field: 'color', message: `Colour "${color}" is not offered` })
  } else if (color) {
    errors.push({ field: 'color', message: 'This product has no colour options' })
  }
  if (errors.length) throw ApiError.badRequest('Invalid product options', { errors })
}

/**
 * Joins cart lines with live product data and flags every line that can no
 * longer be bought. Only purchasable lines count towards the summary.
 */
export async function resolveCartLines(cart) {
  const productIds = [...new Set(cart.items.map((item) => String(item.product)))]
  const products = await Product.find({ _id: { $in: productIds } }, PRODUCT_FIELDS).populate('category', 'name slug colorLabel sizeLabel isActive')
  const byId = new Map(products.map((product) => [String(product._id), product]))

  // Quantity requested per product across all variants (they share stock).
  const requestedPerProduct = new Map()
  for (const item of cart.items) {
    const key = String(item.product)
    requestedPerProduct.set(key, (requestedPerProduct.get(key) ?? 0) + item.quantity)
  }

  return cart.items.map((item) => {
    const product = byId.get(String(item.product))
    let issue = null
    if (!product || product.status !== 'active') issue = 'unavailable'
    else if (product.stock <= 0) issue = 'out_of_stock'
    else if (requestedPerProduct.get(String(item.product)) > product.stock) issue = 'insufficient_stock'

    return {
      itemId: String(item._id),
      productId: String(item.product),
      product,
      size: item.size ?? null,
      color: item.color ?? null,
      quantity: item.quantity,
      unitPrice: product?.price ?? 0,
      title: product?.title ?? 'Unavailable piece',
      issue,
    }
  })
}

export function serializeCartView(lines) {
  const purchasable = lines.filter((line) => !line.issue)
  return {
    items: lines.map((line) => ({
      id: line.itemId,
      productId: line.productId,
      product: line.product ? serializeProduct(line.product) : null,
      size: line.size,
      color: line.color,
      quantity: line.quantity,
      unitPrice: line.unitPrice,
      lineTotal: line.unitPrice * line.quantity,
      available: !line.issue,
      issue: line.issue,
    })),
    itemCount: lines.reduce((sum, line) => sum + line.quantity, 0),
    hasIssues: lines.some((line) => line.issue),
    summary: calculateTotals(purchasable.map(({ unitPrice, quantity }) => ({ unitPrice, quantity }))),
  }
}

export async function getOrCreateCart(userId) {
  return Cart.findOneAndUpdate(
    { user: userId },
    { $setOnInsert: { user: userId, items: [] } },
    { upsert: true, new: true },
  )
}

export async function getCartView(userId) {
  const cart = await getOrCreateCart(userId)
  return serializeCartView(await resolveCartLines(cart))
}

/** Retries once on a concurrent modification of the same cart (double clicks). */
async function mutateCart(userId, mutation) {
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const cart = await getOrCreateCart(userId)
    await mutation(cart)
    try {
      await cart.save()
      return cart
    } catch (error) {
      if (error instanceof mongoose.Error.VersionError && attempt < 2) continue
      throw error
    }
  }
  throw ApiError.conflict('Your bag was updated elsewhere. Please retry.')
}

function assertQuantityAllowed(product, totalForProduct) {
  const max = businessRules.maxCartItemQuantity
  if (totalForProduct > max) {
    throw ApiError.unprocessable(`You can reserve at most ${max} of this piece`, { code: 'QUANTITY_LIMIT' })
  }
  if (totalForProduct > product.stock) {
    throw ApiError.conflict(
      product.stock > 0 ? `Only ${product.stock} left in stock` : 'This piece is out of stock',
      { code: 'INSUFFICIENT_STOCK', details: { available: product.stock } },
    )
  }
}

async function loadPurchasableProduct(productId) {
  const product = await Product.findById(productId, PRODUCT_FIELDS)
  if (!product || product.status !== 'active') throw ApiError.notFound('Product not found or no longer available')
  return product
}

export async function addItem(userId, { productId, quantity, size = null, color = null }) {
  const product = await loadPurchasableProduct(productId)
  validateVariant(product, { size, color })

  await mutateCart(userId, (cart) => {
    const otherVariantsQty = cart.items
      .filter((item) => String(item.product) === productId && !sameVariant(item, { productId, size, color }))
      .reduce((sum, item) => sum + item.quantity, 0)
    const existing = cart.items.find((item) => sameVariant(item, { productId, size, color }))
    const nextQuantity = (existing?.quantity ?? 0) + quantity
    assertQuantityAllowed(product, otherVariantsQty + nextQuantity)
    if (existing) existing.quantity = nextQuantity
    else cart.items.push({ product: productId, size, color, quantity })
  })
  return getCartView(userId)
}

export async function updateItemQuantity(userId, itemId, quantity) {
  await mutateCart(userId, async (cart) => {
    const item = cart.items.id(itemId)
    if (!item) throw ApiError.notFound('Bag item not found')
    const product = await loadPurchasableProduct(String(item.product))
    const otherVariantsQty = cart.items
      .filter((other) => String(other.product) === String(item.product) && String(other._id) !== itemId)
      .reduce((sum, other) => sum + other.quantity, 0)
    assertQuantityAllowed(product, otherVariantsQty + quantity)
    item.quantity = quantity
  })
  return getCartView(userId)
}

export async function removeItem(userId, itemId) {
  await mutateCart(userId, (cart) => {
    const item = cart.items.id(itemId)
    if (!item) throw ApiError.notFound('Bag item not found')
    item.deleteOne()
  })
  return getCartView(userId)
}

export async function clearCart(userId) {
  await Cart.updateOne({ user: userId }, { $set: { items: [] } })
  return getCartView(userId)
}

/**
 * After a verified payment, remove exactly what was purchased. Items added to
 * the bag after checkout started are kept.
 */
export async function removePurchasedItems(userId, orderItems) {
  await mutateCart(userId, (cart) => {
    for (const purchased of orderItems) {
      const item = cart.items.find((candidate) =>
        sameVariant(candidate, { productId: purchased.product, size: purchased.size, color: purchased.color }),
      )
      if (!item) continue
      if (item.quantity > purchased.quantity) item.quantity -= purchased.quantity
      else item.deleteOne()
    }
  })
}

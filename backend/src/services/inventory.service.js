import { Product } from '../models/Product.js'
import { ApiError } from '../utils/ApiError.js'

/** Sum quantities per product: two sizes of one product share one stock counter. */
export function groupQuantitiesByProduct(lines) {
  const grouped = new Map()
  for (const line of lines) {
    const key = String(line.productId)
    const current = grouped.get(key) ?? { productId: key, quantity: 0, title: line.title }
    current.quantity += line.quantity
    grouped.set(key, current)
  }
  return [...grouped.values()]
}

/**
 * Atomically reserves stock. Each decrement only succeeds while
 * `stock >= quantity`, so two buyers racing for the last unit cannot both
 * win. Without a transaction session, already-applied decrements are
 * compensated before the error is thrown.
 */
export async function reserveStock(lines, session = null) {
  const applied = []
  try {
    for (const line of groupQuantitiesByProduct(lines)) {
      const updated = await Product.findOneAndUpdate(
        { _id: line.productId, status: 'active', stock: { $gte: line.quantity } },
        { $inc: { stock: -line.quantity } },
        { new: true, session, projection: { _id: 1, stock: 1 } },
      )
      if (!updated) {
        const current = await Product.findById(line.productId, { stock: 1, status: 1, title: 1 }).session(session)
        throw ApiError.conflict(`"${line.title ?? current?.title ?? 'An item'}" no longer has enough stock`, {
          code: 'INSUFFICIENT_STOCK',
          details: {
            productId: line.productId,
            requested: line.quantity,
            available: current?.status === 'active' ? current.stock : 0,
          },
        })
      }
      applied.push(line)
    }
  } catch (error) {
    if (!session && applied.length) await releaseStock(applied)
    throw error
  }
}

export async function releaseStock(lines, session = null) {
  for (const line of groupQuantitiesByProduct(lines)) {
    await Product.updateOne({ _id: line.productId }, { $inc: { stock: line.quantity } }, { session })
  }
}

/** Admin stock adjustment that can never drive stock negative. */
export async function adjustStock(productId, { stock, adjustment }) {
  if (stock !== undefined) {
    return Product.findByIdAndUpdate(productId, { $set: { stock } }, { new: true, runValidators: true })
  }
  const filter = adjustment < 0 ? { _id: productId, stock: { $gte: -adjustment } } : { _id: productId }
  const updated = await Product.findOneAndUpdate(filter, { $inc: { stock: adjustment } }, { new: true })
  if (!updated) {
    const exists = await Product.exists({ _id: productId })
    if (!exists) throw ApiError.notFound('Product not found')
    throw ApiError.conflict('Adjustment would make stock negative', { code: 'NEGATIVE_STOCK' })
  }
  return updated
}

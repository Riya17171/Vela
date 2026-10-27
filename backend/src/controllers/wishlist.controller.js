import { Product } from '../models/Product.js'
import { Wishlist } from '../models/Wishlist.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { serializeProduct } from '../utils/serializers.js'

async function wishlistView(userId) {
  const wishlist = await Wishlist.findOne({ user: userId }).populate({
    path: 'items.product',
    populate: { path: 'category', select: 'name slug colorLabel sizeLabel isActive' },
  })
  const items = (wishlist?.items ?? [])
    .filter((item) => item.product && item.product.status !== 'archived')
    .sort((a, b) => b.addedAt - a.addedAt)
    .map((item) => ({ productId: String(item.product._id), addedAt: item.addedAt, product: serializeProduct(item.product) }))
  return { items, count: items.length }
}

export async function getWishlist(req, res) {
  sendSuccess(res, { message: 'Wishlist retrieved', data: { wishlist: await wishlistView(req.user.id) } })
}

export async function addItem(req, res) {
  const { productId } = req.validated.body
  const exists = await Product.exists({ _id: productId, status: 'active' })
  if (!exists) throw ApiError.notFound('Product not found')

  try {
    // Only pushes when the product is not already saved; the unique user index makes this race-safe.
    await Wishlist.updateOne(
      { user: req.user.id, 'items.product': { $ne: productId } },
      { $push: { items: { product: productId, addedAt: new Date() } } },
      { upsert: true },
    )
  } catch (error) {
    if (error?.code !== 11000) throw error
  }
  sendSuccess(res, { message: 'Saved to wishlist', data: { wishlist: await wishlistView(req.user.id) } })
}

export async function removeItem(req, res) {
  await Wishlist.updateOne({ user: req.user.id }, { $pull: { items: { product: req.validated.params.productId } } })
  sendSuccess(res, { message: 'Removed from wishlist', data: { wishlist: await wishlistView(req.user.id) } })
}

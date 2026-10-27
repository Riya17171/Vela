import mongoose from 'mongoose'

import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { Review } from '../models/Review.js'
import { ApiError } from '../utils/ApiError.js'
import { buildPageMeta, resolvePagination } from '../utils/pagination.js'

const REVIEW_SORTS = {
  newest: { createdAt: -1 },
  highest: { rating: -1, createdAt: -1 },
  lowest: { rating: 1, createdAt: -1 },
}

/** Recomputes the stored average/count from the reviews themselves. */
export async function refreshProductRating(productId) {
  const [stats] = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: null, average: { $avg: '$rating' }, count: { $sum: 1 } } },
  ])
  await Product.updateOne(
    { _id: productId },
    { $set: { ratingAverage: stats ? Math.round(stats.average * 10) / 10 : 0, ratingCount: stats?.count ?? 0 } },
  )
}

export async function getRatingSummary(productId) {
  const rows = await Review.aggregate([
    { $match: { product: new mongoose.Types.ObjectId(String(productId)) } },
    { $group: { _id: '$rating', count: { $sum: 1 } } },
  ])
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
  let total = 0
  let sum = 0
  for (const row of rows) {
    breakdown[row._id] = row.count
    total += row.count
    sum += row._id * row.count
  }
  return { average: total ? Math.round((sum / total) * 10) / 10 : 0, count: total, breakdown }
}

export async function listProductReviews(productId, query) {
  const exists = await Product.exists({ _id: productId, status: 'active' })
  if (!exists) throw ApiError.notFound('Product not found')

  const { page, limit, skip } = resolvePagination(query)
  const [reviews, total, summary] = await Promise.all([
    Review.find({ product: productId }).sort(REVIEW_SORTS[query.sort ?? 'newest']).skip(skip).limit(limit).populate('user', 'fullName'),
    Review.countDocuments({ product: productId }),
    getRatingSummary(productId),
  ])
  return { reviews, summary, meta: buildPageMeta({ page, limit, total }) }
}

async function hasPurchased(userId, productId) {
  return Boolean(
    await Order.exists({
      user: userId,
      paymentStatus: 'paid',
      status: { $in: ['confirmed', 'processing', 'shipped', 'delivered'] },
      'items.product': productId,
    }),
  )
}

export async function createReview(userId, productId, { rating, title, comment }) {
  const exists = await Product.exists({ _id: productId, status: 'active' })
  if (!exists) throw ApiError.notFound('Product not found')

  let review
  try {
    review = await Review.create({
      product: productId,
      user: userId,
      rating,
      title,
      comment,
      verifiedPurchase: await hasPurchased(userId, productId),
    })
  } catch (error) {
    if (error?.code === 11000) throw ApiError.conflict('You have already reviewed this piece', { code: 'DUPLICATE_REVIEW' })
    throw error
  }
  await refreshProductRating(productId)
  return review.populate('user', 'fullName')
}

export async function updateReview(reviewId, userId, changes) {
  const review = await Review.findById(reviewId)
  if (!review) throw ApiError.notFound('Review not found')
  if (String(review.user) !== String(userId)) throw ApiError.forbidden('You can only edit your own review')
  Object.assign(review, changes)
  await review.save()
  await refreshProductRating(review.product)
  return review.populate('user', 'fullName')
}

export async function deleteReview(reviewId, requester) {
  const review = await Review.findById(reviewId)
  if (!review) throw ApiError.notFound('Review not found')
  if (requester.role !== 'admin' && String(review.user) !== String(requester.id)) {
    throw ApiError.forbidden('You can only delete your own review')
  }
  await review.deleteOne()
  await refreshProductRating(review.product)
}

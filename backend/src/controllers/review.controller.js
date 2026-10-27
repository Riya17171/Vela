import * as reviewService from '../services/review.service.js'
import { sendCreated, sendSuccess } from '../utils/ApiResponse.js'
import { serializeReview } from '../utils/serializers.js'

export async function listReviews(req, res) {
  const { reviews, summary, meta } = await reviewService.listProductReviews(req.validated.params.productId, req.validated.query ?? {})
  sendSuccess(res, {
    message: 'Reviews retrieved',
    data: { summary, reviews: reviews.map((review) => serializeReview(review, { currentUserId: req.user?.id })) },
    meta,
  })
}

export async function createReview(req, res) {
  const review = await reviewService.createReview(req.user.id, req.validated.params.productId, req.validated.body)
  sendCreated(res, { message: 'Review published', data: { review: serializeReview(review, { currentUserId: req.user.id }) } })
}

export async function updateReview(req, res) {
  const review = await reviewService.updateReview(req.validated.params.reviewId, req.user.id, req.validated.body)
  sendSuccess(res, { message: 'Review updated', data: { review: serializeReview(review, { currentUserId: req.user.id }) } })
}

export async function deleteReview(req, res) {
  await reviewService.deleteReview(req.validated.params.reviewId, req.user)
  sendSuccess(res, { message: 'Review deleted' })
}

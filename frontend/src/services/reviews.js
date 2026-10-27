import { request } from './apiClient.js'

export async function fetchReviews(productId, params = {}) {
  const { reviews, summary, meta } = await request({ url: `/products/${productId}/reviews`, params })
  return { reviews, summary, meta }
}

export const createReview = async (productId, body) => (await request({ method: 'post', url: `/products/${productId}/reviews`, data: body })).review
export const updateReview = async (reviewId, body) => (await request({ method: 'patch', url: `/reviews/${reviewId}`, data: body })).review
export const deleteReview = (reviewId) => request({ method: 'delete', url: `/reviews/${reviewId}` })

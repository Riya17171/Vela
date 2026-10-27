import { z } from 'zod'

import { objectId, pageQuery } from './common.js'

const rating = z.number({ error: 'Rating is required' }).int().min(1, 'Rating must be 1-5').max(5, 'Rating must be 1-5')

export const createReviewBody = z.strictObject({
  rating,
  title: z.string().trim().max(120).optional(),
  comment: z.string({ error: 'Share a few words about the piece' }).trim().min(3).max(2000),
})

export const updateReviewBody = createReviewBody
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' })

export const reviewListQuery = z.strictObject({
  ...pageQuery,
  sort: z.enum(['newest', 'highest', 'lowest']).optional(),
})

export const reviewIdParams = z.strictObject({ reviewId: objectId('reviewId') })

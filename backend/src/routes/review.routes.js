import { Router } from 'express'

import * as reviews from '../controllers/review.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { validate } from '../middlewares/validate.js'
import { reviewIdParams, updateReviewBody } from '../validators/review.validator.js'

// Listing and creating reviews live under /products/:productId/reviews.
const router = Router()

router.use(authenticate)

router.patch('/:reviewId', validate({ params: reviewIdParams, body: updateReviewBody }), reviews.updateReview)
router.delete('/:reviewId', validate({ params: reviewIdParams }), reviews.deleteReview)

export default router

import { Router } from 'express'

import * as products from '../controllers/product.controller.js'
import * as reviews from '../controllers/review.controller.js'
import { authenticate, optionalAuthenticate } from '../middlewares/authenticate.js'
import { validate } from '../middlewares/validate.js'
import {
  productIdOrSlugParams,
  productIdParams,
  productListQuery,
  recommendationsQuery,
} from '../validators/product.validator.js'
import { createReviewBody, reviewListQuery } from '../validators/review.validator.js'

const router = Router()

router.get('/', validate({ query: productListQuery }), products.listProducts)
// Static paths must be registered before /:idOrSlug.
router.get('/featured', validate({ query: productListQuery }), products.listFeatured)
router.get('/recommendations', optionalAuthenticate, validate({ query: recommendationsQuery }), products.getRecommendations)
router.get('/:productId/reviews', optionalAuthenticate, validate({ params: productIdParams, query: reviewListQuery }), reviews.listReviews)
router.post('/:productId/reviews', authenticate, validate({ params: productIdParams, body: createReviewBody }), reviews.createReview)
router.get('/:idOrSlug', validate({ params: productIdOrSlugParams }), products.getProduct)

export default router

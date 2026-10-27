import { Router } from 'express'

import * as meta from '../controllers/meta.controller.js'
import { authLimiter } from '../middlewares/rateLimiter.js'
import { validate } from '../middlewares/validate.js'
import { subscribeBody } from '../validators/newsletter.validator.js'
import adminRoutes from './admin.routes.js'
import authRoutes from './auth.routes.js'
import cartRoutes from './cart.routes.js'
import categoryRoutes from './category.routes.js'
import orderRoutes from './order.routes.js'
import paymentRoutes from './payment.routes.js'
import productRoutes from './product.routes.js'
import reviewRoutes from './review.routes.js'
import userRoutes from './user.routes.js'
import wishlistRoutes from './wishlist.routes.js'

const router = Router()

router.get('/health', meta.health)
router.get('/config', meta.publicConfig)
router.post('/newsletter/subscribe', authLimiter, validate({ body: subscribeBody }), meta.subscribe)

router.use('/auth', authRoutes)
router.use('/users', userRoutes)
router.use('/products', productRoutes)
router.use('/categories', categoryRoutes)
router.use('/cart', cartRoutes)
router.use('/wishlist', wishlistRoutes)
router.use('/orders', orderRoutes)
router.use('/payments', paymentRoutes)
router.use('/reviews', reviewRoutes)
router.use('/admin', adminRoutes)

export default router

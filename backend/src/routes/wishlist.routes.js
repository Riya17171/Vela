import { Router } from 'express'

import * as wishlist from '../controllers/wishlist.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { validate } from '../middlewares/validate.js'
import { addWishlistItemBody, wishlistItemParams } from '../validators/cart.validator.js'

const router = Router()

router.use(authenticate)

router.get('/', wishlist.getWishlist)
router.post('/items', validate({ body: addWishlistItemBody }), wishlist.addItem)
router.delete('/items/:productId', validate({ params: wishlistItemParams }), wishlist.removeItem)

export default router

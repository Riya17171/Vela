import { Router } from 'express'

import * as cart from '../controllers/cart.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { validate } from '../middlewares/validate.js'
import { addCartItemBody, cartItemParams, updateCartItemBody } from '../validators/cart.validator.js'

const router = Router()

router.use(authenticate)

router.get('/', cart.getCart)
router.post('/items', validate({ body: addCartItemBody }), cart.addItem)
router.patch('/items/:itemId', validate({ params: cartItemParams, body: updateCartItemBody }), cart.updateItem)
router.delete('/items/:itemId', validate({ params: cartItemParams }), cart.removeItem)
router.delete('/', cart.clearCart)

export default router

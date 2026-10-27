import { Router } from 'express'

import { changePassword } from '../controllers/auth.controller.js'
import * as users from '../controllers/user.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { authLimiter } from '../middlewares/rateLimiter.js'
import { validate } from '../middlewares/validate.js'
import { changePasswordBody } from '../validators/auth.validator.js'
import {
  addressIdParams,
  createAddressBody,
  recentlyViewedBody,
  updateAddressBody,
  updateProfileBody,
} from '../validators/user.validator.js'

const router = Router()

router.use(authenticate)

router.get('/me', users.getProfile)
router.patch('/me', validate({ body: updateProfileBody }), users.updateProfile)
router.patch('/me/password', authLimiter, validate({ body: changePasswordBody }), changePassword)

router.get('/me/addresses', users.listAddresses)
router.post('/me/addresses', validate({ body: createAddressBody }), users.createAddress)
router.patch('/me/addresses/:addressId', validate({ params: addressIdParams, body: updateAddressBody }), users.updateAddress)
router.delete('/me/addresses/:addressId', validate({ params: addressIdParams }), users.deleteAddress)

router.get('/me/recently-viewed', users.getRecentlyViewed)
router.post('/me/recently-viewed', validate({ body: recentlyViewedBody }), users.addRecentlyViewed)

export default router

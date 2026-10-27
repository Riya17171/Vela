import { Router } from 'express'

import * as auth from '../controllers/auth.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { authLimiter } from '../middlewares/rateLimiter.js'
import { validate } from '../middlewares/validate.js'
import { verifyOrigin } from '../middlewares/verifyOrigin.js'
import {
  changePasswordBody,
  forgotPasswordBody,
  loginBody,
  registerBody,
  resetPasswordBody,
} from '../validators/auth.validator.js'

const router = Router()

router.post('/register', authLimiter, validate({ body: registerBody }), auth.register)
router.post('/login', authLimiter, validate({ body: loginBody }), auth.login)
// Cookie-authenticated endpoints get an Origin check against CSRF.
router.post('/refresh', verifyOrigin, auth.refresh)
router.post('/logout', verifyOrigin, auth.logout)
router.get('/me', authenticate, auth.me)
router.post('/forgot-password', authLimiter, validate({ body: forgotPasswordBody }), auth.forgotPassword)
router.post('/reset-password', authLimiter, validate({ body: resetPasswordBody }), auth.resetPassword)
router.patch('/change-password', authenticate, authLimiter, validate({ body: changePasswordBody }), auth.changePassword)

export default router

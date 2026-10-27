import { Router } from 'express'

import * as payments from '../controllers/payment.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { validate } from '../middlewares/validate.js'
import { clientFailureBody, createPaymentOrderBody, paymentIdParams, verifyPaymentBody } from '../validators/payment.validator.js'

// The webhook route lives in app.js because it needs the raw body.
const router = Router()

router.use(authenticate)

router.post('/create-order', validate({ body: createPaymentOrderBody }), payments.createPaymentOrder)
router.post('/verify', validate({ body: verifyPaymentBody }), payments.verifyPayment)
router.get('/:paymentId/status', validate({ params: paymentIdParams }), payments.getPaymentStatus)
router.post('/:paymentId/reconcile', validate({ params: paymentIdParams }), payments.reconcilePayment)
router.post('/:paymentId/failure', validate({ params: paymentIdParams, body: clientFailureBody }), payments.reportFailure)

export default router

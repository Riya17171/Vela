import { Router } from 'express'

import * as orders from '../controllers/order.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { validate } from '../middlewares/validate.js'
import { cancelOrderBody, createOrderBody, myOrdersQuery, orderIdParams } from '../validators/order.validator.js'

const router = Router()

router.use(authenticate)

router.post('/', validate({ body: createOrderBody }), orders.createOrder)
router.get('/my-orders', validate({ query: myOrdersQuery }), orders.listMyOrders)
router.get('/:orderId', validate({ params: orderIdParams }), orders.getOrder)
router.post('/:orderId/cancel', validate({ params: orderIdParams, body: cancelOrderBody }), orders.cancelOrder)

export default router

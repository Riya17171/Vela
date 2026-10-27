import * as orderService from '../services/order.service.js'
import { sendCreated, sendSuccess } from '../utils/ApiResponse.js'
import { serializeOrder } from '../utils/serializers.js'

export async function createOrder(req, res) {
  const idempotencyKey = req.validated.body.idempotencyKey ?? req.get('idempotency-key') ?? undefined
  const { order, created } = await orderService.createOrderFromCart(req.user.id, { ...req.validated.body, idempotencyKey })
  const send = created ? sendCreated : sendSuccess
  send(res, {
    message: created ? 'Order created. Complete payment to confirm it.' : 'Existing order returned for this checkout attempt',
    data: { order: serializeOrder(order) },
  })
}

export async function listMyOrders(req, res) {
  const { orders, meta } = await orderService.listOrdersForUser(req.user.id, req.validated.query ?? {})
  sendSuccess(res, { message: 'Orders retrieved', data: { orders: orders.map((order) => serializeOrder(order)) }, meta })
}

export async function getOrder(req, res) {
  const order = await orderService.getOrderForRequester(req.validated.params.orderId, req.user)
  sendSuccess(res, { message: 'Order retrieved', data: { order: serializeOrder(order, { admin: req.user.role === 'admin' }) } })
}

export async function cancelOrder(req, res) {
  const { order, alreadyCancelled } = await orderService.cancelOrderByCustomer(
    req.validated.params.orderId,
    req.user.id,
    req.validated.body?.reason || undefined,
  )
  sendSuccess(res, {
    message: alreadyCancelled ? 'Order was already cancelled' : order.paymentStatus === 'refund_pending'
      ? 'Order cancelled. Your refund will be processed by our team.'
      : 'Order cancelled',
    data: { order: serializeOrder(order) },
  })
}

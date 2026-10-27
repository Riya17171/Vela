import * as paymentService from '../services/payment.service.js'
import { ApiError } from '../utils/ApiError.js'
import { sendCreated, sendSuccess } from '../utils/ApiResponse.js'
import { serializeOrder, serializePayment } from '../utils/serializers.js'

const OUTCOME_MESSAGES = {
  confirmed: 'Payment verified. Your order is confirmed.',
  confirmed_late: 'Payment verified. Your order is confirmed.',
  already_processed: 'Payment was already verified',
  refund_required: 'Payment received after the order closed; it will be refunded.',
  pending: 'Payment is still being processed by the provider',
}

export async function createPaymentOrder(req, res) {
  const { checkout, created } = await paymentService.createPaymentOrder(req.validated.body.orderId, req.user)
  const send = created ? sendCreated : sendSuccess
  send(res, { message: created ? 'Payment order created' : 'Existing payment order returned', data: { checkout } })
}

export async function verifyPayment(req, res) {
  const { order, payment, outcome } = await paymentService.verifyPayment(req.user, req.validated.body)
  res.status(outcome === 'pending' ? 202 : 200).json({
    success: outcome !== 'pending',
    message: OUTCOME_MESSAGES[outcome] ?? 'Payment processed',
    data: { outcome, order: serializeOrder(order), payment: serializePayment(payment) },
  })
}

export async function getPaymentStatus(req, res) {
  const { payment, order } = await paymentService.getPaymentStatus(req.validated.params.paymentId, req.user)
  sendSuccess(res, {
    message: 'Payment status',
    data: { payment: serializePayment(payment), order: { id: String(order._id), status: order.status, paymentStatus: order.paymentStatus } },
  })
}

export async function reconcilePayment(req, res) {
  const { payment, order, outcome } = await paymentService.reconcilePayment(req.validated.params.paymentId, req.user)
  sendSuccess(res, { message: `Reconciled with provider: ${outcome}`, data: { outcome, payment: serializePayment(payment), order: serializeOrder(order) } })
}

export async function reportFailure(req, res) {
  const { payment, order, outcome } = await paymentService.reportClientFailure(req.validated.params.paymentId, req.user, req.validated.body)
  sendSuccess(res, { message: 'Payment attempt recorded', data: { outcome, payment: serializePayment(payment), order: serializeOrder(order) } })
}

export async function webhook(req, res) {
  if (!Buffer.isBuffer(req.body)) throw ApiError.badRequest('Expected a raw JSON body')
  const result = await paymentService.handleWebhook(req.body, req.get('x-razorpay-signature'), req.get('x-razorpay-event-id'))
  sendSuccess(res, { message: result.duplicate ? 'Duplicate event ignored' : 'Webhook received', data: { outcome: result.outcome } })
}

import crypto from 'node:crypto'

import { logger } from '../config/logger.js'
import { getRazorpayClient, razorpayConfig } from '../config/razorpay.js'
import { Order } from '../models/Order.js'
import { Payment } from '../models/Payment.js'
import { User } from '../models/User.js'
import { WebhookEvent } from '../models/WebhookEvent.js'
import { ApiError } from '../utils/ApiError.js'
import { timingSafeEqualHex } from '../utils/generateToken.js'
import { confirmOrderPayment, expireOrder, getOrderForRequester, recordPaymentFailure } from './order.service.js'

/**
 * Thin wrapper around the official SDK. Everything that talks to Razorpay
 * goes through this object so automated tests can stub the provider.
 */
export const razorpayGateway = {
  createOrder: (params) => requireClient().orders.create(params),
  fetchPayment: (paymentId) => requireClient().payments.fetch(paymentId),
  capturePayment: (paymentId, amount, currency) => requireClient().payments.capture(paymentId, amount, currency),
  fetchOrderPayments: (orderId) => requireClient().orders.fetchPayments(orderId),
  refundPayment: (paymentId, params) => requireClient().payments.refund(paymentId, params),
}

function requireClient() {
  const client = getRazorpayClient()
  if (!client) throw paymentsDisabledError()
  return client
}

function paymentsDisabledError() {
  return ApiError.serviceUnavailable(
    'Payments are not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET (test mode) on the server.',
    { code: 'PAYMENTS_DISABLED' },
  )
}

function providerError(error, action) {
  const description = error?.error?.description ?? error?.message ?? 'Unknown error'
  logger.error({ action, statusCode: error?.statusCode, code: error?.error?.code, description }, 'Razorpay request failed')
  if (action === 'payments.refund' && error?.statusCode === 400) {
    // Razorpay answers "invalid request sent" when the refund exceeds the account's refundable
    // balance (common on fresh test accounts). Nothing was refunded; the order stays refund_pending.
    return ApiError.badGateway(
      `Razorpay rejected the refund (${description}). In test mode this usually means the account's refundable balance is lower than the refund amount; check the Razorpay dashboard and retry later.`,
      { code: 'REFUND_REJECTED' },
    )
  }
  return ApiError.badGateway('The payment provider could not complete the request. Please try again.', {
    code: 'PAYMENT_PROVIDER_ERROR',
  })
}

// ─── Signatures (https://razorpay.com/docs/payments/server-integration/nodejs/) ──

export function computePaymentSignature(razorpayOrderId, razorpayPaymentId, secret) {
  return crypto.createHmac('sha256', secret).update(`${razorpayOrderId}|${razorpayPaymentId}`).digest('hex')
}

export function isValidPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }, secret = razorpayConfig.keySecret) {
  if (!secret) return false
  return timingSafeEqualHex(computePaymentSignature(razorpayOrderId, razorpayPaymentId, secret), razorpaySignature)
}

export function computeWebhookSignature(rawBody, secret) {
  return crypto.createHmac('sha256', secret).update(rawBody).digest('hex')
}

export function isValidWebhookSignature(rawBody, signature, secret = razorpayConfig.webhookSecret) {
  if (!secret || !signature || !Buffer.isBuffer(rawBody)) return false
  return timingSafeEqualHex(computeWebhookSignature(rawBody, secret), signature)
}

// ─── Checkout ─────────────────────────────────────────────────────────────

async function checkoutPayload(order, payment) {
  const user = await User.findById(order.user, 'fullName email phone')
  return {
    keyId: razorpayConfig.keyId,
    razorpayOrderId: order.razorpayOrderId,
    paymentId: String(payment._id),
    orderId: String(order._id),
    orderNumber: order.orderNumber,
    amount: order.total,
    currency: order.currency,
    name: 'Vela',
    description: `Order ${order.orderNumber}`,
    prefill: { name: user?.fullName ?? '', email: order.contactEmail, contact: order.shippingAddress?.phone ?? user?.phone ?? '' },
    testMode: razorpayConfig.testMode,
  }
}

/** Creates (or returns the existing) Razorpay order for a pending internal order. */
export async function createPaymentOrder(orderId, requester) {
  if (!razorpayConfig.enabled) throw paymentsDisabledError()

  let order = await getOrderForRequester(orderId, requester)
  if (order.status === 'pending_payment' && order.reservationExpiresAt < new Date()) {
    await expireOrder(order._id)
    order = await Order.findById(order._id)
  }
  if (order.status !== 'pending_payment' || !['pending', 'failed'].includes(order.paymentStatus)) {
    throw ApiError.conflict(
      order.status === 'expired'
        ? 'This order expired before payment. Please check out again.'
        : `This order cannot be paid (status: ${order.status}, payment: ${order.paymentStatus})`,
      { code: order.status === 'expired' ? 'ORDER_EXPIRED' : 'ORDER_NOT_PAYABLE' },
    )
  }

  if (order.razorpayOrderId) {
    const payment = await Payment.findOne({ providerOrderId: order.razorpayOrderId })
    return { checkout: await checkoutPayload(order, payment), created: false }
  }

  let providerOrder
  try {
    providerOrder = await razorpayGateway.createOrder({
      amount: order.total,
      currency: order.currency,
      receipt: order.orderNumber,
      notes: { orderId: String(order._id), orderNumber: order.orderNumber },
    })
  } catch (error) {
    throw providerError(error, 'orders.create')
  }

  if (providerOrder.amount !== order.total || providerOrder.currency !== order.currency) {
    logger.error({ orderId: String(order._id), providerAmount: providerOrder.amount }, 'Razorpay order amount mismatch')
    throw ApiError.badGateway('Payment provider returned an unexpected amount', { code: 'AMOUNT_MISMATCH' })
  }

  const payment = await Payment.create({
    order: order._id,
    user: order.user,
    providerOrderId: providerOrder.id,
    amount: order.total,
    currency: order.currency,
    status: 'created',
  })

  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, razorpayOrderId: { $exists: false } },
    { $set: { razorpayOrderId: providerOrder.id, payment: payment._id } },
    { new: true },
  )
  if (!claimed) {
    // A concurrent request attached its provider order first; ours is never shown to the customer.
    await Payment.deleteOne({ _id: payment._id })
    const winner = await Order.findById(order._id)
    const winnerPayment = await Payment.findOne({ providerOrderId: winner.razorpayOrderId })
    return { checkout: await checkoutPayload(winner, winnerPayment), created: false }
  }

  logger.info({ orderId: String(order._id), razorpayOrderId: providerOrder.id }, 'Razorpay order created')
  return { checkout: await checkoutPayload(claimed, payment), created: true }
}

async function applyCapturedPayment(payment, providerPayment, source) {
  await Payment.updateOne(
    { _id: payment._id },
    {
      $set: {
        status: payment.status === 'refunded' || payment.status === 'refund_pending' ? payment.status : 'captured',
        providerPaymentId: providerPayment.id,
        method: providerPayment.method,
        verifiedAt: payment.verifiedAt ?? new Date(),
        verifiedVia: payment.verifiedVia ?? source,
      },
      $push: { attempts: { providerPaymentId: providerPayment.id, status: 'captured', method: providerPayment.method, source } },
    },
  )
  return confirmOrderPayment(payment.order, { paymentRecordId: payment._id, source })
}

async function applyFailedPayment(payment, providerPayment, source) {
  await Payment.updateOne(
    { _id: payment._id, status: { $in: ['created', 'failed'] } },
    {
      $set: {
        status: 'failed',
        failureCode: providerPayment.error_code ?? undefined,
        failureReason: providerPayment.error_description ?? 'Payment failed',
      },
      $push: {
        attempts: {
          providerPaymentId: providerPayment.id,
          status: 'failed',
          method: providerPayment.method,
          errorCode: providerPayment.error_code,
          errorDescription: providerPayment.error_description,
          source,
        },
      },
    },
  )
  await recordPaymentFailure(payment.order, `Payment attempt failed: ${providerPayment.error_description ?? 'declined'}`)
}

function assertProviderPaymentMatches(providerPayment, payment) {
  if (providerPayment.order_id !== payment.providerOrderId) {
    throw ApiError.badRequest('Payment does not belong to this order', { code: 'ORDER_MISMATCH' })
  }
  if (providerPayment.amount !== payment.amount || providerPayment.currency !== payment.currency) {
    logger.error({ paymentId: String(payment._id), providerAmount: providerPayment.amount }, 'Captured amount differs from order total')
    throw ApiError.badRequest('Paid amount does not match the order total', { code: 'AMOUNT_MISMATCH' })
  }
}

/** Brings an authorised (not yet captured) payment to captured state. */
async function ensureCaptured(providerPayment) {
  if (providerPayment.status !== 'authorized') return providerPayment
  try {
    return await razorpayGateway.capturePayment(providerPayment.id, providerPayment.amount, providerPayment.currency)
  } catch (error) {
    // Auto-capture may have won the race; trust the provider's current state.
    const refreshed = await razorpayGateway.fetchPayment(providerPayment.id).catch(() => null)
    if (refreshed?.status === 'captured') return refreshed
    throw providerError(error, 'payments.capture')
  }
}

/**
 * Server-side verification after Razorpay Checkout returns. The signature
 * proves the response came from Razorpay; fetching the payment proves the
 * money was actually captured for the right amount.
 */
export async function verifyPayment(requester, { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!razorpayConfig.enabled) throw paymentsDisabledError()

  const order = await getOrderForRequester(orderId, requester)
  if (!order.razorpayOrderId || order.razorpayOrderId !== razorpayOrderId) {
    throw ApiError.badRequest('Payment reference does not match this order', { code: 'ORDER_MISMATCH' })
  }
  const payment = await Payment.findOne({ providerOrderId: razorpayOrderId })
  if (!payment) throw ApiError.notFound('Payment record not found')

  if (!isValidPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature })) {
    await Payment.updateOne(
      { _id: payment._id },
      { $push: { attempts: { providerPaymentId: razorpayPaymentId, status: 'signature_invalid', source: 'verify' } } },
    )
    logger.warn({ orderId: String(order._id) }, 'Rejected payment with invalid signature')
    throw ApiError.badRequest('Payment signature verification failed', { code: 'INVALID_SIGNATURE' })
  }

  if (['paid', 'refund_pending', 'refunded'].includes(order.paymentStatus) && payment.providerPaymentId === razorpayPaymentId) {
    return { order, payment, outcome: 'already_processed' }
  }

  let providerPayment
  try {
    providerPayment = await razorpayGateway.fetchPayment(razorpayPaymentId)
  } catch (error) {
    throw providerError(error, 'payments.fetch')
  }
  assertProviderPaymentMatches(providerPayment, payment)

  if (providerPayment.status === 'failed') {
    await applyFailedPayment(payment, providerPayment, 'verify')
    throw new ApiError(402, providerPayment.error_description ?? 'The payment failed', { code: 'PAYMENT_FAILED' })
  }

  providerPayment = await ensureCaptured(providerPayment)
  if (providerPayment.status !== 'captured') {
    return { order, payment, outcome: 'pending' }
  }

  const result = await applyCapturedPayment(payment, providerPayment, 'verify')
  return { order: result.order, payment: await Payment.findById(payment._id), outcome: result.outcome }
}

async function loadPaymentForRequester(paymentId, requester) {
  const payment = await Payment.findById(paymentId)
  if (!payment || (requester.role !== 'admin' && String(payment.user) !== String(requester.id))) {
    throw ApiError.notFound('Payment not found')
  }
  return payment
}

export async function getPaymentStatus(paymentId, requester) {
  const payment = await loadPaymentForRequester(paymentId, requester)
  const order = await Order.findById(payment.order)
  return { payment, order }
}

/**
 * Asks Razorpay what actually happened. Used when the checkout window is
 * closed without a callback: closing it is not proof of failure.
 */
export async function reconcilePayment(paymentId, requester) {
  if (!razorpayConfig.enabled) throw paymentsDisabledError()
  const payment = await loadPaymentForRequester(paymentId, requester)
  if (['captured', 'refund_pending', 'refunded'].includes(payment.status)) {
    return { payment, order: await Order.findById(payment.order), outcome: 'already_processed' }
  }

  let providerPayments
  try {
    providerPayments = (await razorpayGateway.fetchOrderPayments(payment.providerOrderId))?.items ?? []
  } catch (error) {
    throw providerError(error, 'orders.fetchPayments')
  }

  const successful = providerPayments.find((p) => p.status === 'captured') ?? providerPayments.find((p) => p.status === 'authorized')
  let outcome = providerPayments.length ? 'pending' : 'no_attempts'
  if (successful) {
    assertProviderPaymentMatches(successful, payment)
    const captured = await ensureCaptured(successful)
    if (captured.status === 'captured') outcome = (await applyCapturedPayment(payment, captured, 'reconcile')).outcome
  } else if (providerPayments.length && providerPayments.every((p) => p.status === 'failed')) {
    await applyFailedPayment(payment, providerPayments[0], 'reconcile')
    outcome = 'failed'
  }

  return { payment: await Payment.findById(payment._id), order: await Order.findById(payment.order), outcome }
}

/** Customer-reported checkout failure; informational only, never changes money state on its own. */
export async function reportClientFailure(paymentId, requester, { code, description, razorpayPaymentId }) {
  const payment = await loadPaymentForRequester(paymentId, requester)
  await Payment.updateOne(
    { _id: payment._id },
    { $push: { attempts: { providerPaymentId: razorpayPaymentId, status: 'client_reported_failure', errorCode: code, errorDescription: description, source: 'client_report' } } },
  )
  return reconcilePayment(paymentId, requester)
}

// ─── Refunds ──────────────────────────────────────────────────────────────

export async function refundOrder(orderId, { reason }) {
  if (!razorpayConfig.enabled) throw paymentsDisabledError()
  const order = await Order.findById(orderId)
  if (!order) throw ApiError.notFound('Order not found')

  const refundable =
    order.paymentStatus === 'refund_pending' || (order.paymentStatus === 'paid' && order.status === 'cancelled')
  if (!refundable) {
    throw ApiError.conflict('Only paid orders that are cancelled (or flagged for refund) can be refunded', {
      code: 'NOT_REFUNDABLE',
    })
  }

  // Claim the refund so two admins clicking at once cannot refund twice.
  const payment = await Payment.findOneAndUpdate(
    { _id: order.payment, status: 'captured', refundId: null },
    { $set: { refundId: 'pending' } },
    { new: true },
  )
  if (!payment?.providerPaymentId) {
    throw ApiError.conflict('A refund has already been initiated for this order', { code: 'REFUND_EXISTS' })
  }

  let refund
  try {
    refund = await razorpayGateway.refundPayment(payment.providerPaymentId, {
      amount: payment.amount,
      notes: { orderId: String(order._id), reason: reason ?? 'Order cancelled' },
    })
  } catch (error) {
    await Payment.updateOne({ _id: payment._id }, { $set: { refundId: null } })
    throw providerError(error, 'payments.refund')
  }

  const processed = refund.status === 'processed'
  await Payment.updateOne(
    { _id: payment._id },
    {
      $set: {
        refundId: refund.id,
        status: processed ? 'refunded' : 'refund_pending',
        refundedAmount: processed ? refund.amount : 0,
        ...(processed && { refundedAt: new Date() }),
      },
    },
  )
  const nextPaymentStatus = processed ? 'refunded' : 'refund_pending'
  const updated = await Order.findByIdAndUpdate(
    order._id,
    {
      $set: { paymentStatus: nextPaymentStatus, needsAttention: false },
      $push: { statusHistory: { status: order.status, paymentStatus: nextPaymentStatus, by: 'admin', note: `Refund ${refund.id} ${refund.status}`, at: new Date() } },
    },
    { new: true },
  )
  return { order: updated, refund: { id: refund.id, status: refund.status, amount: refund.amount } }
}

// ─── Webhooks ─────────────────────────────────────────────────────────────

async function handleRefundEvent(event, refundEntity) {
  const payment = await Payment.findOne({ providerPaymentId: refundEntity.payment_id })
  if (!payment) return 'ignored: unknown payment'

  if (event === 'refund.processed') {
    await Payment.updateOne(
      { _id: payment._id },
      { $set: { status: 'refunded', refundId: refundEntity.id, refundedAmount: refundEntity.amount, refundedAt: new Date() } },
    )
    await Order.updateOne(
      { _id: payment.order, paymentStatus: { $ne: 'refunded' } },
      {
        $set: { paymentStatus: 'refunded', needsAttention: false },
        $push: { statusHistory: { status: 'cancelled', paymentStatus: 'refunded', by: 'payment', note: `Refund ${refundEntity.id} processed`, at: new Date() } },
      },
    )
    return 'refund recorded'
  }

  await Order.updateOne(
    { _id: payment.order },
    { $set: { needsAttention: true, attentionReason: `Refund ${refundEntity.id} failed at the provider` } },
  )
  await Payment.updateOne({ _id: payment._id, refundId: refundEntity.id }, { $set: { refundId: null, status: 'captured' } })
  return 'refund failure flagged'
}

async function processWebhookEvent(body) {
  const { event, payload } = body
  if (event === 'payment.captured' || event === 'order.paid' || event === 'payment.failed') {
    const entity = payload?.payment?.entity
    if (!entity?.order_id) return 'ignored: no payment entity'
    const payment = await Payment.findOne({ providerOrderId: entity.order_id })
    if (!payment) return 'ignored: unknown order'
    assertProviderPaymentMatches(entity, payment)
    if (event === 'payment.failed') {
      await applyFailedPayment(payment, entity, 'webhook')
      return 'payment failure recorded'
    }
    if (entity.status !== 'captured') return `ignored: payment status ${entity.status}`
    const { outcome } = await applyCapturedPayment(payment, entity, 'webhook')
    return `payment ${outcome}`
  }
  if (event === 'refund.processed' || event === 'refund.failed') {
    const entity = payload?.refund?.entity
    if (!entity?.payment_id) return 'ignored: no refund entity'
    return handleRefundEvent(event, entity)
  }
  return `ignored: unhandled event ${event}`
}

/**
 * Processes a signed webhook exactly once. The event id is stored before
 * processing; if processing throws, the record is removed so Razorpay's
 * retry can try again.
 */
export async function handleWebhook(rawBody, signature, eventIdHeader) {
  if (!razorpayConfig.webhookEnabled) {
    throw ApiError.serviceUnavailable('Webhooks are not configured (RAZORPAY_WEBHOOK_SECRET)', { code: 'WEBHOOKS_DISABLED' })
  }
  if (!isValidWebhookSignature(rawBody, signature)) {
    logger.warn('Rejected webhook with invalid signature')
    throw ApiError.badRequest('Invalid webhook signature', { code: 'INVALID_SIGNATURE' })
  }

  let body
  try {
    body = JSON.parse(rawBody.toString('utf8'))
  } catch {
    throw ApiError.badRequest('Webhook body is not valid JSON')
  }

  const eventId = eventIdHeader || crypto.createHash('sha256').update(rawBody).digest('hex')
  try {
    await WebhookEvent.create({ provider: 'razorpay', eventId, event: body.event ?? 'unknown' })
  } catch (error) {
    if (error?.code === 11000) {
      logger.info({ eventId, event: body.event }, 'Duplicate webhook delivery ignored')
      return { duplicate: true, outcome: 'duplicate' }
    }
    throw error
  }

  try {
    const outcome = await processWebhookEvent(body)
    await WebhookEvent.updateOne(
      { provider: 'razorpay', eventId },
      { $set: { status: outcome.startsWith('ignored') ? 'ignored' : 'processed', outcome } },
    )
    logger.info({ eventId, event: body.event, outcome }, 'Webhook processed')
    return { duplicate: false, outcome }
  } catch (error) {
    await WebhookEvent.deleteOne({ provider: 'razorpay', eventId })
    if (error instanceof ApiError && error.statusCode < 500) {
      // Permanent problem with this event (e.g. amount mismatch): acknowledge and log, don't retry forever.
      logger.error({ eventId, event: body.event, code: error.code }, 'Webhook rejected by business rules')
      await WebhookEvent.create({ provider: 'razorpay', eventId, event: body.event, status: 'ignored', outcome: error.message })
      return { duplicate: false, outcome: `rejected: ${error.message}` }
    }
    throw error
  }
}

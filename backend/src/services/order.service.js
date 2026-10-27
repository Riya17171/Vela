import crypto from 'node:crypto'

import { businessRules } from '../config/businessRules.js'
import { logger } from '../config/logger.js'
import { Cart } from '../models/Cart.js'
import { Order } from '../models/Order.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { buildPageMeta, resolvePagination } from '../utils/pagination.js'
import { withOptionalTransaction } from '../utils/transaction.js'
import { removePurchasedItems, resolveCartLines } from './cart.service.js'
import { sendOrderConfirmationEmail } from './email.service.js'
import { releaseStock, reserveStock } from './inventory.service.js'
import { canTransition, paymentStatusAfterCancellation, shouldReleaseInventory } from './orderStatus.js'
import { calculateTotals } from './pricing.service.js'

const ISSUE_MESSAGES = {
  unavailable: 'is no longer available',
  out_of_stock: 'is out of stock',
  insufficient_stock: 'does not have enough stock for the requested quantity',
}

export function generateOrderNumber(date = new Date()) {
  const stamp = date.toISOString().slice(2, 10).replace(/-/g, '')
  const random = crypto.randomBytes(4).toString('hex').toUpperCase()
  return `VL-${stamp}-${random}`
}

function historyEvent(status, paymentStatus, by, note) {
  return { status, paymentStatus, by, note, at: new Date() }
}

async function resolveShippingAddress(user, { addressId, shippingAddress }) {
  if (addressId) {
    const saved = user.addresses.id(addressId)
    if (!saved) throw ApiError.notFound('Saved address not found')
    const { fullName, phone, line1, line2, city, state, postalCode, country } = saved
    return { fullName, phone, line1, line2, city, state, postalCode, country }
  }
  return shippingAddress
}

/**
 * Creates a pending order from the server-side cart:
 * live prices -> stock validation -> server totals -> stock reservation.
 * Retrying with the same idempotency key returns the original order.
 */
export async function createOrderFromCart(userId, { addressId, shippingAddress, contactEmail, saveAddress, idempotencyKey }) {
  if (idempotencyKey) {
    const existing = await Order.findOne({ user: userId, idempotencyKey })
    if (existing) return { order: existing, created: false }
  }

  const user = await User.findById(userId)
  if (!user) throw ApiError.unauthorized()

  const address = await resolveShippingAddress(user, { addressId, shippingAddress })

  const cart = await Cart.findOne({ user: userId })
  if (!cart || cart.items.length === 0) throw ApiError.badRequest('Your bag is empty', { code: 'EMPTY_CART' })

  const lines = await resolveCartLines(cart)
  const problems = lines.filter((line) => line.issue)
  if (problems.length) {
    throw ApiError.conflict('Some pieces in your bag can no longer be purchased', {
      code: 'CART_ITEMS_UNAVAILABLE',
      errors: problems.map((line) => ({
        field: `items.${line.itemId}`,
        message: `"${line.title}" ${ISSUE_MESSAGES[line.issue]}`,
      })),
    })
  }

  const totals = calculateTotals(lines.map(({ unitPrice, quantity }) => ({ unitPrice, quantity })))
  const items = lines.map((line) => ({
    product: line.product._id,
    title: line.product.title,
    slug: line.product.slug,
    sku: line.product.sku,
    image: line.product.images?.[0]?.url,
    category: line.product.category?.name,
    size: line.size,
    color: line.color,
    unitPrice: line.unitPrice,
    quantity: line.quantity,
    lineTotal: line.unitPrice * line.quantity,
  }))
  const reservationLines = lines.map((line) => ({ productId: line.productId, quantity: line.quantity, title: line.title }))

  let order
  try {
    order = await withOptionalTransaction(async (session) => {
      await reserveStock(reservationLines, session)
      try {
        const [created] = await Order.create(
          [
            {
              orderNumber: generateOrderNumber(),
              user: userId,
              items,
              ...totals,
              contactEmail: contactEmail ?? user.email,
              shippingAddress: address,
              status: 'pending_payment',
              paymentStatus: 'pending',
              inventoryState: 'reserved',
              reservationExpiresAt: new Date(Date.now() + businessRules.reservationMinutes * 60_000),
              idempotencyKey,
              statusHistory: [historyEvent('pending_payment', 'pending', 'customer', 'Order placed, awaiting payment')],
            },
          ],
          { session },
        )
        return created
      } catch (error) {
        if (!session) await releaseStock(reservationLines)
        throw error
      }
    })
  } catch (error) {
    // Two identical submissions raced; the loser returns the winner's order.
    if (error?.code === 11000 && idempotencyKey) {
      const existing = await Order.findOne({ user: userId, idempotencyKey })
      if (existing) return { order: existing, created: false }
    }
    throw error
  }

  if (saveAddress && shippingAddress && user.addresses.length < businessRules.maxAddressesPerUser) {
    user.addresses.push({ ...shippingAddress, isDefault: user.addresses.length === 0 })
    await user.save()
  }

  logger.info({ orderId: String(order._id), total: order.total }, 'Order created with reserved stock')
  return { order, created: true }
}

export async function listOrdersForUser(userId, query) {
  const { page, limit, skip } = resolvePagination(query)
  const filter = { user: userId }
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    Order.countDocuments(filter),
  ])
  return { orders, meta: buildPageMeta({ page, limit, total }) }
}

/** Owners see their own orders; admins see any. Others get a 404, not a 403, to avoid leaking ids. */
export async function getOrderForRequester(orderId, requester) {
  const order = await Order.findById(orderId)
  if (!order) throw ApiError.notFound('Order not found')
  if (requester.role !== 'admin' && String(order.user) !== String(requester.id)) {
    throw ApiError.notFound('Order not found')
  }
  if (order.status === 'pending_payment' && order.reservationExpiresAt < new Date()) {
    await expireOrder(order._id)
    return Order.findById(orderId)
  }
  return order
}

async function applyCancellation(order, actor, reason) {
  const fromStatus = order.status
  const paymentStatus = paymentStatusAfterCancellation(order.paymentStatus)
  const releaseInventory = shouldReleaseInventory(fromStatus) && order.inventoryState !== 'released'

  const updated = await withOptionalTransaction(async (session) => {
    const result = await Order.findOneAndUpdate(
      { _id: order._id, status: fromStatus, paymentStatus: order.paymentStatus },
      {
        $set: {
          status: 'cancelled',
          paymentStatus,
          cancelledAt: new Date(),
          cancelReason: reason,
          ...(releaseInventory && { inventoryState: 'released' }),
        },
        $push: { statusHistory: historyEvent('cancelled', paymentStatus, actor, reason) },
      },
      { new: true, session },
    )
    if (!result) throw ApiError.conflict('The order changed while it was being cancelled. Please retry.', { code: 'ORDER_CHANGED' })
    if (releaseInventory) await releaseStock(order.items.map((item) => ({ productId: item.product, quantity: item.quantity })), session)
    return result
  })
  logger.info({ orderId: String(order._id), actor, paymentStatus }, 'Order cancelled')
  return updated
}

export async function cancelOrderByCustomer(orderId, userId, reason = 'Cancelled by customer') {
  const order = await getOrderForRequester(orderId, { id: userId, role: 'user' })
  if (order.status === 'cancelled') return { order, alreadyCancelled: true }
  if (!canTransition(order.status, 'cancelled', 'customer')) {
    throw ApiError.conflict(`An order that is ${order.status.replace('_', ' ')} can no longer be cancelled online`, {
      code: 'INVALID_STATUS_TRANSITION',
    })
  }
  return { order: await applyCancellation(order, 'customer', reason), alreadyCancelled: false }
}

export async function updateStatusByAdmin(orderId, { status, note }) {
  const order = await Order.findById(orderId)
  if (!order) throw ApiError.notFound('Order not found')
  if (order.status === status) throw ApiError.conflict(`Order is already ${status}`, { code: 'NO_OP_TRANSITION' })
  if (!canTransition(order.status, status, 'admin')) {
    throw ApiError.conflict(`Cannot move an order from ${order.status} to ${status}`, { code: 'INVALID_STATUS_TRANSITION' })
  }
  if (status === 'cancelled') return applyCancellation(order, 'admin', note || 'Cancelled by Vela')

  const updated = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status },
    { $set: { status }, $push: { statusHistory: historyEvent(status, order.paymentStatus, 'admin', note) } },
    { new: true },
  )
  if (!updated) throw ApiError.conflict('The order changed while it was being updated. Please retry.', { code: 'ORDER_CHANGED' })
  return updated
}

/** Releases the reservation of one unpaid order whose hold has lapsed. */
export async function expireOrder(orderId) {
  return withOptionalTransaction(async (session) => {
    const expired = await Order.findOneAndUpdate(
      { _id: orderId, status: 'pending_payment', reservationExpiresAt: { $lt: new Date() }, paymentStatus: { $in: ['pending', 'failed'] } },
      {
        $set: { status: 'expired', paymentStatus: 'void', inventoryState: 'released' },
        $push: { statusHistory: historyEvent('expired', 'void', 'system', 'Payment window elapsed; stock released') },
      },
      { new: true, session },
    )
    if (expired) {
      await releaseStock(expired.items.map((item) => ({ productId: item.product, quantity: item.quantity })), session)
    }
    return expired
  })
}

export async function expireStaleOrders(limit = 100) {
  const stale = await Order.find(
    { status: 'pending_payment', reservationExpiresAt: { $lt: new Date() } },
    { _id: 1 },
  ).limit(limit)
  let count = 0
  for (const { _id } of stale) {
    if (await expireOrder(_id)) count += 1
  }
  if (count) logger.info({ count }, 'Expired unpaid orders and released their stock')
  return count
}

/**
 * Single entry point for "the provider says this order is paid", used by
 * /payments/verify, the webhook and reconciliation. Safe to call repeatedly:
 * only the first caller flips the state, so stock and cart are touched once.
 */
export async function confirmOrderPayment(orderId, { paymentRecordId, source }) {
  const now = new Date()
  const confirmed = await Order.findOneAndUpdate(
    { _id: orderId, status: 'pending_payment', paymentStatus: { $in: ['pending', 'failed'] } },
    {
      $set: { status: 'confirmed', paymentStatus: 'paid', inventoryState: 'committed', paidAt: now, payment: paymentRecordId },
      $unset: { reservationExpiresAt: 1 },
      $push: { statusHistory: historyEvent('confirmed', 'paid', 'payment', `Payment verified via ${source}`) },
    },
    { new: true },
  )

  if (confirmed) {
    await removePurchasedItems(confirmed.user, confirmed.items).catch((error) =>
      logger.error({ err: error, orderId: String(orderId) }, 'Paid order confirmed but bag cleanup failed'),
    )
    await sendOrderConfirmationEmail(confirmed)
    return { order: confirmed, outcome: 'confirmed' }
  }

  const order = await Order.findById(orderId)
  if (!order) throw ApiError.notFound('Order not found')
  if (['paid', 'refund_pending', 'refunded'].includes(order.paymentStatus)) {
    return { order, outcome: 'already_processed' }
  }
  return handleLatePayment(order, { paymentRecordId, source })
}

/**
 * Money arrived for an order that was cancelled or expired in the meantime.
 * Expired orders are revived when stock can be re-reserved; otherwise (and
 * always for orders the customer cancelled) the payment is flagged for an
 * admin refund rather than silently kept.
 */
async function handleLatePayment(order, { paymentRecordId, source }) {
  const claimed = await Order.findOneAndUpdate(
    { _id: order._id, status: order.status, paymentStatus: { $in: ['pending', 'failed', 'void'] } },
    { $set: { paymentStatus: 'paid', paidAt: new Date(), payment: paymentRecordId } },
    { new: true },
  )
  if (!claimed) return { order: await Order.findById(order._id), outcome: 'already_processed' }

  if (claimed.status === 'expired') {
    try {
      await withOptionalTransaction(async (session) => {
        await reserveStock(claimed.items.map((item) => ({ productId: item.product, quantity: item.quantity, title: item.title })), session)
        await Order.updateOne(
          { _id: claimed._id },
          {
            $set: { status: 'confirmed', inventoryState: 'committed' },
            $push: { statusHistory: historyEvent('confirmed', 'paid', 'payment', `Late payment via ${source}; stock re-reserved`) },
          },
          { session },
        )
      })
      const revived = await Order.findById(claimed._id)
      await removePurchasedItems(revived.user, revived.items).catch(() => {})
      return { order: revived, outcome: 'confirmed_late' }
    } catch (error) {
      logger.warn({ err: error, orderId: String(claimed._id) }, 'Late payment could not re-reserve stock')
    }
  }

  const flagged = await Order.findOneAndUpdate(
    { _id: claimed._id },
    {
      $set: {
        paymentStatus: 'refund_pending',
        needsAttention: true,
        attentionReason: `Payment captured after the order was ${claimed.status}; refund required`,
      },
      $push: { statusHistory: historyEvent(claimed.status, 'refund_pending', 'payment', 'Payment received after cancellation/expiry; refund required') },
    },
    { new: true },
  )
  logger.warn({ orderId: String(claimed._id) }, 'Late payment flagged for refund')
  return { order: flagged, outcome: 'refund_required' }
}

export async function recordPaymentFailure(orderId, note) {
  return Order.findOneAndUpdate(
    { _id: orderId, status: 'pending_payment', paymentStatus: 'pending' },
    { $set: { paymentStatus: 'failed' }, $push: { statusHistory: historyEvent('pending_payment', 'failed', 'payment', note) } },
    { new: true },
  )
}

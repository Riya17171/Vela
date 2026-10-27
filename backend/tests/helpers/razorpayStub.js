import crypto from 'node:crypto'

import { vi } from 'vitest'

import { computePaymentSignature, computeWebhookSignature, razorpayGateway } from '../../src/services/payment.service.js'

export const KEY_SECRET = 'fake_test_key_secret'
export const WEBHOOK_SECRET = 'fake_webhook_secret'

/**
 * In-memory stand-in for the Razorpay API, so automated tests never reach the
 * network. It models what the provider would report; it is not a payment.
 */
export function stubRazorpay() {
  const orders = new Map()
  const payments = new Map()
  const id = (prefix) => `${prefix}_${crypto.randomBytes(7).toString('hex')}`

  vi.spyOn(razorpayGateway, 'createOrder').mockImplementation(async ({ amount, currency, receipt, notes }) => {
    const order = { id: id('order'), entity: 'order', amount, currency, receipt, notes, status: 'created' }
    orders.set(order.id, order)
    return order
  })
  vi.spyOn(razorpayGateway, 'fetchPayment').mockImplementation(async (paymentId) => {
    const payment = payments.get(paymentId)
    if (!payment) throw { statusCode: 400, error: { code: 'BAD_REQUEST_ERROR', description: 'The id provided does not exist' } }
    return { ...payment }
  })
  vi.spyOn(razorpayGateway, 'capturePayment').mockImplementation(async (paymentId) => {
    const payment = payments.get(paymentId)
    payment.status = 'captured'
    return { ...payment }
  })
  vi.spyOn(razorpayGateway, 'fetchOrderPayments').mockImplementation(async (orderId) => ({
    items: [...payments.values()].filter((payment) => payment.order_id === orderId),
  }))
  vi.spyOn(razorpayGateway, 'refundPayment').mockImplementation(async (paymentId, { amount }) => ({
    id: id('rfnd'), entity: 'refund', payment_id: paymentId, amount, status: 'processed',
  }))

  return {
    orders,
    payments,
    /** Simulates the customer completing Razorpay Checkout. */
    pay(razorpayOrderId, { status = 'captured', amount, method = 'upi' } = {}) {
      const order = orders.get(razorpayOrderId)
      const payment = {
        id: id('pay'), entity: 'payment', order_id: razorpayOrderId, amount: amount ?? order.amount,
        currency: order.currency, status, method,
        ...(status === 'failed' && { error_code: 'BAD_REQUEST_ERROR', error_description: 'Payment declined by the bank' }),
      }
      payments.set(payment.id, payment)
      return {
        payment,
        callback: {
          razorpayOrderId,
          razorpayPaymentId: payment.id,
          razorpaySignature: computePaymentSignature(razorpayOrderId, payment.id, KEY_SECRET),
        },
      }
    },
  }
}

export function signedWebhook(event, payload) {
  const raw = Buffer.from(JSON.stringify({ entity: 'event', event, payload, created_at: Math.floor(Date.now() / 1000) }))
  return { raw, signature: computeWebhookSignature(raw, WEBHOOK_SECRET) }
}

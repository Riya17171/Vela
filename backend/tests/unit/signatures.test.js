import crypto from 'node:crypto'

import { describe, expect, it } from 'vitest'

import {
  computePaymentSignature,
  isValidPaymentSignature,
  isValidWebhookSignature,
} from '../../src/services/payment.service.js'
import { timingSafeEqualHex } from '../../src/utils/generateToken.js'

const SECRET = 'fake_test_key_secret'

describe('Razorpay payment signature', () => {
  it('matches the documented HMAC-SHA256 of "order_id|payment_id"', () => {
    const expected = crypto.createHmac('sha256', SECRET).update('order_ABC123|pay_XYZ789').digest('hex')
    expect(computePaymentSignature('order_ABC123', 'pay_XYZ789', SECRET)).toBe(expected)
  })

  it('accepts a valid signature', () => {
    const razorpaySignature = computePaymentSignature('order_ABC123', 'pay_XYZ789', SECRET)
    expect(isValidPaymentSignature({ razorpayOrderId: 'order_ABC123', razorpayPaymentId: 'pay_XYZ789', razorpaySignature }, SECRET)).toBe(true)
  })

  it('rejects a signature for a different payment, order or secret', () => {
    const razorpaySignature = computePaymentSignature('order_ABC123', 'pay_XYZ789', SECRET)
    expect(isValidPaymentSignature({ razorpayOrderId: 'order_ABC123', razorpayPaymentId: 'pay_OTHER1', razorpaySignature }, SECRET)).toBe(false)
    expect(isValidPaymentSignature({ razorpayOrderId: 'order_OTHER', razorpayPaymentId: 'pay_XYZ789', razorpaySignature }, SECRET)).toBe(false)
    expect(isValidPaymentSignature({ razorpayOrderId: 'order_ABC123', razorpayPaymentId: 'pay_XYZ789', razorpaySignature }, 'other_secret')).toBe(false)
  })

  it('rejects malformed input without throwing', () => {
    expect(isValidPaymentSignature({ razorpayOrderId: 'a', razorpayPaymentId: 'b', razorpaySignature: 'short' }, SECRET)).toBe(false)
    expect(isValidPaymentSignature({ razorpayOrderId: 'a', razorpayPaymentId: 'b', razorpaySignature: undefined }, SECRET)).toBe(false)
    expect(isValidPaymentSignature({ razorpayOrderId: 'a', razorpayPaymentId: 'b', razorpaySignature: 'x' }, null)).toBe(false)
  })
})

describe('Razorpay webhook signature', () => {
  const body = Buffer.from(JSON.stringify({ event: 'payment.captured' }))
  const signature = crypto.createHmac('sha256', 'whsec').update(body).digest('hex')

  it('verifies the HMAC of the raw body', () => {
    expect(isValidWebhookSignature(body, signature, 'whsec')).toBe(true)
  })

  it('rejects a re-serialised (not byte-identical) body', () => {
    const reserialised = Buffer.from(JSON.stringify({ event: 'payment.captured' }, null, 2))
    expect(isValidWebhookSignature(reserialised, signature, 'whsec')).toBe(false)
  })

  it('rejects missing signatures, secrets and non-buffer bodies', () => {
    expect(isValidWebhookSignature(body, undefined, 'whsec')).toBe(false)
    expect(isValidWebhookSignature(body, signature, null)).toBe(false)
    expect(isValidWebhookSignature(body.toString(), signature, 'whsec')).toBe(false)
  })
})

describe('timingSafeEqualHex', () => {
  it('compares equal-length strings in constant time and rejects different lengths', () => {
    expect(timingSafeEqualHex('abcd', 'abcd')).toBe(true)
    expect(timingSafeEqualHex('abcd', 'abce')).toBe(false)
    expect(timingSafeEqualHex('abcd', 'abcde')).toBe(false)
    expect(timingSafeEqualHex(null, 'abcd')).toBe(false)
  })
})

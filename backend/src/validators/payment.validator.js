import { z } from 'zod'

import { objectId } from './common.js'

const providerId = (prefix, label) =>
  z.string({ error: `${label} is required` }).trim().regex(new RegExp(`^${prefix}_[A-Za-z0-9]{6,40}$`), `${label} is malformed`)

export const createPaymentOrderBody = z.strictObject({ orderId: objectId('orderId') })

export const verifyPaymentBody = z.strictObject({
  orderId: objectId('orderId'),
  razorpayOrderId: providerId('order', 'razorpayOrderId'),
  razorpayPaymentId: providerId('pay', 'razorpayPaymentId'),
  razorpaySignature: z.string({ error: 'razorpaySignature is required' }).trim().regex(/^[a-f0-9]{64}$/, 'razorpaySignature is malformed'),
})

export const paymentIdParams = z.strictObject({ paymentId: objectId('paymentId') })

export const clientFailureBody = z.strictObject({
  code: z.string().trim().max(80).optional(),
  description: z.string().trim().max(500).optional(),
  razorpayPaymentId: z.string().trim().max(60).optional(),
})

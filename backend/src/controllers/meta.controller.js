import { businessRules } from '../config/businessRules.js'
import { isDatabaseConnected } from '../config/database.js'
import { env } from '../config/env.js'
import { razorpayConfig } from '../config/razorpay.js'
import { NewsletterSubscriber } from '../models/NewsletterSubscriber.js'
import { sendSuccess } from '../utils/ApiResponse.js'

export function health(_req, res) {
  const database = isDatabaseConnected() ? 'connected' : 'disconnected'
  const ok = database === 'connected'
  res.status(ok ? 200 : 503).json({
    success: ok,
    message: ok ? 'Vela API is running' : 'Vela API is running but not ready',
    data: { status: ok ? 'ok' : 'degraded', database, uptimeSeconds: Math.round(process.uptime()) },
  })
}

/** Non-secret settings the storefront needs to render prices and checkout. */
export function publicConfig(_req, res) {
  sendSuccess(res, {
    message: 'Public configuration',
    data: {
      currency: businessRules.currency,
      taxRate: businessRules.taxRate,
      shippingFee: businessRules.shippingFee,
      freeShippingThreshold: businessRules.freeShippingThreshold,
      maxCartItemQuantity: businessRules.maxCartItemQuantity,
      maxCompareItems: businessRules.maxCompareItems,
      reservationMinutes: businessRules.reservationMinutes,
      payments: { enabled: razorpayConfig.enabled, provider: 'razorpay', keyId: razorpayConfig.keyId, testMode: razorpayConfig.testMode },
      uploadsEnabled: env.uploadsEnabled,
    },
  })
}

export async function subscribe(req, res) {
  await NewsletterSubscriber.updateOne(
    { email: req.validated.body.email },
    { $setOnInsert: { email: req.validated.body.email, source: 'journal' } },
    { upsert: true },
  )
  // Same response whether new or existing, so the endpoint cannot be used to probe addresses.
  sendSuccess(res, { message: 'You are on the list. Expect four letters a year.' })
}

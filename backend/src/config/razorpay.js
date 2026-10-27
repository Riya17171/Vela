import Razorpay from 'razorpay'

import { env } from './env.js'

let client = null

export function getRazorpayClient() {
  if (!env.razorpayEnabled) return null
  if (!client) {
    client = new Razorpay({ key_id: env.RAZORPAY_KEY_ID, key_secret: env.RAZORPAY_KEY_SECRET })
  }
  return client
}

export const razorpayConfig = Object.freeze({
  enabled: env.razorpayEnabled,
  webhookEnabled: env.razorpayWebhookEnabled,
  keyId: env.RAZORPAY_KEY_ID ?? null,
  keySecret: env.RAZORPAY_KEY_SECRET ?? null,
  webhookSecret: env.RAZORPAY_WEBHOOK_SECRET ?? null,
  testMode: Boolean(env.RAZORPAY_KEY_ID?.startsWith('rzp_test_')),
})

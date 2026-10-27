import { useCallback, useState } from 'react'

import { createPaymentOrder, reconcilePayment, reportPaymentFailure, verifyPayment } from '../services/payments.js'

const CHECKOUT_SCRIPT = 'https://checkout.razorpay.com/v1/checkout.js'
let scriptPromise = null

function loadCheckoutScript() {
  if (window.Razorpay) return Promise.resolve()
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = CHECKOUT_SCRIPT
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        scriptPromise = null
        reject(new Error('Could not load Razorpay Checkout. Check your connection or disable blockers for checkout.razorpay.com.'))
      }
      document.body.appendChild(script)
    })
  }
  return scriptPromise
}

/**
 * Opens Razorpay Checkout for an existing pending order and resolves with
 * the server's verdict. The browser never decides that a payment succeeded:
 *  - success callback -> POST /payments/verify (signature + provider check)
 *  - window dismissed -> POST /payments/:id/reconcile (ask Razorpay what happened)
 *
 * Resolves to { outcome: 'paid' | 'pending' | 'dismissed', order }.
 */
export function useRazorpayCheckout() {
  const [stage, setStage] = useState('idle') // idle | preparing | awaiting_payment | verifying

  const pay = useCallback(async (orderId, { theme = '#1A1916' } = {}) => {
    setStage('preparing')
    try {
      const [checkout] = await Promise.all([createPaymentOrder(orderId), loadCheckoutScript()])
      setStage('awaiting_payment')

      return await new Promise((resolve, reject) => {
        let settled = false
        const settle = (fn) => (value) => {
          if (settled) return
          settled = true
          fn(value)
        }
        const done = settle(resolve)
        const fail = settle(reject)

        const razorpay = new window.Razorpay({
          key: checkout.keyId,
          order_id: checkout.razorpayOrderId,
          amount: checkout.amount,
          currency: checkout.currency,
          name: checkout.name,
          description: checkout.description,
          prefill: checkout.prefill,
          notes: { orderNumber: checkout.orderNumber },
          theme: { color: theme },
          handler: async (response) => {
            setStage('verifying')
            try {
              const result = await verifyPayment({
                orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              })
              done({ outcome: result.order.paymentStatus === 'paid' ? 'paid' : 'pending', order: result.order })
            } catch (error) {
              fail(error)
            }
          },
          modal: {
            // Closing the window is not proof of failure: ask the server/provider.
            ondismiss: async () => {
              setStage('verifying')
              try {
                const result = await reconcilePayment(checkout.paymentId)
                done({ outcome: result.order.paymentStatus === 'paid' ? 'paid' : 'dismissed', order: result.order })
              } catch (error) {
                fail(error)
              }
            },
          },
        })

        razorpay.on('payment.failed', (response) => {
          // Razorpay keeps the window open so the customer can retry; we only record the attempt.
          reportPaymentFailure(checkout.paymentId, {
            code: response.error?.code,
            description: response.error?.description,
            razorpayPaymentId: response.error?.metadata?.payment_id,
          }).catch(() => {})
        })
        razorpay.open()
      })
    } finally {
      setStage('idle')
    }
  }, [])

  return { pay, stage, busy: stage !== 'idle' }
}

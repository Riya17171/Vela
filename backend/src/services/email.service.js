import nodemailer from 'nodemailer'

import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

let transport = null
if (env.emailEnabled) {
  transport = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER ? { user: env.SMTP_USER, pass: env.SMTP_PASS } : undefined,
  })
}

async function send({ to, subject, text, html }) {
  if (!transport) return false
  await transport.sendMail({ from: env.EMAIL_FROM, to, subject, text, html })
  return true
}

export async function sendPasswordResetEmail(to, resetUrl) {
  const subject = 'Reset your Vela password'
  const text = `A password reset was requested for your Vela account.\n\nReset it here (valid for ${env.PASSWORD_RESET_TTL_MINUTES} minutes):\n${resetUrl}\n\nIf you did not ask for this, ignore this email.`

  if (transport) {
    try {
      await send({ to, subject, text })
      return
    } catch (error) {
      // Never surface delivery failures to the requester (it would reveal the account exists).
      logger.error({ err: error }, 'Password reset email failed to send')
      return
    }
  }

  if (env.isDevelopment) {
    // Development-only fallback: the link is printed to the server console, never returned over HTTP.
    logger.warn({ to, resetUrl }, 'SMTP not configured — password reset link (development only)')
  } else if (!env.isTest) {
    logger.error('SMTP is not configured; password reset emails cannot be delivered')
  }
}

export async function sendOrderConfirmationEmail(order) {
  if (!transport) return
  try {
    await send({
      to: order.contactEmail,
      subject: `Vela order ${order.orderNumber} confirmed`,
      text: `Thank you. Your payment for order ${order.orderNumber} was received and the order is confirmed.\n\nView it: ${env.APP_URL}/orders/${order._id}`,
    })
  } catch (error) {
    logger.error({ err: error, orderId: String(order._id) }, 'Order confirmation email failed')
  }
}

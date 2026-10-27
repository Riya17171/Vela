import rateLimit from 'express-rate-limit'

import { env } from '../config/env.js'

function limiter({ max, message, failedOnly = false }) {
  return rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MINUTES * 60_000,
    limit: max,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    skip: () => env.isTest,
    // Brute-force protection only needs to count failures; successful sign-ins don't use up the budget.
    skipSuccessfulRequests: failedOnly,
    handler: (_req, res) => res.status(429).json({ success: false, message, code: 'RATE_LIMITED' }),
  })
}

export const authLimiter = limiter({
  max: env.RATE_LIMIT_AUTH_MAX,
  failedOnly: true,
  message: 'Too many attempts. Please wait a few minutes and try again.',
})

export const apiLimiter = limiter({
  max: env.RATE_LIMIT_API_MAX,
  message: 'Too many requests. Please slow down.',
})

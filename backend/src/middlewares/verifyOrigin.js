import { env } from '../config/env.js'
import { ApiError } from '../utils/ApiError.js'

/**
 * CSRF guard for the cookie-authenticated endpoints (/auth/refresh,
 * /auth/logout). Browsers always send Origin on cross-site POSTs, so a
 * forged request from another site is rejected; non-browser clients such
 * as Postman send no Origin and are allowed.
 */
export function verifyOrigin(req, _res, next) {
  const origin = req.get('origin')
  if (origin && !env.clientOrigins.includes(origin.replace(/\/$/, ''))) {
    throw ApiError.forbidden('Request origin is not allowed', { code: 'ORIGIN_NOT_ALLOWED' })
  }
  next()
}

import { env } from '../config/env.js'

export const REFRESH_COOKIE = 'vela_rt'
// Scoped to the auth routes so the refresh token is never sent anywhere else.
const REFRESH_COOKIE_PATH = '/api/v1/auth'

function baseOptions() {
  return {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAMESITE,
    path: REFRESH_COOKIE_PATH,
    ...(env.COOKIE_DOMAIN && { domain: env.COOKIE_DOMAIN }),
  }
}

export function setRefreshCookie(res, token, expiresAt) {
  res.cookie(REFRESH_COOKIE, token, { ...baseOptions(), expires: expiresAt })
}

export function clearRefreshCookie(res) {
  res.clearCookie(REFRESH_COOKIE, baseOptions())
}

export function requestContext(req) {
  return { ip: req.ip, userAgent: req.get('user-agent') }
}

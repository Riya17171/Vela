import * as authService from '../services/auth.service.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { sendCreated, sendSuccess } from '../utils/ApiResponse.js'
import { clearRefreshCookie, REFRESH_COOKIE, requestContext, setRefreshCookie } from '../utils/cookies.js'

// The refresh token only ever travels in the httpOnly cookie, never in JSON.
function respondWithSession(res, session, { message, created = false }) {
  setRefreshCookie(res, session.refreshToken, session.refreshTokenExpiresAt)
  const send = created ? sendCreated : sendSuccess
  return send(res, { message, data: { user: session.user, accessToken: session.accessToken } })
}

export async function register(req, res) {
  const session = await authService.register(req.validated.body, requestContext(req))
  respondWithSession(res, session, { message: 'Account created', created: true })
}

export async function login(req, res) {
  const session = await authService.login(req.validated.body, requestContext(req))
  respondWithSession(res, session, { message: 'Signed in' })
}

export async function refresh(req, res) {
  try {
    const session = await authService.refresh(req.cookies?.[REFRESH_COOKIE], requestContext(req))
    respondWithSession(res, session, { message: 'Session refreshed' })
  } catch (error) {
    if (error instanceof ApiError && error.statusCode === 401 && error.code !== 'REFRESH_TOKEN_REVOKED') clearRefreshCookie(res)
    throw error
  }
}

export async function logout(req, res) {
  await authService.logout(req.cookies?.[REFRESH_COOKIE])
  clearRefreshCookie(res)
  sendSuccess(res, { message: 'Signed out' })
}

export async function me(req, res) {
  const user = await User.findById(req.user.id)
  if (!user) throw ApiError.unauthorized()
  sendSuccess(res, { message: 'Current user', data: { user: user.toSafeJSON() } })
}

export async function forgotPassword(req, res) {
  await authService.requestPasswordReset(req.validated.body.email)
  sendSuccess(res, { message: 'If an account exists for that email, a reset link has been sent.' })
}

export async function resetPassword(req, res) {
  await authService.resetPassword(req.validated.body)
  clearRefreshCookie(res)
  sendSuccess(res, { message: 'Password updated. Please sign in with your new password.' })
}

export async function changePassword(req, res) {
  const session = await authService.changePassword(req.user.id, req.validated.body, requestContext(req))
  respondWithSession(res, session, { message: 'Password changed. Other sessions have been signed out.' })
}

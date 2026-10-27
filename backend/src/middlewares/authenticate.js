import jwt from 'jsonwebtoken'

import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { verifyAccessToken } from '../utils/generateToken.js'

function extractBearer(req) {
  const header = req.get('authorization')
  if (!header) return null
  const [scheme, token] = header.split(' ')
  return scheme?.toLowerCase() === 'bearer' && token ? token : null
}

/**
 * Resolves the access token to a live user. Loading the user on every
 * request lets suspensions and password changes (tokenVersion) take effect
 * immediately instead of when the token happens to expire.
 */
async function resolveUser(token) {
  let payload
  try {
    payload = verifyAccessToken(token)
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw ApiError.unauthorized('Access token expired', { code: 'TOKEN_EXPIRED' })
    }
    throw ApiError.unauthorized('Invalid access token', { code: 'INVALID_TOKEN' })
  }

  const user = await User.findById(payload.sub, 'fullName email role status tokenVersion')
  if (!user || user.tokenVersion !== payload.tv) {
    throw ApiError.unauthorized('Session has been revoked', { code: 'TOKEN_REVOKED' })
  }
  if (user.status !== 'active') throw ApiError.forbidden('This account has been suspended', { code: 'ACCOUNT_SUSPENDED' })

  return { id: String(user._id), role: user.role, email: user.email, fullName: user.fullName }
}

export async function authenticate(req, _res, next) {
  const token = extractBearer(req)
  if (!token) throw ApiError.unauthorized('Authentication required', { code: 'NO_TOKEN' })
  req.user = await resolveUser(token)
  next()
}

/** Attaches req.user when a valid token is present; anonymous otherwise. */
export async function optionalAuthenticate(req, _res, next) {
  const token = extractBearer(req)
  if (token) {
    try {
      req.user = await resolveUser(token)
    } catch {
      req.user = undefined
    }
  }
  next()
}

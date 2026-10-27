import crypto from 'node:crypto'

import bcrypt from 'bcryptjs'

import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { RefreshToken } from '../models/RefreshToken.js'
import { User } from '../models/User.js'
import { ApiError } from '../utils/ApiError.js'
import { generateOpaqueToken, hashToken, signAccessToken } from '../utils/generateToken.js'
import { sendPasswordResetEmail } from './email.service.js'

const INVALID_CREDENTIALS = 'Invalid email or password'
// Compared against when the email is unknown so both paths cost one bcrypt check.
const DUMMY_HASH = bcrypt.hashSync('vela-timing-equaliser', env.BCRYPT_ROUNDS)
// A token rotated this recently may be replayed by a concurrent tab/request; don't treat it as theft.
const ROTATION_GRACE_MS = 10_000

function refreshExpiry() {
  return new Date(Date.now() + env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000)
}

async function issueRefreshToken(userId, { family, context } = {}) {
  const token = generateOpaqueToken()
  const doc = await RefreshToken.create({
    user: userId,
    tokenHash: hashToken(token),
    family: family ?? crypto.randomUUID(),
    expiresAt: refreshExpiry(),
    userAgent: context?.userAgent?.slice(0, 300),
    ip: context?.ip,
  })
  return { token, doc }
}

function sessionPayload(user, refresh) {
  return {
    user: user.toSafeJSON(),
    accessToken: signAccessToken(user),
    refreshToken: refresh.token,
    refreshTokenExpiresAt: refresh.doc.expiresAt,
  }
}

export async function register({ fullName, email, password }, context) {
  const existing = await User.exists({ email })
  if (existing) throw ApiError.conflict('An account with this email already exists', { code: 'EMAIL_TAKEN' })

  const user = new User({ fullName, email, role: 'user' })
  await user.setPassword(password)
  try {
    await user.save()
  } catch (error) {
    if (error?.code === 11000) throw ApiError.conflict('An account with this email already exists', { code: 'EMAIL_TAKEN' })
    throw error
  }

  logger.info({ userId: String(user._id) }, 'User registered')
  return sessionPayload(user, await issueRefreshToken(user._id, { context }))
}

export async function login({ email, password }, context) {
  const user = await User.findOne({ email }).select('+passwordHash')
  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)
  if (!user || !passwordMatches) throw ApiError.unauthorized(INVALID_CREDENTIALS, { code: 'INVALID_CREDENTIALS' })

  if (user.status !== 'active') throw ApiError.forbidden('This account has been suspended', { code: 'ACCOUNT_SUSPENDED' })

  user.lastLoginAt = new Date()
  await user.save()
  return sessionPayload(user, await issueRefreshToken(user._id, { context }))
}

/**
 * Rotates a refresh token. Presenting a token that was already rotated (and
 * not within the short concurrency grace window) means it was stolen or
 * replayed, so the whole session family is revoked.
 */
export async function refresh(rawToken, context) {
  if (!rawToken) throw ApiError.unauthorized('No active session', { code: 'NO_REFRESH_TOKEN' })

  const stored = await RefreshToken.findOne({ tokenHash: hashToken(rawToken) })
  if (!stored) throw ApiError.unauthorized('Session is invalid or has expired', { code: 'INVALID_REFRESH_TOKEN' })

  if (stored.revokedAt) {
    const benignRace = stored.revokedReason === 'rotated' && Date.now() - stored.revokedAt.getTime() < ROTATION_GRACE_MS
    if (!benignRace) {
      await RefreshToken.updateMany(
        { family: stored.family, revokedAt: null },
        { $set: { revokedAt: new Date(), revokedReason: 'reuse_detected' } },
      )
      logger.warn({ userId: String(stored.user), family: stored.family }, 'Refresh token reuse detected; session family revoked')
    }
    throw ApiError.unauthorized('Session is no longer valid. Please sign in again.', { code: 'REFRESH_TOKEN_REVOKED' })
  }
  if (stored.expiresAt <= new Date()) throw ApiError.unauthorized('Session has expired', { code: 'REFRESH_TOKEN_EXPIRED' })

  const user = await User.findById(stored.user)
  if (!user || user.status !== 'active') {
    await RefreshToken.updateMany({ family: stored.family, revokedAt: null }, { $set: { revokedAt: new Date(), revokedReason: 'admin' } })
    throw ApiError.unauthorized('Session is no longer valid', { code: 'ACCOUNT_UNAVAILABLE' })
  }

  const next = await issueRefreshToken(user._id, { family: stored.family, context })
  // Conditional revoke: if a concurrent request rotated it first, drop our new token.
  const rotated = await RefreshToken.updateOne(
    { _id: stored._id, revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: 'rotated', replacedByHash: next.doc.tokenHash } },
  )
  if (rotated.modifiedCount === 0) {
    await RefreshToken.deleteOne({ _id: next.doc._id })
    throw ApiError.unauthorized('Session was refreshed by another request. Please retry.', { code: 'REFRESH_TOKEN_REVOKED' })
  }

  return sessionPayload(user, next)
}

export async function logout(rawToken) {
  if (!rawToken) return
  await RefreshToken.updateOne(
    { tokenHash: hashToken(rawToken), revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: 'logout' } },
  )
}

export async function revokeAllSessions(userId, reason = 'password_change') {
  await RefreshToken.updateMany({ user: userId, revokedAt: null }, { $set: { revokedAt: new Date(), revokedReason: reason } })
}

/**
 * Changes the password, invalidates every access token (tokenVersion) and
 * refresh session, then starts one fresh session for the current device.
 */
export async function changePassword(userId, { currentPassword, newPassword }, context) {
  const user = await User.findById(userId).select('+passwordHash')
  if (!user) throw ApiError.unauthorized()
  if (!(await user.comparePassword(currentPassword))) {
    throw ApiError.badRequest('Current password is incorrect', {
      code: 'INVALID_CURRENT_PASSWORD',
      errors: [{ field: 'currentPassword', message: 'Current password is incorrect' }],
    })
  }
  if (await user.comparePassword(newPassword)) {
    throw ApiError.badRequest('New password must be different from the current one', {
      errors: [{ field: 'newPassword', message: 'Choose a password you have not used here' }],
    })
  }

  await user.setPassword(newPassword)
  user.tokenVersion += 1
  await user.save()
  await revokeAllSessions(user._id, 'password_change')
  return sessionPayload(user, await issueRefreshToken(user._id, { context }))
}

/** Always resolves the same way whether or not the account exists. */
export async function requestPasswordReset(email) {
  const user = await User.findOne({ email, status: 'active' })
  if (!user) return

  const token = generateOpaqueToken(32)
  user.passwordResetTokenHash = hashToken(token)
  user.passwordResetExpiresAt = new Date(Date.now() + env.PASSWORD_RESET_TTL_MINUTES * 60_000)
  await user.save()

  const resetUrl = `${env.APP_URL.replace(/\/$/, '')}/reset-password?token=${encodeURIComponent(token)}`
  await sendPasswordResetEmail(user.email, resetUrl)
}

export async function resetPassword({ token, password }) {
  const user = await User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  }).select('+passwordResetTokenHash +passwordResetExpiresAt')
  if (!user) throw ApiError.badRequest('This reset link is invalid or has expired', { code: 'INVALID_RESET_TOKEN' })

  await user.setPassword(password)
  user.passwordResetTokenHash = undefined
  user.passwordResetExpiresAt = undefined
  user.tokenVersion += 1
  await user.save()
  await revokeAllSessions(user._id, 'password_change')
  logger.info({ userId: String(user._id) }, 'Password reset completed')
}

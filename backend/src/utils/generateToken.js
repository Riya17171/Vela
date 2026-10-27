import crypto from 'node:crypto'

import jwt from 'jsonwebtoken'

import { env } from '../config/env.js'

const ISSUER = 'vela-api'
const AUDIENCE = 'vela-client'

export function signAccessToken(user) {
  return jwt.sign(
    { sub: String(user._id), role: user.role, tv: user.tokenVersion },
    env.JWT_ACCESS_SECRET,
    { expiresIn: env.JWT_ACCESS_EXPIRES_IN, issuer: ISSUER, audience: AUDIENCE, algorithm: 'HS256' },
  )
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: ['HS256'],
  })
}

/** Opaque, high-entropy token for refresh sessions and password resets. */
export function generateOpaqueToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString('base64url')
}

/** Only this hash is ever stored; the raw token lives in the cookie or email link. */
export function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export function timingSafeEqualHex(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  const left = Buffer.from(a, 'utf8')
  const right = Buffer.from(b, 'utf8')
  if (left.length !== right.length) return false
  return crypto.timingSafeEqual(left, right)
}

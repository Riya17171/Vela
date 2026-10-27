import { beforeEach, describe, expect, it } from 'vitest'

import { RefreshToken } from '../../src/models/RefreshToken.js'
import { User } from '../../src/models/User.js'
import { hashToken } from '../../src/utils/generateToken.js'
import { api, bearer, createUser, PASSWORD, resetDatabase } from '../helpers/factories.js'

function refreshCookie(res) {
  return res.headers['set-cookie']?.find((cookie) => cookie.startsWith('vela_rt='))
}

function cookieValue(cookie) {
  return cookie.split(';')[0].split('=')[1]
}

beforeEach(resetDatabase)

describe('registration', () => {
  it('creates a user, hashes the password and starts a session', async () => {
    const res = await api().post('/api/v1/auth/register').send({ fullName: 'Asha Rao', email: 'Asha@Example.com', password: PASSWORD })
    expect(res.status).toBe(201)
    expect(res.body.data.user).toMatchObject({ email: 'asha@example.com', role: 'user' })
    expect(res.body.data.accessToken).toEqual(expect.any(String))
    expect(JSON.stringify(res.body)).not.toMatch(/passwordHash|refreshToken/)

    const cookie = refreshCookie(res)
    expect(cookie).toMatch(/HttpOnly/)
    expect(cookie).toMatch(/Path=\/api\/v1\/auth/)

    const stored = await User.findOne({ email: 'asha@example.com' }).select('+passwordHash')
    expect(stored.passwordHash).not.toBe(PASSWORD)
    expect(stored.passwordHash).toMatch(/^\$2[aby]\$/)
  })

  it('rejects duplicate emails with 409', async () => {
    await createUser({ email: 'taken@example.com' })
    const res = await api().post('/api/v1/auth/register').send({ fullName: 'Asha', email: 'TAKEN@example.com', password: PASSWORD })
    expect(res.status).toBe(409)
  })

  it('rejects weak passwords with field errors', async () => {
    const res = await api().post('/api/v1/auth/register').send({ fullName: 'Asha', email: 'a@example.com', password: 'password' })
    expect(res.status).toBe(400)
    expect(res.body.errors).toEqual(expect.arrayContaining([expect.objectContaining({ field: 'password' })]))
  })

  it('cannot be used to create an administrator', async () => {
    const res = await api().post('/api/v1/auth/register').send({ fullName: 'Mallory', email: 'm@example.com', password: PASSWORD, role: 'admin' })
    expect(res.status).toBe(400)
    expect(await User.countDocuments()).toBe(0)
  })
})

describe('login', () => {
  it('returns an access token and sets the refresh cookie', async () => {
    const user = await createUser({ email: 'client@example.com' })
    const res = await api().post('/api/v1/auth/login').send({ email: 'client@example.com', password: PASSWORD })
    expect(res.status).toBe(200)
    expect(res.body.data.user.id).toBe(String(user._id))
    expect(refreshCookie(res)).toBeDefined()
  })

  it('uses the same generic error for unknown email and wrong password', async () => {
    await createUser({ email: 'client@example.com' })
    const wrongPassword = await api().post('/api/v1/auth/login').send({ email: 'client@example.com', password: 'Wrong123' })
    const unknownEmail = await api().post('/api/v1/auth/login').send({ email: 'nobody@example.com', password: 'Wrong123' })
    expect(wrongPassword.status).toBe(401)
    expect(unknownEmail.status).toBe(401)
    expect(wrongPassword.body.message).toBe(unknownEmail.body.message)
  })

  it('blocks suspended accounts', async () => {
    await createUser({ email: 'gone@example.com', status: 'suspended' })
    const res = await api().post('/api/v1/auth/login').send({ email: 'gone@example.com', password: PASSWORD })
    expect(res.status).toBe(403)
  })

  it('rejects NoSQL operator injection in credentials', async () => {
    await createUser({ email: 'client@example.com' })
    const res = await api().post('/api/v1/auth/login').send({ email: { $gt: '' }, password: { $gt: '' } })
    expect(res.status).toBe(400)
  })
})

describe('protected routes', () => {
  it('requires a bearer token', async () => {
    expect((await api().get('/api/v1/auth/me')).status).toBe(401)
    expect((await api().get('/api/v1/auth/me').set('Authorization', 'Bearer not-a-jwt')).status).toBe(401)
  })

  it('returns the current user for a valid token', async () => {
    const user = await createUser()
    const res = await api().get('/api/v1/auth/me').set(bearer(user))
    expect(res.status).toBe(200)
    expect(res.body.data.user.email).toBe(user.email)
  })
})

describe('refresh token rotation', () => {
  it('rotates the refresh token and revokes the family when an old token is replayed', async () => {
    await createUser({ email: 'client@example.com' })
    const login = await api().post('/api/v1/auth/login').send({ email: 'client@example.com', password: PASSWORD })
    const firstCookie = refreshCookie(login)

    const rotated = await api().post('/api/v1/auth/refresh').set('Cookie', firstCookie)
    expect(rotated.status).toBe(200)
    expect(rotated.body.data.accessToken).toEqual(expect.any(String))
    const secondCookie = refreshCookie(rotated)
    expect(cookieValue(secondCookie)).not.toBe(cookieValue(firstCookie))

    // Age the rotation past the concurrency grace window, then replay the old token.
    await RefreshToken.updateOne({ tokenHash: hashToken(cookieValue(firstCookie)) }, { $set: { revokedAt: new Date(Date.now() - 60_000) } })
    const replay = await api().post('/api/v1/auth/refresh').set('Cookie', firstCookie)
    expect(replay.status).toBe(401)

    // The legitimate newer token is now dead too.
    const afterTheft = await api().post('/api/v1/auth/refresh').set('Cookie', secondCookie)
    expect(afterTheft.status).toBe(401)
    expect(await RefreshToken.countDocuments({ revokedReason: 'reuse_detected' })).toBeGreaterThan(0)
  })

  it('rejects refresh without a cookie or with an expired token', async () => {
    expect((await api().post('/api/v1/auth/refresh')).status).toBe(401)

    await createUser({ email: 'client@example.com' })
    const login = await api().post('/api/v1/auth/login').send({ email: 'client@example.com', password: PASSWORD })
    const cookie = refreshCookie(login)
    await RefreshToken.updateOne({ tokenHash: hashToken(cookieValue(cookie)) }, { $set: { expiresAt: new Date(Date.now() - 1000) } })
    expect((await api().post('/api/v1/auth/refresh').set('Cookie', cookie)).status).toBe(401)
  })

  it('rejects cookie-authenticated requests from a foreign origin (CSRF)', async () => {
    await createUser({ email: 'client@example.com' })
    const login = await api().post('/api/v1/auth/login').send({ email: 'client@example.com', password: PASSWORD })
    const res = await api().post('/api/v1/auth/refresh').set('Cookie', refreshCookie(login)).set('Origin', 'https://evil.example')
    expect(res.status).toBe(403)
  })

  it('logout revokes the refresh session', async () => {
    await createUser({ email: 'client@example.com' })
    const login = await api().post('/api/v1/auth/login').send({ email: 'client@example.com', password: PASSWORD })
    const cookie = refreshCookie(login)
    expect((await api().post('/api/v1/auth/logout').set('Cookie', cookie)).status).toBe(200)
    expect((await api().post('/api/v1/auth/refresh').set('Cookie', cookie)).status).toBe(401)
  })
})

describe('password management', () => {
  it('changes the password and invalidates existing access tokens and sessions', async () => {
    const user = await createUser({ email: 'client@example.com' })
    const oldToken = bearer(user)
    const login = await api().post('/api/v1/auth/login').send({ email: 'client@example.com', password: PASSWORD })

    const wrong = await api().patch('/api/v1/auth/change-password').set(oldToken).send({ currentPassword: 'Nope1234', newPassword: 'N3wPassword!' })
    expect(wrong.status).toBe(400)

    const res = await api().patch('/api/v1/auth/change-password').set(oldToken).send({ currentPassword: PASSWORD, newPassword: 'N3wPassword!' })
    expect(res.status).toBe(200)

    expect((await api().get('/api/v1/auth/me').set(oldToken)).status).toBe(401)
    expect((await api().post('/api/v1/auth/refresh').set('Cookie', refreshCookie(login))).status).toBe(401)
    expect((await api().get('/api/v1/auth/me').set('Authorization', `Bearer ${res.body.data.accessToken}`)).status).toBe(200)
    expect((await api().post('/api/v1/auth/login').send({ email: 'client@example.com', password: 'N3wPassword!' })).status).toBe(200)
  })

  it('handles forgot/reset with a hashed, expiring, single-use token', async () => {
    await createUser({ email: 'client@example.com' })
    const unknown = await api().post('/api/v1/auth/forgot-password').send({ email: 'nobody@example.com' })
    const known = await api().post('/api/v1/auth/forgot-password').send({ email: 'client@example.com' })
    expect(unknown.status).toBe(200)
    expect(known.body.message).toBe(unknown.body.message)

    // The raw token is only emailed; simulate the email by setting a known token's hash.
    const rawToken = 'a-known-reset-token-for-this-test-0123456789'
    await User.updateOne({ email: 'client@example.com' }, { $set: { passwordResetTokenHash: hashToken(rawToken), passwordResetExpiresAt: new Date(Date.now() + 60_000) } })

    const reset = await api().post('/api/v1/auth/reset-password').send({ token: rawToken, password: 'Res3tPassword!' })
    expect(reset.status).toBe(200)
    expect((await api().post('/api/v1/auth/reset-password').send({ token: rawToken, password: 'Another1Pass' })).status).toBe(400)
    expect((await api().post('/api/v1/auth/login').send({ email: 'client@example.com', password: 'Res3tPassword!' })).status).toBe(200)
  })

  it('rejects expired reset tokens', async () => {
    await createUser({ email: 'client@example.com' })
    const rawToken = 'an-expired-reset-token-for-this-test-012345'
    await User.updateOne({ email: 'client@example.com' }, { $set: { passwordResetTokenHash: hashToken(rawToken), passwordResetExpiresAt: new Date(Date.now() - 1000) } })
    expect((await api().post('/api/v1/auth/reset-password').send({ token: rawToken, password: 'Res3tPassword!' })).status).toBe(400)
  })
})

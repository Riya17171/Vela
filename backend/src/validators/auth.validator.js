import { z } from 'zod'

import { email, fullName, password } from './common.js'

export const registerBody = z.strictObject({ fullName, email, password })

export const loginBody = z.strictObject({
  email,
  // Login must not reveal password rules; any non-empty string is checked against the hash.
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required').max(128),
})

export const forgotPasswordBody = z.strictObject({ email })

export const resetPasswordBody = z.strictObject({
  token: z.string({ error: 'Reset token is required' }).min(20).max(200),
  password,
})

export const changePasswordBody = z.strictObject({
  currentPassword: z.string({ error: 'Current password is required' }).min(1).max(128),
  newPassword: password,
})

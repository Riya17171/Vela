import { z } from 'zod'

import { ACCOUNT_STATUSES } from '../models/User.js'
import { objectId, pageQuery } from './common.js'

export const adminUserListQuery = z.strictObject({
  ...pageQuery,
  search: z.string().trim().max(100).optional(),
  role: z.enum(['user', 'admin']).optional(),
})

export const userIdParams = z.strictObject({ userId: objectId('userId') })

export const userStatusBody = z.strictObject({ status: z.enum(ACCOUNT_STATUSES) })

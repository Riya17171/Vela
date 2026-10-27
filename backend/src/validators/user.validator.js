import { z } from 'zod'

import { addressFields, addressSchema, fullName, httpsUrl, idParam, objectId, phone } from './common.js'

// Strict: role, status, email, tokenVersion... are rejected, not ignored.
export const updateProfileBody = z
  .strictObject({
    fullName: fullName.optional(),
    phone: phone.or(z.literal('')).optional(),
    avatarUrl: httpsUrl.or(z.literal('')).optional(),
  })
  .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' })

export const createAddressBody = addressSchema

// Default-free fields so a partial update never resets `country`.
export const updateAddressBody = z
  .strictObject(addressFields)
  .partial()
  .refine((body) => Object.keys(body).length > 0, { message: 'Provide at least one field to update' })

export const addressIdParams = idParam('addressId')

export const recentlyViewedBody = z.strictObject({ productId: objectId('productId') })

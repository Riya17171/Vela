import { z } from 'zod'

import { isObjectId } from '../utils/objectId.js'

export const objectId = (label = 'id') =>
  z.string({ error: `${label} is required` }).refine(isObjectId, { message: `${label} must be a valid id` })

export const queryBoolean = z.enum(['true', 'false']).transform((value) => value === 'true')

export const pageQuery = {
  page: z.coerce.number().int().min(1).max(10_000).optional(),
  limit: z.coerce.number().int().min(1).max(200).optional(),
}

export const email = z
  .string({ error: 'Email is required' })
  .trim()
  .toLowerCase()
  .max(254)
  .pipe(z.email({ error: 'Enter a valid email address' }))

export const password = z
  .string({ error: 'Password is required' })
  .min(8, 'Password must be at least 8 characters')
  .max(128, 'Password must be at most 128 characters')
  .regex(/[a-z]/, 'Password needs a lowercase letter')
  .regex(/[A-Z]/, 'Password needs an uppercase letter')
  .regex(/\d/, 'Password needs a number')

export const fullName = z.string({ error: 'Full name is required' }).trim().min(2, 'Full name is too short').max(100)

export const phone = z
  .string()
  .trim()
  .regex(/^\+?[0-9\s-]{7,20}$/, 'Enter a valid phone number')

export const httpsUrl = z
  .string()
  .trim()
  .max(500)
  .pipe(z.url({ protocol: /^https$/, error: 'Must be an https:// URL' }))

export const addressFields = {
  label: z.string().trim().max(40).optional(),
  fullName,
  phone,
  line1: z.string({ error: 'Address line 1 is required' }).trim().min(3).max(200),
  line2: z.string().trim().max(200).optional(),
  city: z.string({ error: 'City is required' }).trim().min(2).max(100),
  state: z.string({ error: 'State is required' }).trim().min(2).max(100),
  postalCode: z
    .string({ error: 'Postal code is required' })
    .trim()
    .regex(/^[A-Za-z0-9\s-]{3,12}$/, 'Enter a valid postal code'),
  country: z.string().trim().toUpperCase().length(2, 'Use a 2-letter country code'),
  isDefault: z.boolean().optional(),
}

export const addressSchema = z.strictObject({ ...addressFields, country: addressFields.country.default('IN') })

export const idParam = (name, label = name) => z.strictObject({ [name]: objectId(label) })

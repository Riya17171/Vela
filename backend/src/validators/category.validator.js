import { z } from 'zod'

import { httpsUrl, objectId } from './common.js'

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens')

const fields = {
  name: z.string().trim().min(2).max(80),
  slug: slug.optional(),
  description: z.string().trim().max(500).optional(),
  imageUrl: httpsUrl.or(z.literal('')).optional(),
  colorLabel: z.string().trim().max(30).optional(),
  sizeLabel: z.string().trim().max(30).optional(),
  sortOrder: z.number().int().min(0).max(1000).optional(),
  isActive: z.boolean().optional(),
}

export const createCategoryBody = z.strictObject(fields)

export const updateCategoryBody = z
  .strictObject(Object.fromEntries(Object.entries(fields).map(([key, schema]) => [key, schema.optional()])))
  .refine((body) => Object.values(body).some((value) => value !== undefined), { message: 'Provide at least one field to update' })

export const categorySlugParams = z.strictObject({ slug })
export const categoryIdParams = z.strictObject({ categoryId: objectId('categoryId') })

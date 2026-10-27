import { z } from 'zod'

import { PRODUCT_STATUSES } from '../models/Product.js'
import { PRODUCT_SORTS } from '../services/catalog.service.js'
import { httpsUrl, objectId, pageQuery, queryBoolean } from './common.js'

const slug = z
  .string()
  .trim()
  .toLowerCase()
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and hyphens')

const money = z.coerce.number().int('Use whole numbers in the smallest currency unit (paise)').min(0).max(1_000_000_000)

export const productListQuery = z
  .strictObject({
    ...pageQuery,
    search: z.string().trim().max(100).optional(),
    category: slug.optional(),
    minPrice: money.optional(),
    maxPrice: money.optional(),
    sort: z.enum(Object.keys(PRODUCT_SORTS)).optional(),
    size: z.string().trim().max(20).optional(),
    colour: z.string().trim().max(40).optional(),
    featured: queryBoolean.optional(),
    inStock: queryBoolean.optional(),
    ids: z
      .string()
      .trim()
      .transform((value) => value.split(',').map((part) => part.trim()).filter(Boolean))
      .pipe(z.array(objectId('ids')).max(12))
      .optional(),
  })
  .refine((q) => q.minPrice === undefined || q.maxPrice === undefined || q.minPrice <= q.maxPrice, {
    message: 'minPrice must not exceed maxPrice',
    path: ['minPrice'],
  })

export const adminProductListQuery = productListQuery.safeExtend({
  status: z.enum(PRODUCT_STATUSES).optional(),
  lowStock: queryBoolean.optional(),
})

export const productIdOrSlugParams = z.strictObject({
  idOrSlug: z.string().trim().min(1).max(120),
})

export const productIdParams = z.strictObject({ productId: objectId('productId') })

const imageInput = z.strictObject({
  url: httpsUrl,
  alt: z.string().trim().max(200).optional(),
  storageId: z.string().trim().max(300).optional(),
})

const colorInput = z.strictObject({
  name: z.string().trim().min(1).max(40),
  hex: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a #RRGGBB colour'),
})

const attributeInput = z.strictObject({
  name: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(200),
})

const productFields = {
  title: z.string().trim().min(2).max(160),
  slug: slug,
  description: z.string().trim().min(10).max(4000),
  price: money,
  category: objectId('category'),
  images: z.array(imageInput).min(1, 'Add at least one image').max(8),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9-]{3,40}$/, 'SKU may contain letters, numbers and hyphens'),
  sizes: z.array(z.string().trim().min(1).max(20)).max(20),
  colors: z.array(colorInput).max(12),
  stock: z.coerce.number().int().min(0).max(1_000_000),
  isFeatured: z.boolean(),
  status: z.enum(PRODUCT_STATUSES),
  attributes: z.array(attributeInput).max(20),
}

// ratingAverage/ratingCount/currency are server-controlled and therefore not accepted.
export const createProductBody = z.strictObject({
  ...productFields,
  slug: productFields.slug.optional(),
  sizes: productFields.sizes.default([]),
  colors: productFields.colors.default([]),
  isFeatured: productFields.isFeatured.default(false),
  status: productFields.status.default('active'),
  attributes: productFields.attributes.default([]),
})

// Built from the default-free fields so omitted keys stay untouched on PATCH.
export const updateProductBody = z
  .strictObject(Object.fromEntries(Object.entries(productFields).map(([key, schema]) => [key, schema.optional()])))
  .refine((body) => Object.values(body).some((value) => value !== undefined), { message: 'Provide at least one field to update' })

export const inventoryBody = z
  .strictObject({
    stock: z.number().int().min(0).max(1_000_000).optional(),
    adjustment: z.number().int().min(-1_000_000).max(1_000_000).refine((value) => value !== 0, 'Adjustment cannot be zero').optional(),
  })
  .refine((body) => (body.stock === undefined) !== (body.adjustment === undefined), {
    message: 'Send either stock (absolute) or adjustment (relative), not both',
  })

export const recommendationsQuery = z.strictObject({ limit: z.coerce.number().int().min(1).max(24).optional() })

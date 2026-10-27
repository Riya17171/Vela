import { z } from 'zod'

import { ADMIN_SETTABLE_STATUSES, FULFILMENT_STATUSES, ORDER_PAYMENT_STATUSES } from '../services/orderStatus.js'
import { addressSchema, email, objectId, pageQuery } from './common.js'

// No prices, totals or statuses are accepted here: the server derives them.
export const createOrderBody = z
  .strictObject({
    addressId: objectId('addressId').optional(),
    shippingAddress: addressSchema.omit({ label: true, isDefault: true }).optional(),
    contactEmail: email.optional(),
    saveAddress: z.boolean().optional(),
    idempotencyKey: z
      .string()
      .trim()
      .regex(/^[A-Za-z0-9_-]{8,100}$/, 'idempotencyKey must be 8-100 URL-safe characters')
      .optional(),
  })
  .refine((body) => Boolean(body.addressId) !== Boolean(body.shippingAddress), {
    message: 'Provide either addressId or shippingAddress',
    path: ['shippingAddress'],
  })

export const orderIdParams = z.strictObject({ orderId: objectId('orderId') })

export const myOrdersQuery = z.strictObject({ ...pageQuery })

export const cancelOrderBody = z.strictObject({ reason: z.string().trim().max(300).optional() })

export const adminOrderListQuery = z.strictObject({
  ...pageQuery,
  status: z.enum(FULFILMENT_STATUSES).optional(),
  paymentStatus: z.enum(ORDER_PAYMENT_STATUSES).optional(),
  needsAttention: z.enum(['true', 'false']).transform((value) => value === 'true').optional(),
  search: z.string().trim().max(60).optional(),
})

export const adminStatusBody = z.strictObject({
  status: z.enum(ADMIN_SETTABLE_STATUSES, { error: `status must be one of: ${ADMIN_SETTABLE_STATUSES.join(', ')}` }),
  note: z.string().trim().max(300).optional(),
})

export const refundBody = z.strictObject({ reason: z.string().trim().max(300).optional() })

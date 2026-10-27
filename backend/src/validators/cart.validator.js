import { z } from 'zod'

import { businessRules } from '../config/businessRules.js'
import { objectId } from './common.js'

const quantity = z
  .number({ error: 'Quantity must be a number' })
  .int('Quantity must be a whole number')
  .min(1, 'Quantity must be at least 1')
  .max(businessRules.maxCartItemQuantity, `You can reserve at most ${businessRules.maxCartItemQuantity} of a piece`)

export const addCartItemBody = z.strictObject({
  productId: objectId('productId'),
  quantity: quantity.default(1),
  size: z.string().trim().min(1).max(20).nullable().optional(),
  color: z.string().trim().min(1).max(40).nullable().optional(),
})

export const updateCartItemBody = z.strictObject({ quantity })
export const cartItemParams = z.strictObject({ itemId: objectId('itemId') })

export const addWishlistItemBody = z.strictObject({ productId: objectId('productId') })
export const wishlistItemParams = z.strictObject({ productId: objectId('productId') })

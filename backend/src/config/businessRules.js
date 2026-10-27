import { env } from './env.js'

// Adjustable commercial settings. All money values are integers in the
// smallest currency unit (paise for INR).
export const businessRules = Object.freeze({
  currency: env.CURRENCY,
  taxRate: env.TAX_RATE,
  shippingFee: env.SHIPPING_FEE,
  freeShippingThreshold: env.FREE_SHIPPING_THRESHOLD,
  reservationMinutes: env.ORDER_RESERVATION_MINUTES,
  maxCartItemQuantity: env.MAX_CART_ITEM_QUANTITY,
  lowStockThreshold: env.LOW_STOCK_THRESHOLD,
  pagination: { defaultLimit: env.PAGINATION_DEFAULT_LIMIT, maxLimit: env.PAGINATION_MAX_LIMIT },
  maxAddressesPerUser: 5,
  maxRecentlyViewed: 20,
  maxCompareItems: 4,
})

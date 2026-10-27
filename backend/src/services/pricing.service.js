import { businessRules } from '../config/businessRules.js'

/**
 * Computes order totals from trusted (database) prices only.
 * All values are integers in the smallest currency unit.
 */
export function calculateTotals(lines, rules = businessRules) {
  const subtotal = lines.reduce((sum, line) => {
    if (!Number.isInteger(line.unitPrice) || line.unitPrice < 0) {
      throw new TypeError('unitPrice must be a non-negative integer')
    }
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new TypeError('quantity must be a positive integer')
    }
    return sum + line.unitPrice * line.quantity
  }, 0)

  const discount = 0
  const taxable = subtotal - discount
  const tax = Math.round(taxable * rules.taxRate)
  const qualifiesForFreeShipping =
    subtotal === 0 || (rules.freeShippingThreshold > 0 && subtotal >= rules.freeShippingThreshold)
  const shipping = qualifiesForFreeShipping ? 0 : rules.shippingFee
  const total = taxable + tax + shipping

  return { subtotal, discount, taxRate: rules.taxRate, tax, shipping, total, currency: rules.currency }
}

import { describe, expect, it } from 'vitest'

import { calculateTotals } from '../../src/services/pricing.service.js'

const rules = { taxRate: 0.08, shippingFee: 25_000, freeShippingThreshold: 1_000_000, currency: 'INR' }

describe('calculateTotals', () => {
  it('sums lines in integer paise and applies tax and shipping', () => {
    const totals = calculateTotals([{ unitPrice: 199_900, quantity: 2 }, { unitPrice: 50_050, quantity: 1 }], rules)
    expect(totals.subtotal).toBe(449_850)
    expect(totals.tax).toBe(35_988) // 449850 * 0.08 = 35988
    expect(totals.shipping).toBe(25_000)
    expect(totals.total).toBe(449_850 + 35_988 + 25_000)
    expect(Number.isInteger(totals.total)).toBe(true)
  })

  it('rounds tax to the nearest paisa', () => {
    expect(calculateTotals([{ unitPrice: 1_001, quantity: 1 }], rules).tax).toBe(80) // 80.08
    expect(calculateTotals([{ unitPrice: 1_007, quantity: 1 }], rules).tax).toBe(81) // 80.56
  })

  it('waives shipping at or above the free-shipping threshold', () => {
    expect(calculateTotals([{ unitPrice: 1_000_000, quantity: 1 }], rules).shipping).toBe(0)
    expect(calculateTotals([{ unitPrice: 999_999, quantity: 1 }], rules).shipping).toBe(25_000)
  })

  it('charges nothing for an empty bag', () => {
    expect(calculateTotals([], rules)).toMatchObject({ subtotal: 0, tax: 0, shipping: 0, total: 0 })
  })

  it('rejects fractional prices and quantities instead of silently rounding them', () => {
    expect(() => calculateTotals([{ unitPrice: 10.5, quantity: 1 }], rules)).toThrow(TypeError)
    expect(() => calculateTotals([{ unitPrice: 100, quantity: 0 }], rules)).toThrow(TypeError)
    expect(() => calculateTotals([{ unitPrice: -1, quantity: 1 }], rules)).toThrow(TypeError)
  })
})

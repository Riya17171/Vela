import { describe, expect, it } from 'vitest'

import { formatPrice, fromMinorUnits, statusLabel, toMinorUnits, variantLabel } from './format.js'

describe('formatPrice', () => {
  it('formats paise as Indian rupees', () => {
    expect(formatPrice(10_650_000, 'INR')).toBe('₹1,06,500')
    expect(formatPrice(12_345, 'INR')).toBe('₹123.45')
  })

  it('shows a dash for missing values instead of ₹0', () => {
    expect(formatPrice(undefined)).toBe('—')
    expect(formatPrice(null)).toBe('—')
  })
})

describe('money conversion', () => {
  it('round-trips rupees and paise without floating point drift', () => {
    expect(toMinorUnits('1999.99')).toBe(199_999)
    expect(toMinorUnits('0.1')).toBe(10)
    expect(fromMinorUnits(199_999)).toBe('1999.99')
    expect(Number.isNaN(toMinorUnits('abc'))).toBe(true)
  })
})

describe('labels', () => {
  it('humanises statuses and variants', () => {
    expect(statusLabel('pending_payment')).toBe('Awaiting payment')
    expect(statusLabel('refund_pending')).toBe('Refund pending')
    expect(variantLabel({ size: 'M', color: 'Ivory' })).toBe('Size M — Ivory')
    expect(variantLabel({ size: null, color: null })).toBe('')
  })
})

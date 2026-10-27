import { describe, expect, it } from 'vitest'

import {
  allowedNextStatuses,
  canTransition,
  paymentStatusAfterCancellation,
  shouldReleaseInventory,
} from '../../src/services/orderStatus.js'

describe('order state machine', () => {
  it('only lets a verified payment confirm an order', () => {
    expect(canTransition('pending_payment', 'confirmed', 'payment')).toBe(true)
    expect(canTransition('pending_payment', 'confirmed', 'admin')).toBe(false)
    expect(canTransition('pending_payment', 'confirmed', 'customer')).toBe(false)
  })

  it('follows the fulfilment path for admins', () => {
    expect(canTransition('confirmed', 'processing', 'admin')).toBe(true)
    expect(canTransition('processing', 'shipped', 'admin')).toBe(true)
    expect(canTransition('shipped', 'delivered', 'admin')).toBe(true)
  })

  it('rejects skipping backwards or reopening terminal orders', () => {
    expect(canTransition('shipped', 'processing', 'admin')).toBe(false)
    expect(canTransition('delivered', 'shipped', 'admin')).toBe(false)
    expect(canTransition('cancelled', 'confirmed', 'payment')).toBe(false)
    expect(canTransition('expired', 'pending_payment', 'system')).toBe(false)
    expect(canTransition('pending_payment', 'delivered', 'admin')).toBe(false)
  })

  it('limits customer cancellation to orders that have not started processing', () => {
    expect(canTransition('pending_payment', 'cancelled', 'customer')).toBe(true)
    expect(canTransition('confirmed', 'cancelled', 'customer')).toBe(true)
    expect(canTransition('processing', 'cancelled', 'customer')).toBe(false)
    expect(canTransition('shipped', 'cancelled', 'customer')).toBe(false)
    expect(canTransition('shipped', 'cancelled', 'admin')).toBe(false)
  })

  it('lists the next statuses available to an actor', () => {
    expect(allowedNextStatuses('confirmed', 'admin').sort()).toEqual(['cancelled', 'processing', 'shipped'])
    expect(allowedNextStatuses('delivered', 'admin')).toEqual([])
  })

  it('never auto-refunds: cancelling a paid order only marks it refund_pending', () => {
    expect(paymentStatusAfterCancellation('paid')).toBe('refund_pending')
    expect(paymentStatusAfterCancellation('pending')).toBe('void')
    expect(paymentStatusAfterCancellation('failed')).toBe('void')
  })

  it('returns stock only for orders that never shipped', () => {
    expect(shouldReleaseInventory('pending_payment')).toBe(true)
    expect(shouldReleaseInventory('processing')).toBe(true)
    expect(shouldReleaseInventory('shipped')).toBe(false)
  })
})

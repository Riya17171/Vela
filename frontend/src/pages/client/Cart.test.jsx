import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'

import Cart from './Cart.jsx'

const state = { current: null }
vi.mock('../../context/CartContext.jsx', () => ({ useCartContext: () => state.current }))
vi.mock('../../context/ConfigContext.jsx', () => ({ useConfig: () => ({ config: { maxCartItemQuantity: 10 } }) }))

const base = { summary: { subtotal: 0, tax: 0, shipping: 0, total: 0, currency: 'INR' }, loading: false, pending: false, error: null, updateQty: vi.fn(), remove: vi.fn(), reload: vi.fn() }

describe('Cart', () => {
  it('shows an empty state', () => {
    state.current = { ...base, items: [], hasIssues: false }
    render(<MemoryRouter><Cart /></MemoryRouter>)
    expect(screen.getByText('Your Bag is Empty')).toBeInTheDocument()
  })

  it('flags unavailable pieces and disables checkout', () => {
    state.current = {
      ...base,
      hasIssues: true,
      items: [{ id: 'i1', productId: 'p1', product: { title: 'Gold Cuff', slug: 'gold-cuff', currency: 'INR', availableQuantity: 0, category: { name: 'Fine Accessories' } }, size: null, color: 'Gold', quantity: 1, unitPrice: 75_500, lineTotal: 75_500, available: false, issue: 'out_of_stock' }],
    }
    render(<MemoryRouter><Cart /></MemoryRouter>)
    expect(screen.getByText(/sold out — please remove/i)).toBeInTheDocument()
    expect(screen.getByText('Fine Accessories — Gold')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /secure checkout/i })).toBeDisabled()
  })
})

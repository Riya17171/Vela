import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import Checkout from './Checkout.jsx'

const cartState = { current: null }
const configState = { current: null }

vi.mock('../../context/AuthContext.jsx', () => ({ useAuth: () => ({ user: { email: 'a@example.com', fullName: 'Asha' } }) }))
vi.mock('../../context/CartContext.jsx', () => ({ useCartContext: () => cartState.current }))
vi.mock('../../context/ConfigContext.jsx', () => ({ useConfig: () => ({ config: configState.current }) }))
vi.mock('../../services/users.js', () => ({ listAddresses: vi.fn().mockResolvedValue([]) }))
vi.mock('../../hooks/useRazorpayCheckout.js', () => ({ useRazorpayCheckout: () => ({ pay: vi.fn(), stage: 'idle', busy: false }) }))

const item = { id: 'i1', product: { title: 'Camel Coat' }, quantity: 1, lineTotal: 300_000, size: 'M', color: null }
const summary = { subtotal: 300_000, tax: 24_000, shipping: 0, total: 324_000, currency: 'INR', taxRate: 0.08 }

function renderCheckout() {
  return render(<MemoryRouter><Checkout /></MemoryRouter>)
}

beforeEach(() => {
  cartState.current = { items: [item], summary, hasIssues: false, loading: false, reload: vi.fn() }
  configState.current = { payments: { enabled: true, testMode: true }, maxCartItemQuantity: 10 }
})

describe('Checkout', () => {
  it('shows the server-calculated total on the pay button', async () => {
    renderCheckout()
    expect(await screen.findByRole('button', { name: 'Pay ₹3,240' })).toBeEnabled()
    expect(screen.getByText(/test mode/i)).toBeInTheDocument()
  })

  it('never offers payment when the server has no Razorpay keys', async () => {
    configState.current = { payments: { enabled: false } }
    renderCheckout()
    expect(await screen.findByText(/payments are not configured/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /pay/i })).toBeDisabled()
  })

  it('blocks checkout while bag items have problems', async () => {
    cartState.current = { ...cartState.current, hasIssues: true }
    renderCheckout()
    expect(await screen.findByRole('button', { name: /pay/i })).toBeDisabled()
  })

  it('does not collect card details in the Vela form', async () => {
    renderCheckout()
    await screen.findByRole('button', { name: /pay/i })
    expect(screen.queryByLabelText(/card number/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/cvv|security code/i)).not.toBeInTheDocument()
  })
})

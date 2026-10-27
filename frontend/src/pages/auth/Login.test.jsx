import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { expect, it, vi } from 'vitest'

import Login from './Login.jsx'

const signIn = vi.fn()
vi.mock('../../context/AuthContext.jsx', () => ({
  useAuth: () => ({ signIn, sessionExpired: false, clearSessionExpired: () => {} }),
}))

function renderLogin() {
  return render(
    <MemoryRouter initialEntries={['/login']}>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<p>Storefront</p>} />
        <Route path="/admin" element={<p>Admin dashboard</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

async function submit(email, password) {
  if (email) await userEvent.type(screen.getByLabelText(/email address/i), email)
  if (password) await userEvent.type(screen.getByLabelText(/^password$/i), password)
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }))
}

it('validates input before calling the API', async () => {
  signIn.mockClear()
  renderLogin()
  await submit()
  expect(await screen.findByText('Email is required')).toBeInTheDocument()
  expect(screen.getByText('Password is required')).toBeInTheDocument()
  expect(signIn).not.toHaveBeenCalled()
})

it('shows the server error message on failure', async () => {
  signIn.mockRejectedValue(new Error('Invalid email or password'))
  renderLogin()
  await submit('client@example.com', 'wrong')
  expect(await screen.findByRole('alert')).toHaveTextContent('Invalid email or password')
})

it('sends administrators to the dashboard after signing in', async () => {
  signIn.mockResolvedValue({ role: 'admin' })
  renderLogin()
  await submit('admin@example.com', 'Secret123')
  expect(await screen.findByText('Admin dashboard')).toBeInTheDocument()
  expect(signIn).toHaveBeenLastCalledWith({ email: 'admin@example.com', password: 'Secret123' })
})

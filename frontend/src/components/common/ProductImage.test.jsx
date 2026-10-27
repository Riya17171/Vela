import { fireEvent, render, screen } from '@testing-library/react'
import { expect, it } from 'vitest'

import ProductImage from './ProductImage.jsx'

it('replaces a broken image with the piece name instead of a broken-image icon', () => {
  render(<ProductImage src="https://images.example.com/missing.jpg" alt="Silence No. 1" />)
  fireEvent.error(screen.getByRole('img', { name: 'Silence No. 1' }))
  const fallback = screen.getByRole('img', { name: 'Silence No. 1' })
  expect(fallback.tagName).toBe('DIV')
  expect(fallback).toHaveTextContent('Silence No. 1')
})

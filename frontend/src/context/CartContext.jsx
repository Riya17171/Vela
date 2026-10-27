import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import * as cartService from '../services/cart.js'
import { useAuth } from './AuthContext.jsx'

const EMPTY_CART = { items: [], itemCount: 0, hasIssues: false, summary: { subtotal: 0, tax: 0, shipping: 0, total: 0, currency: 'INR' } }

const CartContext = createContext(null)

/**
 * The bag lives on the server. Local state only ever mirrors the last
 * successful server response, so the UI never shows an item the API refused.
 */
export function CartProvider({ children }) {
  const { user } = useAuth()
  const [cart, setCart] = useState(EMPTY_CART)
  const [loading, setLoading] = useState(false)
  const [pending, setPending] = useState(false)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!user) {
      setCart(EMPTY_CART)
      return
    }
    setLoading(true)
    try {
      setCart(await cartService.fetchCart())
      setError(null)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    reload()
  }, [reload])

  const mutate = useCallback(async (operation, successMessage) => {
    setPending(true)
    try {
      const next = await operation()
      setCart(next)
      if (successMessage) toast.success(successMessage)
      return true
    } catch (err) {
      toast.error(err.message)
      return false
    } finally {
      setPending(false)
    }
  }, [])

  const add = useCallback(
    (productId, quantity = 1, variant = {}) =>
      mutate(() => cartService.addCartItem({ productId, quantity, size: variant.size ?? null, color: variant.color ?? null }), 'Added to your bag'),
    [mutate],
  )
  const updateQty = useCallback((itemId, quantity) => mutate(() => cartService.updateCartItem(itemId, quantity)), [mutate])
  const remove = useCallback((itemId) => mutate(() => cartService.removeCartItem(itemId), 'Removed from your bag'), [mutate])

  const value = useMemo(
    () => ({
      cart,
      items: cart.items,
      summary: cart.summary,
      hasIssues: cart.hasIssues,
      count: cart.itemCount,
      loading,
      pending,
      error,
      reload,
      add,
      updateQty,
      remove,
    }),
    [cart, loading, pending, error, reload, add, updateQty, remove],
  )

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCartContext() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCartContext must be used within CartProvider')
  return ctx
}

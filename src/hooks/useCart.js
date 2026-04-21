import { useCallback, useEffect, useState } from 'react'

import {
  addCartItem,
  fetchCartItems,
  removeCartItem,
  updateCartItemQty,
} from '../services/cart.js'

export function useCart(userId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!userId) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      const res = await fetchCartItems({ userId })
      setItems(res)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    reload()
  }, [reload])

  const add = useCallback(
    async (productId, quantity = 1) => {
      if (!userId) return

      // Optimistic upate (won't have full product details, but prevents block)
      setItems(prev => {
        const existing = prev.find(i => i.product_id === productId)
        if (existing) {
          return prev.map(i => i.product_id === productId ? { ...i, quantity: i.quantity + quantity } : i)
        }
        return [...prev, { id: 'temp_' + Date.now(), product_id: productId, quantity, products: { price: 0 } }]
      })

      try {
        await addCartItem({ userId, productId, quantity })
      } catch (err) {
        console.error(err)
      } finally {
        reload()
      }
    },
    [reload, userId],
  )

  const updateQty = useCallback(
    async (productId, quantity) => {
      if (!userId) return

      setItems(prev => prev.map(i => i.product_id === productId ? { ...i, quantity } : i))

      try {
        await updateCartItemQty({ userId, productId, quantity })
      } catch (err) {
        console.error(err)
      } finally {
        reload()
      }
    },
    [reload, userId],
  )

  const remove = useCallback(
    async (productId) => {
      if (!userId) return

      setItems(prev => prev.filter(i => i.product_id !== productId))

      try {
        await removeCartItem({ userId, productId })
      } catch (err) {
        console.error(err)
      } finally {
        reload()
      }
    },
    [reload, userId],
  )

  return { items, loading, reload, add, updateQty, remove }
}


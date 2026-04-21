import { useCallback, useEffect, useState } from 'react'

import {
  fetchWishlistItems,
  isProductWishlisted,
  toggleWishlistItem,
} from '../services/wishlist.js'

export function useWishlist(userId) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!userId) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      const res = await fetchWishlistItems({ userId })
      setItems(res)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    reload()
  }, [reload])

  const toggle = useCallback(
    async (productId) => {
      if (!userId) return

      setItems(prev => {
        const exists = prev.find(i => i.product_id === productId)
        if (exists) return prev.filter(i => i.product_id !== productId)
        return [...prev, { id: 'temp_' + Date.now(), product_id: productId, products: {} }]
      })

      try {
        await toggleWishlistItem({ userId, productId })
      } catch (err) {
        console.error(err)
      } finally {
        reload()
      }
    },
    [reload, userId],
  )

  const isWishlisted = useCallback(
    async (productId) => {
      if (!userId) return false
      return isProductWishlisted({ userId, productId })
    },
    [userId],
  )

  return { items, loading, reload, toggle, isWishlisted }
}


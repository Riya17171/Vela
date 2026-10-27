import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

import * as wishlistService from '../services/wishlist.js'
import { useAuth } from './AuthContext.jsx'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
  const { user } = useAuth()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const reload = useCallback(async () => {
    if (!user) {
      setItems([])
      return
    }
    setLoading(true)
    try {
      setItems((await wishlistService.fetchWishlist()).items)
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

  const savedIds = useMemo(() => new Set(items.map((item) => item.productId)), [items])
  const isWishlisted = useCallback((productId) => savedIds.has(productId), [savedIds])

  const toggle = useCallback(
    async (productId) => {
      try {
        const saved = savedIds.has(productId)
        const next = saved ? await wishlistService.removeWishlistItem(productId) : await wishlistService.addWishlistItem(productId)
        setItems(next.items)
        toast.success(saved ? 'Removed from your wishlist' : 'Saved to your wishlist')
      } catch (err) {
        toast.error(err.message)
      }
    },
    [savedIds],
  )

  const value = useMemo(
    () => ({ items, loading, error, reload, toggle, isWishlisted, count: items.length }),
    [items, loading, error, reload, toggle, isWishlisted],
  )

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useWishlistContext() {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error('useWishlistContext must be used within WishlistProvider')
  return ctx
}

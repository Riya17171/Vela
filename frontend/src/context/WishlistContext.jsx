import { createContext, useContext, useMemo } from 'react'

import { useAuth } from './AuthContext.jsx'
import { useWishlist as useWishlistService } from '../hooks/useWishlist.js'

const WishlistContext = createContext(null)

export function WishlistProvider({ children }) {
    const { user } = useAuth()
    const wishlistService = useWishlistService(user?.id)

    const value = useMemo(
        () => ({
            items: wishlistService.items,
            loading: wishlistService.loading,
            reload: wishlistService.reload,
            toggle: wishlistService.toggle,
            isWishlisted: wishlistService.isWishlisted,
            count: wishlistService.items?.length || 0,
        }),
        [
            wishlistService.items,
            wishlistService.loading,
            wishlistService.reload,
            wishlistService.toggle,
            wishlistService.isWishlisted
        ]
    )

    return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>
}

export function useWishlistContext() {
    const ctx = useContext(WishlistContext)
    if (!ctx) throw new Error('useWishlistContext must be used within WishlistProvider')
    return ctx
}

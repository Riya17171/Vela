import { createContext, useContext, useMemo } from 'react'

import { useAuth } from './AuthContext.jsx'
import { useCart as useCartService } from '../hooks/useCart.js'

const CartContext = createContext(null)

export function CartProvider({ children }) {
    const { user } = useAuth()
    const cartService = useCartService(user?.id)

    const value = useMemo(
        () => ({
            items: cartService.items,
            loading: cartService.loading,
            reload: cartService.reload,
            add: cartService.add,
            updateQty: cartService.updateQty,
            remove: cartService.remove,
            count: cartService.items?.reduce((acc, current) => acc + (current.quantity || 0), 0) || 0,
            subtotal: cartService.items?.reduce((acc, current) => {
                const price = current.products?.price || 0
                return acc + (current.quantity * price)
            }, 0) || 0,
        }),
        [
            cartService.items,
            cartService.loading,
            cartService.reload,
            cartService.add,
            cartService.updateQty,
            cartService.remove
        ],
    )

    return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCartContext() {
    const ctx = useContext(CartContext)
    if (!ctx) throw new Error('useCartContext must be used within CartProvider')
    return ctx
}

import { createContext, useContext, useState, useEffect } from 'react'
import { toast } from 'react-toastify';

export const CompareContext = createContext(null)

export function CompareProvider({ children }) {
    const [items, setItems] = useState(() => {
        try {
            const stored = localStorage.getItem('vela_compare')
            return stored ? JSON.parse(stored) : []
        } catch {
            return []
        }
    })

    useEffect(() => {
        localStorage.setItem('vela_compare', JSON.stringify(items))
    }, [items])

    function toggleCompare(product) {
        setItems(prev => {
            const exists = prev.find(p => p.id === product.id)
            if (exists) return prev.filter(p => p.id !== product.id)
            if (prev.length >= 4) {
                toast.error("You can only compare up to 4 products at once.")
                return prev
            }
            return [...prev, product]
        })
    }

    function removeFromCompare(id) {
        setItems(prev => prev.filter(p => p.id !== id))
    }

    function clearCompare() {
        setItems([])
    }

    return (
        <CompareContext.Provider value={{ items, toggleCompare, removeFromCompare, clearCompare }}>
            {children}
        </CompareContext.Provider>
    )
}

export function useCompare() {
    const ctx = useContext(CompareContext)
    if (!ctx) throw new Error('useCompare must be used within CompareProvider')
    return ctx
}

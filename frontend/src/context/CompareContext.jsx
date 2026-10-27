import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { toast } from 'react-toastify'

const STORAGE_KEY = 'vela_compare_ids'
const MAX_ITEMS = 4

// eslint-disable-next-line react-refresh/only-export-components
export const CompareContext = createContext(null)

function readStoredIds() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(stored) ? stored.filter((id) => typeof id === 'string').slice(0, MAX_ITEMS) : []
  } catch {
    return []
  }
}

/**
 * Comparison is a browsing aid available to guests too, so it stays in this
 * browser. Only product ids are stored; the Compare page always fetches
 * current data from the API, so prices and availability are never stale.
 */
export function CompareProvider({ children }) {
  const [ids, setIds] = useState(readStoredIds)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(ids))
    } catch {
      // Storage unavailable (private mode); comparison still works for this visit.
    }
  }, [ids])

  // Side effects (toasts) stay outside the state updater, which React may call during render.
  const toggleCompare = useCallback(
    (product) => {
      if (ids.includes(product.id)) {
        setIds(ids.filter((id) => id !== product.id))
        return
      }
      if (ids.length >= MAX_ITEMS) {
        toast.error(`You can compare up to ${MAX_ITEMS} pieces at once.`)
        return
      }
      setIds([...ids, product.id])
      toast.success('Added to comparison')
    },
    [ids],
  )

  const removeFromCompare = useCallback((id) => setIds((prev) => prev.filter((value) => value !== id)), [])
  const clearCompare = useCallback(() => setIds([]), [])
  const isCompared = useCallback((id) => ids.includes(id), [ids])

  const value = useMemo(
    () => ({ ids, count: ids.length, toggleCompare, removeFromCompare, clearCompare, isCompared }),
    [ids, toggleCompare, removeFromCompare, clearCompare, isCompared],
  )

  return <CompareContext.Provider value={value}>{children}</CompareContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useCompare() {
  const ctx = useContext(CompareContext)
  if (!ctx) throw new Error('useCompare must be used within CompareProvider')
  return ctx
}

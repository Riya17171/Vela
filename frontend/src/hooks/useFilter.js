import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'

const FILTER_KEYS = ['category', 'search', 'sort', 'size', 'colour', 'minPrice', 'maxPrice', 'inStock']

/**
 * Catalogue filters live in the URL, so links such as /products?category=handbags
 * work, filters survive refreshes and the back button behaves.
 */
export function useFilter() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo(() => {
    const read = (key) => searchParams.get(key) || undefined
    return {
      category: read('category'),
      search: read('search'),
      sort: read('sort') || 'newest',
      size: read('size'),
      colour: read('colour'),
      minPrice: read('minPrice'),
      maxPrice: read('maxPrice'),
      inStock: read('inStock'),
    }
  }, [searchParams])

  const setFilter = useCallback(
    (key, value) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          if (value === undefined || value === null || value === '' || (key === 'sort' && value === 'newest')) next.delete(key)
          else next.set(key, value)
          return next
        },
        { replace: true },
      )
    },
    [setSearchParams],
  )

  const resetFilters = useCallback(() => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        FILTER_KEYS.forEach((key) => next.delete(key))
        return next
      },
      { replace: true },
    )
  }, [setSearchParams])

  const activeCount = FILTER_KEYS.filter((key) => key !== 'sort' && filters[key]).length

  return { filters, setFilter, resetFilters, activeCount }
}

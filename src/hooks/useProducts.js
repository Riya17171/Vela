import { useCallback, useEffect, useState } from 'react'

import { fetchProducts } from '../services/products.js'

export function useProducts({ categoryId, minPrice, maxPrice, sort, search, isFeatured, limit = 12 } = {}) {
  const [products, setProducts] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetchProducts({ categoryId, minPrice, maxPrice, sort, search, isFeatured, limit, offset: 0 })
      setProducts(res.products)
      setTotal(res.total)
    } finally {
      setLoading(false)
    }
  }, [categoryId, maxPrice, minPrice, search, sort, isFeatured, limit])

  useEffect(() => {
    load()
  }, [load])

  const loadMore = useCallback(async () => {
    if (loadingMore || products.length >= total) return
    setLoadingMore(true)
    try {
      const res = await fetchProducts({ categoryId, minPrice, maxPrice, sort, search, isFeatured, limit, offset: products.length })
      setProducts(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newProducts = res.products.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProducts];
      })
    } finally {
      setLoadingMore(false)
    }
  }, [loadingMore, products.length, total, categoryId, maxPrice, minPrice, search, sort, isFeatured, limit])

  return { products, total, loading, loadingMore, reload: load, loadMore }
}


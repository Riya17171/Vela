import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchProducts } from '../services/products.js'

/** Paginated catalogue loader with "load more"; refetches from page 1 when filters change. */
export function useProducts(params = {}, { enabled = true } = {}) {
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState({ page: 0, total: 0, totalPages: 0, hasNextPage: false })
  const [loading, setLoading] = useState(enabled)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState(null)
  const key = JSON.stringify(params)
  const latest = useRef(key)

  const load = useCallback(async () => {
    if (!enabled) return
    latest.current = key
    setLoading(true)
    setError(null)
    try {
      const res = await fetchProducts({ ...JSON.parse(key), page: 1 })
      if (latest.current !== key) return
      setProducts(res.products)
      setMeta(res.meta)
    } catch (err) {
      if (latest.current === key) setError(err)
    } finally {
      if (latest.current === key) setLoading(false)
    }
  }, [key, enabled])

  useEffect(() => {
    load()
  }, [load])

  const loadMore = useCallback(async () => {
    if (loadingMore || !meta.hasNextPage) return
    setLoadingMore(true)
    try {
      const res = await fetchProducts({ ...JSON.parse(key), page: meta.page + 1 })
      setProducts((prev) => {
        const seen = new Set(prev.map((product) => product.id))
        return [...prev, ...res.products.filter((product) => !seen.has(product.id))]
      })
      setMeta(res.meta)
    } catch (err) {
      setError(err)
    } finally {
      setLoadingMore(false)
    }
  }, [key, loadingMore, meta])

  return { products, total: meta.total, meta, loading, loadingMore, error, reload: load, loadMore }
}

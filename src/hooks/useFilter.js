import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

export function useFilter({ initialCategoryId = null } = {}) {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialSearch = searchParams.get('search') || ''

  const [categoryId, setCategoryId] = useState(initialCategoryId)
  const [minPrice, setMinPrice] = useState(null)
  const [maxPrice, setMaxPrice] = useState(null)
  const [sort, setSort] = useState('newest')
  const [search, setSearch] = useState(initialSearch)

  useEffect(() => {
    if (search) {
      searchParams.set('search', search)
    } else {
      searchParams.delete('search')
    }
    setSearchParams(searchParams, { replace: true })
  }, [search, searchParams, setSearchParams])

  const filters = useMemo(
    () => ({
      categoryId,
      minPrice,
      maxPrice,
      sort,
      search,
    }),
    [categoryId, maxPrice, minPrice, search, sort],
  )

  return {
    filters,
    setCategoryId,
    setMinPrice,
    setMaxPrice,
    setSort,
    setSearch,
  }
}


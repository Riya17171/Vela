import { useCallback, useEffect, useState } from 'react'

import {
  fetchRecentlyViewedRecommendations,
  logRecentlyViewed,
} from '../services/recentlyViewed.js'

export function useRecentlyViewed({ userId } = {}) {
  const [recommendations, setRecommendations] = useState([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!userId) {
      setRecommendations([])
      return
    }
    setLoading(true)
    try {
      const res = await fetchRecentlyViewedRecommendations({ userId, limit: 8 })
      setRecommendations(res)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    reload()
  }, [reload])

  const logView = useCallback(
    async ({ productId }) => {
      if (!userId) return null
      return logRecentlyViewed({ userId, productId })
    },
    [userId],
  )

  return { recommendations, loading, reload, logView }
}


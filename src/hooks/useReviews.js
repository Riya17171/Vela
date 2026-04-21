import { useCallback, useEffect, useState } from 'react'

import { fetchReviewsByProduct, addReview } from '../services/reviews.js'

export function useReviews({ productId, sort } = {}) {
  const [reviews, setReviews] = useState([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!productId) {
      setReviews([])
      return
    }
    setLoading(true)
    try {
      const res = await fetchReviewsByProduct(productId)
      setReviews(res)
    } finally {
      setLoading(false)
    }
  }, [productId, sort])

  useEffect(() => {
    reload()
  }, [reload])

  const submitReview = useCallback(
    async ({ userId, rating, title, body }) => {
      if (!productId) return null
      return addReview({ userId, productId, rating, comment: body })
    },
    [productId],
  )

  return { reviews, loading, reload, submitReview }
}


import { useCallback, useEffect, useState } from 'react'

import { fetchOrderById, fetchOrders } from '../services/orders.js'

export function useOrders(userId) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(false)

  const reload = useCallback(async () => {
    if (!userId) {
      setOrders([])
      return
    }
    setLoading(true)
    try {
      const res = await fetchOrders({ userId })
      setOrders(res)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    reload()
  }, [reload])

  const getOrder = useCallback(
    async (orderId) => {
      if (!userId) return null
      return fetchOrderById({ userId, orderId })
    },
    [userId],
  )

  return { orders, loading, reload, getOrder }
}


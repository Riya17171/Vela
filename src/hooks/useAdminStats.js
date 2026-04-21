import { useCallback, useEffect, useState } from 'react'
import {
    fetchDashboardStats,
    fetchRecentOrders,
} from '../services/admin.js'

export function useAdminStats() {
    const [stats, setStats] = useState(null)
    const [recentOrders, setRecentOrders] = useState([])
    const [loading, setLoading] = useState(false)

    const reload = useCallback(async () => {
        setLoading(true)
        try {
            const [statsData, ordersData] = await Promise.all([
                fetchDashboardStats(),
                fetchRecentOrders({ limit: 8 }),
            ])
            setStats(statsData)
            setRecentOrders(ordersData)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        reload()
    }, [reload])

    return { stats, recentOrders, loading, reload }
}

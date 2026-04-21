import { useCallback, useEffect, useState } from 'react'
import { fetchAllOrders, updateOrderStatus } from '../services/admin.js'

export function useAdminOrders() {
    const [orders, setOrders] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [statusFilter, setStatusFilter] = useState('all')

    const reload = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetchAllOrders({
                status: statusFilter === 'all' ? undefined : statusFilter
            })
            setOrders(res.orders)
            setTotal(res.total)
        } finally {
            setLoading(false)
        }
    }, [statusFilter])

    useEffect(() => {
        reload()
    }, [reload])

    const updateStatus = useCallback(async (orderId, status) => {
        const result = await updateOrderStatus({ orderId, status })
        if (result) {
            setOrders(prev => prev.map(o =>
                o.id === orderId ? { ...o, status } : o
            ))
        }
        return result
    }, [])

    return {
        orders, total, loading,
        statusFilter, setStatusFilter,
        reload, updateStatus,
    }
}

import { useCallback, useEffect, useState } from 'react'
import { useDebounce } from './useDebounce.js'
import {
    fetchAllProductsAdmin,
    createProduct,
    updateProduct,
    deleteProduct,
    uploadProductImage,
} from '../services/admin.js'

export function useAdminProducts() {
    const [products, setProducts] = useState([])
    const [total, setTotal] = useState(0)
    const [loading, setLoading] = useState(false)
    const [search, setSearch] = useState('')
    const debouncedSearch = useDebounce(search, 400)

    const reload = useCallback(async () => {
        setLoading(true)
        try {
            const res = await fetchAllProductsAdmin({ search: debouncedSearch })
            setProducts(res.products)
            setTotal(res.total)
        } finally {
            setLoading(false)
        }
    }, [debouncedSearch])

    useEffect(() => {
        reload()
    }, [reload])

    const create = useCallback(async (product) => {
        const result = await createProduct({ product })
        if (result) await reload()
        return result
    }, [reload])

    const update = useCallback(async (id, updates) => {
        const result = await updateProduct({ id, updates })
        if (result) await reload()
        return result
    }, [reload])

    const remove = useCallback(async (id) => {
        const result = await deleteProduct({ id })
        if (result.success) await reload()
        return result
    }, [reload])

    const uploadImage = useCallback(async (file) => {
        return uploadProductImage({ file })
    }, [])

    return {
        products, total, loading,
        search, setSearch,
        reload, create, update, remove, uploadImage,
    }
}

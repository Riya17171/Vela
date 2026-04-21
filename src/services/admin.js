// src/services/admin.js

import { supabase } from '../lib/supabaseClient.js'

// ─── Dashboard Stats ────────────────────────────────

export async function fetchDashboardStats() {
    if (!supabase) return null

    // Run all queries in parallel for performance
    const [revenueRes, ordersRes, customersRes, stockRes] = await Promise.all([

        // Total revenue from all confirmed/delivered orders
        supabase
            .from('orders')
            .select('total')
            .in('status', ['confirmed', 'shipped', 'delivered']),

        // Total order count
        supabase
            .from('orders')
            .select('id', { count: 'exact', head: true }),

        // Total customer count
        supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .eq('role', 'user'),

        // Products with low or zero stock (using rating_count as proxy)
        // Note: real stock tracking would need a stock column added to products
        supabase
            .from('products')
            .select('id', { count: 'exact', head: true })
            .lte('rating_count', 5),
    ])

    const totalRevenue = revenueRes.data
        ?.reduce((sum, o) => sum + (o.total || 0), 0) || 0

    return {
        totalRevenue,
        totalOrders: ordersRes.count || 0,
        totalCustomers: customersRes.count || 0,
        lowStockCount: stockRes.count || 0,
    }
}

// ─── Recent Orders ───────────────────────────────────

export async function fetchRecentOrders({ limit = 8 } = {}) {
    if (!supabase) return []

    const { data, error } = await supabase
        .from('orders')
        .select('*, profiles(full_name)')
        .order('created_at', { ascending: false })
        .limit(limit)

    if (error) {
        console.error('fetchRecentOrders error:', error)
        return []
    }
    return data || []
}

// ─── All Orders (admin) ──────────────────────────────

export async function fetchAllOrders({ status, limit = 50, offset = 0 } = {}) {
    if (!supabase) return { orders: [], total: 0 }

    let query = supabase
        .from('orders')
        .select('*, profiles(full_name)', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (status && status !== 'all') {
        query = query.eq('status', status)
    }

    const { data, count, error } = await query

    if (error) {
        console.error('fetchAllOrders error:', error)
        return { orders: [], total: 0 }
    }

    return { orders: data || [], total: count || 0 }
}

// ─── Update Order Status ─────────────────────────────

export async function updateOrderStatus({ orderId, status }) {
    if (!supabase) return null

    const { data, error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId)
        .select()
        .single()

    if (error) {
        console.error('updateOrderStatus error:', error)
        return null
    }
    return data
}

// ─── Products (admin) ────────────────────────────────

export async function fetchAllProductsAdmin({ limit = 50, offset = 0, search } = {}) {
    if (!supabase) return { products: [], total: 0 }

    let query = supabase
        .from('products')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (search) {
        query = query.ilike('title', `%${search}%`)
    }

    const { data, count, error } = await query

    if (error) {
        console.error('fetchAllProductsAdmin error:', error)
        return { products: [], total: 0 }
    }

    return { products: data || [], total: count || 0 }
}

export async function createProduct({ product }) {
    if (!supabase) return null

    const { data, error } = await supabase
        .from('products')
        .insert([product])
        .select()
        .single()

    if (error) {
        console.error('createProduct error:', error)
        return null
    }
    return data
}

export async function updateProduct({ id, updates }) {
    if (!supabase) return null

    const { data, error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

    if (error) {
        console.error('updateProduct error:', error)
        return null
    }
    return data
}

export async function deleteProduct({ id }) {
    if (!supabase) return { success: false, error: 'No client' }

    const { error, count } = await supabase
        .from('products')
        .delete({ count: 'exact' })
        .eq('id', id)

    if (error) {
        console.error('deleteProduct error fully:', error)
        return { success: false, error: error.message }
    }
    if (count === 0) {
        return { success: false, error: 'Unauthorized or not found' }
    }
    return { success: true }
}

// ─── Image Upload ────────────────────────────────────

export async function uploadProductImage({ file }) {
    if (!supabase) return null

    const fileExt = file.name.split('.').pop()
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`
    const filePath = `products/${fileName}`

    const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false,
        })

    if (uploadError) {
        console.error('Image upload error:', uploadError)
        return null
    }

    const { data } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath)

    return data.publicUrl
}

// ─── Customers ───────────────────────────────────────

export async function fetchAllCustomers({ limit = 50, offset = 0 } = {}) {
    if (!supabase) return { customers: [], total: 0 }

    const { data, count, error } = await supabase
        .from('profiles')
        .select('*, orders(id)', { count: 'exact' })
        .eq('role', 'user')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1)

    if (error) {
        console.error('fetchAllCustomers error:', error)
        return { customers: [], total: 0 }
    }

    return { customers: data || [], total: count || 0 }
}

// ─── Categories ──────────────────────────────────────

export async function fetchAllCategories() {
    if (!supabase) return []

    const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name', { ascending: true })

    if (error) {
        console.error('fetchAllCategories error:', error)
        return []
    }
    return data || []
}

export async function createCategory({ name, slug }) {
    if (!supabase) return null

    const { data, error } = await supabase
        .from('categories')
        .insert([{ name, slug }])
        .select()
        .single()

    if (error) {
        console.error('createCategory error:', error)
        return null
    }
    return data
}

export async function deleteCategory({ id }) {
    if (!supabase) return { success: false, error: 'No client' }

    const { error, count } = await supabase
        .from('categories')
        .delete({ count: 'exact' })
        .eq('id', id)

    if (error) {
        console.error('deleteCategory error:', error)
        return { success: false, error: error.message }
    }
    if (count === 0) {
        return { success: false, error: 'Unauthorized or not found' }
    }
    return { success: true }
}

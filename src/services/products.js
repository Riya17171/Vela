import { supabase } from '../lib/supabaseClient.js'

export async function fetchProducts({
  categoryId,
  minPrice,
  maxPrice,
  sort,
  search,
  isFeatured,
  limit,
  offset = 0,
} = {}) {
  if (!supabase) return { products: [], total: 0 }

  let query = supabase.from('products').select('*', { count: 'exact' })

  if (categoryId) query = query.eq('category', categoryId)
  if (isFeatured) query = query.eq('is_featured', true)
  if (minPrice) query = query.gte('price', minPrice)
  if (maxPrice) query = query.lte('price', maxPrice)
  if (search) query = query.ilike('title', `%${search}%`)

  if (sort === 'price-low') query = query.order('price', { ascending: true })
  else if (sort === 'price-high') query = query.order('price', { ascending: false })
  else if (sort === 'rating') query = query.order('rating', { ascending: false })
  else query = query.order('created_at', { ascending: false }) // newest by default

  if (limit) {
    query = query.range(offset, offset + limit - 1)
  }

  const { data, count, error } = await query

  if (error) {
    console.error('Error fetching products:', error)
    return { products: [], total: 0 }
  }

  return { products: data || [], total: count || 0 }
}

export async function fetchProductById(id) {
  if (!supabase) return null
  const { data, error } = await supabase.from('products').select('*').eq('id', id).single()
  if (error) {
    console.error('Error fetching product:', error)
    return null
  }
  return data
}

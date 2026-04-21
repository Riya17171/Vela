import { supabase } from '../lib/supabaseClient.js'

export async function fetchWishlistItems({ userId }) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('wishlist_items')
    .select('*, products(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching wishlist:', error)
    return []
  }
  return data || []
}

export async function toggleWishlistItem({ userId, productId }) {
  if (!supabase) return null

  const isSaved = await isProductWishlisted({ userId, productId })

  if (isSaved) {
    const { error } = await supabase
      .from('wishlist_items')
      .delete()
      .eq('user_id', userId)
      .eq('product_id', productId)

    if (error) console.error('Error removing from wishlist:', error)
    return false
  } else {
    const { data, error } = await supabase
      .from('wishlist_items')
      .insert([{ user_id: userId, product_id: productId }])
      .select()
      .single()

    if (error) console.error('Error adding to wishlist:', error)
    return true
  }
}

export async function isProductWishlisted({ userId, productId }) {
  if (!supabase) return false
  const { count, error } = await supabase
    .from('wishlist_items')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('product_id', productId)

  if (error) return false
  return count > 0
}

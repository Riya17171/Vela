import { supabase } from '../lib/supabaseClient.js'

export async function fetchReviewsByProduct(productId) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('reviews')
    .select('*, profiles(full_name)')
    .eq('product_id', productId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    return []
  }
  return data || []
}

export async function addReview({ productId, userId, rating, comment }) {
  if (!supabase) return null
  const { data, error } = await supabase
    .from('reviews')
    .insert([{ product_id: productId, user_id: userId, rating, comment }])
    .select('*, profiles(full_name)')
    .single()

  if (error) {
    console.error(error)
    return null
  }
  return data
}

import { supabase } from '../lib/supabaseClient.js'

export async function fetchCartItems({ userId }) {
  if (!supabase) return []
  const { data, error } = await supabase
    .from('cart_items')
    .select('*, products(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: true })

  if (error) {
    console.error('Error fetching cart:', error)
    return []
  }
  return data || []
}

export async function addCartItem({ userId, productId, quantity = 1 }) {
  if (!supabase) return null

  // Check if exists first because of unique constraint
  const { data: existing } = await supabase
    .from('cart_items')
    .select('id, quantity')
    .eq('user_id', userId)
    .eq('product_id', productId)
    .maybeSingle()

  if (existing) {
    return updateCartItemQty({ userId, productId, quantity: existing.quantity + quantity })
  }

  const { data, error } = await supabase
    .from('cart_items')
    .insert([{ user_id: userId, product_id: productId, quantity }])
    .select()
    .single()

  if (error) console.error('Error adding to cart:', error)
  return data
}

export async function updateCartItemQty({ userId, productId, quantity }) {
  if (!supabase) return null

  if (quantity <= 0) {
    return removeCartItem({ userId, productId })
  }

  const { data, error } = await supabase
    .from('cart_items')
    .update({ quantity })
    .eq('user_id', userId)
    .eq('product_id', productId)
    .select()

  if (error) console.error('Error updating cart qty:', error)
  return data
}

export async function removeCartItem({ userId, productId }) {
  if (!supabase) return null
  const { error } = await supabase
    .from('cart_items')
    .delete()
    .eq('user_id', userId)
    .eq('product_id', productId)

  if (error) console.error('Error removing from cart:', error)
  return true
}

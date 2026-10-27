import { supabase } from '../lib/supabaseClient.js'

export async function placeOrder({ userId, items, subtotal, tax, total, shippingDetails }) {
  if (!supabase) return null

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert([{ user_id: userId, status: 'pending', subtotal, tax, total }])
    .select()
    .single()

  if (orderError || !order) {
    console.error('Order Error:', orderError)
    return null
  }

  const orderItems = items.map(item => ({
    order_id: order.id,
    product_id: item.product_id,
    quantity: item.quantity,
    price_at_purchase: item.products.price
  }))

  const { error: itemsError } = await supabase.from('order_items').insert(orderItems)
  if (itemsError) console.error('Order Items Error:', itemsError)

  const { error: clearError } = await supabase.from('cart_items').delete().eq('user_id', userId)
  if (clearError) console.error('Clear Cart Error:', clearError)

  return order
}

export async function fetchOrders({ userId }) {
  if (!supabase) return []
  const { data, error } = await supabase.from('orders').select('*').eq('user_id', userId).order('created_at', { ascending: false })
  if (error) console.error(error)
  return data || []
}

export async function fetchOrderById({ userId, orderId }) {
  if (!supabase) return null
  const { data, error } = await supabase.from('orders').select('*, order_items(*, products(*))').eq('id', orderId).eq('user_id', userId).single()
  if (error) console.error(error)
  return data
}

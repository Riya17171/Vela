import { supabase } from '../lib/supabaseClient.js'

export async function logRecentlyViewed({ userId, productId }) {
  if (!supabase) return null

  const { data, error } = await supabase
    .from('recently_viewed')
    .upsert(
      {
        user_id: userId,
        product_id: productId,
        viewed_at: new Date().toISOString()
      },
      { onConflict: 'user_id,product_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Error logging recently viewed:', error)
    return null
  }

  // App-level optimization: Cap list at 20 items per user
  const { data: userViews } = await supabase
    .from('recently_viewed')
    .select('product_id')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })

  if (userViews && userViews.length > 20) {
    const idsToDelete = userViews.slice(20).map(v => v.product_id)
    await supabase.from('recently_viewed').delete().eq('user_id', userId).in('product_id', idsToDelete)
  }

  return data
}

export async function fetchRecentlyViewedRecommendations({ userId, limit = 8 }) {
  if (!supabase) return []

  const { data: viewedData, error: viewedError } = await supabase
    .from('recently_viewed')
    .select('product_id, viewed_at, products(category)')
    .eq('user_id', userId)
    .order('viewed_at', { ascending: false })
    .limit(10)

  if (viewedError || !viewedData?.length) return []

  const viewedProductIds = viewedData.map(v => v.product_id)
  const categories = [...new Set(
    viewedData
      .map(v => v.products?.category)
      .filter(Boolean)
  )]

  if (!categories.length) return []

  const { data: recommendations, error: recError } = await supabase
    .from('products')
    .select('*')
    .in('category', categories)
    .not('id', 'in', `(${viewedProductIds.join(',')})`)
    .order('rating', { ascending: false })
    .limit(limit)

  if (recError) {
    console.error('Error fetching recommendations:', recError)
    return []
  }

  return recommendations || []
}


import { request } from './apiClient.js'

/** Drops empty values so the API only sees filters the shopper actually set. */
function cleanParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

export async function fetchProducts(params = {}) {
  const { products, meta } = await request({ url: '/products', params: cleanParams(params) })
  return { products, meta }
}

export async function fetchProduct(idOrSlug) {
  return (await request({ url: `/products/${encodeURIComponent(idOrSlug)}` })).product
}

export async function fetchProductsByIds(ids) {
  if (!ids.length) return []
  return (await fetchProducts({ ids: ids.join(','), limit: ids.length })).products
}

export async function fetchRecommendations(limit = 8) {
  const { products, reason } = await request({ url: '/products/recommendations', params: { limit } })
  return { products, reason }
}

export async function fetchCategories() {
  return (await request({ url: '/categories' })).categories
}

import { request } from './apiClient.js'

export const fetchWishlist = async () => (await request({ url: '/wishlist' })).wishlist
export const addWishlistItem = async (productId) => (await request({ method: 'post', url: '/wishlist/items', data: { productId } })).wishlist
export const removeWishlistItem = async (productId) => (await request({ method: 'delete', url: `/wishlist/items/${productId}` })).wishlist

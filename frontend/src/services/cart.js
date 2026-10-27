import { request } from './apiClient.js'

export const fetchCart = async () => (await request({ url: '/cart' })).cart
export const addCartItem = async (body) => (await request({ method: 'post', url: '/cart/items', data: body })).cart
export const updateCartItem = async (itemId, quantity) => (await request({ method: 'patch', url: `/cart/items/${itemId}`, data: { quantity } })).cart
export const removeCartItem = async (itemId) => (await request({ method: 'delete', url: `/cart/items/${itemId}` })).cart
export const clearCart = async () => (await request({ method: 'delete', url: '/cart' })).cart

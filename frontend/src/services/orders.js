import { request } from './apiClient.js'

export const createOrder = async (body) => (await request({ method: 'post', url: '/orders', data: body })).order

export async function fetchMyOrders(params = {}) {
  const { orders, meta } = await request({ url: '/orders/my-orders', params })
  return { orders, meta }
}

export const fetchOrder = async (orderId) => (await request({ url: `/orders/${orderId}` })).order
export const cancelOrder = async (orderId, reason) => (await request({ method: 'post', url: `/orders/${orderId}/cancel`, data: reason ? { reason } : {} }))

import { request } from './apiClient.js'

export const createPaymentOrder = async (orderId) => (await request({ method: 'post', url: '/payments/create-order', data: { orderId } })).checkout
export const verifyPayment = (body) => request({ method: 'post', url: '/payments/verify', data: body })
export const reconcilePayment = (paymentId) => request({ method: 'post', url: `/payments/${paymentId}/reconcile` })
export const reportPaymentFailure = (paymentId, body) => request({ method: 'post', url: `/payments/${paymentId}/failure`, data: body })

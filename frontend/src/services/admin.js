import { api, request } from './apiClient.js'

export const fetchDashboard = () => request({ url: '/admin/dashboard' })

export async function fetchAdminProducts(params = {}) {
  const { products, meta } = await request({ url: '/admin/products', params })
  return { products, meta }
}
export const fetchAdminProduct = async (id) => (await request({ url: `/admin/products/${id}` })).product
export const createProduct = async (body) => (await request({ method: 'post', url: '/admin/products', data: body })).product
export const updateProduct = async (id, body) => (await request({ method: 'patch', url: `/admin/products/${id}`, data: body })).product
export const archiveProduct = async (id) => (await request({ method: 'delete', url: `/admin/products/${id}` })).product
export const updateInventory = async (id, body) => (await request({ method: 'patch', url: `/admin/products/${id}/inventory`, data: body })).product

export async function uploadProductImage(file) {
  const form = new FormData()
  form.append('image', file)
  const res = await api.post('/admin/uploads/images', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  return res.data.data.image
}

export async function fetchAdminOrders(params = {}) {
  const { orders, meta } = await request({ url: '/admin/orders', params })
  return { orders, meta }
}
export const fetchAdminOrder = async (id) => (await request({ url: `/admin/orders/${id}` })).order
export const updateOrderStatus = async (id, body) => (await request({ method: 'patch', url: `/admin/orders/${id}/status`, data: body })).order
export const refundOrder = (id, reason) => request({ method: 'post', url: `/admin/orders/${id}/refund`, data: reason ? { reason } : {} })

export async function fetchCustomers(params = {}) {
  const { users, meta } = await request({ url: '/admin/users', params })
  return { users, meta }
}
export const updateCustomerStatus = async (id, status) => (await request({ method: 'patch', url: `/admin/users/${id}/status`, data: { status } })).user

export const fetchAdminCategories = async () => (await request({ url: '/admin/categories' })).categories
export const createCategory = async (body) => (await request({ method: 'post', url: '/admin/categories', data: body })).category
export const updateCategory = async (id, body) => (await request({ method: 'patch', url: `/admin/categories/${id}`, data: body })).category
export const deleteCategory = (id) => request({ method: 'delete', url: `/admin/categories/${id}` })

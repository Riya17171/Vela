import { request } from './apiClient.js'

export const getProfile = async () => (await request({ url: '/users/me' })).user
export const updateProfile = async (body) => (await request({ method: 'patch', url: '/users/me', data: body })).user

export const listAddresses = async () => (await request({ url: '/users/me/addresses' })).addresses
export const createAddress = async (body) => (await request({ method: 'post', url: '/users/me/addresses', data: body })).addresses
export const updateAddress = async (id, body) => (await request({ method: 'patch', url: `/users/me/addresses/${id}`, data: body })).addresses
export const deleteAddress = async (id) => (await request({ method: 'delete', url: `/users/me/addresses/${id}` })).addresses

export const listRecentlyViewed = async () => (await request({ url: '/users/me/recently-viewed' })).items
export const recordRecentlyViewed = (productId) => request({ method: 'post', url: '/users/me/recently-viewed', data: { productId } })

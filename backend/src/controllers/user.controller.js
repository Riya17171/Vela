import { businessRules } from '../config/businessRules.js'
import { User } from '../models/User.js'
import { listRecentlyViewed, recordRecentlyViewed } from '../services/catalog.service.js'
import { ApiError } from '../utils/ApiError.js'
import { sendCreated, sendSuccess } from '../utils/ApiResponse.js'
import { serializeProduct } from '../utils/serializers.js'

async function loadCurrentUser(req) {
  const user = await User.findById(req.user.id)
  if (!user) throw ApiError.unauthorized()
  return user
}

export async function getProfile(req, res) {
  const user = await loadCurrentUser(req)
  sendSuccess(res, { message: 'Profile retrieved', data: { user: user.toSafeJSON() } })
}

export async function updateProfile(req, res) {
  const user = await loadCurrentUser(req)
  const { fullName, phone, avatarUrl } = req.validated.body
  if (fullName !== undefined) user.fullName = fullName
  if (phone !== undefined) user.phone = phone || undefined
  if (avatarUrl !== undefined) user.avatarUrl = avatarUrl || undefined
  await user.save()
  sendSuccess(res, { message: 'Profile updated', data: { user: user.toSafeJSON() } })
}

function addressesOf(user) {
  return user.toSafeJSON().addresses
}

function applyDefault(user, address) {
  for (const other of user.addresses) {
    if (String(other._id) !== String(address._id)) other.isDefault = false
  }
  address.isDefault = true
}

export async function listAddresses(req, res) {
  const user = await loadCurrentUser(req)
  sendSuccess(res, { message: 'Addresses retrieved', data: { addresses: addressesOf(user) } })
}

export async function createAddress(req, res) {
  const user = await loadCurrentUser(req)
  if (user.addresses.length >= businessRules.maxAddressesPerUser) {
    throw ApiError.unprocessable(`You can save up to ${businessRules.maxAddressesPerUser} addresses`)
  }
  user.addresses.push({ ...req.validated.body, isDefault: false })
  const address = user.addresses[user.addresses.length - 1]
  if (req.validated.body.isDefault || user.addresses.length === 1) applyDefault(user, address)
  await user.save()
  sendCreated(res, { message: 'Address saved', data: { address: addressesOf(user).find((a) => a.id === String(address._id)), addresses: addressesOf(user) } })
}

export async function updateAddress(req, res) {
  const user = await loadCurrentUser(req)
  const address = user.addresses.id(req.validated.params.addressId)
  if (!address) throw ApiError.notFound('Address not found')
  const { isDefault, ...changes } = req.validated.body
  address.set(changes)
  if (isDefault) applyDefault(user, address)
  await user.save()
  sendSuccess(res, { message: 'Address updated', data: { addresses: addressesOf(user) } })
}

export async function deleteAddress(req, res) {
  const user = await loadCurrentUser(req)
  const address = user.addresses.id(req.validated.params.addressId)
  if (!address) throw ApiError.notFound('Address not found')
  const wasDefault = address.isDefault
  address.deleteOne()
  if (wasDefault && user.addresses.length) user.addresses[0].isDefault = true
  await user.save()
  sendSuccess(res, { message: 'Address removed', data: { addresses: addressesOf(user) } })
}

export async function getRecentlyViewed(req, res) {
  const entries = await listRecentlyViewed(req.user.id, businessRules.maxRecentlyViewed)
  sendSuccess(res, {
    message: 'Recently viewed pieces',
    data: { items: entries.map((entry) => ({ viewedAt: entry.viewedAt, product: serializeProduct(entry.product) })) },
  })
}

export async function addRecentlyViewed(req, res) {
  await recordRecentlyViewed(req.user.id, req.validated.body.productId, businessRules.maxRecentlyViewed)
  sendSuccess(res, { message: 'View recorded' })
}

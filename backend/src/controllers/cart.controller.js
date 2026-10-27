import * as cartService from '../services/cart.service.js'
import { sendSuccess } from '../utils/ApiResponse.js'

export async function getCart(req, res) {
  sendSuccess(res, { message: 'Bag retrieved', data: { cart: await cartService.getCartView(req.user.id) } })
}

export async function addItem(req, res) {
  const cart = await cartService.addItem(req.user.id, req.validated.body)
  sendSuccess(res, { message: 'Added to bag', data: { cart } })
}

export async function updateItem(req, res) {
  const cart = await cartService.updateItemQuantity(req.user.id, req.validated.params.itemId, req.validated.body.quantity)
  sendSuccess(res, { message: 'Bag updated', data: { cart } })
}

export async function removeItem(req, res) {
  const cart = await cartService.removeItem(req.user.id, req.validated.params.itemId)
  sendSuccess(res, { message: 'Removed from bag', data: { cart } })
}

export async function clearCart(req, res) {
  sendSuccess(res, { message: 'Bag cleared', data: { cart: await cartService.clearCart(req.user.id) } })
}

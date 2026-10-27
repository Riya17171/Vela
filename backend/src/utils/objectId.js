import mongoose from 'mongoose'

import { ApiError } from './ApiError.js'

export function isObjectId(value) {
  return typeof value === 'string' && /^[a-f\d]{24}$/i.test(value) && mongoose.isValidObjectId(value)
}

export function assertObjectId(value, label = 'id') {
  if (!isObjectId(value)) {
    throw ApiError.badRequest(`Invalid ${label}`, { errors: [{ field: label, message: 'Must be a valid id' }] })
  }
  return value
}

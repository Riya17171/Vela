import mongoose from 'mongoose'
import multer from 'multer'

import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import { ApiError } from '../utils/ApiError.js'

function normalise(error) {
  if (error instanceof ApiError) return error

  if (error instanceof mongoose.Error.ValidationError) {
    return ApiError.badRequest('Validation failed', {
      errors: Object.values(error.errors).map((issue) => ({ field: issue.path, message: issue.message })),
    })
  }
  if (error instanceof mongoose.Error.CastError) {
    return ApiError.badRequest(`Invalid value for ${error.path}`, { errors: [{ field: error.path, message: 'Invalid value' }] })
  }
  if (error?.code === 11000) {
    const field = Object.keys(error.keyPattern ?? error.keyValue ?? {})[0] ?? 'field'
    return ApiError.conflict(`A record with this ${field} already exists`, { errors: [{ field, message: 'Already exists' }] })
  }
  if (error instanceof multer.MulterError) {
    return error.code === 'LIMIT_FILE_SIZE'
      ? new ApiError(413, `Image must be smaller than ${env.MAX_UPLOAD_MB} MB`, { code: 'FILE_TOO_LARGE' })
      : ApiError.badRequest(error.message, { code: error.code })
  }
  if (error?.type === 'entity.parse.failed') return ApiError.badRequest('Malformed JSON body')
  if (error?.type === 'entity.too.large') return new ApiError(413, 'Request body is too large')

  return null
}

// Express recognises error middleware by its four parameters.
export function errorHandler(error, req, res, _next) {
  const known = normalise(error)
  const statusCode = known?.statusCode ?? 500

  if (statusCode >= 500) {
    (req.log ?? logger).error({ err: error }, 'Unhandled error')
  }

  const body = {
    success: false,
    message: known ? known.message : 'Something went wrong. Please try again.',
  }
  if (known?.code) body.code = known.code
  if (known?.errors?.length) body.errors = known.errors
  if (known?.details) body.details = known.details
  if (!env.isProduction && !known) body.debug = { message: error?.message, stack: error?.stack }

  res.status(statusCode).json(body)
}

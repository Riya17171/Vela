/**
 * Every successful response uses the same envelope:
 * { success: true, message, data, meta? }
 */
export function sendSuccess(res, { statusCode = 200, message = 'OK', data = null, meta } = {}) {
  const body = { success: true, message, data }
  if (meta) body.meta = meta
  return res.status(statusCode).json(body)
}

export function sendCreated(res, options) {
  return sendSuccess(res, { statusCode: 201, ...options })
}

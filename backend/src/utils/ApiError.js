export class ApiError extends Error {
  constructor(statusCode, message, { errors, code, details } = {}) {
    super(message)
    this.name = 'ApiError'
    this.statusCode = statusCode
    this.errors = errors
    this.code = code
    this.details = details
  }

  static badRequest(message = 'Bad request', options) {
    return new ApiError(400, message, options)
  }

  static unauthorized(message = 'Authentication required', options) {
    return new ApiError(401, message, options)
  }

  static forbidden(message = 'You do not have permission to perform this action', options) {
    return new ApiError(403, message, options)
  }

  static notFound(message = 'Resource not found', options) {
    return new ApiError(404, message, options)
  }

  static conflict(message = 'Conflict', options) {
    return new ApiError(409, message, options)
  }

  static unprocessable(message = 'Unprocessable request', options) {
    return new ApiError(422, message, options)
  }

  static serviceUnavailable(message = 'Service unavailable', options) {
    return new ApiError(503, message, options)
  }

  static badGateway(message = 'Upstream provider error', options) {
    return new ApiError(502, message, options)
  }
}

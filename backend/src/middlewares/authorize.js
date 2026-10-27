import { ApiError } from '../utils/ApiError.js'

export function isAuthorized(user, allowedRoles) {
  return Boolean(user && allowedRoles.includes(user.role))
}

/** Must run after `authenticate`. The role comes from the database, never the client. */
export function authorize(...allowedRoles) {
  return (req, _res, next) => {
    if (!req.user) throw ApiError.unauthorized()
    if (!isAuthorized(req.user, allowedRoles)) throw ApiError.forbidden('Administrator access required')
    next()
  }
}

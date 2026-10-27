import { ApiError } from '../utils/ApiError.js'

function findOperatorKey(value, depth = 0) {
  if (depth > 20 || value === null || typeof value !== 'object') return null
  for (const [key, nested] of Object.entries(value)) {
    if (key.startsWith('$') || key.includes('.')) return key
    const found = findOperatorKey(nested, depth + 1)
    if (found) return found
  }
  return null
}

/** Defence in depth against NoSQL operator injection (`{"$gt": ""}`) in any input. */
export function rejectOperators(req, _res, next) {
  for (const location of ['body', 'query', 'params']) {
    const key = findOperatorKey(req[location])
    if (key) throw ApiError.badRequest(`Illegal key "${key}" in request ${location}`, { code: 'ILLEGAL_KEY' })
  }
  next()
}

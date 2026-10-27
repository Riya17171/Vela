import { ApiError } from '../utils/ApiError.js'

function formatIssues(issues, location) {
  return issues.map((issue) => {
    const path = [...issue.path, ...(issue.code === 'unrecognized_keys' ? [issue.keys.join(',')] : [])]
    return { field: path.length ? path.join('.') : location, message: issue.message }
  })
}

/**
 * Validates and coerces request input with Zod. Parsed values are exposed on
 * `req.validated` (Express 5 makes `req.query` read-only), and unknown keys
 * are rejected by the strict schemas, which blocks mass assignment.
 */
export function validate({ body, query, params } = {}) {
  return (req, _res, next) => {
    const validated = {}
    const errors = []
    for (const [location, schema] of Object.entries({ params, query, body })) {
      if (!schema) continue
      const result = schema.safeParse(req[location] ?? {})
      if (result.success) validated[location] = result.data
      else errors.push(...formatIssues(result.error.issues, location))
    }
    if (errors.length) throw ApiError.badRequest('Validation failed', { errors })
    req.validated = validated
    next()
  }
}

import { businessRules } from '../config/businessRules.js'

export function resolvePagination({ page, limit } = {}) {
  const { defaultLimit, maxLimit } = businessRules.pagination
  const safePage = Number.isInteger(page) && page > 0 ? page : 1
  const safeLimit = Number.isInteger(limit) && limit > 0 ? Math.min(limit, maxLimit) : defaultLimit
  return { page: safePage, limit: safeLimit, skip: (safePage - 1) * safeLimit }
}

export function buildPageMeta({ page, limit, total }) {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit)
  return { page, limit, total, totalPages, hasNextPage: page < totalPages }
}

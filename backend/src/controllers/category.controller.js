import { Category } from '../models/Category.js'
import { listCategoriesWithCounts } from '../services/catalog.service.js'
import { ApiError } from '../utils/ApiError.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { serializeCategory } from '../utils/serializers.js'

export async function listCategories(_req, res) {
  const rows = await listCategoriesWithCounts()
  sendSuccess(res, {
    message: 'Categories retrieved',
    data: { categories: rows.map(({ category, productCount }) => serializeCategory(category, { productCount })) },
  })
}

export async function getCategory(req, res) {
  const category = await Category.findOne({ slug: req.validated.params.slug, isActive: true })
  if (!category) throw ApiError.notFound('Category not found')
  sendSuccess(res, { message: 'Category retrieved', data: { category: serializeCategory(category) } })
}

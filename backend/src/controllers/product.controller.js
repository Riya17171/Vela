import * as catalog from '../services/catalog.service.js'
import { sendSuccess } from '../utils/ApiResponse.js'
import { serializeProduct } from '../utils/serializers.js'

export async function listProducts(req, res) {
  const { products, meta } = await catalog.listProducts(req.validated.query ?? {})
  sendSuccess(res, {
    message: products.length ? 'Products retrieved successfully' : 'No products match these filters',
    data: { products: products.map((product) => serializeProduct(product)) },
    meta,
  })
}

export async function listFeatured(req, res) {
  const { products, meta } = await catalog.listProducts({ ...(req.validated.query ?? {}), featured: true })
  sendSuccess(res, { message: 'Featured products', data: { products: products.map((p) => serializeProduct(p)) }, meta })
}

export async function getProduct(req, res) {
  const product = await catalog.getPublicProduct(req.validated.params.idOrSlug)
  sendSuccess(res, { message: 'Product retrieved', data: { product: serializeProduct(product) } })
}

export async function getRecommendations(req, res) {
  const { products, reason } = await catalog.recommendProducts(req.user?.id, req.validated.query?.limit ?? 8)
  sendSuccess(res, { message: 'Recommendations', data: { reason, products: products.map((p) => serializeProduct(p)) } })
}

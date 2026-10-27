import { Router } from 'express'

import * as admin from '../controllers/admin.controller.js'
import { authenticate } from '../middlewares/authenticate.js'
import { authorize } from '../middlewares/authorize.js'
import { imageUpload } from '../middlewares/upload.js'
import { validate } from '../middlewares/validate.js'
import { adminUserListQuery, userIdParams, userStatusBody } from '../validators/admin.validator.js'
import { categoryIdParams, createCategoryBody, updateCategoryBody } from '../validators/category.validator.js'
import { adminOrderListQuery, adminStatusBody, orderIdParams, refundBody } from '../validators/order.validator.js'
import {
  adminProductListQuery,
  createProductBody,
  inventoryBody,
  productIdParams,
  updateProductBody,
} from '../validators/product.validator.js'

const router = Router()

// Every admin route is checked on the server, regardless of what the UI shows.
router.use(authenticate, authorize('admin'))

router.get('/dashboard', admin.dashboard)

router.get('/users', validate({ query: adminUserListQuery }), admin.listUsers)
router.get('/users/:userId', validate({ params: userIdParams }), admin.getUser)
router.patch('/users/:userId/status', validate({ params: userIdParams, body: userStatusBody }), admin.updateUserStatus)

router.get('/orders', validate({ query: adminOrderListQuery }), admin.listOrders)
router.get('/orders/:orderId', validate({ params: orderIdParams }), admin.getOrder)
router.patch('/orders/:orderId/status', validate({ params: orderIdParams, body: adminStatusBody }), admin.updateOrderStatus)
router.post('/orders/:orderId/refund', validate({ params: orderIdParams, body: refundBody }), admin.refund)

router.get('/products', validate({ query: adminProductListQuery }), admin.listAdminProducts)
router.post('/products', validate({ body: createProductBody }), admin.createProduct)
router.get('/products/:productId', validate({ params: productIdParams }), admin.getAdminProduct)
router.patch('/products/:productId', validate({ params: productIdParams, body: updateProductBody }), admin.updateProduct)
router.delete('/products/:productId', validate({ params: productIdParams }), admin.archiveProduct)
router.patch('/products/:productId/inventory', validate({ params: productIdParams, body: inventoryBody }), admin.updateInventory)

router.post('/uploads/images', imageUpload, admin.uploadImage)

router.get('/categories', admin.listAdminCategories)
router.post('/categories', validate({ body: createCategoryBody }), admin.createCategory)
router.patch('/categories/:categoryId', validate({ params: categoryIdParams, body: updateCategoryBody }), admin.updateCategory)
router.delete('/categories/:categoryId', validate({ params: categoryIdParams }), admin.deleteCategory)

export default router

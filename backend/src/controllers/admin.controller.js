import { businessRules } from '../config/businessRules.js'
import { Category } from '../models/Category.js'
import { Order } from '../models/Order.js'
import { Product } from '../models/Product.js'
import { User } from '../models/User.js'
import { listCategoriesWithCounts, listProducts } from '../services/catalog.service.js'
import { adjustStock } from '../services/inventory.service.js'
import { updateStatusByAdmin } from '../services/order.service.js'
import { refundOrder } from '../services/payment.service.js'
import { revokeAllSessions } from '../services/auth.service.js'
import { uploadProductImage } from '../services/upload.service.js'
import { ApiError } from '../utils/ApiError.js'
import { sendCreated, sendSuccess } from '../utils/ApiResponse.js'
import { buildPageMeta, resolvePagination } from '../utils/pagination.js'
import { serializeCategory, serializeOrder, serializeProduct } from '../utils/serializers.js'
import { escapeRegex, slugify } from '../utils/strings.js'

// ─── Dashboard ────────────────────────────────────────────

export async function dashboard(_req, res) {
  const threshold = businessRules.lowStockThreshold
  const [revenue, statusCounts, customers, lowStock, outOfStock, attention, recentOrders, lowStockProducts] = await Promise.all([
    Order.aggregate([{ $match: { paymentStatus: 'paid' } }, { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } }]),
    Order.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    User.countDocuments({ role: 'user' }),
    Product.countDocuments({ status: 'active', stock: { $gt: 0, $lte: threshold } }),
    Product.countDocuments({ status: 'active', stock: 0 }),
    Order.countDocuments({ needsAttention: true }),
    Order.find().sort({ createdAt: -1 }).limit(8).populate('user', 'fullName email'),
    Product.find({ status: 'active', stock: { $lte: threshold } }).sort({ stock: 1 }).limit(8).populate('category', 'name slug'),
  ])

  const byStatus = Object.fromEntries(statusCounts.map((row) => [row._id, row.count]))
  sendSuccess(res, {
    message: 'Dashboard statistics',
    data: {
      stats: {
        currency: businessRules.currency,
        totalRevenue: revenue[0]?.total ?? 0,
        paidOrders: revenue[0]?.count ?? 0,
        totalOrders: Object.values(byStatus).reduce((sum, count) => sum + count, 0),
        ordersByStatus: byStatus,
        totalCustomers: customers,
        lowStockCount: lowStock,
        outOfStockCount: outOfStock,
        lowStockThreshold: threshold,
        ordersNeedingAttention: attention,
      },
      recentOrders: recentOrders.map((order) => serializeOrder(order, { admin: true })),
      lowStockProducts: lowStockProducts.map((product) => serializeProduct(product, { admin: true })),
    },
  })
}

// ─── Customers ────────────────────────────────────────────

export async function listUsers(req, res) {
  const query = req.validated.query ?? {}
  const { page, limit, skip } = resolvePagination(query)
  const filter = {}
  if (query.role) filter.role = query.role
  if (query.search) {
    const pattern = new RegExp(escapeRegex(query.search), 'i')
    filter.$or = [{ fullName: pattern }, { email: pattern }]
  }
  const [users, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ])
  // One aggregate for all listed users instead of a query per user.
  const stats = await Order.aggregate([
    { $match: { user: { $in: users.map((user) => user._id) } } },
    {
      $group: {
        _id: '$user',
        orderCount: { $sum: 1 },
        totalSpent: { $sum: { $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$total', 0] } },
        lastOrderAt: { $max: '$createdAt' },
      },
    },
  ])
  const statsByUser = new Map(stats.map((row) => [String(row._id), row]))
  sendSuccess(res, {
    message: 'Customers retrieved',
    data: {
      users: users.map((user) => {
        const { addresses, ...safe } = user.toSafeJSON()
        const row = statsByUser.get(String(user._id))
        return { ...safe, addressCount: addresses.length, orderCount: row?.orderCount ?? 0, totalSpent: row?.totalSpent ?? 0, lastOrderAt: row?.lastOrderAt ?? null, lastLoginAt: user.lastLoginAt ?? null }
      }),
    },
    meta: buildPageMeta({ page, limit, total }),
  })
}

export async function getUser(req, res) {
  const user = await User.findById(req.validated.params.userId)
  if (!user) throw ApiError.notFound('Customer not found')
  const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 }).limit(20)
  sendSuccess(res, {
    message: 'Customer retrieved',
    data: { user: user.toSafeJSON(), orders: orders.map((order) => serializeOrder(order, { admin: true })) },
  })
}

export async function updateUserStatus(req, res) {
  const { userId } = req.validated.params
  if (userId === req.user.id) throw ApiError.badRequest('You cannot change the status of your own account')
  const user = await User.findById(userId)
  if (!user) throw ApiError.notFound('Customer not found')
  if (user.role === 'admin') throw ApiError.forbidden('Administrator accounts are managed with the provisioning script')
  user.status = req.validated.body.status
  await user.save()
  if (user.status === 'suspended') await revokeAllSessions(user._id, 'admin')
  sendSuccess(res, { message: `Account ${user.status}`, data: { user: user.toSafeJSON() } })
}

// ─── Orders ───────────────────────────────────────────────

export async function listOrders(req, res) {
  const query = req.validated.query ?? {}
  const { page, limit, skip } = resolvePagination(query)
  const filter = {}
  if (query.status) filter.status = query.status
  if (query.paymentStatus) filter.paymentStatus = query.paymentStatus
  if (query.needsAttention !== undefined) filter.needsAttention = query.needsAttention
  if (query.search) filter.orderNumber = new RegExp(escapeRegex(query.search), 'i')
  const [orders, total] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate('user', 'fullName email'),
    Order.countDocuments(filter),
  ])
  sendSuccess(res, {
    message: 'Orders retrieved',
    data: { orders: orders.map((order) => serializeOrder(order, { admin: true })) },
    meta: buildPageMeta({ page, limit, total }),
  })
}

export async function getOrder(req, res) {
  const order = await Order.findById(req.validated.params.orderId).populate('user', 'fullName email')
  if (!order) throw ApiError.notFound('Order not found')
  sendSuccess(res, { message: 'Order retrieved', data: { order: serializeOrder(order, { admin: true }) } })
}

export async function updateOrderStatus(req, res) {
  const order = await updateStatusByAdmin(req.validated.params.orderId, req.validated.body)
  await order.populate('user', 'fullName email')
  sendSuccess(res, { message: `Order marked ${order.status}`, data: { order: serializeOrder(order, { admin: true }) } })
}

export async function refund(req, res) {
  const { order, refund: refundInfo } = await refundOrder(req.validated.params.orderId, req.validated.body)
  await order.populate('user', 'fullName email')
  sendSuccess(res, { message: `Refund ${refundInfo.status}`, data: { refund: refundInfo, order: serializeOrder(order, { admin: true }) } })
}

// ─── Products ─────────────────────────────────────────────

async function uniqueSlug(base, excludeId) {
  const root = slugify(base) || 'piece'
  let candidate = root
  for (let suffix = 2; await Product.exists({ slug: candidate, ...(excludeId && { _id: { $ne: excludeId } }) }); suffix += 1) {
    candidate = `${root}-${suffix}`
  }
  return candidate
}

async function assertCategoryExists(categoryId) {
  if (categoryId && !(await Category.exists({ _id: categoryId }))) {
    throw ApiError.badRequest('Category does not exist', { errors: [{ field: 'category', message: 'Unknown category' }] })
  }
}

export async function listAdminProducts(req, res) {
  const query = { ...(req.validated.query ?? {}), lowStockThreshold: businessRules.lowStockThreshold }
  const { products, meta } = await listProducts(query, { admin: true })
  sendSuccess(res, { message: 'Products retrieved', data: { products: products.map((p) => serializeProduct(p, { admin: true })) }, meta })
}

export async function getAdminProduct(req, res) {
  const product = await Product.findById(req.validated.params.productId).populate('category', 'name slug colorLabel sizeLabel isActive')
  if (!product) throw ApiError.notFound('Product not found')
  sendSuccess(res, { message: 'Product retrieved', data: { product: serializeProduct(product, { admin: true }) } })
}

export async function createProduct(req, res) {
  const body = req.validated.body
  await assertCategoryExists(body.category)
  const product = await Product.create({ ...body, slug: await uniqueSlug(body.slug ?? body.title) })
  await product.populate('category', 'name slug colorLabel sizeLabel isActive')
  sendCreated(res, { message: 'Product created', data: { product: serializeProduct(product, { admin: true }) } })
}

export async function updateProduct(req, res) {
  const product = await Product.findById(req.validated.params.productId)
  if (!product) throw ApiError.notFound('Product not found')
  const changes = Object.fromEntries(Object.entries(req.validated.body).filter(([, value]) => value !== undefined))
  await assertCategoryExists(changes.category)
  if (changes.slug) changes.slug = await uniqueSlug(changes.slug, product._id)
  product.set(changes)
  await product.save()
  await product.populate('category', 'name slug colorLabel sizeLabel isActive')
  sendSuccess(res, { message: 'Product updated', data: { product: serializeProduct(product, { admin: true }) } })
}

/** Products are archived, not destroyed: order history and reviews keep their references. */
export async function archiveProduct(req, res) {
  const product = await Product.findByIdAndUpdate(
    req.validated.params.productId,
    { $set: { status: 'archived', isFeatured: false } },
    { new: true },
  )
  if (!product) throw ApiError.notFound('Product not found')
  sendSuccess(res, { message: 'Product archived', data: { product: serializeProduct(product, { admin: true }) } })
}

export async function updateInventory(req, res) {
  const product = await adjustStock(req.validated.params.productId, req.validated.body)
  if (!product) throw ApiError.notFound('Product not found')
  sendSuccess(res, { message: 'Inventory updated', data: { product: serializeProduct(product, { admin: true }) } })
}

export async function uploadImage(req, res) {
  const image = await uploadProductImage(req.file)
  sendCreated(res, { message: 'Image uploaded', data: { image } })
}

// ─── Categories ───────────────────────────────────────────

export async function listAdminCategories(_req, res) {
  const rows = await listCategoriesWithCounts({ includeInactive: true })
  sendSuccess(res, {
    message: 'Categories retrieved',
    data: { categories: rows.map(({ category, productCount }) => serializeCategory(category, { productCount })) },
  })
}

export async function createCategory(req, res) {
  const body = req.validated.body
  const category = await Category.create({ ...body, slug: body.slug ?? slugify(body.name) })
  sendCreated(res, { message: 'Category created', data: { category: serializeCategory(category) } })
}

export async function updateCategory(req, res) {
  const category = await Category.findById(req.validated.params.categoryId)
  if (!category) throw ApiError.notFound('Category not found')
  category.set(Object.fromEntries(Object.entries(req.validated.body).filter(([, value]) => value !== undefined)))
  await category.save()
  sendSuccess(res, { message: 'Category updated', data: { category: serializeCategory(category) } })
}

export async function deleteCategory(req, res) {
  const { categoryId } = req.validated.params
  const inUse = await Product.countDocuments({ category: categoryId, status: { $ne: 'archived' } })
  if (inUse) {
    throw ApiError.conflict(`This category still has ${inUse} product(s). Move or archive them first, or deactivate the category.`, {
      code: 'CATEGORY_IN_USE',
    })
  }
  const deleted = await Category.findByIdAndDelete(categoryId)
  if (!deleted) throw ApiError.notFound('Category not found')
  sendSuccess(res, { message: 'Category deleted' })
}

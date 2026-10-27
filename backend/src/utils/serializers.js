import { businessRules } from '../config/businessRules.js'

function id(value) {
  if (!value) return null
  return String(value._id ?? value)
}

export function serializeCategory(category, { productCount } = {}) {
  if (!category || !category._id) return category ? { id: id(category) } : null
  return {
    id: id(category),
    name: category.name,
    slug: category.slug,
    description: category.description ?? null,
    imageUrl: category.imageUrl ?? null,
    colorLabel: category.colorLabel ?? null,
    sizeLabel: category.sizeLabel ?? null,
    sortOrder: category.sortOrder ?? 0,
    isActive: category.isActive,
    ...(productCount !== undefined && { productCount }),
  }
}

export function stockStatus(stock) {
  if (stock <= 0) return 'out_of_stock'
  if (stock <= businessRules.lowStockThreshold) return 'low_stock'
  return 'in_stock'
}

export function serializeProduct(product, { admin = false } = {}) {
  if (!product) return null
  const base = {
    id: id(product),
    title: product.title,
    slug: product.slug,
    description: product.description,
    price: product.price,
    currency: product.currency,
    category: product.category?._id ? serializeCategory(product.category) : { id: id(product.category) },
    images: (product.images ?? []).map((image) => ({ url: image.url, alt: image.alt ?? product.title })),
    image: product.images?.[0]?.url ?? null,
    sku: product.sku,
    sizes: product.sizes ?? [],
    colors: (product.colors ?? []).map((color) => ({ name: color.name, hex: color.hex })),
    attributes: (product.attributes ?? []).map((attr) => ({ name: attr.name, value: attr.value })),
    isFeatured: product.isFeatured,
    ratingAverage: product.ratingAverage,
    ratingCount: product.ratingCount,
    stockStatus: stockStatus(product.stock),
    availableQuantity: Math.max(0, Math.min(product.stock, businessRules.maxCartItemQuantity)),
    isAvailable: product.status === 'active' && product.stock > 0,
    createdAt: product.createdAt,
  }
  if (admin) {
    base.stock = product.stock
    base.status = product.status
    base.updatedAt = product.updatedAt
  }
  return base
}

export function serializeOrder(order, { admin = false } = {}) {
  if (!order) return null
  const result = {
    id: id(order),
    orderNumber: order.orderNumber,
    items: order.items.map((item) => ({
      id: id(item),
      productId: id(item.product),
      title: item.title,
      slug: item.slug ?? null,
      sku: item.sku,
      image: item.image ?? null,
      category: item.category ?? null,
      size: item.size ?? null,
      color: item.color ?? null,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
      lineTotal: item.lineTotal,
    })),
    subtotal: order.subtotal,
    discount: order.discount,
    taxRate: order.taxRate,
    tax: order.tax,
    shipping: order.shipping,
    total: order.total,
    currency: order.currency,
    contactEmail: order.contactEmail,
    shippingAddress: order.shippingAddress,
    status: order.status,
    paymentStatus: order.paymentStatus,
    reservationExpiresAt: order.status === 'pending_payment' ? order.reservationExpiresAt : null,
    paymentId: order.payment ? id(order.payment) : null,
    paidAt: order.paidAt ?? null,
    cancelledAt: order.cancelledAt ?? null,
    cancelReason: order.cancelReason ?? null,
    statusHistory: (order.statusHistory ?? []).map((event) => ({
      status: event.status,
      paymentStatus: event.paymentStatus ?? null,
      at: event.at,
      by: event.by,
      note: event.note ?? null,
    })),
    createdAt: order.createdAt,
    updatedAt: order.updatedAt,
  }
  if (admin) {
    result.customer = order.user?._id
      ? { id: id(order.user), fullName: order.user.fullName, email: order.user.email }
      : { id: id(order.user) }
    result.razorpayOrderId = order.razorpayOrderId ?? null
    result.inventoryState = order.inventoryState
    result.needsAttention = order.needsAttention
    result.attentionReason = order.attentionReason ?? null
  }
  return result
}

export function serializePayment(payment) {
  if (!payment) return null
  return {
    id: id(payment),
    orderId: id(payment.order),
    provider: payment.provider,
    providerOrderId: payment.providerOrderId,
    providerPaymentId: payment.providerPaymentId ?? null,
    amount: payment.amount,
    currency: payment.currency,
    status: payment.status,
    method: payment.method ?? null,
    verifiedAt: payment.verifiedAt ?? null,
    failureReason: payment.failureReason ?? null,
    refundedAmount: payment.refundedAmount,
    refundedAt: payment.refundedAt ?? null,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  }
}

export function serializeReview(review, { currentUserId } = {}) {
  return {
    id: id(review),
    productId: id(review.product),
    rating: review.rating,
    title: review.title ?? null,
    comment: review.comment,
    verifiedPurchase: review.verifiedPurchase,
    author: { id: id(review.user), fullName: review.user?.fullName ?? 'Vela client' },
    isOwn: currentUserId ? id(review.user) === String(currentUserId) : false,
    createdAt: review.createdAt,
    updatedAt: review.updatedAt,
  }
}

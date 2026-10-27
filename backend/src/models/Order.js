import mongoose from 'mongoose'

import { env } from '../config/env.js'
import { FULFILMENT_STATUSES, ORDER_PAYMENT_STATUSES } from '../services/orderStatus.js'

// Immutable purchase-time snapshot: later product edits never rewrite history.
const orderItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    title: { type: String, required: true },
    slug: { type: String },
    sku: { type: String, required: true },
    image: { type: String },
    category: { type: String },
    size: { type: String, default: null },
    color: { type: String, default: null },
    unitPrice: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    lineTotal: { type: Number, required: true, min: 0 },
  },
  { _id: true },
)

const shippingAddressSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true },
    phone: { type: String, required: true },
    line1: { type: String, required: true },
    line2: { type: String },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false },
)

const statusEventSchema = new mongoose.Schema(
  {
    status: { type: String, required: true },
    paymentStatus: { type: String },
    at: { type: Date, default: Date.now },
    by: { type: String, enum: ['customer', 'admin', 'system', 'payment'], required: true },
    note: { type: String, maxlength: 300 },
  },
  { _id: false },
)

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    items: {
      type: [orderItemSchema],
      validate: { validator: (items) => items.length > 0, message: 'An order needs at least one item' },
    },
    // Money: integers in the smallest currency unit.
    subtotal: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0 },
    taxRate: { type: Number, required: true, min: 0 },
    tax: { type: Number, required: true, min: 0 },
    shipping: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true, default: env.CURRENCY },
    contactEmail: { type: String, required: true, lowercase: true, trim: true },
    shippingAddress: { type: shippingAddressSchema, required: true },

    status: { type: String, enum: FULFILMENT_STATUSES, default: 'pending_payment' },
    paymentStatus: { type: String, enum: ORDER_PAYMENT_STATUSES, default: 'pending' },
    // reserved -> committed (paid) or released (cancelled/expired before shipping)
    inventoryState: { type: String, enum: ['reserved', 'committed', 'released'], default: 'reserved' },
    reservationExpiresAt: { type: Date },

    razorpayOrderId: { type: String },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment' },
    paidAt: { type: Date },
    cancelledAt: { type: Date },
    cancelReason: { type: String, maxlength: 300 },
    needsAttention: { type: Boolean, default: false },
    attentionReason: { type: String, maxlength: 300 },

    idempotencyKey: { type: String, maxlength: 100 },
    statusHistory: { type: [statusEventSchema], default: [] },
  },
  { timestamps: true },
)

orderSchema.index({ user: 1, createdAt: -1 })
orderSchema.index({ status: 1, createdAt: -1 })
orderSchema.index({ paymentStatus: 1, createdAt: -1 })
orderSchema.index({ status: 1, reservationExpiresAt: 1 })
orderSchema.index({ razorpayOrderId: 1 }, { unique: true, partialFilterExpression: { razorpayOrderId: { $type: 'string' } } })
orderSchema.index(
  { user: 1, idempotencyKey: 1 },
  { unique: true, partialFilterExpression: { idempotencyKey: { $type: 'string' } } },
)

export const Order = mongoose.model('Order', orderSchema)

import mongoose from 'mongoose'

import { env } from '../config/env.js'

export const PRODUCT_STATUSES = ['active', 'inactive', 'archived']

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, required: true, trim: true, maxlength: 500 },
    alt: { type: String, trim: true, maxlength: 200 },
    storageId: { type: String, trim: true, maxlength: 300 },
  },
  { _id: false },
)

const colorSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    hex: { type: String, required: true, match: /^#[0-9a-fA-F]{6}$/ },
  },
  { _id: false },
)

const attributeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 40 },
    value: { type: String, required: true, trim: true, maxlength: 200 },
  },
  { _id: false },
)

const productSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    description: { type: String, required: true, trim: true, maxlength: 4000 },
    // Integer, smallest currency unit (paise).
    price: {
      type: Number,
      required: true,
      min: 0,
      validate: { validator: Number.isInteger, message: 'price must be an integer amount in the smallest currency unit' },
    },
    currency: { type: String, default: env.CURRENCY, uppercase: true, minlength: 3, maxlength: 3 },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    images: {
      type: [imageSchema],
      validate: { validator: (images) => images.length > 0, message: 'At least one image is required' },
    },
    sku: { type: String, required: true, unique: true, uppercase: true, trim: true, maxlength: 40 },
    sizes: { type: [String], default: [] },
    colors: { type: [colorSchema], default: [] },
    stock: {
      type: Number,
      required: true,
      min: [0, 'stock cannot be negative'],
      validate: { validator: Number.isInteger, message: 'stock must be an integer' },
    },
    isFeatured: { type: Boolean, default: false },
    status: { type: String, enum: PRODUCT_STATUSES, default: 'active' },
    attributes: { type: [attributeSchema], default: [] },
    // Server-maintained aggregates; never accepted from clients.
    ratingAverage: { type: Number, default: 0, min: 0, max: 5 },
    ratingCount: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true },
)

productSchema.index({ status: 1, category: 1, price: 1 })
productSchema.index({ status: 1, isFeatured: 1, createdAt: -1 })
productSchema.index({ status: 1, createdAt: -1 })
productSchema.index({ status: 1, ratingAverage: -1 })
productSchema.index({ status: 1, stock: 1 })
productSchema.index({ title: 'text', description: 'text' }, { weights: { title: 5, description: 1 } })

export const Product = mongoose.model('Product', productSchema)

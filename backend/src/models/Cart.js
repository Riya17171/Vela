import mongoose from 'mongoose'

const cartItemSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    size: { type: String, trim: true, default: null },
    color: { type: String, trim: true, default: null },
    quantity: { type: Number, required: true, min: 1 },
  },
  { timestamps: true },
)

// Prices are deliberately NOT stored here: they are always read from Product.
const cartSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    items: { type: [cartItemSchema], default: [] },
  },
  { timestamps: true, optimisticConcurrency: true },
)

export const Cart = mongoose.model('Cart', cartSchema)

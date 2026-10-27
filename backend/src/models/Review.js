import mongoose from 'mongoose'

const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
      validate: { validator: Number.isInteger, message: 'rating must be a whole number' },
    },
    title: { type: String, trim: true, maxlength: 120 },
    comment: { type: String, required: true, trim: true, minlength: 3, maxlength: 2000 },
    verifiedPurchase: { type: Boolean, default: false },
  },
  { timestamps: true },
)

reviewSchema.index({ product: 1, user: 1 }, { unique: true })
reviewSchema.index({ product: 1, createdAt: -1 })

export const Review = mongoose.model('Review', reviewSchema)

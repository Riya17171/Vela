import mongoose from 'mongoose'

const recentlyViewedSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    viewedAt: { type: Date, default: Date.now },
  },
  { timestamps: false },
)

recentlyViewedSchema.index({ user: 1, product: 1 }, { unique: true })
recentlyViewedSchema.index({ user: 1, viewedAt: -1 })

export const RecentlyViewed = mongoose.model('RecentlyViewed', recentlyViewedSchema)

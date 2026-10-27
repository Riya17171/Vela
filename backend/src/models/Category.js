import mongoose from 'mongoose'

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug may contain lowercase letters, numbers and hyphens'],
    },
    description: { type: String, trim: true, maxlength: 500 },
    imageUrl: { type: String, trim: true, maxlength: 500 },
    // Label shown above colour swatches for this category ("Leather", "Finish").
    colorLabel: { type: String, trim: true, maxlength: 30 },
    sizeLabel: { type: String, trim: true, maxlength: 30 },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
)

categorySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } })
categorySchema.index({ isActive: 1, sortOrder: 1 })

export const Category = mongoose.model('Category', categorySchema)

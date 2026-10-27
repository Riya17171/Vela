import mongoose from 'mongoose'

const newsletterSubscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    source: { type: String, trim: true, maxlength: 40, default: 'journal' },
  },
  { timestamps: true },
)

export const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', newsletterSubscriberSchema)

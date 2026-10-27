import mongoose from 'mongoose'

// Deduplicates provider webhook deliveries (Razorpay retries on non-2xx).
const webhookEventSchema = new mongoose.Schema(
  {
    provider: { type: String, required: true, default: 'razorpay' },
    eventId: { type: String, required: true },
    event: { type: String, required: true },
    status: { type: String, enum: ['processing', 'processed', 'ignored'], default: 'processing' },
    outcome: { type: String, maxlength: 200 },
  },
  { timestamps: true },
)

webhookEventSchema.index({ provider: 1, eventId: 1 }, { unique: true })
webhookEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 })

export const WebhookEvent = mongoose.model('WebhookEvent', webhookEventSchema)

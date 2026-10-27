import mongoose from 'mongoose'

export const PAYMENT_RECORD_STATUSES = ['created', 'authorized', 'captured', 'failed', 'refund_pending', 'refunded']

// One payment record per provider order. Card data never touches this API:
// Razorpay Checkout collects it, we only keep provider identifiers.
const attemptSchema = new mongoose.Schema(
  {
    providerPaymentId: { type: String },
    status: { type: String },
    method: { type: String },
    errorCode: { type: String },
    errorDescription: { type: String, maxlength: 500 },
    source: { type: String, enum: ['verify', 'webhook', 'reconcile', 'client_report'] },
    at: { type: Date, default: Date.now },
  },
  { _id: false },
)

const paymentSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    provider: { type: String, enum: ['razorpay'], default: 'razorpay' },
    providerOrderId: { type: String, required: true, unique: true },
    providerPaymentId: { type: String },
    amount: { type: Number, required: true, min: 0 },
    currency: { type: String, required: true },
    status: { type: String, enum: PAYMENT_RECORD_STATUSES, default: 'created' },
    method: { type: String },
    verifiedAt: { type: Date },
    verifiedVia: { type: String, enum: ['verify', 'webhook', 'reconcile'] },
    failureCode: { type: String },
    failureReason: { type: String, maxlength: 500 },
    refundId: { type: String },
    refundedAmount: { type: Number, default: 0 },
    refundedAt: { type: Date },
    attempts: { type: [attemptSchema], default: [] },
  },
  { timestamps: true },
)

paymentSchema.index({ providerPaymentId: 1 }, { sparse: true })

export const Payment = mongoose.model('Payment', paymentSchema)

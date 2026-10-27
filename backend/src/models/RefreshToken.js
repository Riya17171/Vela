import mongoose from 'mongoose'

// One document per issued refresh token. Rotation links tokens into a family
// so a replayed (already rotated) token can revoke the whole session.
const refreshTokenSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    family: { type: String, required: true, index: true },
    expiresAt: { type: Date, required: true },
    revokedAt: { type: Date, default: null },
    revokedReason: { type: String, enum: ['rotated', 'logout', 'reuse_detected', 'password_change', 'admin', null], default: null },
    replacedByHash: { type: String, default: null },
    userAgent: { type: String, maxlength: 300 },
    ip: { type: String, maxlength: 64 },
  },
  { timestamps: true },
)

// MongoDB removes documents once they expire.
refreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const RefreshToken = mongoose.model('RefreshToken', refreshTokenSchema)

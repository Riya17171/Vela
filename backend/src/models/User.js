import bcrypt from 'bcryptjs'
import mongoose from 'mongoose'

import { env } from '../config/env.js'

export const USER_ROLES = ['user', 'admin']
export const ACCOUNT_STATUSES = ['active', 'suspended']

const addressSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 40 },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },
    phone: { type: String, required: true, trim: true, maxlength: 20 },
    line1: { type: String, required: true, trim: true, maxlength: 200 },
    line2: { type: String, trim: true, maxlength: 200 },
    city: { type: String, required: true, trim: true, maxlength: 100 },
    state: { type: String, required: true, trim: true, maxlength: 100 },
    postalCode: { type: String, required: true, trim: true, maxlength: 12 },
    country: { type: String, required: true, trim: true, default: 'IN', maxlength: 2 },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true },
)

const userSchema = new mongoose.Schema(
  {
    fullName: { type: String, required: true, trim: true, minlength: 2, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: 254,
    },
    passwordHash: { type: String, required: true, select: false },
    phone: { type: String, trim: true, maxlength: 20 },
    avatarUrl: { type: String, trim: true, maxlength: 500 },
    role: { type: String, enum: USER_ROLES, default: 'user', index: true },
    status: { type: String, enum: ACCOUNT_STATUSES, default: 'active' },
    // Bumped whenever every existing session must die (password change/reset).
    tokenVersion: { type: Number, default: 0 },
    passwordChangedAt: { type: Date },
    passwordResetTokenHash: { type: String, select: false },
    passwordResetExpiresAt: { type: Date, select: false },
    lastLoginAt: { type: Date },
    addresses: { type: [addressSchema], default: [] },
  },
  { timestamps: true },
)

userSchema.index({ passwordResetTokenHash: 1 }, { sparse: true })
userSchema.index({ createdAt: -1 })

userSchema.methods.setPassword = async function setPassword(plain) {
  this.passwordHash = await bcrypt.hash(plain, env.BCRYPT_ROUNDS)
  this.passwordChangedAt = new Date()
}

userSchema.methods.comparePassword = function comparePassword(plain) {
  return bcrypt.compare(plain, this.passwordHash)
}

/** The only shape of a user that ever leaves the API. */
userSchema.methods.toSafeJSON = function toSafeJSON() {
  return {
    id: String(this._id),
    fullName: this.fullName,
    email: this.email,
    phone: this.phone ?? null,
    avatarUrl: this.avatarUrl ?? null,
    role: this.role,
    status: this.status,
    addresses: (this.addresses ?? []).map((address) => ({
      id: String(address._id),
      label: address.label ?? null,
      fullName: address.fullName,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 ?? null,
      city: address.city,
      state: address.state,
      postalCode: address.postalCode,
      country: address.country,
      isDefault: address.isDefault,
    })),
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  }
}

userSchema.set('toJSON', {
  transform(_doc, ret) {
    delete ret.passwordHash
    delete ret.passwordResetTokenHash
    delete ret.passwordResetExpiresAt
    delete ret.tokenVersion
    delete ret.__v
    return ret
  },
})

export const User = mongoose.model('User', userSchema)

import dotenv from 'dotenv'
import { z } from 'zod'

dotenv.config({ quiet: true })

const booleanString = z
  .enum(['true', 'false', '1', '0', 'yes', 'no'])
  .transform((value) => ['true', '1', 'yes'].includes(value))

const optionalString = z
  .string()
  .trim()
  .optional()
  .transform((value) => (value ? value : undefined))

const schema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']).default('info'),
  TRUST_PROXY: z.coerce.number().int().min(0).default(0),

  MONGODB_URI: z.string().trim().min(1, 'MONGODB_URI is required'),
  MONGODB_TRANSACTIONS: z.enum(['auto', 'on', 'off']).default('auto'),

  CLIENT_ORIGINS: z
    .string()
    .trim()
    .min(1, 'CLIENT_ORIGINS is required (comma-separated list of allowed frontend origins)'),
  APP_URL: z.url('APP_URL must be the public URL of the frontend'),

  JWT_ACCESS_SECRET: z.string().min(32, 'JWT_ACCESS_SECRET must be at least 32 characters'),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().min(1).max(90).default(7),
  PASSWORD_RESET_TTL_MINUTES: z.coerce.number().int().min(5).max(240).default(30),
  BCRYPT_ROUNDS: z.coerce.number().int().min(4).max(15).default(12),

  COOKIE_SECURE: booleanString.default(false),
  COOKIE_SAMESITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: optionalString,

  RAZORPAY_KEY_ID: optionalString,
  RAZORPAY_KEY_SECRET: optionalString,
  RAZORPAY_WEBHOOK_SECRET: optionalString,
  RAZORPAY_ALLOW_LIVE_KEYS: booleanString.default(false),

  CURRENCY: z.string().trim().length(3).toUpperCase().default('INR'),
  TAX_RATE: z.coerce.number().min(0).max(1).default(0.08),
  SHIPPING_FEE: z.coerce.number().int().min(0).default(0),
  FREE_SHIPPING_THRESHOLD: z.coerce.number().int().min(0).default(0),
  ORDER_RESERVATION_MINUTES: z.coerce.number().int().min(5).max(1440).default(30),
  MAX_CART_ITEM_QUANTITY: z.coerce.number().int().min(1).max(100).default(10),
  LOW_STOCK_THRESHOLD: z.coerce.number().int().min(0).default(5),
  PAGINATION_DEFAULT_LIMIT: z.coerce.number().int().min(1).max(100).default(12),
  PAGINATION_MAX_LIMIT: z.coerce.number().int().min(1).max(200).default(48),

  RATE_LIMIT_WINDOW_MINUTES: z.coerce.number().int().min(1).default(15),
  RATE_LIMIT_AUTH_MAX: z.coerce.number().int().min(1).default(20),
  RATE_LIMIT_API_MAX: z.coerce.number().int().min(1).default(600),

  SMTP_HOST: optionalString,
  SMTP_PORT: z.coerce.number().int().positive().default(587),
  SMTP_USER: optionalString,
  SMTP_PASS: optionalString,
  EMAIL_FROM: z.string().default('Vela <no-reply@vela.local>'),

  CLOUDINARY_CLOUD_NAME: optionalString,
  CLOUDINARY_API_KEY: optionalString,
  CLOUDINARY_API_SECRET: optionalString,
  CLOUDINARY_FOLDER: z.string().default('vela/products'),
  MAX_UPLOAD_MB: z.coerce.number().min(0.1).max(20).default(5),
})

function loadEnv() {
  const parsed = schema.safeParse(process.env)

  if (!parsed.success) {
    const details = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.') || 'env'}: ${issue.message}`)
      .join('\n')
    throw new Error(`Invalid backend configuration. Fix these environment variables:\n${details}`)
  }

  const env = parsed.data
  const problems = []

  const razorpayValues = [env.RAZORPAY_KEY_ID, env.RAZORPAY_KEY_SECRET]
  const razorpayConfigured = razorpayValues.every(Boolean)
  if (razorpayValues.some(Boolean) && !razorpayConfigured) {
    problems.push('RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET must be set together')
  }
  if (razorpayConfigured && !env.RAZORPAY_ALLOW_LIVE_KEYS && !env.RAZORPAY_KEY_ID.startsWith('rzp_test_')) {
    problems.push('RAZORPAY_KEY_ID is not a test-mode key (rzp_test_...). Live keys are refused unless RAZORPAY_ALLOW_LIVE_KEYS=true')
  }
  if (env.NODE_ENV === 'production') {
    if (!razorpayConfigured) problems.push('Razorpay credentials are required in production')
    if (!env.RAZORPAY_WEBHOOK_SECRET) problems.push('RAZORPAY_WEBHOOK_SECRET is required in production')
    if (!env.COOKIE_SECURE) problems.push('COOKIE_SECURE must be true in production')
  }
  if (env.COOKIE_SAMESITE === 'none' && !env.COOKIE_SECURE) {
    problems.push('COOKIE_SAMESITE=none requires COOKIE_SECURE=true (browsers reject it otherwise)')
  }

  const cloudinaryValues = [env.CLOUDINARY_CLOUD_NAME, env.CLOUDINARY_API_KEY, env.CLOUDINARY_API_SECRET]
  if (cloudinaryValues.some(Boolean) && !cloudinaryValues.every(Boolean)) {
    problems.push('CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY and CLOUDINARY_API_SECRET must be set together')
  }

  if (problems.length) {
    throw new Error(`Invalid backend configuration:\n${problems.map((p) => `  - ${p}`).join('\n')}`)
  }

  return Object.freeze({
    ...env,
    isProduction: env.NODE_ENV === 'production',
    isTest: env.NODE_ENV === 'test',
    isDevelopment: env.NODE_ENV === 'development',
    clientOrigins: env.CLIENT_ORIGINS.split(',').map((origin) => origin.trim().replace(/\/$/, '')).filter(Boolean),
    razorpayEnabled: razorpayConfigured,
    razorpayWebhookEnabled: Boolean(env.RAZORPAY_WEBHOOK_SECRET),
    emailEnabled: Boolean(env.SMTP_HOST),
    uploadsEnabled: cloudinaryValues.every(Boolean),
  })
}

export const env = loadEnv()

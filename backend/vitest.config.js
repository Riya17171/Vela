import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globalSetup: ['./tests/helpers/globalSetup.js'],
    setupFiles: ['./tests/helpers/setupFile.js'],
    testTimeout: 30_000,
    hookTimeout: 120_000,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      MONGODB_URI: 'mongodb://placeholder-replaced-by-global-setup',
      CLIENT_ORIGINS: 'http://localhost:5173',
      APP_URL: 'http://localhost:5173',
      JWT_ACCESS_SECRET: 'test-secret-that-is-definitely-longer-than-32-chars',
      BCRYPT_ROUNDS: '4',
      RAZORPAY_KEY_ID: 'rzp_test_FakeKeyForTests',
      RAZORPAY_KEY_SECRET: 'fake_test_key_secret',
      RAZORPAY_WEBHOOK_SECRET: 'fake_webhook_secret',
      TAX_RATE: '0.08',
      SHIPPING_FEE: '0',
      LOG_LEVEL: 'silent',
    },
  },
})

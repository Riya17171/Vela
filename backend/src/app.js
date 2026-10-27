import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import helmet from 'helmet'

import { env } from './config/env.js'
import { webhook } from './controllers/payment.controller.js'
import { errorHandler } from './middlewares/errorHandler.js'
import { notFound } from './middlewares/notFound.js'
import { apiLimiter } from './middlewares/rateLimiter.js'
import { rejectOperators } from './middlewares/rejectOperators.js'
import { requestLogger } from './middlewares/requestLogger.js'
import apiRoutes from './routes/index.js'

export function createApp() {
  const app = express()

  app.disable('x-powered-by')
  if (env.TRUST_PROXY) app.set('trust proxy', env.TRUST_PROXY)

  app.use(requestLogger)
  app.use(helmet())
  app.use(
    cors({
      origin(origin, callback) {
        // Same-origin and non-browser requests (curl, Postman, Razorpay) carry no Origin header.
        if (!origin || env.clientOrigins.includes(origin.replace(/\/$/, ''))) return callback(null, true)
        return callback(null, false)
      },
      credentials: true,
      methods: ['GET', 'POST', 'PATCH', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Idempotency-Key', 'X-Request-Id'],
      exposedHeaders: ['X-Request-Id', 'RateLimit', 'RateLimit-Policy'],
      maxAge: 600,
    }),
  )

  // Razorpay signs the exact bytes it sends, so this route must see the raw body
  // and therefore has to be registered before express.json().
  app.post('/api/v1/payments/webhook', express.raw({ type: 'application/json', limit: '256kb' }), webhook)

  app.use(express.json({ limit: '100kb' }))
  app.use(express.urlencoded({ extended: false, limit: '100kb' }))
  app.use(cookieParser())
  app.use(rejectOperators)
  app.use('/api/v1', apiLimiter, apiRoutes)

  app.use(notFound)
  app.use(errorHandler)
  return app
}

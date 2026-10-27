// Configuration is validated when ./config/env.js is first imported. Importing
// everything dynamically lets a bad .env produce a readable message, not a stack trace.
let modules
try {
  modules = {
    ...(await import('./config/database.js')),
    ...(await import('./config/env.js')),
    ...(await import('./config/logger.js')),
    ...(await import('./config/razorpay.js')),
    ...(await import('./app.js')),
    ...(await import('./services/order.service.js')),
  }
} catch (error) {
  console.error(`\n${error.message}\n\nSee backend/.env.example for every variable.\n`)
  process.exit(1)
}

const { connectDatabase, disconnectDatabase, env, logger, razorpayConfig, createApp, expireStaleOrders } = modules

const EXPIRY_SWEEP_MS = 60_000

function warnAboutOptionalIntegrations() {
  if (!razorpayConfig.enabled) {
    logger.warn('Razorpay is NOT configured: checkout will respond 503 until RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET are set')
  } else {
    logger.info({ testMode: razorpayConfig.testMode }, 'Razorpay configured')
  }
  if (!razorpayConfig.webhookEnabled) logger.warn('RAZORPAY_WEBHOOK_SECRET not set: webhook endpoint is disabled')
  if (!env.emailEnabled) logger.warn('SMTP not configured: password-reset emails are not delivered (dev: link is logged)')
  if (!env.uploadsEnabled) logger.warn('Cloudinary not configured: admin image upload is disabled; image URLs still work')
}

async function start() {
  await connectDatabase()
  warnAboutOptionalIntegrations()

  const app = createApp()
  const server = app.listen(env.PORT, () => logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Vela API listening'))
  server.on('error', (error) => {
    logger.fatal({ err: error }, error.code === 'EADDRINUSE' ? `Port ${env.PORT} is already in use; set PORT to a free port` : 'HTTP server error')
    process.exit(1)
  })

  const sweep = setInterval(() => {
    expireStaleOrders().catch((error) => logger.error({ err: error }, 'Order expiry sweep failed'))
  }, EXPIRY_SWEEP_MS)
  sweep.unref()

  let shuttingDown = false
  async function shutdown(signal) {
    if (shuttingDown) return
    shuttingDown = true
    logger.info({ signal }, 'Shutting down gracefully')
    clearInterval(sweep)
    const forceExit = setTimeout(() => {
      logger.error('Forced shutdown after timeout')
      process.exit(1)
    }, 10_000)
    forceExit.unref()
    server.close(async () => {
      await disconnectDatabase().catch(() => {})
      logger.info('Shutdown complete')
      process.exit(0)
    })
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'))
  process.on('SIGINT', () => shutdown('SIGINT'))
}

process.on('unhandledRejection', (reason) => logger.error({ err: reason }, 'Unhandled promise rejection'))

start().catch((error) => {
  // Configuration and database errors land here with a readable message.
  logger.fatal({ err: error }, `Failed to start Vela API: ${error.message}`)
  process.exit(1)
})

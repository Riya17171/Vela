import mongoose from 'mongoose'

import { env } from './env.js'
import { logger } from './logger.js'

mongoose.set('strictQuery', true)

let transactionsSupported = false

/**
 * Transactions need a replica set or sharded cluster (MongoDB Atlas always is one;
 * a bare local `mongod` is not). In `auto` mode we ask the server what it is.
 */
async function detectTransactionSupport() {
  if (env.MONGODB_TRANSACTIONS === 'off') return false
  const hello = await mongoose.connection.db.admin().command({ hello: 1 })
  const supported = Boolean(hello.setName) || hello.msg === 'isdbgrid'
  if (env.MONGODB_TRANSACTIONS === 'on' && !supported) {
    throw new Error('MONGODB_TRANSACTIONS=on but the MongoDB deployment is not a replica set or sharded cluster')
  }
  return supported
}

export async function connectDatabase(uri = env.MONGODB_URI, options = {}) {
  await mongoose.connect(uri, { serverSelectionTimeoutMS: 10_000, ...options })
  transactionsSupported = await detectTransactionSupport()
  logger.info(
    { db: mongoose.connection.name, transactions: transactionsSupported },
    'MongoDB connected',
  )
  if (!transactionsSupported) {
    logger.warn(
      'MongoDB transactions are unavailable; inventory falls back to atomic conditional updates with compensation',
    )
  }
  return mongoose.connection
}

export async function disconnectDatabase() {
  await mongoose.disconnect()
}

export function supportsTransactions() {
  return transactionsSupported
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1
}

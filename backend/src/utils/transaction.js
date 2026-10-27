import mongoose from 'mongoose'

import { supportsTransactions } from '../config/database.js'

/**
 * Runs `work(session)` inside a MongoDB transaction when the deployment
 * supports it, otherwise runs it with `session = null`. Callers must write
 * their logic so it stays correct without a session (atomic conditional
 * updates plus explicit compensation), which is how inventory.service works.
 */
export async function withOptionalTransaction(work) {
  if (!supportsTransactions()) return work(null)

  const session = await mongoose.startSession()
  try {
    let result
    await session.withTransaction(async () => {
      result = await work(session)
    })
    return result
  } finally {
    await session.endSession()
  }
}

import crypto from 'node:crypto'

import mongoose from 'mongoose'
import { afterAll, beforeAll, inject } from 'vitest'

import { connectDatabase } from '../../src/config/database.js'

beforeAll(async () => {
  await connectDatabase(inject('mongoUri'), { dbName: `vela_test_${crypto.randomBytes(4).toString('hex')}` })
  // Wait for unique indexes: several tests rely on them (idempotency, duplicate reviews).
  await Promise.all(Object.values(mongoose.models).map((model) => model.init()))
})

afterAll(async () => {
  await mongoose.connection.dropDatabase()
  await mongoose.disconnect()
})

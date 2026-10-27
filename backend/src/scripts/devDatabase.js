/**
 * Local development convenience when neither Docker nor MongoDB is installed:
 * starts a single-node MongoDB *replica set* (so transactions work) using the
 * mongod binary that mongodb-memory-server downloads. Data persists in
 * backend/.mongo-data between runs.
 *
 *   npm run db:dev   -> then set MONGODB_URI to the printed URI
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { MongoMemoryReplSet } from 'mongodb-memory-server'

const dbPath = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.mongo-data')
fs.mkdirSync(dbPath, { recursive: true })

const port = Number(process.env.DEV_MONGO_PORT ?? 27017)
const replSet = await MongoMemoryReplSet.create({
  replSet: { count: 1, name: 'rs0', storageEngine: 'wiredTiger' },
  instanceOpts: [{ port, dbPath }],
})

console.log(`MongoDB replica set ready: mongodb://127.0.0.1:${port}/vela?replicaSet=rs0`)
console.log(`Data directory: ${dbPath}. Press Ctrl+C to stop.`)

async function stop() {
  await replSet.stop({ doCleanup: false })
  process.exit(0)
}
process.on('SIGINT', stop)
process.on('SIGTERM', stop)

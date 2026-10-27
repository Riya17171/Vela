/**
 * Provisions an administrator. There is deliberately no HTTP endpoint for
 * this: admins are created only by someone with shell + database access.
 *
 *   ADMIN_EMAIL=you@example.com ADMIN_NAME="Your Name" npm run create-admin
 *     -> prompts for the password (or reads ADMIN_PASSWORD if set)
 *
 * If the email already belongs to a customer account, that account is
 * promoted after confirmation. Refuses to run with NODE_ENV=production unless
 * ALLOW_ADMIN_PROVISIONING=true is also set.
 */
import readline from 'node:readline'
import { Writable } from 'node:stream'

import { connectDatabase, disconnectDatabase } from '../config/database.js'
import { env } from '../config/env.js'
import { revokeAllSessions } from '../services/auth.service.js'
import { User } from '../models/User.js'
import { email as emailSchema, fullName as nameSchema, password as passwordSchema } from '../validators/common.js'

function ask(question, { hidden = false } = {}) {
  let muted = false
  const output = new Writable({
    write(chunk, encoding, callback) {
      if (!muted) process.stdout.write(chunk, encoding)
      callback()
    },
  })
  const rl = readline.createInterface({ input: process.stdin, output, terminal: true })
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close()
      if (hidden) process.stdout.write('\n')
      resolve(answer)
    })
    muted = hidden
  })
}

function parse(schema, value, label) {
  const result = schema.safeParse(value)
  if (!result.success) throw new Error(`${label}: ${result.error.issues[0].message}`)
  return result.data
}

async function main() {
  if (env.isProduction && process.env.ALLOW_ADMIN_PROVISIONING !== 'true') {
    throw new Error('Refusing to provision an admin in production without ALLOW_ADMIN_PROVISIONING=true')
  }

  const email = parse(emailSchema, process.env.ADMIN_EMAIL ?? (await ask('Admin email: ')), 'Email')
  await connectDatabase()

  const existing = await User.findOne({ email })
  if (existing?.role === 'admin') {
    console.log(`${email} is already an administrator. Nothing to do.`)
    return
  }
  if (existing) {
    const confirm = process.env.ADMIN_PROMOTE_EXISTING ?? (await ask(`${email} is a customer account. Promote it to admin? (yes/no) `))
    if (confirm.trim().toLowerCase() !== 'yes') {
      console.log('Aborted.')
      return
    }
    existing.role = 'admin'
    existing.tokenVersion += 1
    await existing.save()
    await revokeAllSessions(existing._id, 'admin')
    console.log(`Promoted ${email} to administrator. They must sign in again.`)
    return
  }

  const fullName = parse(nameSchema, process.env.ADMIN_NAME ?? (await ask('Full name: ')), 'Full name')
  const password = parse(passwordSchema, process.env.ADMIN_PASSWORD ?? (await ask('Password (hidden): ', { hidden: true })), 'Password')

  const admin = new User({ fullName, email, role: 'admin' })
  await admin.setPassword(password)
  await admin.save()
  console.log(`Administrator ${email} created.`)
}

main()
  .catch((error) => {
    console.error(`create-admin failed: ${error.message}`)
    process.exitCode = 1
  })
  .finally(() => disconnectDatabase().catch(() => {}))

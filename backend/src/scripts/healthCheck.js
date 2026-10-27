/**
 * Calls GET /api/v1/health and exits non-zero unless the API reports ready.
 * Useful for container health checks and CI smoke tests.
 *
 *   npm run health                         (uses http://localhost:$PORT)
 *   HEALTH_URL=https://api.example.com npm run health
 */
const base = process.env.HEALTH_URL ?? `http://localhost:${process.env.PORT ?? 4000}`
const url = `${base.replace(/\/$/, '')}/api/v1/health`

try {
  const response = await fetch(url, { signal: AbortSignal.timeout(5000) })
  const body = await response.json()
  console.log(`${response.status} ${JSON.stringify(body)}`)
  process.exitCode = response.ok && body?.data?.status === 'ok' ? 0 : 1
} catch (error) {
  console.error(`Health check failed for ${url}: ${error.message}`)
  process.exitCode = 1
}

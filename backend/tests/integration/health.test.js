import { describe, expect, it } from 'vitest'

import { api } from '../helpers/factories.js'

describe('GET /api/v1/health', () => {
  it('reports ready when the database is connected', async () => {
    const res = await api().get('/api/v1/health')
    expect(res.status).toBe(200)
    expect(res.body).toMatchObject({ success: true, message: 'Vela API is running', data: { status: 'ok', database: 'connected' } })
  })

  it('exposes only non-secret public configuration', async () => {
    const res = await api().get('/api/v1/config')
    expect(res.status).toBe(200)
    expect(res.body.data.payments).toMatchObject({ enabled: true, keyId: 'rzp_test_FakeKeyForTests', testMode: true })
    expect(JSON.stringify(res.body)).not.toContain('fake_test_key_secret')
    expect(JSON.stringify(res.body)).not.toContain('fake_webhook_secret')
  })

  it('returns a JSON 404 for unknown routes', async () => {
    const res = await api().get('/api/v1/does-not-exist')
    expect(res.status).toBe(404)
    expect(res.body.success).toBe(false)
  })
})

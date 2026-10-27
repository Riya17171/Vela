import { afterEach, describe, expect, it, vi } from 'vitest'

import { api, ApiRequestError, getAccessToken, request, setAccessToken, setSessionExpiredHandler } from './apiClient.js'

function respond(config, status, body) {
  const response = { data: body, status, statusText: String(status), headers: {}, config }
  if (status >= 400) {
    const error = new Error(`Request failed with status code ${status}`)
    error.config = config
    error.response = response
    return Promise.reject(error)
  }
  return Promise.resolve(response)
}

const originalAdapter = api.defaults.adapter
afterEach(() => {
  api.defaults.adapter = originalAdapter
  setAccessToken(null)
  setSessionExpiredHandler(() => {})
})

describe('apiClient', () => {
  it('unwraps the success envelope and attaches the bearer token', async () => {
    setAccessToken('token-1')
    api.defaults.adapter = vi.fn((config) => {
      expect(config.headers.Authorization).toBe('Bearer token-1')
      return respond(config, 200, { success: true, message: 'ok', data: { value: 42 }, meta: { page: 1 } })
    })
    const result = await request({ url: '/anything' })
    expect(result).toMatchObject({ value: 42, meta: { page: 1 }, message: 'ok' })
  })

  it('normalises API errors including field errors', async () => {
    api.defaults.adapter = (config) => respond(config, 400, { success: false, message: 'Validation failed', errors: [{ field: 'email', message: 'Enter a valid email address' }] })
    const error = await request({ url: '/auth/login', method: 'post' }).catch((e) => e)
    expect(error).toBeInstanceOf(ApiRequestError)
    expect(error.status).toBe(400)
    expect(error.fieldErrors()).toEqual({ email: 'Enter a valid email address' })
  })

  it('reports network failures distinctly', async () => {
    api.defaults.adapter = (config) => {
      const error = new Error('Network Error')
      error.config = config
      return Promise.reject(error)
    }
    const error = await request({ url: '/products' }).catch((e) => e)
    expect(error.isNetworkError).toBe(true)
  })

  it('refreshes an expired access token once for concurrent requests and retries them', async () => {
    setAccessToken('expired')
    let refreshCalls = 0
    api.defaults.adapter = vi.fn((config) => {
      if (config.url === '/auth/refresh') {
        refreshCalls += 1
        return respond(config, 200, { success: true, data: { accessToken: 'fresh', user: { id: '1' } } })
      }
      if (config.headers.Authorization === 'Bearer expired') {
        return respond(config, 401, { success: false, message: 'Access token expired', code: 'TOKEN_EXPIRED' })
      }
      return respond(config, 200, { success: true, data: { url: config.url } })
    })

    const [a, b] = await Promise.all([request({ url: '/cart' }), request({ url: '/wishlist' })])
    expect(a.url).toBe('/cart')
    expect(b.url).toBe('/wishlist')
    expect(refreshCalls).toBe(1)
    expect(getAccessToken()).toBe('fresh')
  })

  it('ends the session instead of looping when refresh fails', async () => {
    setAccessToken('expired')
    const expired = vi.fn()
    setSessionExpiredHandler(expired)
    api.defaults.adapter = (config) =>
      config.url === '/auth/refresh'
        ? respond(config, 401, { success: false, code: 'REFRESH_TOKEN_REVOKED', message: 'Session is no longer valid' })
        : respond(config, 401, { success: false, code: 'TOKEN_EXPIRED', message: 'Access token expired' })

    const error = await request({ url: '/cart' }).catch((e) => e)
    expect(error.status).toBe(401)
    expect(expired).toHaveBeenCalledOnce()
    expect(getAccessToken()).toBeNull()
  })
})

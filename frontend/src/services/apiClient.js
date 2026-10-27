import axios from 'axios'

/** Every failed request becomes one of these, so pages never parse Axios internals. */
export class ApiRequestError extends Error {
  constructor({ status = 0, message, code, errors = [], details } = {}) {
    super(message || 'Something went wrong. Please try again.')
    this.name = 'ApiRequestError'
    this.status = status
    this.code = code
    this.errors = errors
    this.details = details
  }

  get isNetworkError() {
    return this.status === 0
  }

  /** Field errors keyed by field name, ready for form display. */
  fieldErrors() {
    return Object.fromEntries(this.errors.map((error) => [error.field, error.message]))
  }
}

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api/v1',
  withCredentials: true, // sends the httpOnly refresh cookie to /auth/*
  timeout: 20_000,
  headers: { 'Content-Type': 'application/json' },
})

// The access token lives only in memory; the long-lived refresh token is an httpOnly cookie.
let accessToken = null
let refreshPromise = null
let onSessionExpired = () => {}

export function setAccessToken(token) {
  accessToken = token || null
}

export function getAccessToken() {
  return accessToken
}

export function setSessionExpiredHandler(handler) {
  onSessionExpired = handler
}

/**
 * Single-flight refresh: concurrent 401s (or React StrictMode's double
 * effects) share one /auth/refresh call instead of racing and tripping the
 * server's refresh-token reuse detection.
 */
export function refreshSession() {
  if (!refreshPromise) {
    refreshPromise = api
      .post('/auth/refresh', {}, { skipAuthRefresh: true })
      .then((res) => {
        setAccessToken(res.data.data.accessToken)
        return res.data.data
      })
      .finally(() => {
        refreshPromise = null
      })
  }
  return refreshPromise
}

api.interceptors.request.use((config) => {
  if (accessToken && !config.headers.Authorization) config.headers.Authorization = `Bearer ${accessToken}`
  return config
})

const REFRESHABLE_CODES = new Set(['TOKEN_EXPIRED', 'INVALID_TOKEN', 'TOKEN_REVOKED', 'NO_TOKEN'])

function toApiError(error) {
  if (error.response) {
    const { status, data } = error.response
    return new ApiRequestError({
      status,
      message: data?.message,
      code: data?.code,
      errors: data?.errors ?? [],
      details: data?.details,
    })
  }
  return new ApiRequestError({
    status: 0,
    code: 'NETWORK_ERROR',
    message: error.code === 'ECONNABORTED' ? 'The request timed out. Please try again.' : 'Unable to reach Vela. Check your connection and try again.',
  })
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config ?? {}
    const status = error.response?.status
    const code = error.response?.data?.code

    if (status === 401 && REFRESHABLE_CODES.has(code) && !original.skipAuthRefresh && !original._retried && accessToken) {
      original._retried = true
      try {
        await refreshSession()
        original.headers = { ...original.headers, Authorization: `Bearer ${accessToken}` }
        return api(original)
      } catch {
        setAccessToken(null)
        onSessionExpired()
      }
    }
    return Promise.reject(toApiError(error))
  },
)

/** Unwraps the API envelope: { success, message, data, meta }. */
export async function request(config) {
  const res = await api.request(config)
  return { ...res.data.data, meta: res.data.meta, message: res.data.message, status: res.status }
}

import { request } from './apiClient.js'

let configPromise = null

/** Public, non-secret store settings (currency, payment availability). Cached per page load. */
export function fetchPublicConfig() {
  if (!configPromise) {
    configPromise = request({ url: '/config' }).catch((error) => {
      configPromise = null
      throw error
    })
  }
  return configPromise
}

export const subscribeToJournal = (email) => request({ method: 'post', url: '/newsletter/subscribe', data: { email } })

import { request, setAccessToken } from './apiClient.js'

function startSession(result) {
  setAccessToken(result.accessToken)
  return result.user
}

export async function register(body) {
  return startSession(await request({ method: 'post', url: '/auth/register', data: body }))
}

export async function login(body) {
  return startSession(await request({ method: 'post', url: '/auth/login', data: body }))
}

export async function logout() {
  try {
    await request({ method: 'post', url: '/auth/logout', skipAuthRefresh: true })
  } finally {
    setAccessToken(null)
  }
}

export const forgotPassword = (email) => request({ method: 'post', url: '/auth/forgot-password', data: { email } })
export const resetPassword = (body) => request({ method: 'post', url: '/auth/reset-password', data: body })

export async function changePassword(body) {
  return startSession(await request({ method: 'patch', url: '/auth/change-password', data: body }))
}

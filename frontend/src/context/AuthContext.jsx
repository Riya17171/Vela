import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

import { refreshSession, setSessionExpiredHandler } from '../services/apiClient.js'
import * as authService from '../services/auth.js'

const AuthContext = createContext(null)

// Per-browser hint that a refresh cookie probably exists, so anonymous visitors
// don't fire a guaranteed-401 refresh on every page load. The httpOnly cookie
// remains the only credential; this flag carries no authority.
const SESSION_HINT = 'vela_has_session'

function readHint() {
  try {
    return localStorage.getItem(SESSION_HINT) === '1'
  } catch {
    return true
  }
}

function writeHint(active) {
  try {
    if (active) localStorage.setItem(SESSION_HINT, '1')
    else localStorage.removeItem(SESSION_HINT)
  } catch {
    // Storage unavailable: we simply always attempt a refresh.
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(readHint)
  const [sessionExpired, setSessionExpired] = useState(false)

  useEffect(() => {
    let mounted = true
    // Restore the session from the httpOnly refresh cookie, if there is one.
    if (readHint()) {
      refreshSession()
        .then((session) => mounted && setUser(session.user))
        .catch(() => {
          writeHint(false)
          if (mounted) setUser(null)
        })
        .finally(() => mounted && setLoading(false))
    }

    setSessionExpiredHandler(() => {
      writeHint(false)
      setUser(null)
      setSessionExpired(true)
    })
    return () => {
      mounted = false
      setSessionExpiredHandler(() => {})
    }
  }, [])

  const signIn = useCallback(async (credentials) => {
    const nextUser = await authService.login(credentials)
    writeHint(true)
    setUser(nextUser)
    setSessionExpired(false)
    return nextUser
  }, [])

  const signUp = useCallback(async (details) => {
    const nextUser = await authService.register(details)
    writeHint(true)
    setUser(nextUser)
    setSessionExpired(false)
    return nextUser
  }, [])

  const signOut = useCallback(async () => {
    try {
      await authService.logout()
    } finally {
      writeHint(false)
      setUser(null)
    }
  }, [])

  const changePassword = useCallback(async (body) => {
    const nextUser = await authService.changePassword(body)
    setUser(nextUser)
    return nextUser
  }, [])

  const value = useMemo(
    () => ({
      user,
      isAdmin: user?.role === 'admin',
      loading,
      sessionExpired,
      clearSessionExpired: () => setSessionExpired(false),
      signIn,
      signUp,
      signOut,
      changePassword,
      updateUser: setUser,
    }),
    [user, loading, sessionExpired, signIn, signUp, signOut, changePassword],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

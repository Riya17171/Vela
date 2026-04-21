import { createContext, useContext, useEffect, useMemo, useState } from 'react'

import { supabase } from '../lib/supabaseClient.js'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    async function loadSessionAndProfile() {
      // If Supabase isn't configured yet, keep the app usable in "public-only" mode.
      if (!supabase) {
        if (mounted) setLoading(false)
        return
      }

      setLoading(true)

      const { data: sessionData } = await supabase.auth.getSession()
      const nextUser = sessionData?.session?.user ?? null

      if (!mounted) return
      setUser(nextUser)

      if (!nextUser) {
        setIsAdmin(false)
        setLoading(false)
        return
      }

      // Load admin flag from profiles without strict column selection.
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', nextUser.id)
        .maybeSingle()

      if (!mounted) return
      if (error) {
        setIsAdmin(false)
      } else {
        setIsAdmin(profile?.role === 'admin')
      }

      setLoading(false)
    }

    loadSessionAndProfile()

    if (!supabase) return () => { }

    const { data: subscriptionData } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const nextUser = session?.user ?? null
        setUser(nextUser)

        if (!nextUser) {
          setIsAdmin(false)
          setLoading(false)
          return
        }

        // Reload admin flag on auth changes.
        setLoading(true)
        supabase
          .from('profiles')
          .select('*')
          .eq('id', nextUser.id)
          .maybeSingle()
          .then(({ data: profile, error }) => {
            if (error) setIsAdmin(false)
            else setIsAdmin(profile?.role === 'admin')
          })
          .catch(() => setIsAdmin(false))
          .finally(() => setLoading(false))
      },
    )

    return () => {
      mounted = false
      subscriptionData?.subscription?.unsubscribe?.()
    }
  }, [])

  async function signIn({ email, password }) {
    if (!supabase) return { error: new Error('Supabase is not configured') }
    return await supabase.auth.signInWithPassword({ email, password })
  }

  async function signOut() {
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
    setIsAdmin(false)
  }

  async function signUp({ email, password, fullName }) {
    if (!supabase) return { error: new Error('Supabase is not configured') }
    return await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } }
    })
  }

  const value = useMemo(
    () => ({
      user,
      isAdmin,
      loading,
      signIn,
      signOut,
      signUp,
    }),
    [user, isAdmin, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}


import { Navigate } from 'react-router-dom'

import { useAuth } from '../context/AuthContext.jsx'

export default function RequireAdmin({ children }) {
  const { user, isAdmin, loading } = useAuth()

  if (loading) return null
  if (!user) return <Navigate to="/login" replace />

  if (!isAdmin) {
    return (
      <div className="w-full min-h-screen flex flex-col items-center justify-center p-8 bg-bg">
        <h1 className="font-display text-4xl font-light text-charcoal mb-4">Access Denied</h1>
        <p className="text-[10px] tracking-luxury uppercase text-warmgray">Admin privileges required to view this sector.</p>
      </div>
    )
  }

  return children
}


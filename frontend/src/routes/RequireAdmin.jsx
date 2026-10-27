import { Navigate, useLocation } from 'react-router-dom'

import { LoadingState } from '../components/common/StatusViews.jsx'
import { useAuth } from '../context/AuthContext.jsx'

/**
 * Hides the admin UI from non-admins. This is a convenience, not security:
 * every /api/v1/admin route is protected by authenticate + authorize('admin').
 */
export default function RequireAdmin({ children }) {
  const { user, isAdmin, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingState label="Restoring session..." className="min-h-screen" />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

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

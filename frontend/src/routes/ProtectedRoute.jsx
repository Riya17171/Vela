import { Navigate, useLocation } from 'react-router-dom'

import { LoadingState } from '../components/common/StatusViews.jsx'
import { useAuth } from '../context/AuthContext.jsx'

/** UX guard only: the API independently rejects unauthenticated requests. */
export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingState label="Restoring session..." className="min-h-[60vh]" />
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />

  return children
}

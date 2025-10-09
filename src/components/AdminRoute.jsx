import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

function AdminRoute({ children }) {
  const { t } = useTranslation()
  const { user, isAuthenticated, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    // Show loading spinner while checking authentication
    return (
      <div className="min-h-screen bg-gradient-to-br from-obsidian to-charcoal flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto mb-4"></div>
          <p className="text-pearl/70">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if user has admin role
  if (user?.role !== 'admin') {
    // Redirect non-admin users to home page
    return <Navigate to="/skore" replace />
  }

  return children
}

export default AdminRoute


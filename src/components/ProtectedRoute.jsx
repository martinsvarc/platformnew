import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'

function ProtectedRoute({ children }) {
  const { t } = useTranslation()
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const [needs2FAVerification, setNeeds2FAVerification] = useState(false)

  useEffect(() => {
    // Check if 2FA verification is pending
    const pendingVerification = localStorage.getItem('pending2FAVerification')
    const pinVerified = localStorage.getItem('pin_verified')
    
    if (pendingVerification === 'true' && pinVerified !== 'true') {
      setNeeds2FAVerification(true)
    } else {
      setNeeds2FAVerification(false)
    }
  }, [location])

  if (loading) {
    // Show loading spinner while checking authentication
    return (
      <div className="min-h-screen bg-gradient-to-br from-obsidian to-charcoal flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-orchid mx-auto mb-4"></div>
          <p className="text-pearl/70">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    // Redirect to login page with return url
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  // Check if 2FA verification is required
  if (needs2FAVerification) {
    // Redirect to PIN verification page
    return <Navigate to="/pin-verify" state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute

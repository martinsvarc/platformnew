import { Navigate, useLocation } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import { useEffect, useState } from 'react'
import { isPINEnabled, isBiometricEnabled } from '../utils/biometric'

function ProtectedRoute({ children }) {
  const { t } = useTranslation()
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  const [needs2FAVerification, setNeeds2FAVerification] = useState(false)
  const [verificationMethod, setVerificationMethod] = useState(null)

  useEffect(() => {
    // Check if 2FA verification is pending
    const pendingVerification = localStorage.getItem('pending2FAVerification')
    const bioVerified = localStorage.getItem('biometric_verified')
    const pinVerified = localStorage.getItem('pin_verified')
    
    if (pendingVerification === 'true' && bioVerified !== 'true' && pinVerified !== 'true') {
      setNeeds2FAVerification(true)
      
      // Determine which method to use - check what user has set up
      const storedMethod = localStorage.getItem('two_fa_method')
      
      if (storedMethod === 'pin' || isPINEnabled()) {
        setVerificationMethod('pin')
      } else if (storedMethod === 'biometric' || isBiometricEnabled()) {
        setVerificationMethod('biometric')
      } else {
        // Default to biometric if nothing is set
        setVerificationMethod('biometric')
      }
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
    // Redirect to appropriate verification page based on method
    const verifyPath = verificationMethod === 'pin' ? '/pin-verify' : '/biometric-verify'
    return <Navigate to={verifyPath} state={{ from: location }} replace />
  }

  return children
}

export default ProtectedRoute

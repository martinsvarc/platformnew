import { createContext, useContext, useState, useEffect } from 'react'
import { login, getCurrentUser, logout as logoutApi, updateUserAvatar as updateAvatarApi, updateUserLanguage as updateLanguageApi } from '../api/auth'
import { 
  authenticateWithBiometric, 
  isBiometricAvailable, 
  isBiometricEnabled,
  isPINEnabled,
  disableBiometric,
  disablePIN,
  registerBiometric as registerBiometricAuth,
  shouldRequireVerification,
  get2FAMethod
} from '../utils/biometric'
import { get2FASettings } from '../api/auth'
import { useTranslation } from 'react-i18next'

const AuthContext = createContext()

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [needs2FASetup, setNeeds2FASetup] = useState(false)
  const { i18n } = useTranslation()

  // Check if running on macOS/Desktop
  const isMacOS = () => {
    return navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
           navigator.platform.toUpperCase().indexOf('WIN') >= 0 ||
           (!navigator.userAgent.match(/Android/i) && !navigator.userAgent.match(/iPhone|iPad|iPod/i))
  }

  useEffect(() => {
    // Check if user is logged in on app start
    const checkAuth = async () => {
      try {
        // Check biometric availability
        const bioAvailable = await isBiometricAvailable()
        setBiometricAvailable(bioAvailable)

        const userId = localStorage.getItem('userId')
        const teamId = localStorage.getItem('teamId')
        const biometricVerified = localStorage.getItem('biometricVerified')
        const verificationTime = localStorage.getItem('verificationTime')
        
        if (userId && teamId) {
          const userData = await getCurrentUser(userId)
          if (userData) {
            // Set user language if available
            if (userData.language) {
              i18n.changeLanguage(userData.language)
            }
            
            // Check if 2FA is required
            const twoFASettings = await get2FASettings(userData.id)
            
            // Check if user needs to set up 2FA
            if (twoFASettings?.two_fa_setup_required) {
              setNeeds2FASetup(true)
              setUser(userData)
              setLoading(false)
              return
            }
            
            // Check if it's past 3 AM Czech time and verification is needed
            if (shouldRequireVerification()) {
              console.log('Daily verification required (past 3 AM Czech time)')
              localStorage.setItem('pending2FAVerification', 'true')
              localStorage.removeItem('biometric_verified')
              localStorage.removeItem('pin_verified')
              localStorage.removeItem('verificationTime')
              setUser(userData) // Set user but they'll be redirected to verification
              setLoading(false)
              return
            }
            
            // Check if pending verification exists
            const pendingVerification = localStorage.getItem('pending2FAVerification')
            const bioVerified = localStorage.getItem('biometric_verified')
            const pinVerified = localStorage.getItem('pin_verified')
            
            if (pendingVerification === 'true' && bioVerified !== 'true' && pinVerified !== 'true') {
              // User logged in but hasn't verified 2FA yet
              setUser(userData)
            } else {
              setUser(userData)
            }
            
            // Keep session alive by refreshing timestamp
            localStorage.setItem('lastActivity', Date.now().toString())
          } else {
            // User not found, clear storage
            clearAllAuthData()
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Clear invalid auth data
        clearAllAuthData()
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Set up activity tracker to keep session alive
    const updateActivity = () => {
      if (localStorage.getItem('userId')) {
        localStorage.setItem('lastActivity', Date.now().toString())
      }
    }

    // Set up periodic check for 3 AM Czech time (check every minute)
    const timeoutCheckInterval = setInterval(() => {
      const userId = localStorage.getItem('userId')
      const bioVerified = localStorage.getItem('biometric_verified')
      const pinVerified = localStorage.getItem('pin_verified')
      
      if (userId && (bioVerified === 'true' || pinVerified === 'true')) {
        // Check if we need to require verification (past 3 AM Czech time)
        if (shouldRequireVerification()) {
          console.log('3 AM Czech time passed, requiring re-verification')
          // IMPORTANT: Only clear verification status, NOT session data
          // This allows user to re-verify without entering password
          localStorage.setItem('pending2FAVerification', 'true')
          localStorage.removeItem('biometric_verified')
          localStorage.removeItem('pin_verified')
          localStorage.removeItem('verificationTime')
          // Keep: userId, teamId, userData, etc. for session persistence
          
          // Redirect to appropriate verification page
          const twoFAMethod = localStorage.getItem('two_fa_method') || 'biometric'
          window.location.href = twoFAMethod === 'pin' ? '/pin-verify' : '/biometric-verify'
        }
      }
    }, 60000) // Check every minute

    // Update activity on user interaction
    window.addEventListener('click', updateActivity)
    window.addEventListener('keydown', updateActivity)
    window.addEventListener('touchstart', updateActivity)

    return () => {
      window.removeEventListener('click', updateActivity)
      window.removeEventListener('keydown', updateActivity)
      window.removeEventListener('touchstart', updateActivity)
      if (timeoutCheckInterval) {
        clearInterval(timeoutCheckInterval)
      }
    }
  }, [])

  const clearAllAuthData = () => {
    localStorage.removeItem('userId')
    localStorage.removeItem('teamId')
    localStorage.removeItem('teamSlug')
    localStorage.removeItem('teamName')
    localStorage.removeItem('userData')
    localStorage.removeItem('lastActivity')
    localStorage.removeItem('pendingBiometricVerification')
    localStorage.removeItem('biometricVerified')
    localStorage.removeItem('verificationTime')
  }

  const loginUser = async ({ username, password, enableBiometric = false }) => {
    try {
      const userData = await login({ username, password })
      
      // Store auth data with enhanced persistence
      localStorage.setItem('userId', userData.id)
      localStorage.setItem('teamId', userData.team_id)
      localStorage.setItem('teamSlug', userData.team_slug)
      localStorage.setItem('teamName', userData.team_name)
      localStorage.setItem('userData', JSON.stringify(userData))
      localStorage.setItem('lastActivity', Date.now().toString())
      localStorage.setItem('sessionCreated', Date.now().toString())
      
      // Set user language if available
      if (userData.language) {
        i18n.changeLanguage(userData.language)
      }
      
      setUser(userData)

      // Check if user needs to set up 2FA (first time setup)
      if (userData.two_fa_setup_required) {
        // User needs to set up 2FA - they'll see the setup prompt
        localStorage.setItem('pending2FASetup', 'true')
        return { success: true, user: userData, requireBiometric: false, require2FASetup: true }
      }

      // Check user's 2FA method preference (if they already have 2FA set up)
      if (userData.two_fa_method === 'biometric') {
        // User has biometric enabled - redirect to biometric verification
        localStorage.setItem('pendingBiometricVerification', 'true')
        localStorage.removeItem('biometricVerified')
        localStorage.setItem('two_fa_method', 'biometric')
        return { success: true, user: userData, requireBiometric: true }
      } else if (userData.two_fa_method === 'pin') {
        // User has PIN enabled - redirect to PIN verification
        localStorage.setItem('pendingPINVerification', 'true')
        localStorage.removeItem('pin_verified')
        localStorage.setItem('two_fa_method', 'pin')
        return { success: true, user: userData, requirePIN: true }
      }
      
      // No 2FA set up yet (shouldn't happen, but handle gracefully)
      return { success: true, user: userData, requireBiometric: false }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const checkExistingSession = () => {
    // Check if user has a recent session (within 24 hours) that can be resumed with 2FA
    const userId = localStorage.getItem('userId')
    const userData = localStorage.getItem('userData')
    const sessionCreated = localStorage.getItem('sessionCreated')
    const twoFAMethod = localStorage.getItem('two_fa_method')
    
    if (!userId || !userData || !sessionCreated || !twoFAMethod) {
      return null
    }
    
    // Check if session is within 24 hours
    const sessionAge = Date.now() - parseInt(sessionCreated)
    const twentyFourHours = 24 * 60 * 60 * 1000
    
    if (sessionAge > twentyFourHours) {
      // Session too old, require full login
      return null
    }
    
    try {
      const user = JSON.parse(userData)
      return {
        userId,
        user,
        twoFAMethod,
        sessionAge
      }
    } catch (error) {
      console.error('Error parsing session data:', error)
      return null
    }
  }

  const loginWithBiometric = async () => {
    try {
      if (!biometricAvailable) {
        throw new Error('Biometric authentication is not available on this device')
      }

      if (!isBiometricEnabled()) {
        throw new Error('Biometric authentication is not set up')
      }

      // Authenticate with biometric
      const result = await authenticateWithBiometric()
      
      if (result.success && result.userId) {
        // Get user data from server
        const userData = await getCurrentUser(result.userId)
        
        if (userData) {
          // Store auth data
          localStorage.setItem('userId', userData.id)
          localStorage.setItem('teamId', userData.team_id)
          localStorage.setItem('lastActivity', Date.now().toString())
          localStorage.setItem('sessionCreated', Date.now().toString())
          
          setUser(userData)
          return { success: true, user: userData }
        } else {
          throw new Error('User not found')
        }
      } else {
        throw new Error('Biometric authentication failed')
      }
    } catch (error) {
      console.error('Biometric login error:', error)
      return { success: false, error: error.message }
    }
  }

  const logoutUser = async () => {
    try {
      await logoutApi()
      clearAllAuthData()
      setUser(null)
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local state even if API call fails
      clearAllAuthData()
      setUser(null)
      return { success: true }
    }
  }

  const registerBiometric = async () => {
    try {
      if (!user) {
        throw new Error('No user logged in')
      }

      if (!biometricAvailable) {
        throw new Error('Biometric authentication is not available on this device')
      }

      await registerBiometricAuth(user.id, user.username)
      return { success: true }
    } catch (error) {
      console.error('Register biometric error:', error)
      return { success: false, error: error.message }
    }
  }

  const disableBiometricAuth = () => {
    disableBiometric()
    return { success: true }
  }

  const updateUserAvatar = async (avatarUrl) => {
    try {
      if (!user?.id) {
        throw new Error('No user logged in')
      }
      
      const updatedUser = await updateAvatarApi(user.id, avatarUrl)
      if (updatedUser) {
        setUser(updatedUser)
        // Update localStorage
        const userData = JSON.parse(localStorage.getItem('userData') || '{}')
        userData.avatar_url = avatarUrl
        localStorage.setItem('userData', JSON.stringify(userData))
        return { success: true }
      }
      throw new Error('Failed to update avatar')
    } catch (error) {
      console.error('Update avatar error:', error)
      return { success: false, error: error.message }
    }
  }

  const updateUserLanguage = async (language) => {
    try {
      if (!user?.id) {
        throw new Error('No user logged in')
      }
      
      const updatedUser = await updateLanguageApi(user.id, language)
      if (updatedUser) {
        setUser(updatedUser)
        // Change i18n language
        i18n.changeLanguage(language)
        // Update localStorage
        const userData = JSON.parse(localStorage.getItem('userData') || '{}')
        userData.language = language
        localStorage.setItem('userData', JSON.stringify(userData))
        return { success: true }
      }
      throw new Error('Failed to update language')
    } catch (error) {
      console.error('Update language error:', error)
      return { success: false, error: error.message }
    }
  }

  const value = {
    user,
    loading,
    login: loginUser,
    loginWithBiometric,
    logout: logoutUser,
    checkExistingSession,
    updateUserAvatar,
    updateUserLanguage,
    registerBiometric,
    disableBiometricAuth,
    isAuthenticated: !!user,
    biometricAvailable,
    biometricEnabled: isBiometricEnabled(),
    needs2FASetup,
    setNeeds2FASetup
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

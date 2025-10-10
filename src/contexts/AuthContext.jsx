import { createContext, useContext, useState, useEffect } from 'react'
import { login, getCurrentUser, logout as logoutApi, updateUserAvatar as updateAvatarApi, updateUserLanguage as updateLanguageApi, get2FASettings } from '../api/authClient'
import { shouldRequireVerification } from '../utils/verification'
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
        const userId = localStorage.getItem('userId')
        const teamId = localStorage.getItem('teamId')
        
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
              localStorage.removeItem('pin_verified')
              localStorage.removeItem('verificationTime')
              setUser(userData) // Set user but they'll be redirected to verification
              setLoading(false)
              return
            }
            
            // Check if pending verification exists
            const pendingVerification = localStorage.getItem('pending2FAVerification')
            const pinVerified = localStorage.getItem('pin_verified')
            
            if (pendingVerification === 'true' && pinVerified !== 'true') {
              // User logged in but hasn't verified PIN yet
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
      const pinVerified = localStorage.getItem('pin_verified')
      
      if (userId && pinVerified === 'true') {
        // Check if we need to require verification (past 3 AM Czech time)
        if (shouldRequireVerification()) {
          console.log('3 AM Czech time passed, requiring re-verification')
          // IMPORTANT: Only clear verification status, NOT session data
          // This allows user to re-verify without entering password
          localStorage.setItem('pending2FAVerification', 'true')
          localStorage.removeItem('pin_verified')
          localStorage.removeItem('verificationTime')
          // Keep: userId, teamId, userData, etc. for session persistence
          
          // Redirect to PIN verification page
          window.location.href = '/pin-verify'
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
    localStorage.removeItem('pending2FAVerification')
    localStorage.removeItem('pin_verified')
    localStorage.removeItem('verificationTime')
  }

  const loginUser = async ({ username, password }) => {
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

      // Check if user needs to set up 2FA (first time setup or after reset)
      if (userData.two_fa_setup_required) {
        // Clear any old 2FA credentials from previous setup
        localStorage.removeItem('pin_credential')
        localStorage.removeItem('pin_enabled')
        localStorage.removeItem('pin_verified')
        localStorage.removeItem('two_fa_method')
        localStorage.removeItem('pendingPINVerification')
        
        // User needs to set up 2FA - they'll see the setup prompt
        localStorage.setItem('pending2FASetup', 'true')
        return { success: true, user: userData, require2FASetup: true }
      }

      // Check user's 2FA method preference (if they already have PIN set up)
      if (userData.two_fa_method === 'pin') {
        // User has PIN enabled - redirect to PIN verification
        localStorage.setItem('pendingPINVerification', 'true')
        localStorage.removeItem('pin_verified')
        localStorage.setItem('two_fa_method', 'pin')
        return { success: true, user: userData, requirePIN: true }
      }
      
      // No 2FA set up yet (shouldn't happen, but handle gracefully)
      return { success: true, user: userData, require2FASetup: true }
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
    logout: logoutUser,
    checkExistingSession,
    updateUserAvatar,
    updateUserLanguage,
    isAuthenticated: !!user,
    needs2FASetup,
    setNeeds2FASetup
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

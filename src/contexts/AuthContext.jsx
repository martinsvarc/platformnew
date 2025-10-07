import { createContext, useContext, useState, useEffect } from 'react'
import { login, getCurrentUser, logout as logoutApi, updateUserAvatar as updateAvatarApi } from '../api/auth'

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

  useEffect(() => {
    // Check if user is logged in on app start
    const checkAuth = async () => {
      try {
        const userId = localStorage.getItem('userId')
        const teamId = localStorage.getItem('teamId')
        
        if (userId && teamId) {
          const userData = await getCurrentUser(userId)
          if (userData) {
            setUser(userData)
          } else {
            // User not found, clear storage
            localStorage.removeItem('userId')
            localStorage.removeItem('teamId')
            localStorage.removeItem('userData')
          }
        }
      } catch (error) {
        console.error('Auth check failed:', error)
        // Clear invalid auth data
        localStorage.removeItem('userId')
        localStorage.removeItem('teamId')
        localStorage.removeItem('teamSlug')
        localStorage.removeItem('teamName')
        localStorage.removeItem('userData')
      } finally {
        setLoading(false)
      }
    }

    checkAuth()
  }, [])

  const loginUser = async ({ username, password }) => {
    try {
      const userData = await login({ username, password })
      
      // Store auth data
      localStorage.setItem('userId', userData.id)
      localStorage.setItem('teamId', userData.team_id)
      localStorage.setItem('teamSlug', userData.team_slug)
      localStorage.setItem('teamName', userData.team_name)
      localStorage.setItem('userData', JSON.stringify(userData))
      
      setUser(userData)
      return { success: true, user: userData }
    } catch (error) {
      return { success: false, error: error.message }
    }
  }

  const logoutUser = async () => {
    try {
      await logoutApi()
      setUser(null)
      return { success: true }
    } catch (error) {
      console.error('Logout error:', error)
      // Still clear local state even if API call fails
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

  const value = {
    user,
    loading,
    login: loginUser,
    logout: logoutUser,
    updateUserAvatar,
    isAuthenticated: !!user
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

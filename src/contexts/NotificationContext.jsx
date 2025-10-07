import { createContext, useContext, useState, useEffect, useRef } from 'react'
import { useAuth } from './AuthContext'
import { getRecentPayments } from '../api/queries'

const NotificationContext = createContext()

export function useNotifications() {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider')
  }
  return context
}

export function NotificationProvider({ children }) {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const lastCheckRef = useRef(null)
  const pollingIntervalRef = useRef(null)
  const timersRef = useRef(new Map())

  // Initialize lastCheck when user logs in
  useEffect(() => {
    if (user) {
      lastCheckRef.current = new Date().toISOString()
    } else {
      lastCheckRef.current = null
      setNotifications([])
    }
  }, [user])

  // Polling mechanism to check for new payments
  useEffect(() => {
    if (!user?.team_id) return

    const checkForNewPayments = async () => {
      try {
        const payments = await getRecentPayments(user.team_id, lastCheckRef.current)
        
        if (payments && payments.length > 0) {
          // Filter out payments from current user (optional - remove this if you want to show own payments)
          const newPayments = payments.filter(p => p.user_id !== user.id)
          
          if (newPayments.length > 0) {
            // Add notifications for new payments
            const newNotifications = newPayments.map(payment => ({
              id: payment.id,
              payment,
              createdAt: Date.now()
            }))

            setNotifications(prev => [...newNotifications, ...prev])
          }
        }

        // Update lastCheck to current time
        lastCheckRef.current = new Date().toISOString()
      } catch (error) {
        console.error('Error checking for new payments:', error)
      }
    }

    // Check immediately on mount
    checkForNewPayments()

    // Poll every 3 seconds
    pollingIntervalRef.current = setInterval(checkForNewPayments, 3000)

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current)
      }
    }
  }, [user])

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id))
    // Clear timer if it exists
    if (timersRef.current.has(id)) {
      clearTimeout(timersRef.current.get(id))
      timersRef.current.delete(id)
    }
  }

  // Auto-dismiss notifications after 10 seconds
  useEffect(() => {
    // Set timers for new notifications
    notifications.forEach(notification => {
      if (!timersRef.current.has(notification.id)) {
        const timer = setTimeout(() => {
          removeNotification(notification.id)
        }, 10000)
        timersRef.current.set(notification.id, timer)
      }
    })

    // Clean up timers for removed notifications
    const currentIds = new Set(notifications.map(n => n.id))
    timersRef.current.forEach((timer, id) => {
      if (!currentIds.has(id)) {
        clearTimeout(timer)
        timersRef.current.delete(id)
      }
    })
  }, [notifications])

  // Clean up all timers on unmount
  useEffect(() => {
    return () => {
      timersRef.current.forEach(timer => clearTimeout(timer))
      timersRef.current.clear()
    }
  }, [])

  const value = {
    notifications,
    removeNotification
  }

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  )
}


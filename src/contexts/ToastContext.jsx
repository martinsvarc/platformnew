import { createContext, useContext, useState, useCallback } from 'react'

const ToastContext = createContext()

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = Date.now() + Math.random()
    const toast = { id, message, type, duration }
    
    setToasts(prev => [...prev, toast])

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id)
      }, duration)
    }

    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: useCallback((message, duration) => addToast(message, 'success', duration), [addToast]),
    error: useCallback((message, duration) => addToast(message, 'error', duration), [addToast]),
    info: useCallback((message, duration) => addToast(message, 'info', duration), [addToast]),
    warning: useCallback((message, duration) => addToast(message, 'warning', duration), [addToast]),
  }

  const value = {
    toasts,
    addToast,
    removeToast,
    toast,
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
    </ToastContext.Provider>
  )
}


import { createContext, useContext, useState, useCallback } from 'react'

const CelebrationContext = createContext()

export function useCelebration() {
  const context = useContext(CelebrationContext)
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider')
  }
  return context
}

export function CelebrationProvider({ children }) {
  const [isCelebrating, setIsCelebrating] = useState(false)

  const celebrate = useCallback(() => {
    setIsCelebrating(true)
    // Reset after animation completes
    setTimeout(() => {
      setIsCelebrating(false)
    }, 2000)
  }, [])

  const value = {
    isCelebrating,
    celebrate
  }

  return (
    <CelebrationContext.Provider value={value}>
      {children}
    </CelebrationContext.Provider>
  )
}


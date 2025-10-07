import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'

function PageTransition({ children }) {
  const location = useLocation()
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [displayLocation, setDisplayLocation] = useState(location)
  const [displayChildren, setDisplayChildren] = useState(children)

  useEffect(() => {
    if (location !== displayLocation) {
      setIsTransitioning(true)
      
      // Start exit transition
      const exitTimer = setTimeout(() => {
        setDisplayLocation(location)
        setDisplayChildren(children)
        setIsTransitioning(false)
      }, 200) // Half of total transition time

      return () => clearTimeout(exitTimer)
    }
  }, [location, displayLocation, children])

  return (
    <div className="page-transition-container min-h-screen">
      <div 
        className={`page-content ${
          isTransitioning ? 'page-exit' : 'page-enter'
        }`}
        style={{
          transition: 'opacity 400ms cubic-bezier(0.4, 0, 0.2, 1), transform 400ms cubic-bezier(0.4, 0, 0.2, 1)',
          minHeight: '100vh'
        }}
      >
        {displayChildren}
      </div>
    </div>
  )
}

export default PageTransition

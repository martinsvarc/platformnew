import { useEffect, useState, useRef } from 'react'
import { getTeamUsers } from '../api/queries'
import { TEAM_ID } from '../api/config'

function StarTeam() {
  const [teamMembers, setTeamMembers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [lightningKey, setLightningKey] = useState(0)
  const audioRef = useRef(null)

  useEffect(() => {
    const loadTeam = async () => {
      if (!TEAM_ID) return
      try {
        const users = await getTeamUsers(TEAM_ID)
        setTeamMembers(users)
      } catch (error) {
        console.error('Failed to load team:', error)
      } finally {
        setIsLoading(false)
      }
    }
    loadTeam()
  }, [])

  // Play thunder sound on loop
  useEffect(() => {
    if (audioRef.current && !isLoading) {
      audioRef.current.volume = 0.3 // Set to 30% volume
      audioRef.current.play().catch(err => console.log('Audio play failed:', err))
    }
  }, [isLoading])

  // Animate lightning constantly
  useEffect(() => {
    const interval = setInterval(() => {
      setLightningKey(prev => prev + 1)
    }, 150) // Re-generate lightning every 150ms
    return () => clearInterval(interval)
  }, [])

  // Calculate positions around a circle - all at equal distance INSIDE the frosted glass
  const getPosition = (index, total) => {
    const angle = (index * 2 * Math.PI) / total - Math.PI / 2 // Start from top
    const radius = 32 // Smaller radius to stay inside frosted glass circle
    const x = 50 + radius * Math.cos(angle)
    const y = 50 + radius * Math.sin(angle)
    return { x, y, angle }
  }

  // Generate lightning bolt path between two points (in 0-100 coordinate system)
  const generateLightningPath = (x1, y1, x2, y2, seed) => {
    const segments = 6
    let path = `M ${x1} ${y1}`
    
    for (let i = 1; i < segments; i++) {
      const t = i / segments
      const x = x1 + (x2 - x1) * t
      const y = y1 + (y2 - y1) * t
      // Smaller random offsets to keep lightning inside the circle
      const offsetX = (Math.sin(seed + i * 1.5) * 0.5 + Math.random() - 0.5) * 3
      const offsetY = (Math.cos(seed + i * 1.5) * 0.5 + Math.random() - 0.5) * 3
      path += ` L ${x + offsetX} ${y + offsetY}`
    }
    
    path += ` L ${x2} ${y2}`
    return path
  }

  // Get random lightning color - only cyan, purple, white
  const getLightningColor = (index, time) => {
    const colors = [
      '#00d4ff', // Bright cyan/blue
      '#9d00ff', // Purple
      '#ffffff', // White
    ]
    const colorIndex = (index + Math.floor(time / 500)) % colors.length
    return colors[colorIndex]
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden lg:pl-64">
        <div className="text-center relative z-10 animate-fade-in">
          <div className="mb-8">
            <div className="inline-block animate-spin-slow">
              <svg className="w-20 h-20 text-neon-orchid" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          </div>
          <h2 className="text-4xl md:text-5xl font-bold mb-4" style={{
            color: '#ff69b4',
            textShadow: '0 0 20px rgba(255,105,180,0.8), 0 0 40px rgba(255,105,180,0.6)'
          }}>
            Načítání týmu...
          </h2>
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen relative overflow-hidden flex items-center justify-center lg:pl-64 p-4">
      {/* Thunder sound effect - plays on loop */}
      <audio 
        ref={audioRef}
        src="https://res.cloudinary.com/dmbzcxhjn/video/upload/v1759812360/10_Minutes_of_Rain_and_Thunderstorm_Sounds_For_Focus_Relaxing_and_Sleep_%EF%B8%8F_Epidemic_ASMR_-_Overtone_Ambient_youtube_welf49.mp3"
        loop
        autoPlay
      />

      {/* Content - Centered accounting for nav menu */}
      <div className="relative animate-fade-in w-full max-w-[min(calc(100vw-2rem),calc(100vh-2rem))] lg:max-w-[min(calc(100vw-320px),85vh)]" style={{ 
        animationDelay: '0.2s',
        aspectRatio: '1 / 1'
      }}>
          {/* Large frosted glass circle underneath everything */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[90%] h-[90%] rounded-full frosted-glass"></div>

          {/* Center Table - Static with Logo */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full bg-gradient-to-br from-velvet-gray/60 via-charcoal/80 to-black/60 border-2 sm:border-3 md:border-4 border-sunset-gold/40 shadow-2xl z-20 flex items-center justify-center p-2 sm:p-3 md:p-4">
            {/* Logo */}
            <img 
              src="https://res.cloudinary.com/dmbzcxhjn/image/upload/v1759811073/WhatsApp_Image_2025-06-30_at_20.10.32_f45256ee-removebg-preview_ozqh99.png" 
              alt="Logo" 
              className="w-full h-full object-contain"
            />
          </div>

          {/* Rotating container for team members AND lightning */}
          <div className="absolute inset-0 animate-spin-very-slow z-10">
            {/* Animated lightning bolts - inside rotating container with proper viewBox */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style={{ pointerEvents: 'none' }}>
              {teamMembers.map((member, index) => {
                const { x, y, angle } = getPosition(index, teamMembers.length)
                
                // Calculate logo border point where lightning starts
                const logoBorderRadius = 12 // In viewBox units (0-100 scale)
                const borderX = 50 + logoBorderRadius * Math.cos(angle)
                const borderY = 50 + logoBorderRadius * Math.sin(angle)
                
                // Generate lightning path
                const lightningPath = generateLightningPath(borderX, borderY, x, y, lightningKey + index)
                const color = getLightningColor(index, lightningKey * 150)
                
                return (
                  <g key={`lightning-${member.id}-${lightningKey}`}>
                    {/* Outer glow */}
                    <path
                      d={lightningPath}
                      stroke={color}
                      strokeWidth="0.6"
                      fill="none"
                      opacity="0.4"
                      style={{ 
                        filter: `drop-shadow(0 0 2px ${color}) drop-shadow(0 0 4px ${color})`
                      }}
                    />
                    {/* Main lightning bolt */}
                    <path
                      d={lightningPath}
                      stroke={color}
                      strokeWidth="0.4"
                      fill="none"
                      opacity="0.8"
                      style={{ 
                        filter: `drop-shadow(0 0 1px ${color})`
                      }}
                    />
                    {/* Inner white core */}
                    <path
                      d={lightningPath}
                      stroke="#ffffff"
                      strokeWidth="0.2"
                      fill="none"
                      opacity="0.9"
                    />
                  </g>
                )
              })}
            </svg>

            {/* Team Members positioned around the table */}
            {teamMembers.map((member, index) => {
            const { x, y } = getPosition(index, teamMembers.length)
            const delay = index * 0.1
            
            return (
              <div
                key={member.id}
                className="absolute animate-fade-in"
                style={{
                  left: `${x}%`,
                  top: `${y}%`,
                  transform: 'translate(-50%, -50%)',
                  animationDelay: `${delay}s`
                }}
              >
                {/* Counter-rotate content to keep it upright */}
                <div className="animate-spin-very-slow-reverse">
                  {/* Profile Picture - Simple Circle, Unified Style */}
                  <div className="flex flex-col items-center">
                    {member.avatar_url ? (
                      <img
                        src={member.avatar_url}
                        alt={member.display_name || member.username}
                        className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-16 h-16 sm:w-24 sm:h-24 md:w-32 md:h-32 lg:w-36 lg:h-36 rounded-full bg-gradient-to-br from-neon-orchid/30 to-crimson/30 flex items-center justify-center">
                        <span className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl">👤</span>
                      </div>
                    )}

                    {/* Name Label - Unified Style */}
                    <div className="mt-1 sm:mt-2 text-center animate-fade-in" style={{ animationDelay: `${delay + 0.2}s` }}>
                      <p className="text-pearl font-semibold text-xs sm:text-sm md:text-base whitespace-nowrap">
                        {member.display_name || member.username}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
          </div>
      </div>
    </div>
  )
}

export default StarTeam

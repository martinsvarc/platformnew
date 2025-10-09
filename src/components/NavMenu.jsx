import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCelebration } from '../contexts/CelebrationContext'
import { useToast } from '../contexts/ToastContext'
import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

function NavMenu() {
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout, updateUserAvatar } = useAuth()
  const { isCelebrating } = useCelebration()
  const { toast } = useToast()
  const { t } = useTranslation()
  const [isHovering, setIsHovering] = useState(false)
  const [showFireworks, setShowFireworks] = useState(false)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const fileInputRef = useRef(null)
  const profilePicRef = useRef(null)

  useEffect(() => {
    if (isCelebrating) {
      setShowFireworks(true)
      // Create fire particles
      createFireParticles()
      
      // Remove fireworks after animation
      setTimeout(() => {
        setShowFireworks(false)
      }, 2000)
    }
  }, [isCelebrating])

  const createFireParticles = () => {
    if (!profilePicRef.current) return
    
    const rect = profilePicRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    
    // Create 20 fire particles
    for (let i = 0; i < 20; i++) {
      const particle = document.createElement('div')
      particle.className = 'fire-particle'
      
      const angle = (Math.PI * 2 * i) / 20
      const distance = 100 + Math.random() * 100
      const tx = Math.cos(angle) * distance
      const ty = Math.sin(angle) * distance
      
      // Random fire colors (orange, red, yellow)
      const colors = [
        'radial-gradient(circle, #ff6b00, #ff0000)',
        'radial-gradient(circle, #ff9500, #ff4500)',
        'radial-gradient(circle, #ffd700, #ff8c00)'
      ]
      const color = colors[Math.floor(Math.random() * colors.length)]
      
      particle.style.cssText = `
        position: fixed;
        left: ${centerX}px;
        top: ${centerY}px;
        width: 30px;
        height: 30px;
        background: ${color};
        border-radius: 50%;
        pointer-events: none;
        z-index: 9999;
        --tx: ${tx}px;
        --ty: ${ty}px;
        animation: fire-burst 1s ease-out forwards;
      `
      
      document.body.appendChild(particle)
      
      // Remove particle after animation
      setTimeout(() => {
        particle.remove()
      }, 1000)
    }
  }

  const allNavItems = [
    { path: '/starteam', label: t('nav.starTeam'), icon: '⭐' },
    { path: '/skore', label: t('nav.score'), icon: '📊' },
    { path: '/tvuj-vykon', label: t('nav.yourPerformance'), icon: '📈' },
    { path: '/klientiaplatby', label: t('nav.clientsPayments'), icon: '🗂️' },
    { path: '/zalozky', label: t('nav.bookmarks'), icon: '🔖' },
    { path: '/admin', label: t('nav.admin'), icon: '🛠️', adminOnly: true },
    { path: '/analytics', label: t('nav.analytics'), icon: '💹', adminOnly: true }
  ]

  // Filter navigation items based on user role
  const navItems = allNavItems.filter(item => {
    if (item.adminOnly) {
      return user?.role === 'admin'
    }
    return true
  })

  const isActive = (path) => location.pathname === path

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/login')
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Convert to base64
    const reader = new FileReader()
    reader.onloadend = async () => {
      const base64String = reader.result
      try {
        await updateUserAvatar(base64String)
        toast.success(t('profile.uploadSuccess'))
      } catch (error) {
        console.error('Error updating avatar:', error)
        toast.error(t('profile.uploadError'))
      }
    }
    reader.readAsDataURL(file)
  }

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-[60] p-3 rounded-lg bg-charcoal/90 backdrop-blur-sm border border-neon-orchid/30 text-pearl hover:bg-charcoal shadow-lg"
        aria-label="Toggle menu"
      >
        {isMobileMenuOpen ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40 animate-fade-in"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Navigation Menu */}
      <div className={`
        fixed left-0 top-0 w-64 h-full unified-glass z-50 flex flex-col
        transition-transform duration-300 ease-in-out
        lg:translate-x-0
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
      {/* User Profile */}
      <div className="p-6 border-b border-neon-orchid/20">
        <div className="flex flex-col items-center space-y-3">
          <div 
            className="relative cursor-pointer group"
            onClick={handleAvatarClick}
            onMouseEnter={() => setIsHovering(true)}
            onMouseLeave={() => setIsHovering(false)}
          >
            {/* Purple smoke effects */}
            <div className="absolute inset-0 -m-4">
              <div className="smoke-particle smoke-1"></div>
              <div className="smoke-particle smoke-2"></div>
              <div className="smoke-particle smoke-3"></div>
              <div className="smoke-particle smoke-4"></div>
            </div>
            
            {/* Profile Picture */}
            {user?.avatar_url ? (
              <img
                ref={profilePicRef}
                src={user.avatar_url}
                alt="Profil"
                className={`w-32 h-32 rounded-full object-cover border-4 border-neon-orchid/40 relative z-10 transition-all duration-300 group-hover:border-neon-orchid/60 group-hover:scale-105 shadow-2xl profile-picture ${isCelebrating ? 'celebrating' : ''}`}
              />
            ) : (
              <div
                ref={profilePicRef}
                className={`w-32 h-32 rounded-full border-4 border-neon-orchid/40 relative z-10 transition-all duration-300 group-hover:border-neon-orchid/60 group-hover:scale-105 shadow-2xl profile-picture bg-gradient-to-br from-neon-orchid/30 to-crimson/30 ${isCelebrating ? 'celebrating' : ''}`}
              />
            )}
            
            {/* Live indicator */}
            <div className="absolute top-1 right-1 w-6 h-6 bg-gradient-to-r from-neon-orchid to-crimson rounded-full border-3 border-charcoal animate-pulse z-20"></div>
            
            {/* Upload overlay on hover */}
            {isHovering && (
              <div className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center z-20 transition-opacity duration-300">
                <span className="text-white text-sm font-semibold">📸 {t('nav.changePhoto')}</span>
              </div>
            )}
            
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div className="text-center">
            {/* Team Name - Gold and Shiny */}
            {user?.team_name && (
              <h2 className="text-xl font-bold mb-2 animate-shimmer-gold" style={{
                background: 'linear-gradient(90deg, #FFD700 0%, #FFA500 25%, #FFD700 50%, #FFA500 75%, #FFD700 100%)',
                backgroundSize: '200% auto',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                textShadow: '0 0 20px rgba(255, 215, 0, 0.5)',
                filter: 'drop-shadow(0 0 10px rgba(255, 215, 0, 0.4))'
              }}>
                {user.team_name}
              </h2>
            )}
            {/* User Name */}
            <h3 className="text-pearl font-semibold text-lg">
              {user?.display_name || user?.username || t('profile.user')}
            </h3>
            <p className="text-pearl/70 text-sm capitalize">
              {user?.role === 'admin' ? t('nav.administrator') : 
               user?.role === 'manager' ? t('nav.manager') : t('nav.member')}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Items */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            onClick={() => setIsMobileMenuOpen(false)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-lg border smooth-hover ${
              isActive(item.path)
                ? 'bg-gradient-to-r from-neon-orchid to-crimson text-white shadow-glow-purple border-neon-orchid/30'
                : 'text-pearl border-transparent hover:bg-charcoal/20 hover:border-neon-orchid/20 hover:text-neon-orchid'
            }`}
          >
            <span className="text-xl">{item.icon}</span>
            <span className="font-semibold">{item.label}</span>
            {isActive(item.path) && (
              <div className="ml-auto w-2 h-2 bg-white rounded-full animate-pulse"></div>
            )}
          </Link>
        ))}
      </nav>

      {/* Language Switcher */}
      <div className="px-4 py-2 border-t border-neon-orchid/20 flex justify-center">
        <LanguageSwitcher />
      </div>

      {/* Logout Button */}
      <div className="p-4 border-t border-neon-orchid/20">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center space-x-2 px-4 py-3 rounded-lg border border-transparent text-pearl hover:bg-crimson/20 hover:text-crimson hover:border-crimson/20 smooth-hover"
        >
          <span className="text-xl">🚪</span>
          <span className="font-semibold">{t('nav.logout')}</span>
        </button>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-neon-orchid/20">
        <div className="text-center text-pearl/50 text-xs">
          <p>© 2025 Fuck the Matrix</p>
        </div>
      </div>
    </div>
    </>
  )
}

export default NavMenu

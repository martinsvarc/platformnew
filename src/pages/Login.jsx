import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { getBackgroundUrl } from '../api/settings'
import { TEAM_ID } from '../api/config'

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const { login } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()

  // Default background URL (same as App.jsx)
  const DEFAULT_BG = 'https://res.cloudinary.com/dmbzcxhjn/image/upload/v1759767010/0a80caad8e77bea777fb41bf5438086e_ubbh2h.jpg'
  const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_BG)
  const [backgroundLoaded, setBackgroundLoaded] = useState(false)

  // Load background URL from settings
  useEffect(() => {
    const loadBackground = async () => {
      if (!TEAM_ID) {
        setBackgroundLoaded(true)
        return
      }
      
      try {
        const url = await getBackgroundUrl(TEAM_ID)
        setBackgroundUrl(url || DEFAULT_BG)
      } catch (err) {
        console.error('Failed to load background:', err)
        setBackgroundUrl(DEFAULT_BG)
      } finally {
        setBackgroundLoaded(true)
      }
    }
    
    loadBackground()
  }, [])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setError('') // Clear error when user types
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const result = await login({
        username: formData.username,
        password: formData.password
      })
      
      if (result.success) {
        // If biometric is required, redirect to biometric verification page
        if (result.requireBiometric) {
          navigate('/biometric-verify')
        } else {
          // Otherwise go directly to the app
          navigate('/starteam')
        }
      } else {
        setError(result.error)
      }
    } catch (err) {
      setError(t('auth.unexpectedError'))
    } finally {
      setLoading(false)
    }
  }


  return (
    <div 
      className="min-h-screen flex items-center justify-center p-3 sm:p-4 relative overflow-hidden"
      style={backgroundLoaded ? {
        backgroundImage: `url("${backgroundUrl}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
        backgroundAttachment: 'fixed'
      } : {
        background: 'linear-gradient(to bottom right, #1a1a1a, #2d2d2d, #1e1e1e)'
      }}
    >
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/40"></div>
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-orchid/5 to-crimson/5"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-neon-orchid/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-crimson/10 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Login Form - Enhanced Frosted Glass */}
        <div className="bg-black/20 backdrop-blur-xl rounded-3xl p-10 pt-24 border border-white/10 shadow-2xl shadow-black/50 backdrop-saturate-150 relative">
          {/* Logo on top of card */}
          <div className="absolute -top-6 left-1/2 -translate-x-1/2">
            <img 
              src="https://res.cloudinary.com/dmbzcxhjn/image/upload/v1759811073/WhatsApp_Image_2025-06-30_at_20.10.32_f45256ee-removebg-preview_ozqh99.png" 
              alt="Platform Logo" 
              className="w-32 h-32 object-contain"
            />
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-pearl mb-2">
                {t('auth.username')}
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-obsidian/60 border border-neon-orchid/40 rounded-xl text-pearl placeholder-pearl/60 focus:outline-none focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all duration-300 hover:border-neon-orchid/60"
                placeholder={t('auth.enterUsername')}
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-pearl mb-2">
                {t('auth.password')}
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-obsidian/60 border border-neon-orchid/40 rounded-xl text-pearl placeholder-pearl/60 focus:outline-none focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all duration-300 hover:border-neon-orchid/60"
                placeholder={t('auth.enterPassword')}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-crimson/20 border border-crimson/50 rounded-lg p-3">
                <p className="text-crimson text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-neon-orchid to-crimson text-white font-bold py-4 px-6 rounded-xl hover:shadow-glow-purple transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>{t('auth.loggingIn')}</span>
                </div>
              ) : (
                t('auth.login')
              )}
            </button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-pearl/70 text-sm">
              {t('auth.noAccount')}{' '}
              <Link 
                to="/register" 
                className="text-neon-orchid hover:text-crimson font-semibold transition-colors"
              >
                {t('auth.registerNow')}
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-pearl/50 text-xs">
            © 2025 - Fuck the Matrix
          </p>
        </div>
      </div>
    </div>
  )
}

export default Login

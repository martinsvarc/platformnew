import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signup } from '../api/signup'
import { getBackgroundUrl } from '../api/settings'
import { TEAM_ID } from '../api/config'

function Register() {
  const [formData, setFormData] = useState({
    teamSlug: 'default',
    username: '',
    email: '',
    displayName: '',
    password: '',
    confirmPassword: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [loading, setLoading] = useState(false)
  
  const navigate = useNavigate()

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
    setSuccess('') // Clear success message
  }

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Hesla se neshodují')
      return false
    }
    
    if (formData.password.length < 6) {
      setError('Heslo musí mít alespoň 6 znaků')
      return false
    }
    
    return true
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!validateForm()) {
      setLoading(false)
      return
    }

    try {
      const result = await signup({
        teamSlug: formData.teamSlug,
        username: formData.username,
        email: formData.email || null,
        displayName: formData.displayName || null,
        password: formData.password,
        avatarUrl: null
      })

      setSuccess('Účet byl úspěšně vytvořen! Nyní se můžete přihlásit.')
      
      // Clear form
      setFormData({
        teamSlug: 'default',
        username: '',
        email: '',
        displayName: '',
        password: '',
        confirmPassword: ''
      })

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login')
      }, 2000)

    } catch (err) {
      setError(err.message || 'Nastala chyba při vytváření účtu')
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
        {/* Registration Form - Enhanced Frosted Glass */}
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
            {/* Team Slug */}
            <div>
              <label htmlFor="teamSlug" className="block text-sm font-medium text-pearl mb-2">
                Název týmu *
              </label>
              <input
                type="text"
                id="teamSlug"
                name="teamSlug"
                value={formData.teamSlug}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-obsidian/60 border border-neon-orchid/40 rounded-xl text-pearl placeholder-pearl/60 focus:outline-none focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all duration-300 hover:border-neon-orchid/60"
                placeholder="Zadejte název týmu (např. 'default')"
              />
              <p className="text-pearl/60 text-xs mt-1">
                Použijte "default" pro výchozí tým nebo název existujícího týmu
              </p>
            </div>

            {/* Username */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-pearl mb-2">
                Uživatelské jméno *
              </label>
              <input
                type="text"
                id="username"
                name="username"
                value={formData.username}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-obsidian/60 border border-neon-orchid/40 rounded-xl text-pearl placeholder-pearl/60 focus:outline-none focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all duration-300 hover:border-neon-orchid/60"
                placeholder="Zadejte uživatelské jméno"
              />
            </div>

            {/* Display Name */}
            <div>
              <label htmlFor="displayName" className="block text-sm font-medium text-pearl mb-2">
                Zobrazované jméno
              </label>
              <input
                type="text"
                id="displayName"
                name="displayName"
                value={formData.displayName}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-obsidian/60 border border-neon-orchid/40 rounded-xl text-pearl placeholder-pearl/60 focus:outline-none focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all duration-300 hover:border-neon-orchid/60"
                placeholder="Zadejte zobrazované jméno"
              />
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-pearl mb-2">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-5 py-4 bg-obsidian/60 border border-neon-orchid/40 rounded-xl text-pearl placeholder-pearl/60 focus:outline-none focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all duration-300 hover:border-neon-orchid/60"
                placeholder="Zadejte email"
              />
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-pearl mb-2">
                Heslo *
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-obsidian/60 border border-neon-orchid/40 rounded-xl text-pearl placeholder-pearl/60 focus:outline-none focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all duration-300 hover:border-neon-orchid/60"
                placeholder="Zadejte heslo (min. 6 znaků)"
              />
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-pearl mb-2">
                Potvrzení hesla *
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="w-full px-5 py-4 bg-obsidian/60 border border-neon-orchid/40 rounded-xl text-pearl placeholder-pearl/60 focus:outline-none focus:ring-2 focus:ring-neon-orchid focus:border-transparent transition-all duration-300 hover:border-neon-orchid/60"
                placeholder="Zadejte heslo znovu"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-crimson/20 border border-crimson/50 rounded-lg p-3">
                <p className="text-crimson text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-500/20 border border-green-500/50 rounded-lg p-3">
                <p className="text-green-400 text-sm">{success}</p>
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
                  <span>Vytváření účtu...</span>
                </div>
              ) : (
                'Vytvořit účet'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-pearl/70 text-sm">
              Již máte účet?{' '}
              <Link 
                to="/login" 
                className="text-neon-orchid hover:text-crimson font-semibold transition-colors"
              >
                Přihlaste se
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

export default Register

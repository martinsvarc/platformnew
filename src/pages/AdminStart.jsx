import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { signupAdmin } from '../api/signup'

function AdminStart() {
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
      const result = await signupAdmin({
        teamSlug: formData.teamSlug,
        username: formData.username,
        email: formData.email || null,
        displayName: formData.displayName || null,
        password: formData.password,
        avatarUrl: null
      })

      setSuccess('Admin účet byl úspěšně vytvořen! Nyní se můžete přihlásit.')
      
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
      setError(err.message || 'Nastala chyba při vytváření admin účtu')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian via-charcoal to-velvet-gray flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 to-orange-500/5"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl"></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Logo/Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl mb-6 shadow-lg">
            <span className="text-3xl">👑</span>
          </div>
          <h1 className="text-5xl font-bold bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 bg-clip-text text-transparent mb-3">
            Admin Registration
          </h1>
          <p className="text-pearl/80 text-lg">
            Vytvořte administrátorský účet
          </p>
        </div>

        {/* Registration Form */}
        <div className="bg-velvet-gray/30 backdrop-blur-md rounded-3xl p-10 border border-amber-500/30 shadow-2xl shadow-amber-500/20">
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
                className="w-full px-5 py-4 bg-obsidian/60 border border-amber-500/40 rounded-xl text-pearl placeholder-pearl/60 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 hover:border-amber-500/60"
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
                className="w-full px-5 py-4 bg-obsidian/60 border border-amber-500/40 rounded-xl text-pearl placeholder-pearl/60 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 hover:border-amber-500/60"
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
                className="w-full px-5 py-4 bg-obsidian/60 border border-amber-500/40 rounded-xl text-pearl placeholder-pearl/60 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 hover:border-amber-500/60"
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
                className="w-full px-5 py-4 bg-obsidian/60 border border-amber-500/40 rounded-xl text-pearl placeholder-pearl/60 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 hover:border-amber-500/60"
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
                className="w-full px-5 py-4 bg-obsidian/60 border border-amber-500/40 rounded-xl text-pearl placeholder-pearl/60 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 hover:border-amber-500/60"
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
                className="w-full px-5 py-4 bg-obsidian/60 border border-amber-500/40 rounded-xl text-pearl placeholder-pearl/60 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all duration-300 hover:border-amber-500/60"
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
              className="w-full bg-gradient-to-r from-amber-500 to-orange-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-lg hover:shadow-amber-500/50 transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-lg"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Vytváření admin účtu...</span>
                </div>
              ) : (
                'Vytvořit Admin Účet'
              )}
            </button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-pearl/70 text-sm">
              Již máte účet?{' '}
              <Link 
                to="/login" 
                className="text-amber-400 hover:text-orange-500 font-semibold transition-colors"
              >
                Přihlaste se
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-pearl/50 text-xs">
            © 2025 Fuck the Matrix
          </p>
        </div>
      </div>
    </div>
  )
}

export default AdminStart


import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'
import { getBackgroundUrl } from '../api/settingsClient'
import { TEAM_ID } from '../api/config'

function TeamSelection() {
  const navigate = useNavigate()
  const location = useLocation()
  const { selectTeamProfile } = useAuth()
  const { t } = useTranslation()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Default background URL
  const DEFAULT_BG = 'https://res.cloudinary.com/dmbzcxhjn/image/upload/v1759767010/0a80caad8e77bea777fb41bf5438086e_ubbh2h.jpg'
  const [backgroundUrl, setBackgroundUrl] = useState(DEFAULT_BG)
  const [backgroundLoaded, setBackgroundLoaded] = useState(false)

  // Get available teams from location state (passed from login)
  const availableTeams = location.state?.available_teams || []
  const userData = location.state?.userData || null

  useEffect(() => {
    // If no teams available, redirect to login
    if (!availableTeams || availableTeams.length === 0) {
      navigate('/login')
      return
    }

    // Load background
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
  }, [availableTeams, navigate])

  const handleTeamSelect = async (team) => {
    setLoading(true)
    setError('')

    try {
      // Select this team profile
      const result = await selectTeamProfile(team.team_id, team.user_id)
      
      if (result.success) {
        // Check if 2FA verification is needed
        if (userData?.two_fa_method === 'pin') {
          navigate('/pin-verify')
        } else if (userData?.two_fa_setup_required) {
          navigate('/starteam') // Will show 2FA setup prompt
        } else {
          navigate('/starteam')
        }
      } else {
        setError(result.error || 'Failed to select team')
      }
    } catch (err) {
      console.error('Team selection error:', err)
      setError('An error occurred while selecting team')
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
      
      <div className="w-full max-w-2xl relative z-10">
        {/* Team Selection Card */}
        <div className="bg-black/20 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl shadow-black/50 backdrop-saturate-150">
          {/* Logo */}
          <div className="flex justify-center mb-8">
            <img 
              src="https://res.cloudinary.com/dmbzcxhjn/image/upload/v1759811073/WhatsApp_Image_2025-06-30_at_20.10.32_f45256ee-removebg-preview_ozqh99.png" 
              alt="Platform Logo" 
              className="w-24 h-24 object-contain"
            />
          </div>

          <h1 className="text-3xl font-bold text-pearl text-center mb-2">
            {t('teamSelection.title', 'Vyberte tým')}
          </h1>
          <p className="text-pearl/70 text-center mb-8">
            {t('teamSelection.subtitle', 'Máte přístup k více týmům. Vyberte, do kterého se chcete přihlásit.')}
          </p>

          {/* Error Message */}
          {error && (
            <div className="bg-crimson/20 border border-crimson/50 rounded-lg p-3 mb-6">
              <p className="text-crimson text-sm">{error}</p>
            </div>
          )}

          {/* Team List */}
          <div className="space-y-4">
            {availableTeams.map((team) => (
              <button
                key={team.team_id}
                onClick={() => handleTeamSelect(team)}
                disabled={loading}
                className="w-full flex items-center justify-between p-6 bg-obsidian/60 border border-neon-orchid/40 rounded-xl text-pearl hover:bg-obsidian/80 hover:border-neon-orchid/60 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed group"
              >
                <div className="flex items-center space-x-4">
                  {/* Team Avatar */}
                  {team.avatar_url ? (
                    <img
                      src={team.avatar_url}
                      alt={team.team_name}
                      className="w-16 h-16 rounded-full object-cover border-2 border-neon-orchid/40 group-hover:border-neon-orchid/60 transition-all"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gradient-to-br from-neon-orchid/30 to-crimson/30 border-2 border-neon-orchid/40 group-hover:border-neon-orchid/60 transition-all flex items-center justify-center">
                      <span className="text-2xl">🏢</span>
                    </div>
                  )}
                  
                  <div className="text-left">
                    <h3 className="text-xl font-bold text-pearl group-hover:text-neon-orchid transition-colors">
                      {team.team_name}
                    </h3>
                    <p className="text-sm text-pearl/60 capitalize">
                      {team.role === 'admin' ? t('nav.administrator', 'Administrátor') : 
                       team.role === 'manager' ? t('nav.manager', 'Manager') : 
                       t('nav.member', 'Člen')}
                    </p>
                  </div>
                </div>

                {/* Arrow Icon */}
                <svg 
                  className="w-6 h-6 text-neon-orchid transform group-hover:translate-x-2 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            ))}
          </div>

          {/* Back to Login */}
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate('/login')}
              className="text-pearl/70 hover:text-neon-orchid text-sm transition-colors"
            >
              ← {t('teamSelection.backToLogin', 'Zpět na přihlášení')}
            </button>
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

export default TeamSelection


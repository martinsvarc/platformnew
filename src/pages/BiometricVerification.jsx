import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authenticateWithBiometric, isBiometricAvailable, isBiometricEnabled } from '../utils/biometric'
import { getBackgroundUrl } from '../api/settingsClient'
import { TEAM_ID } from '../api/config'

function BiometricVerification() {
  const navigate = useNavigate()
  const { user, logout } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [biometricAvailable, setBiometricAvailable] = useState(false)
  const [isInitialAttempt, setIsInitialAttempt] = useState(true)
  const [showDomainWarning, setShowDomainWarning] = useState(false)
  
  // Default background URL
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

  const handleBiometricVerify = useCallback(async (isAuto = false) => {
    setLoading(true)
    // Only clear error on manual attempts
    if (!isAuto) {
      setError('')
    }

    try {
      const result = await authenticateWithBiometric()
      
      if (result.success) {
        // Clear pending verification flag
        localStorage.removeItem('pendingBiometricVerification')
        
        // Mark as fully authenticated
        localStorage.setItem('biometricVerified', 'true')
        localStorage.setItem('lastActivity', Date.now().toString())
        localStorage.setItem('verificationTime', Date.now().toString())
        
        // Success animation
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Navigate to app
        navigate('/starteam')
      } else {
        // Only show error if it's a manual attempt (not auto)
        if (!isAuto) {
          setError(result.error || 'Ověření se nezdařilo')
        }
      }
    } catch (err) {
      console.error('Biometric verification error:', err)
      // Only show error if it's a manual attempt (not auto)
      if (!isAuto) {
        setError('Ověření pomocí Touch ID se nezdařilo. Zkuste to znovu.')
      }
    } finally {
      setLoading(false)
      setIsInitialAttempt(false)
    }
  }, [navigate])

  useEffect(() => {
    const checkBiometric = async () => {
      const available = await isBiometricAvailable()
      setBiometricAvailable(available)
      
      // Check if pending verification
      const pendingVerification = localStorage.getItem('pendingBiometricVerification')
      if (!pendingVerification) {
        // No pending verification, redirect to login
        navigate('/login')
        return
      }

      // Check if credentials are from a different domain
      const storedDomain = localStorage.getItem('biometric_domain')
      const currentDomain = window.location.hostname
      if (storedDomain && storedDomain !== currentDomain) {
        setShowDomainWarning(true)
        setError(`Touch ID bylo nastaveno na ${storedDomain}. Pro použití na této doméně (${currentDomain}) je potřeba ho nastavit znovu.`)
        return
      }

      // Check if biometric is enabled (this also validates domain)
      if (!isBiometricEnabled()) {
        setError('Touch ID není nastaveno pro tuto doménu. Přihlaste se heslem a nastavte Touch ID znovu.')
        return
      }

      // Auto-trigger biometric verification after a longer delay to ensure credential is ready
      if (available) {
        setTimeout(() => {
          handleBiometricVerify(true) // Pass true to indicate this is auto-attempt
        }, 1200) // Longer delay to ensure everything is ready
      }
    }
    
    checkBiometric()
  }, [navigate, handleBiometricVerify])

  const handleLogout = async () => {
    await logout()
    localStorage.removeItem('pendingBiometricVerification')
    localStorage.removeItem('biometricVerified')
    navigate('/login')
  }

  if (!biometricAvailable) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-obsidian via-charcoal to-obsidian">
        <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl max-w-md text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-bold text-pearl mb-4">Touch ID není k dispozici</h2>
          <p className="text-pearl/70 mb-6">
            Vaše zařízení nepodporuje biometrické ověření nebo není nakonfigurováno.
          </p>
          <button
            onClick={handleLogout}
            className="w-full bg-gradient-to-r from-neon-orchid to-crimson text-white font-bold py-3 px-6 rounded-xl hover:shadow-glow-purple transition-all duration-300"
          >
            Zpět na přihlášení
          </button>
        </div>
      </div>
    )
  }

  return (
    <div 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
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
      {/* Dark overlay */}
      <div className="absolute inset-0 bg-black/50"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-neon-orchid/5 to-crimson/5"></div>
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      
      <div className="w-full max-w-md relative z-10">
        {/* Verification Card */}
        <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl backdrop-saturate-150">
          
          {/* Logo */}
          <div className="text-center mb-8">
            <img 
              src="https://res.cloudinary.com/dmbzcxhjn/image/upload/v1759811073/WhatsApp_Image_2025-06-30_at_20.10.32_f45256ee-removebg-preview_ozqh99.png" 
              alt="Platform Logo" 
              className="w-24 h-24 object-contain mx-auto mb-4"
            />
            <h1 className="text-3xl font-bold text-pearl mb-2">Biometrické ověření</h1>
            <p className="text-pearl/60">
              {loading ? 'Přiložte prst na Touch ID...' : 'Potvrďte svou identitu pomocí Touch ID'}
            </p>
          </div>

          {/* Fingerprint Animation */}
          <div className="flex justify-center mb-8">
            <div className="relative">
              {/* Subtle outer glow - only when loading */}
              {loading && (
                <>
                  <div className="absolute inset-0 -m-6 rounded-full border-2 border-neon-orchid/20 animate-pulse-slow"></div>
                </>
              )}
              
              {/* Fingerprint icon container */}
              <div className={`
                relative w-32 h-32 rounded-full 
                bg-gradient-to-br from-purple-600/30 to-blue-600/30 
                backdrop-blur-lg border-4
                flex items-center justify-center
                transition-all duration-500
                ${loading ? 'scale-105 border-neon-orchid/60 shadow-lg shadow-neon-orchid/50' : 'border-white/20'}
              `}>
                {loading ? (
                  <div className="relative">
                    <svg className="w-16 h-16 text-neon-orchid animate-spin" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  </div>
                ) : (
                  <svg className="w-16 h-16 text-neon-orchid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10M12 8.5a3.5 3.5 0 100-7 3.5 3.5 0 000 7z" />
                  </svg>
                )}
                
                {/* Success checkmark animation */}
                {!loading && !error && (
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300">
                    <svg className="w-20 h-20 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Scanning line effect */}
              {loading && (
                <div className="absolute inset-0 overflow-hidden rounded-full">
                  <div className="absolute w-full h-1 bg-gradient-to-r from-transparent via-neon-orchid to-transparent animate-scan"></div>
                </div>
              )}
            </div>
          </div>

          {/* User info */}
          {user && (
            <div className="text-center mb-6 p-4 bg-white/5 rounded-xl border border-white/10">
              <p className="text-pearl/50 text-sm mb-1">Ověřování uživatele</p>
              <p className="text-pearl font-semibold text-lg">{user.display_name || user.username}</p>
              {user.team_name && (
                <p className="text-pearl/60 text-sm">{user.team_name}</p>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 bg-crimson/20 border border-crimson/50 rounded-xl p-4 animate-shake">
              <p className="text-crimson text-sm text-center font-semibold">{error}</p>
              {showDomainWarning && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                  <p className="text-yellow-300 text-xs text-center mb-2">
                    💡 Touch ID credentials jsou vázány na doménu, kde byly vytvořeny.
                  </p>
                  <button
                    onClick={handleLogout}
                    className="w-full bg-gradient-to-r from-neon-orchid to-crimson text-white font-bold py-2 px-4 rounded-lg hover:shadow-glow-purple transition-all text-sm"
                  >
                    Přihlásit se heslem a nastavit znovu
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Retry Button - only show if not loading AND (has error OR initial auto-attempt failed) AND NOT domain warning */}
          {!loading && !isInitialAttempt && !showDomainWarning && (
            <button
              onClick={() => handleBiometricVerify(false)}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-4 px-6 rounded-xl hover:shadow-glow-purple transform hover:scale-105 transition-all duration-300 text-lg mb-4"
            >
              <div className="flex items-center justify-center space-x-2">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>{error ? 'Zkusit znovu' : 'Spustit Touch ID znovu'}</span>
              </div>
            </button>
          )}

          {/* Loading message */}
          {loading && (
            <div className="text-center py-4 mb-4">
              <div className="flex items-center justify-center space-x-2 text-neon-orchid">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-neon-orchid"></div>
                <span className="font-semibold">Čekám na Touch ID...</span>
              </div>
            </div>
          )}

          {/* Alternative actions */}
          <div className="text-center space-y-2">
            <button
              onClick={handleLogout}
              className="text-pearl/60 hover:text-pearl text-sm transition-colors duration-300"
            >
              Přihlásit se jako jiný uživatel
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-pearl/40 text-xs">
            🔒 Zabezpečeno biometrickým ověřením
          </p>
        </div>
      </div>

      {/* Custom styles */}
      <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          100% { top: 100%; }
        }
        .animate-scan {
          animation: scan 2s ease-in-out infinite;
        }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
          20%, 40%, 60%, 80% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
        @keyframes pulse-slow {
          0%, 100% { 
            opacity: 0.3;
            transform: scale(1);
          }
          50% { 
            opacity: 0.6;
            transform: scale(1.05);
          }
        }
        .animate-pulse-slow {
          animation: pulse-slow 3s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
      `}</style>
    </div>
  )
}

export default BiometricVerification


import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { isBiometricAvailable, registerBiometric } from '../utils/biometric'
import { setupBiometric } from '../api/authClient'

function TwoFASetupPrompt({ isOpen, onSetupComplete }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [bioAvailable, setBioAvailable] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [checkingBio, setCheckingBio] = useState(true)

  useEffect(() => {
    const checkBiometric = async () => {
      try {
        const available = await isBiometricAvailable()
        setBioAvailable(available)
      } catch (err) {
        console.error('Error checking biometric:', err)
        setBioAvailable(false)
      } finally {
        setCheckingBio(false)
      }
    }

    if (isOpen) {
      checkBiometric()
    }
  }, [isOpen])

  const handleSetupBiometric = async () => {
    setLoading(true)
    setError('')

    try {
      // Register biometric
      await registerBiometric(user.id, user.username)
      
      // Save to database
      await setupBiometric(user.id)
      
      // Mark as setup complete
      localStorage.setItem('biometric_verified', 'true')
      localStorage.setItem('verificationTime', Date.now().toString())
      localStorage.removeItem('pending2FAVerification')
      
      if (onSetupComplete) {
        onSetupComplete('biometric')
      }
    } catch (err) {
      console.error('Biometric setup error:', err)
      setError(err.message || 'Failed to set up biometric authentication')
    } finally {
      setLoading(false)
    }
  }

  const handleSetupPIN = () => {
    // Navigate to PIN setup page
    navigate('/setup-pin')
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-gradient-to-br from-charcoal to-obsidian rounded-2xl border border-neon-orchid/30 shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-neon-orchid to-crimson flex items-center justify-center">
            <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold text-gradient-primary mb-2">
            Secure Your Account
          </h2>
          <p className="text-pearl/70 text-sm sm:text-base">
            Choose a method to protect your account
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 bg-crimson/20 border border-crimson/50 rounded-lg text-crimson text-sm">
            {error}
          </div>
        )}

        {/* Options */}
        <div className="space-y-4 mb-6">
          {/* Biometric Option - Only show if available */}
          {bioAvailable && !checkingBio && (
            <button
              onClick={handleSetupBiometric}
              disabled={loading}
              className="w-full p-6 rounded-xl bg-velvet-gray/40 hover:bg-velvet-gray/60 
                       border-2 border-transparent hover:border-neon-orchid/50
                       transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-neon-orchid/20 to-crimson/20 
                              flex items-center justify-center group-hover:from-neon-orchid/30 group-hover:to-crimson/30 transition-all">
                  <svg className="w-6 h-6 text-neon-orchid" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 008 4.07M3 15.364c.64-1.319 1-2.8 1-4.364 0-1.457.39-2.823 1.07-4" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-pearl mb-1">
                    Touch ID / Face ID
                  </h3>
                  <p className="text-sm text-pearl/60">
                    Use biometric authentication (Mac users)
                  </p>
                </div>
                {loading && (
                  <div className="w-5 h-5 border-2 border-neon-orchid/30 border-t-neon-orchid rounded-full animate-spin" />
                )}
              </div>
            </button>
          )}

          {/* PIN Option */}
          <button
            onClick={handleSetupPIN}
            disabled={loading}
            className="w-full p-6 rounded-xl bg-velvet-gray/40 hover:bg-velvet-gray/60 
                     border-2 border-transparent hover:border-sunset-gold/50
                     transition-all text-left group disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sunset-gold/20 to-amber-500/20 
                            flex items-center justify-center group-hover:from-sunset-gold/30 group-hover:to-amber-500/30 transition-all">
                <svg className="w-6 h-6 text-sunset-gold" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-pearl mb-1">
                  6-Digit PIN Code
                </h3>
                <p className="text-sm text-pearl/60">
                  Set up a secure PIN (All users)
                </p>
              </div>
            </div>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center text-pearl/50 text-xs">
          <p>🔒 This is required to secure your account</p>
          <p className="mt-1">You'll need to verify once daily at 3 AM</p>
        </div>
      </div>
    </div>
  )
}

export default TwoFASetupPrompt


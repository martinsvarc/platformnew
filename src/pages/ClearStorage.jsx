import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

/**
 * Emergency page to clear all localStorage
 * Access via /clear-storage
 * Useful when stuck due to domain mismatch or 2FA issues
 * SECURITY: Only accessible when NOT logged in to prevent hijacking
 */
function ClearStorage() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [cleared, setCleared] = useState(false)
  
  // SECURITY: Redirect if user is already logged in
  // This prevents someone with physical access from hijacking an active session
  if (user) {
    navigate('/starteam')
    return null
  }

  const handleClearAll = () => {
    // Clear all localStorage
    localStorage.clear()
    setCleared(true)
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      navigate('/login')
    }, 2000)
  }

  const handleClear2FAOnly = () => {
    // Clear only 2FA-related items
    const keysToRemove = [
      'biometric_credential',
      'biometric_enabled',
      'biometric_domain',
      'pin_credential',
      'pin_enabled',
      'two_fa_method',
      'pendingBiometricVerification',
      'pendingPINVerification',
      'pending2FAVerification',
      'pending2FASetup',
      'biometricVerified',
      'pin_verified',
      'verificationTime'
    ]
    
    keysToRemove.forEach(key => localStorage.removeItem(key))
    setCleared(true)
    
    // Redirect to login after 2 seconds
    setTimeout(() => {
      navigate('/login')
    }, 2000)
  }

  if (cleared) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-obsidian via-charcoal to-obsidian flex items-center justify-center p-4">
        <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl max-w-md text-center">
          <div className="text-6xl mb-6">✅</div>
          <h2 className="text-2xl font-bold text-pearl mb-4">Storage Cleared!</h2>
          <p className="text-pearl/70 mb-6">
            Redirecting to login page...
          </p>
          <div className="w-8 h-8 mx-auto border-2 border-neon-orchid/30 border-t-neon-orchid rounded-full animate-spin"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-obsidian via-charcoal to-obsidian flex items-center justify-center p-4">
      <div className="bg-black/30 backdrop-blur-xl rounded-3xl p-10 border border-white/10 shadow-2xl max-w-lg">
        <div className="text-center mb-8">
          <div className="text-6xl mb-6">🔧</div>
          <h2 className="text-3xl font-bold text-pearl mb-4">Clear Browser Storage</h2>
          <p className="text-pearl/70 text-sm">
            Use this page if you're stuck due to 2FA or domain mismatch issues
          </p>
        </div>

        <div className="space-y-4">
          <button
            onClick={handleClear2FAOnly}
            className="w-full bg-gradient-to-r from-neon-orchid to-crimson text-white font-bold py-4 px-6 rounded-xl hover:shadow-glow-purple transition-all duration-300"
          >
            Clear 2FA Data Only
          </button>

          <button
            onClick={handleClearAll}
            className="w-full bg-gradient-to-r from-yellow-500 to-orange-500 text-white font-bold py-4 px-6 rounded-xl hover:shadow-glow transition-all duration-300"
          >
            Clear All Storage (Logout)
          </button>

          <button
            onClick={() => navigate('/login')}
            className="w-full bg-velvet-gray/40 hover:bg-velvet-gray/60 text-pearl font-semibold py-3 px-6 rounded-xl transition-all duration-300"
          >
            Cancel
          </button>
        </div>

        <div className="mt-8 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-yellow-300 text-xs space-y-2">
          <p className="font-semibold">⚠️ When to use this:</p>
          <ul className="list-disc list-inside space-y-1 text-yellow-300/80">
            <li>Stuck on Touch ID page (domain mismatch)</li>
            <li>Can't login after resetting 2FA</li>
            <li>Getting "2FA not defined" errors</li>
            <li>Need to start fresh with authentication</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-lg text-red-300 text-xs space-y-2">
          <p className="font-semibold">🔒 Security Note:</p>
          <ul className="list-disc list-inside space-y-1 text-red-300/80">
            <li>This page only works when you're NOT logged in</li>
            <li>You'll still need your password to login after clearing</li>
            <li>This prevents unauthorized 2FA hijacking</li>
            <li>Contact admin if you've forgotten your password</li>
          </ul>
        </div>

        <div className="mt-4 text-center">
          <p className="text-pearl/50 text-xs">
            Access this page anytime at: /clear-storage
          </p>
        </div>
      </div>
    </div>
  )
}

export default ClearStorage


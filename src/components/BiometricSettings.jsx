import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

function BiometricSettings() {
  const { biometricAvailable, biometricEnabled, registerBiometric, disableBiometricAuth } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)

  const handleEnableBiometric = async () => {
    setLoading(true)
    try {
      const result = await registerBiometric()
      if (result.success) {
        toast.success('Face ID / Touch ID bylo úspěšně aktivováno!')
      } else {
        toast.error(result.error || 'Nepodařilo se aktivovat biometrické ověření')
      }
    } catch (error) {
      toast.error('Nastala chyba při aktivaci biometrického ověření')
    } finally {
      setLoading(false)
    }
  }

  const handleDisableBiometric = () => {
    const result = disableBiometricAuth()
    if (result.success) {
      toast.success('Face ID / Touch ID bylo deaktivováno')
      // Refresh the page to update the UI
      window.location.reload()
    }
  }

  // Don't show anything if biometric is not available on this device
  if (!biometricAvailable) {
    return null
  }

  return (
    <div className="p-4 border-t border-neon-orchid/20">
      <div className="space-y-3">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-1">
            <svg className="w-5 h-5 text-neon-orchid" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-pearl mb-1">Biometrické ověření</h3>
            <p className="text-xs text-pearl/60 mb-3">
              {biometricEnabled 
                ? 'Face ID / Touch ID je aktivováno pro rychlé přihlášení'
                : 'Aktivujte Face ID / Touch ID pro rychlé a bezpečné přihlášení bez hesla'
              }
            </p>
            
            {biometricEnabled ? (
              <button
                onClick={handleDisableBiometric}
                className="text-xs px-3 py-2 bg-crimson/20 border border-crimson/40 text-crimson rounded-lg hover:bg-crimson/30 transition-all duration-300"
              >
                Deaktivovat
              </button>
            ) : (
              <button
                onClick={handleEnableBiometric}
                disabled={loading}
                className="text-xs px-3 py-2 bg-neon-orchid/20 border border-neon-orchid/40 text-neon-orchid rounded-lg hover:bg-neon-orchid/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-neon-orchid"></div>
                    <span>Aktivace...</span>
                  </span>
                ) : (
                  'Aktivovat'
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default BiometricSettings


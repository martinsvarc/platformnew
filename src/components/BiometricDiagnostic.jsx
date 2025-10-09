import { useState, useEffect } from 'react'
import { isBiometricSupported, isBiometricAvailable } from '../utils/biometric'

/**
 * Diagnostic component to check biometric authentication support
 */
function BiometricDiagnostic() {
  const [diagnostics, setDiagnostics] = useState({
    loading: true,
    isSecureContext: false,
    protocol: '',
    hostname: '',
    hasPublicKeyCredential: false,
    hasNavigatorCredentials: false,
    isPlatformAuthenticatorAvailable: false,
    browserInfo: '',
    errors: []
  })

  useEffect(() => {
    runDiagnostics()
  }, [])

  const runDiagnostics = async () => {
    const results = {
      loading: false,
      isSecureContext: window.isSecureContext,
      protocol: window.location.protocol,
      hostname: window.location.hostname,
      hasPublicKeyCredential: window.PublicKeyCredential !== undefined,
      hasNavigatorCredentials: navigator.credentials !== undefined,
      isPlatformAuthenticatorAvailable: false,
      browserInfo: navigator.userAgent,
      errors: []
    }

    // Check secure context
    if (!window.isSecureContext && window.location.hostname !== 'localhost') {
      results.errors.push('⚠️ Not a secure context (HTTPS required for biometric authentication)')
    }

    // Check PublicKeyCredential
    if (!window.PublicKeyCredential) {
      results.errors.push('❌ Browser does not support Web Authentication API')
    }

    // Check navigator.credentials
    if (!navigator.credentials) {
      results.errors.push('❌ navigator.credentials is not available')
    }

    // Check platform authenticator availability
    if (window.PublicKeyCredential && navigator.credentials) {
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        results.isPlatformAuthenticatorAvailable = available
        if (!available) {
          results.errors.push('❌ No platform authenticator (Touch ID/Face ID) available on this device')
        }
      } catch (error) {
        results.errors.push(`❌ Error checking platform authenticator: ${error.message}`)
      }
    }

    setDiagnostics(results)
  }

  if (diagnostics.loading) {
    return (
      <div className="unified-glass p-6 max-w-2xl mx-auto">
        <h2 className="text-xl font-bold text-gradient-primary mb-4">
          🔍 Biometric Diagnostic
        </h2>
        <p className="text-pearl/70">Running diagnostics...</p>
      </div>
    )
  }

  const allChecksPass = diagnostics.errors.length === 0 && 
                        diagnostics.isSecureContext && 
                        diagnostics.hasPublicKeyCredential && 
                        diagnostics.hasNavigatorCredentials &&
                        diagnostics.isPlatformAuthenticatorAvailable

  return (
    <div className="unified-glass p-6 max-w-2xl mx-auto">
      <h2 className="text-xl font-bold text-gradient-primary mb-4">
        🔍 Biometric Authentication Diagnostic
      </h2>

      {allChecksPass ? (
        <div className="mb-4 p-4 bg-green-500/20 border border-green-500/50 rounded-lg">
          <p className="text-green-400 font-semibold">✅ All checks passed! Biometric authentication should work.</p>
        </div>
      ) : (
        <div className="mb-4 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <p className="text-red-400 font-semibold">⚠️ Issues detected that may prevent biometric authentication from working:</p>
          <ul className="mt-2 space-y-1 text-sm">
            {diagnostics.errors.map((error, index) => (
              <li key={index} className="text-pearl/80">{error}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="space-y-3 text-sm">
        <div className="flex justify-between items-center p-3 bg-obsidian/40 rounded">
          <span className="text-pearl/70">Secure Context (HTTPS):</span>
          <span className={diagnostics.isSecureContext ? 'text-green-400' : 'text-red-400'}>
            {diagnostics.isSecureContext ? '✅ Yes' : '❌ No'}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-obsidian/40 rounded">
          <span className="text-pearl/70">Protocol:</span>
          <span className="text-pearl font-mono">{diagnostics.protocol}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-obsidian/40 rounded">
          <span className="text-pearl/70">Hostname:</span>
          <span className="text-pearl font-mono">{diagnostics.hostname}</span>
        </div>

        <div className="flex justify-between items-center p-3 bg-obsidian/40 rounded">
          <span className="text-pearl/70">PublicKeyCredential API:</span>
          <span className={diagnostics.hasPublicKeyCredential ? 'text-green-400' : 'text-red-400'}>
            {diagnostics.hasPublicKeyCredential ? '✅ Available' : '❌ Not Available'}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-obsidian/40 rounded">
          <span className="text-pearl/70">navigator.credentials:</span>
          <span className={diagnostics.hasNavigatorCredentials ? 'text-green-400' : 'text-red-400'}>
            {diagnostics.hasNavigatorCredentials ? '✅ Available' : '❌ Not Available'}
          </span>
        </div>

        <div className="flex justify-between items-center p-3 bg-obsidian/40 rounded">
          <span className="text-pearl/70">Platform Authenticator:</span>
          <span className={diagnostics.isPlatformAuthenticatorAvailable ? 'text-green-400' : 'text-red-400'}>
            {diagnostics.isPlatformAuthenticatorAvailable ? '✅ Available (Touch ID/Face ID)' : '❌ Not Available'}
          </span>
        </div>

        <details className="p-3 bg-obsidian/40 rounded cursor-pointer">
          <summary className="text-pearl/70">Browser Info</summary>
          <p className="mt-2 text-xs text-pearl/60 break-all font-mono">{diagnostics.browserInfo}</p>
        </details>
      </div>

      <div className="mt-6 p-4 bg-velvet-gray/30 rounded-lg text-xs text-pearl/70 space-y-2">
        <h3 className="font-bold text-pearl mb-2">💡 Common Issues & Solutions:</h3>
        <ul className="space-y-2 list-disc list-inside">
          <li><strong>HTTPS Required:</strong> Biometric authentication only works on HTTPS (except localhost). Make sure your deployment uses HTTPS.</li>
          <li><strong>Browser Support:</strong> Not all browsers support platform authenticators. Safari on iOS/macOS and Chrome on macOS work best.</li>
          <li><strong>Device Support:</strong> Your device must have Touch ID or Face ID hardware.</li>
          <li><strong>Domain Mismatch:</strong> The domain must be properly configured. Vercel/Netlify deployments should work automatically.</li>
          <li><strong>Browser Permissions:</strong> Make sure you haven't blocked access to biometric features in browser settings.</li>
        </ul>
      </div>

      <button
        onClick={runDiagnostics}
        className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-neon-orchid to-crimson text-white rounded-lg hover:brightness-110 transition"
      >
        🔄 Re-run Diagnostics
      </button>
    </div>
  )
}

export default BiometricDiagnostic


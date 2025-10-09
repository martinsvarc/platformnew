import CryptoJS from 'crypto-js'

/**
 * Check if the browser supports biometric authentication
 */
export function isBiometricSupported() {
  // Web Authentication API requires a secure context (HTTPS or localhost)
  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    console.warn('Web Authentication API requires HTTPS (secure context)')
    return false
  }
  
  return window.PublicKeyCredential !== undefined &&
         navigator.credentials !== undefined &&
         typeof navigator.credentials.create === 'function'
}

/**
 * Check if biometric is available on this device
 */
export async function isBiometricAvailable() {
  if (!isBiometricSupported()) {
    return false
  }
  
  try {
    // Check if platform authenticator is available (Face ID, Touch ID, etc.)
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
    return available
  } catch (error) {
    console.error('Error checking biometric availability:', error)
    return false
  }
}

/**
 * Register biometric credentials for a user
 */
export async function registerBiometric(userId, username) {
  // Check secure context first
  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    throw new Error('Biometric authentication requires HTTPS. Please ensure your site is deployed with SSL/TLS.')
  }
  
  if (!await isBiometricAvailable()) {
    throw new Error('Biometric authentication is not available on this device. Please ensure you have Touch ID or Face ID enabled.')
  }

  try {
    // Generate a challenge (in production, this should come from server)
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)
    
    // Create credential options
    const publicKeyCredentialCreationOptions = {
      challenge,
      rp: {
        name: "Platform App",
        id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
      },
      user: {
        id: new TextEncoder().encode(userId.toString()),
        name: username,
        displayName: username
      },
      pubKeyCredParams: [
        { alg: -7, type: "public-key" },  // ES256
        { alg: -257, type: "public-key" } // RS256
      ],
      authenticatorSelection: {
        authenticatorAttachment: "platform", // Use platform authenticator (Face ID, Touch ID)
        userVerification: "required",
        requireResidentKey: false
      },
      timeout: 60000,
      attestation: "none"
    }

    // Create the credential
    const credential = await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions
    })

    if (!credential) {
      throw new Error('Failed to create credential')
    }

    // Store credential ID securely in localStorage
    const credentialData = {
      id: credential.id,
      rawId: Array.from(new Uint8Array(credential.rawId)),
      userId: userId,
      username: username,
      createdAt: new Date().toISOString()
    }

    localStorage.setItem('biometric_credential', JSON.stringify(credentialData))
    localStorage.setItem('biometric_enabled', 'true')

    return { success: true, credentialId: credential.id }
  } catch (error) {
    console.error('Error registering biometric:', error)
    throw new Error(error.message || 'Failed to register biometric authentication')
  }
}

/**
 * Authenticate using biometric credentials
 */
export async function authenticateWithBiometric() {
  // Check secure context first
  if (!window.isSecureContext && window.location.hostname !== 'localhost') {
    throw new Error('Biometric authentication requires HTTPS. Please access the site using https://')
  }
  
  if (!await isBiometricAvailable()) {
    throw new Error('Biometric authentication is not available on this device')
  }

  try {
    // Get stored credential
    const storedCredential = localStorage.getItem('biometric_credential')
    if (!storedCredential) {
      throw new Error('No biometric credential found. Please login with password first.')
    }

    const credentialData = JSON.parse(storedCredential)
    
    // Generate a challenge (in production, this should come from server)
    const challenge = new Uint8Array(32)
    crypto.getRandomValues(challenge)

    // Create authentication options
    const publicKeyCredentialRequestOptions = {
      challenge,
      allowCredentials: [{
        id: new Uint8Array(credentialData.rawId),
        type: 'public-key',
        transports: ['internal']
      }],
      timeout: 60000,
      userVerification: "required",
      rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname
    }

    // Get the credential
    const assertion = await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions
    })

    if (!assertion) {
      throw new Error('Biometric authentication failed')
    }

    // Return stored user data
    return {
      success: true,
      userId: credentialData.userId,
      username: credentialData.username
    }
  } catch (error) {
    console.error('Error authenticating with biometric:', error)
    
    // Check if user cancelled
    if (error.name === 'NotAllowedError') {
      throw new Error('Biometric authentication was cancelled')
    }
    
    throw new Error(error.message || 'Biometric authentication failed')
  }
}

/**
 * Check if biometric is enabled for current device
 */
export function isBiometricEnabled() {
  return localStorage.getItem('biometric_enabled') === 'true' &&
         localStorage.getItem('biometric_credential') !== null
}

/**
 * Disable biometric authentication
 */
export function disableBiometric() {
  localStorage.removeItem('biometric_credential')
  localStorage.removeItem('biometric_enabled')
}

/**
 * Store encrypted credentials for auto-login (optional, less secure fallback)
 */
export function storeRememberMeCredentials(username, password) {
  const encrypted = CryptoJS.AES.encrypt(
    JSON.stringify({ username, password }),
    'remember-me-key'
  ).toString()
  
  localStorage.setItem('remember_me', encrypted)
  localStorage.setItem('remember_me_enabled', 'true')
}

/**
 * Get stored remember me credentials
 */
export function getRememberMeCredentials() {
  const encrypted = localStorage.getItem('remember_me')
  if (!encrypted) return null
  
  try {
    const decrypted = CryptoJS.AES.decrypt(encrypted, 'remember-me-key').toString(CryptoJS.enc.Utf8)
    return JSON.parse(decrypted)
  } catch (error) {
    console.error('Error decrypting credentials:', error)
    return null
  }
}

/**
 * Clear remember me credentials
 */
export function clearRememberMeCredentials() {
  localStorage.removeItem('remember_me')
  localStorage.removeItem('remember_me_enabled')
}

/**
 * Check if remember me is enabled
 */
export function isRememberMeEnabled() {
  return localStorage.getItem('remember_me_enabled') === 'true'
}

/**
 * PIN Code 2FA Functions
 */

/**
 * Hash a PIN code for storage
 */
export function hashPIN(pin) {
  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    throw new Error('PIN must be exactly 6 digits')
  }
  
  // Use CryptoJS to hash the PIN with a salt
  const salt = CryptoJS.lib.WordArray.random(128/8).toString()
  const hash = CryptoJS.PBKDF2(pin, salt, {
    keySize: 256/32,
    iterations: 1000
  }).toString()
  
  return JSON.stringify({ hash, salt })
}

/**
 * Verify a PIN against stored hash
 */
export function verifyPIN(pin, storedData) {
  if (!pin || pin.length !== 6 || !/^\d{6}$/.test(pin)) {
    return false
  }
  
  try {
    const { hash: storedHash, salt } = JSON.parse(storedData)
    const computedHash = CryptoJS.PBKDF2(pin, salt, {
      keySize: 256/32,
      iterations: 1000
    }).toString()
    
    return computedHash === storedHash
  } catch (error) {
    console.error('Error verifying PIN:', error)
    return false
  }
}

/**
 * Store PIN locally for the current session
 */
export function storePINLocally(userId, pinHash) {
  const pinData = {
    userId,
    pinHash,
    createdAt: new Date().toISOString()
  }
  localStorage.setItem('pin_credential', JSON.stringify(pinData))
  localStorage.setItem('pin_enabled', 'true')
}

/**
 * Check if PIN is enabled
 */
export function isPINEnabled() {
  return localStorage.getItem('pin_enabled') === 'true' &&
         localStorage.getItem('pin_credential') !== null
}

/**
 * Get stored PIN data
 */
export function getStoredPINData() {
  const pinData = localStorage.getItem('pin_credential')
  return pinData ? JSON.parse(pinData) : null
}

/**
 * Disable PIN authentication
 */
export function disablePIN() {
  localStorage.removeItem('pin_credential')
  localStorage.removeItem('pin_enabled')
}

/**
 * Check what 2FA method is available/enabled
 */
export async function get2FAMethod() {
  // Check if biometric is available and enabled
  if (await isBiometricAvailable() && isBiometricEnabled()) {
    return 'biometric'
  }
  
  // Check if PIN is enabled
  if (isPINEnabled()) {
    return 'pin'
  }
  
  return null
}

/**
 * Check if it's time for daily re-verification (3 AM Czech time)
 */
export function shouldRequireVerification() {
  const lastVerificationTime = localStorage.getItem('verificationTime')
  
  if (!lastVerificationTime) {
    return true // No verification time stored, require verification
  }

  try {
    const lastVerification = new Date(parseInt(lastVerificationTime))
    const now = new Date()

    // Convert to Czech time (UTC+1 in winter, UTC+2 in summer)
    const czechTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }))
    const lastVerificationCzech = new Date(lastVerification.toLocaleString('en-US', { timeZone: 'Europe/Prague' }))

    // Check if we've passed 3 AM Czech time since last verification
    const last3AM = new Date(lastVerificationCzech)
    last3AM.setHours(3, 0, 0, 0)

    // If last verification was before 3 AM today, and it's now after 3 AM, require re-verification
    if (lastVerificationCzech < last3AM && czechTime >= last3AM) {
      return true
    }

    // If last verification was yesterday or earlier, require re-verification
    const czechTimeDay = czechTime.toDateString()
    const lastVerificationDay = lastVerificationCzech.toDateString()
    
    if (czechTimeDay !== lastVerificationDay) {
      // Check if we're past 3 AM today
      const today3AM = new Date(czechTime)
      today3AM.setHours(3, 0, 0, 0)
      
      if (czechTime >= today3AM) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('Error checking verification time:', error)
    return true // Err on the side of caution
  }
}

/**
 * Check if current time is past 3 AM Czech time
 */
export function isPast3AMCzechTime() {
  const now = new Date()
  const czechTime = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Prague' }))
  const hours = czechTime.getHours()
  return hours >= 3
}


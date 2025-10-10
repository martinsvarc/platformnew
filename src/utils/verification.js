// Utility functions for PIN verification timing and PIN handling

export function shouldRequireVerification() {
  const verificationTime = localStorage.getItem('verificationTime')
  
  if (!verificationTime) {
    return true // No verification time = need to verify
  }
  
  const lastVerified = new Date(parseInt(verificationTime))
  const now = new Date()
  
  // Check if we're in Prague timezone and it's past 3 AM
  const pragueTime = new Date(now.toLocaleString("en-US", {timeZone: "Europe/Prague"}))
  const pragueHour = pragueTime.getHours()
  
  // Get last verified time in Prague timezone
  const lastVerifiedPrague = new Date(lastVerified.toLocaleString("en-US", {timeZone: "Europe/Prague"}))
  const lastVerifiedDate = lastVerifiedPrague.toDateString()
  const currentDate = pragueTime.toDateString()
  
  // If we're on a different day and it's past 3 AM, require verification
  if (lastVerifiedDate !== currentDate && pragueHour >= 3) {
    return true
  }
  
  return false
}

export function isPINEnabled() {
  return localStorage.getItem('pin_enabled') === 'true'
}

// Hash PIN using SHA-256
export async function hashPIN(pin) {
  const encoder = new TextEncoder()
  const data = encoder.encode(pin)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
  return hashHex
}

// Store PIN hash locally for verification
export function storePINLocally(userId, pinHash) {
  localStorage.setItem('pin_enabled', 'true')
  localStorage.setItem('pin_hash', pinHash)
  localStorage.setItem('pin_user_id', userId.toString())
}

// Get stored PIN data from localStorage
export function getStoredPINData() {
  const pinHash = localStorage.getItem('pin_hash')
  const userId = localStorage.getItem('pin_user_id')
  const enabled = localStorage.getItem('pin_enabled') === 'true'
  
  if (!pinHash || !userId || !enabled) {
    return null
  }
  
  return {
    pinHash,
    userId: parseInt(userId),
    enabled
  }
}

// Verify PIN against stored hash
export async function verifyPIN(pin, storedHash) {
  const pinHash = await hashPIN(pin)
  return pinHash === storedHash
}


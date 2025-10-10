// Utility functions for PIN verification timing

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


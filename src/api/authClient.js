// Frontend API client for authentication
// This calls the serverless functions (works with both Netlify and Vercel)

const API_BASE = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_USE_NETLIFY === 'true' ? '/.netlify/functions' : '/api')

async function callAuthAPI(action, params = {}) {
  const response = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...params }),
  })

  // Get the response text first
  const text = await response.text()
  
  // Try to parse as JSON
  let data
  try {
    data = text ? JSON.parse(text) : {}
  } catch (e) {
    console.error('Failed to parse response:', text)
    throw new Error('Invalid response from server')
  }

  if (!response.ok) {
    throw new Error(data.error || 'Request failed')
  }

  return data
}

export async function login({ username, password }) {
  return callAuthAPI('login', { username, password })
}

export async function getCurrentUser(userId) {
  return callAuthAPI('getCurrentUser', { userId })
}

export async function logout() {
  // Clear localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem('userId')
    localStorage.removeItem('teamId')
    localStorage.removeItem('teamSlug')
    localStorage.removeItem('teamName')
    localStorage.removeItem('userData')
  }
}

export async function updateUserAvatar(userId, avatarUrl) {
  return callAuthAPI('updateUserAvatar', { userId, avatarUrl })
}

export async function updateUserLanguage(userId, language) {
  return callAuthAPI('updateUserLanguage', { userId, language })
}

export async function setupPIN(userId, pinHash) {
  return callAuthAPI('setupPIN', { userId, pinHash })
}

export async function setupBiometric(userId) {
  return callAuthAPI('setupBiometric', { userId })
}

export async function get2FASettings(userId) {
  return callAuthAPI('get2FASettings', { userId })
}

export async function verifyUserPIN(userId, pinHash) {
  return callAuthAPI('verifyUserPIN', { userId, pinHash })
}


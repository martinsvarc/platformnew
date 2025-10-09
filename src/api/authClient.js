// Frontend API client for authentication
// This calls the Netlify Function instead of using server-side functions directly

const API_BASE = '/.netlify/functions'

async function callAuthAPI(action, params = {}) {
  const response = await fetch(`${API_BASE}/auth`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ action, ...params }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Request failed')
  }

  return response.json()
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


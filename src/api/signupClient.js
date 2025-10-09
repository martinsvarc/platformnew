// Frontend API client for signup
// This calls the Netlify Function instead of using server-side functions directly

const API_BASE = '/.netlify/functions'

async function callSignupAPI(action, params = {}) {
  const response = await fetch(`${API_BASE}/signup`, {
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

export async function signup({ teamSlug, username, email, displayName, password, avatarUrl, role = 'member' }) {
  return callSignupAPI('signup', { teamSlug, username, email, displayName, password, avatarUrl, role })
}

export async function signupAdmin({ teamSlug, username, email, displayName, password, avatarUrl }) {
  return callSignupAPI('signupAdmin', { teamSlug, username, email, displayName, password, avatarUrl })
}


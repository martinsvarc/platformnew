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

export async function signup({ teamSlug, username, email, displayName, password, avatarUrl, role = 'member' }) {
  return callSignupAPI('signup', { teamSlug, username, email, displayName, password, avatarUrl, role })
}

export async function signupAdmin({ teamSlug, username, email, displayName, password, avatarUrl }) {
  return callSignupAPI('signupAdmin', { teamSlug, username, email, displayName, password, avatarUrl })
}


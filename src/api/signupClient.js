// Frontend API client for signup
// This calls the serverless functions (works with both Netlify and Vercel)

const API_BASE = import.meta.env.PROD ? '/api' : (import.meta.env.VITE_USE_NETLIFY === 'true' ? '/.netlify/functions' : '/api')

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


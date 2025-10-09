// Frontend API client for settings
// This calls the serverless functions (Vercel /api endpoints)

const API_BASE = '/api'

async function callSettingsAPI(action, params = {}, method = 'POST') {
  let response
  
  if (method === 'GET') {
    const queryParams = new URLSearchParams({ action, ...params })
    response = await fetch(`${API_BASE}/settings?${queryParams}`)
  } else {
    response = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ action, ...params }),
    })
  }

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

export async function getSetting(teamId, settingKey) {
  return callSettingsAPI('getSetting', { teamId, settingKey })
}

export async function getAllSettings(teamId) {
  return callSettingsAPI('getAllSettings', { teamId })
}

export async function updateSetting(teamId, settingKey, settingValue) {
  return callSettingsAPI('updateSetting', { teamId, settingKey, settingValue })
}

export async function deleteSetting(teamId, settingKey) {
  return callSettingsAPI('deleteSetting', { teamId, settingKey })
}

export async function getBackgroundUrl(teamId) {
  return callSettingsAPI('getBackgroundUrl', { teamId }, 'GET')
}

export async function updateBackgroundUrl(teamId, backgroundUrl) {
  return callSettingsAPI('updateBackgroundUrl', { teamId, backgroundUrl })
}

export async function removeBackgroundUrl(teamId) {
  return callSettingsAPI('removeBackgroundUrl', { teamId })
}


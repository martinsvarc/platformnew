// Frontend API client for settings
// This calls the Netlify Function instead of using server-side functions directly

const API_BASE = '/.netlify/functions'

async function callSettingsAPI(action, params = {}, method = 'POST') {
  if (method === 'GET') {
    const queryParams = new URLSearchParams({ action, ...params })
    const response = await fetch(`${API_BASE}/settings?${queryParams}`)
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Request failed')
    }
    
    return response.json()
  } else {
    const response = await fetch(`${API_BASE}/settings`, {
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


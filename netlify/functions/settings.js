import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.VITE_DATABASE_URL)

async function getSetting(teamId, settingKey) {
  const result = await sql`
    SELECT setting_value 
    FROM app_settings 
    WHERE team_id = ${teamId} AND setting_key = ${settingKey}
  `
  
  return result[0]?.setting_value || null
}

async function getAllSettings(teamId) {
  const result = await sql`
    SELECT setting_key, setting_value 
    FROM app_settings 
    WHERE team_id = ${teamId}
  `
  
  // Convert to object format
  const settings = {}
  result.forEach(row => {
    settings[row.setting_key] = row.setting_value
  })
  
  return settings
}

async function updateSetting(teamId, settingKey, settingValue) {
  const result = await sql`
    INSERT INTO app_settings (team_id, setting_key, setting_value)
    VALUES (${teamId}, ${settingKey}, ${settingValue})
    ON CONFLICT (team_id, setting_key) 
    DO UPDATE SET setting_value = ${settingValue}, updated_at = now()
    RETURNING *
  `
  
  return result[0]
}

async function deleteSetting(teamId, settingKey) {
  await sql`
    DELETE FROM app_settings 
    WHERE team_id = ${teamId} AND setting_key = ${settingKey}
  `
}

async function getBackgroundUrl(teamId) {
  return await getSetting(teamId, 'background_url')
}

async function updateBackgroundUrl(teamId, backgroundUrl) {
  return await updateSetting(teamId, 'background_url', backgroundUrl)
}

async function removeBackgroundUrl(teamId) {
  await deleteSetting(teamId, 'background_url')
}

export async function handler(event) {
  // CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
    'Content-Type': 'application/json'
  }

  // Handle OPTIONS request for CORS
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    }
  }

  try {
    let result
    
    if (event.httpMethod === 'GET') {
      // For GET requests, parse query parameters
      const params = event.queryStringParameters || {}
      const action = params.action
      
      if (action === 'getBackgroundUrl' && params.teamId) {
        result = await getBackgroundUrl(params.teamId)
      } else if (action === 'getSetting' && params.teamId && params.settingKey) {
        result = await getSetting(params.teamId, params.settingKey)
      } else if (action === 'getAllSettings' && params.teamId) {
        result = await getAllSettings(params.teamId)
      } else {
        throw new Error('Invalid action or missing parameters')
      }
    } else if (event.httpMethod === 'POST') {
      // For POST requests, parse body
      const { action, ...params } = JSON.parse(event.body)
      
      switch (action) {
        case 'getSetting':
          result = await getSetting(params.teamId, params.settingKey)
          break
        
        case 'getAllSettings':
          result = await getAllSettings(params.teamId)
          break
        
        case 'updateSetting':
          result = await updateSetting(params.teamId, params.settingKey, params.settingValue)
          break
        
        case 'deleteSetting':
          await deleteSetting(params.teamId, params.settingKey)
          result = { success: true }
          break
        
        case 'getBackgroundUrl':
          result = await getBackgroundUrl(params.teamId)
          break
        
        case 'updateBackgroundUrl':
          result = await updateBackgroundUrl(params.teamId, params.backgroundUrl)
          break
        
        case 'removeBackgroundUrl':
          await removeBackgroundUrl(params.teamId)
          result = { success: true }
          break
        
        default:
          throw new Error(`Unknown action: ${action}`)
      }
    } else {
      return {
        statusCode: 405,
        headers,
        body: JSON.stringify({ error: 'Method not allowed' })
      }
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(result)
    }
  } catch (error) {
    console.error('Settings error:', error)
    return {
      statusCode: 400,
      headers,
      body: JSON.stringify({ error: error.message })
    }
  }
}


import { neon } from '@neondatabase/serverless'

const sql = neon(process.env.DATABASE_URL)

async function getSetting(teamId, settingKey) {
  if (!teamId || !settingKey) {
    throw new Error('Team ID and setting key are required')
  }

  const settings = await sql`
    select setting_key, setting_value
    from app_settings
    where team_id = ${teamId} and setting_key = ${settingKey}
  `

  return settings.length > 0 ? settings[0].setting_value : null
}

async function getAllSettings(teamId) {
  if (!teamId) {
    throw new Error('Team ID is required')
  }

  const settings = await sql`
    select setting_key, setting_value
    from app_settings
    where team_id = ${teamId}
  `

  // Convert to object
  const settingsObj = {}
  settings.forEach(s => {
    settingsObj[s.setting_key] = s.setting_value
  })

  return settingsObj
}

async function updateSetting(teamId, settingKey, settingValue) {
  if (!teamId || !settingKey) {
    throw new Error('Team ID and setting key are required')
  }

  // Upsert the setting
  await sql`
    insert into app_settings (team_id, setting_key, setting_value)
    values (${teamId}, ${settingKey}, ${settingValue})
    on conflict (team_id, setting_key)
    do update set setting_value = ${settingValue}, updated_at = now()
  `

  return { success: true, settingKey, settingValue }
}

async function deleteSetting(teamId, settingKey) {
  if (!teamId || !settingKey) {
    throw new Error('Team ID and setting key are required')
  }

  await sql`
    delete from app_settings
    where team_id = ${teamId} and setting_key = ${settingKey}
  `

  return { success: true }
}

async function getBackgroundUrl(teamId) {
  if (!teamId) {
    return null
  }

  const result = await getSetting(teamId, 'background_url')
  return result
}

async function updateBackgroundUrl(teamId, backgroundUrl) {
  return updateSetting(teamId, 'background_url', backgroundUrl)
}

async function removeBackgroundUrl(teamId) {
  return deleteSetting(teamId, 'background_url')
}

// Vercel serverless function handler
export default async function handler(req, res) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  )

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  try {
    let action, params

    if (req.method === 'GET') {
      // Parse query parameters
      action = req.query.action
      params = { ...req.query }
      delete params.action
    } else if (req.method === 'POST') {
      // Parse body
      const body = req.body
      action = body.action
      params = { ...body }
      delete params.action
    } else {
      return res.status(405).json({ error: 'Method not allowed' })
    }

    let result

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
        result = await deleteSetting(params.teamId, params.settingKey)
        break

      case 'getBackgroundUrl':
        result = await getBackgroundUrl(params.teamId)
        break

      case 'updateBackgroundUrl':
        result = await updateBackgroundUrl(params.teamId, params.backgroundUrl)
        break

      case 'removeBackgroundUrl':
        result = await removeBackgroundUrl(params.teamId)
        break

      default:
        throw new Error(`Unknown action: ${action}`)
    }

    return res.status(200).json(result)
  } catch (error) {
    console.error('Settings error:', error)
    return res.status(400).json({ error: error.message })
  }
}


import { sql } from './db.js'

/**
 * Get a specific setting for a team
 */
export async function getSetting(teamId, settingKey) {
  const result = await sql`
    SELECT setting_value 
    FROM app_settings 
    WHERE team_id = ${teamId} AND setting_key = ${settingKey}
  `
  
  return result[0]?.setting_value || null
}

/**
 * Get all settings for a team
 */
export async function getAllSettings(teamId) {
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

/**
 * Update or create a setting for a team
 */
export async function updateSetting(teamId, settingKey, settingValue) {
  const result = await sql`
    INSERT INTO app_settings (team_id, setting_key, setting_value)
    VALUES (${teamId}, ${settingKey}, ${settingValue})
    ON CONFLICT (team_id, setting_key) 
    DO UPDATE SET setting_value = ${settingValue}, updated_at = now()
    RETURNING *
  `
  
  return result[0]
}

/**
 * Delete a setting for a team
 */
export async function deleteSetting(teamId, settingKey) {
  await sql`
    DELETE FROM app_settings 
    WHERE team_id = ${teamId} AND setting_key = ${settingKey}
  `
}

/**
 * Get background URL for a team
 */
export async function getBackgroundUrl(teamId) {
  return await getSetting(teamId, 'background_url')
}

/**
 * Update background URL for a team
 */
export async function updateBackgroundUrl(teamId, backgroundUrl) {
  return await updateSetting(teamId, 'background_url', backgroundUrl)
}

/**
 * Remove background URL (reset to default)
 */
export async function removeBackgroundUrl(teamId) {
  await deleteSetting(teamId, 'background_url')
}

